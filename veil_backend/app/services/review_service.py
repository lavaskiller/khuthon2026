from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Content, ReviewStatus
from app.models.onboarding import ContentType
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import (
    ContentAdminDetail,
    PaginatedPendingContents,
    PendingContentItem,
    ReviewHistoryItem,
    mask_email,
)


class ReviewService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = ReviewRepository(db)

    async def list_pending(
        self,
        content_type: ContentType | None,
        uploaded_from: date | None,
        uploaded_to: date | None,
        page: int,
        page_size: int,
    ) -> PaginatedPendingContents:
        contents, total = await self.repo.list_pending(
            content_type, uploaded_from, uploaded_to, page, page_size
        )
        items = [
            PendingContentItem(
                id=c.id,
                content_type=c.content_type,
                created_at=c.created_at,
                creator_email_masked=mask_email(c.user.email),
            )
            for c in contents
        ]
        return PaginatedPendingContents(
            items=items, total=total, page=page, page_size=page_size
        )

    async def get_for_review(self, content_id: int) -> ContentAdminDetail:
        content = await self.repo.get_with_user(content_id)
        if content is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        return ContentAdminDetail(
            **{
                k: v
                for k, v in content.__dict__.items()
                if not k.startswith("_")
            },
            genres=content.genres,
            creator_email=content.user.email,
        )

    async def approve(self, content_id: int, admin_id: int) -> ContentAdminDetail:
        content = await self._get_pending(content_id)
        content.review_status = ReviewStatus.APPROVED
        content.reviewed_by_id = admin_id
        content.reviewed_at = datetime.now(timezone.utc)
        content.rejection_reason = None
        await self.repo.update(content)
        return await self.get_for_review(content_id)

    async def reject(
        self, content_id: int, admin_id: int, rejection_reason: str
    ) -> ContentAdminDetail:
        content = await self._get_pending(content_id)
        content.review_status = ReviewStatus.REJECTED
        content.reviewed_by_id = admin_id
        content.reviewed_at = datetime.now(timezone.utc)
        content.rejection_reason = rejection_reason
        await self.repo.update(content)
        return await self.get_for_review(content_id)

    async def list_history(self, admin_id: int) -> list[ReviewHistoryItem]:
        contents = await self.repo.list_reviewed_by(admin_id)
        return [ReviewHistoryItem.model_validate(c) for c in contents]

    # ─── helpers ──────────────────────────────────────────────────────────────

    async def _get_pending(self, content_id: int) -> Content:
        content = await self.repo.get(content_id)
        if content is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        if content.review_status != ReviewStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 처리된 컨텐츠입니다",
            )
        return content
