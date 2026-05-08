from typing import Literal

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Content, ReviewStatus
from app.models.notification import Notification
from app.models.reaction import Reaction, ReactionType
from app.schemas.dashboard import (
    ContentCardItem,
    ContentSummary,
    DashboardResponse,
    NotificationArea,
    NotificationPreview,
)


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_dashboard(
        self,
        creator_id: int,
        sort: Literal["activity", "created"] = "created",
    ) -> DashboardResponse:
        summary = await self._get_summary(creator_id)
        notifications = await self._get_notifications(creator_id)
        contents = await self._get_content_cards(creator_id, sort)
        return DashboardResponse(
            summary=summary,
            notifications=notifications,
            contents=contents,
        )

    # ─── private ──────────────────────────────────────────────────────────────

    async def _get_summary(self, creator_id: int) -> ContentSummary:
        result = await self.db.execute(
            select(
                func.count(Content.id).label("total"),
                func.sum(
                    case((Content.review_status == ReviewStatus.APPROVED, 1), else_=0)
                ).label("approved"),
                func.sum(
                    case((Content.review_status == ReviewStatus.PENDING, 1), else_=0)
                ).label("pending"),
                func.sum(
                    case((Content.review_status == ReviewStatus.REJECTED, 1), else_=0)
                ).label("rejected"),
            ).where(Content.user_id == creator_id)
        )
        row = result.one()
        return ContentSummary(
            total=row.total or 0,
            approved=row.approved or 0,
            pending=row.pending or 0,
            rejected=row.rejected or 0,
        )

    async def _get_notifications(self, creator_id: int) -> NotificationArea:
        unread_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == creator_id,
                Notification.is_read.is_(False),
            )
        )
        unread_count = unread_result.scalar_one() or 0

        recent_result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == creator_id)
            .order_by(Notification.created_at.desc())
            .limit(3)
        )
        recent = [
            NotificationPreview(
                id=n.id,
                type=n.type,
                content_id=n.content_id,
                created_at=n.created_at,
            )
            for n in recent_result.scalars().all()
        ]
        return NotificationArea(unread_count=unread_count, recent=recent)

    async def _get_content_cards(
        self, creator_id: int, sort: Literal["activity", "created"]
    ) -> list[ContentCardItem]:
        contents_result = await self.db.execute(
            select(Content).where(Content.user_id == creator_id)
        )
        contents = contents_result.scalars().all()
        if not contents:
            return []

        content_ids = [c.id for c in contents]

        # 반응 집계: exposure(전체) + interest
        agg_result = await self.db.execute(
            select(
                Reaction.content_id,
                func.count(Reaction.id).label("exposure_count"),
                func.sum(
                    case((Reaction.type == ReactionType.INTEREST, 1), else_=0)
                ).label("interest_count"),
                func.max(Reaction.updated_at).label("last_activity_at"),
            )
            .where(Reaction.content_id.in_(content_ids))
            .group_by(Reaction.content_id)
        )
        agg = {
            row.content_id: {
                "exposure_count": row.exposure_count or 0,
                "interest_count": row.interest_count or 0,
                "last_activity_at": row.last_activity_at,
            }
            for row in agg_result
        }

        cards = [
            ContentCardItem(
                id=c.id,
                title=c.title,
                content_type=c.content_type,
                review_status=c.review_status,
                exposure_count=agg.get(c.id, {}).get("exposure_count", 0),
                interest_count=agg.get(c.id, {}).get("interest_count", 0),
                created_at=c.created_at,
                last_activity_at=agg.get(c.id, {}).get("last_activity_at"),
            )
            for c in contents
        ]

        if sort == "activity":
            cards.sort(key=lambda x: x.last_activity_at or x.created_at, reverse=True)
        else:
            cards.sort(key=lambda x: x.created_at, reverse=True)

        return cards
