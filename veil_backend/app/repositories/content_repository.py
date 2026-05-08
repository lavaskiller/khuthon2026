from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Content, ReviewStatus
from app.repositories.base_repository import BaseRepository


class ContentRepository(BaseRepository[Content]):
    model = Content

    async def get_by_teaser_hash(self, hash_: str) -> Content | None:
        result = await self.db.execute(
            select(Content).where(Content.teaser_hash == hash_)
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: int, status: ReviewStatus | None = None
    ) -> list[Content]:
        stmt = select(Content).where(Content.user_id == user_id)
        if status:
            stmt = stmt.where(Content.review_status == status)
        stmt = stmt.order_by(Content.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, status: ReviewStatus | None = None) -> list[Content]:
        stmt = select(Content)
        if status:
            stmt = stmt.where(Content.review_status == status)
        stmt = stmt.order_by(Content.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
