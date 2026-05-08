import random

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import anon_id
from app.models.content import Content, ReviewStatus
from app.models.notification import Notification, NotificationType
from app.models.onboarding import ContentType
from app.models.user import User
from app.repositories.reaction_repository import ReactionRepository
from app.services.notification_service import NotificationService
from app.schemas.explore import (
    ContentRevealRead,
    FeedItem,
    FeedPage,
    InterestListItem,
    ReactionRead,
)


class ExploreService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.reaction_repo = ReactionRepository(db)

    async def get_feed(
        self,
        user: User,
        content_types: list[ContentType] | None,
        exclude_ids: list[int],
        page: int = 1,
        page_size: int = 5,
    ) -> FeedPage:
        effective_types = (
            content_types
            or [ct.content_type for ct in user.content_types]
            or list(ContentType)
        )

        interested_ids = await self.reaction_repo.get_interested_content_ids(user.id)
        all_excluded = interested_ids | set(exclude_ids)

        candidates = await self._get_approved_candidates(effective_types, all_excluded)
        if not candidates:
            return FeedPage(items=[], has_more=False, page=page, page_size=page_size)

        pass_counts = await self.reaction_repo.get_pass_counts(
            [c.id for c in candidates], user.id
        )

        weights = [0.8 ** pass_counts.get(c.id, 0) for c in candidates]
        k = min(len(candidates), page_size * 4)
        sampled = random.choices(candidates, weights=weights, k=k)

        seen: set[int] = set()
        unique: list[Content] = []
        for c in sampled:
            if c.id not in seen:
                seen.add(c.id)
                unique.append(c)

        total_needed = page * page_size
        constrained = self._apply_constraints(unique, total_needed)
        start = (page - 1) * page_size
        page_items = constrained[start : start + page_size]

        return FeedPage(
            items=[FeedItem.model_validate(c) for c in page_items],
            has_more=len(candidates) - len(all_excluded) > total_needed,
            page=page,
            page_size=page_size,
        )

    async def pass_content(self, user_id: int, content_id: int) -> ReactionRead:
        await self._assert_content_exists(content_id)
        reaction = await self.reaction_repo.upsert_pass(user_id, content_id)
        return ReactionRead.model_validate(reaction)

    async def interest_content(
        self, user_id: int, content_id: int
    ) -> tuple[ContentRevealRead, bool]:
        """(reveal, is_new) 반환"""
        await self._assert_content_exists(content_id)
        _, is_new = await self.reaction_repo.upsert_interest(user_id, content_id)
        content = await self.db.get(Content, content_id)

        # F-NT-01: 최초 관심 시에만 창작자에게 알림 (중복 방지)
        if is_new and content:
            self.db.add(
                NotificationService.build_info_reveal(
                    creator_id=content.user_id,
                    content_id=content_id,
                    consumer_anon_id=anon_id(user_id, content_id),
                )
            )
            await self.db.commit()

        return ContentRevealRead.model_validate(content), is_new

    async def remove_interest(self, user_id: int, content_id: int) -> None:
        await self.reaction_repo.delete_interest(user_id, content_id)

    async def get_interest_list(self, user_id: int) -> list[InterestListItem]:
        reactions = await self.reaction_repo.get_interests_with_content(user_id)
        return [
            InterestListItem(
                reaction_id=r.id,
                content_id=r.content.id,
                content_type=r.content.content_type,
                title=r.content.title,
                genres=[g.genre for g in r.content.genres],
                interested_at=r.updated_at,
            )
            for r in reactions
        ]

    # ─── helpers ──────────────────────────────────────────────────────────────

    async def _get_approved_candidates(
        self, content_types: list[ContentType], excluded_ids: set[int]
    ) -> list[Content]:
        stmt = (
            select(Content)
            .where(Content.review_status == ReviewStatus.APPROVED)
            .where(Content.content_type.in_(content_types))
        )
        if excluded_ids:
            stmt = stmt.where(Content.id.notin_(excluded_ids))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def _assert_content_exists(self, content_id: int) -> None:
        content = await self.db.get(Content, content_id)
        if content is None or content.review_status != ReviewStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
            )

    @staticmethod
    def _apply_constraints(candidates: list[Content], limit: int) -> list[Content]:
        result: list[Content] = []
        last_creator: int | None = None
        genre_count: dict[str, int] = {}

        for content in candidates:
            if len(result) >= limit:
                break

            # 같은 창작자 연속 노출 방지
            if content.user_id == last_creator:
                continue

            # 장르 50% 초과 방지
            content_genres = [g.genre for g in content.genres]
            exceed = False
            if len(result) >= 2:
                for genre in content_genres:
                    if (genre_count.get(genre, 0) + 1) / (len(result) + 1) > 0.5:
                        exceed = True
                        break
            if exceed:
                continue

            result.append(content)
            last_creator = content.user_id
            for genre in content_genres:
                genre_count[genre] = genre_count.get(genre, 0) + 1

        return result
