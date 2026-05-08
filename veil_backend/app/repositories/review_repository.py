from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.content import Content, ReviewStatus
from app.models.onboarding import ContentType
from app.repositories.base_repository import BaseRepository


class ReviewRepository(BaseRepository[Content]):
    model = Content

    async def list_pending(
        self,
        content_type: ContentType | None,
        uploaded_from: date | None,
        uploaded_to: date | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Content], int]:
        base = (
            select(Content)
            .where(Content.review_status == ReviewStatus.PENDING)
            .options(selectinload(Content.user))
        )
        if content_type:
            base = base.where(Content.content_type == content_type)
        if uploaded_from:
            base = base.where(Content.created_at >= datetime(uploaded_from.year, uploaded_from.month, uploaded_from.day, tzinfo=timezone.utc))
        if uploaded_to:
            base = base.where(Content.created_at < datetime(uploaded_to.year, uploaded_to.month, uploaded_to.day + 1, tzinfo=timezone.utc))

        total_stmt = select(func.count(Content.id)).where(Content.review_status == ReviewStatus.PENDING)
        if content_type:
            total_stmt = total_stmt.where(Content.content_type == content_type)
        if uploaded_from:
            total_stmt = total_stmt.where(Content.created_at >= datetime(uploaded_from.year, uploaded_from.month, uploaded_from.day, tzinfo=timezone.utc))
        if uploaded_to:
            total_stmt = total_stmt.where(Content.created_at < datetime(uploaded_to.year, uploaded_to.month, uploaded_to.day + 1, tzinfo=timezone.utc))

        total = (await self.db.execute(total_stmt)).scalar_one()

        data_stmt = (
            base
            .order_by(Content.created_at.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(data_stmt)
        return list(result.scalars().all()), total

    async def get_with_user(self, content_id: int) -> Content | None:
        result = await self.db.execute(
            select(Content)
            .where(Content.id == content_id)
            .options(selectinload(Content.user))
        )
        return result.scalar_one_or_none()

    async def list_reviewed_by(self, admin_id: int) -> list[Content]:
        result = await self.db.execute(
            select(Content)
            .where(Content.reviewed_by_id == admin_id)
            .order_by(Content.reviewed_at.desc())
        )
        return list(result.scalars().all())
