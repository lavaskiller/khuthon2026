from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.invite import ExternalNotice, ExternalNoticeRecipient, ScreeningInvite
from app.models.reaction import Reaction, ReactionType
from app.repositories.base_repository import BaseRepository


class InviteRepository(BaseRepository[ExternalNotice]):
    model = ExternalNotice

    async def get_interests_with_users(self, content_id: int) -> list[Reaction]:
        result = await self.db.execute(
            select(Reaction)
            .where(
                Reaction.content_id == content_id,
                Reaction.type == ReactionType.INTEREST,
            )
            .options(selectinload(Reaction.user))
            .order_by(Reaction.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_notified_user_ids(self, content_id: int) -> dict[int, datetime]:
        """content_id에 대해 안내 받은 user_id → 가장 최근 sent_at 매핑"""
        result = await self.db.execute(
            select(ExternalNoticeRecipient.user_id, ExternalNotice.sent_at)
            .join(ExternalNotice, ExternalNoticeRecipient.notice_id == ExternalNotice.id)
            .where(ExternalNotice.content_id == content_id)
            .order_by(ExternalNotice.sent_at.desc())
        )
        mapping: dict[int, datetime] = {}
        for user_id, sent_at in result:
            if user_id not in mapping:
                mapping[user_id] = sent_at
        return mapping

    async def get_recent_notices(
        self, content_id: int, creator_id: int, since: datetime
    ) -> list[ExternalNotice]:
        result = await self.db.execute(
            select(ExternalNotice)
            .where(
                ExternalNotice.content_id == content_id,
                ExternalNotice.creator_id == creator_id,
                ExternalNotice.sent_at >= since,
            )
            .order_by(ExternalNotice.sent_at.desc())
        )
        return list(result.scalars().all())

    async def create_notice(
        self,
        content_id: int,
        creator_id: int,
        url: str,
        message: str,
        label: str | None,
        user_ids: list[int],
    ) -> ExternalNotice:
        notice = ExternalNotice(
            content_id=content_id,
            creator_id=creator_id,
            url=url,
            message=message,
            label=label,
            recipients=[
                ExternalNoticeRecipient(user_id=uid) for uid in user_ids
            ],
        )
        self.db.add(notice)
        await self.db.commit()
        await self.db.refresh(notice)
        return notice

    async def get_received_by_user(self, user_id: int) -> list[ExternalNoticeRecipient]:
        result = await self.db.execute(
            select(ExternalNoticeRecipient)
            .where(ExternalNoticeRecipient.user_id == user_id)
            .options(selectinload(ExternalNoticeRecipient.notice))
            .order_by(ExternalNoticeRecipient.id.desc())
        )
        return list(result.scalars().all())
