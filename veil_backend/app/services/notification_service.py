from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.schemas.notification import (
    NotificationItem,
    NotificationListResponse,
    UnreadCountResponse,
)


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_notifications(
        self, user_id: int, page: int = 1, page_size: int = 20
    ) -> NotificationListResponse:
        total_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.recipient_user_id == user_id
            )
        )
        total = total_result.scalar_one() or 0

        result = await self.db.execute(
            select(Notification)
            .where(Notification.recipient_user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = [
            NotificationItem.model_validate(n) for n in result.scalars().all()
        ]
        return NotificationListResponse(
            items=items, total=total, page=page, page_size=page_size
        )

    async def mark_read(self, notification_id: int, user_id: int) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=now)
        )
        await self.db.commit()

    async def mark_all_read(self, user_id: int) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(Notification)
            .where(
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=now)
        )
        await self.db.commit()

    async def get_unread_count(self, user_id: int) -> UnreadCountResponse:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        count = result.scalar_one() or 0
        display = str(count) if count <= 9 else "9+"
        return UnreadCountResponse(count=count, display=display)

    # ─── factory helpers (트리거 지점에서 호출) ───────────────────────────────

    @staticmethod
    def build_info_reveal(
        creator_id: int, content_id: int, consumer_anon_id: str
    ) -> Notification:
        return Notification(
            recipient_user_id=creator_id,
            notification_type=NotificationType.INFO_REVEAL,
            related_content_id=content_id,
            related_user_id=consumer_anon_id,
            extra_data=None,
        )

    @staticmethod
    def build_review_result(
        creator_id: int,
        content_id: int,
        result: str,
        rejection_reason: str | None = None,
    ) -> Notification:
        extra: dict = {"result": result}
        if rejection_reason:
            extra["rejection_reason"] = rejection_reason
        return Notification(
            recipient_user_id=creator_id,
            notification_type=NotificationType.REVIEW_RESULT,
            related_content_id=content_id,
            related_user_id=None,
            extra_data=extra,
        )

    @staticmethod
    def build_external_notice(recipient_id: int, content_id: int) -> Notification:
        return Notification(
            recipient_user_id=recipient_id,
            notification_type=NotificationType.EXTERNAL_NOTICE,
            related_content_id=content_id,
            related_user_id=None,
            extra_data=None,
        )
