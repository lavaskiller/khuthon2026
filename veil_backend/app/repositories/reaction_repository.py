from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.reaction import Reaction, ReactionType
from app.repositories.base_repository import BaseRepository


class ReactionRepository(BaseRepository[Reaction]):
    model = Reaction

    async def get_by_user_content(self, user_id: int, content_id: int) -> Reaction | None:
        result = await self.db.execute(
            select(Reaction).where(
                Reaction.user_id == user_id,
                Reaction.content_id == content_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_pass(self, user_id: int, content_id: int) -> Reaction:
        reaction = await self.get_by_user_content(user_id, content_id)
        if reaction:
            reaction.type = ReactionType.PASS
            reaction.pass_count += 1
        else:
            reaction = Reaction(
                user_id=user_id,
                content_id=content_id,
                type=ReactionType.PASS,
                pass_count=1,
            )
            self.db.add(reaction)
        await self.db.commit()
        await self.db.refresh(reaction)
        return reaction

    async def upsert_interest(self, user_id: int, content_id: int) -> tuple[Reaction, bool]:
        """(reaction, is_new) 반환 — is_new=False면 이미 관심 누른 상태"""
        reaction = await self.get_by_user_content(user_id, content_id)
        if reaction and reaction.type == ReactionType.INTEREST:
            return reaction, False
        if reaction:
            reaction.type = ReactionType.INTEREST
        else:
            reaction = Reaction(
                user_id=user_id,
                content_id=content_id,
                type=ReactionType.INTEREST,
                pass_count=0,
            )
            self.db.add(reaction)
        await self.db.commit()
        await self.db.refresh(reaction)
        return reaction, True

    async def delete_interest(self, user_id: int, content_id: int) -> None:
        reaction = await self.get_by_user_content(user_id, content_id)
        if reaction and reaction.type == ReactionType.INTEREST:
            await self.db.delete(reaction)
            await self.db.commit()

    async def get_interested_content_ids(self, user_id: int) -> set[int]:
        result = await self.db.execute(
            select(Reaction.content_id).where(
                Reaction.user_id == user_id,
                Reaction.type == ReactionType.INTEREST,
            )
        )
        return {row[0] for row in result}

    async def get_pass_counts(self, content_ids: list[int], user_id: int) -> dict[int, int]:
        if not content_ids:
            return {}
        result = await self.db.execute(
            select(Reaction.content_id, Reaction.pass_count).where(
                Reaction.user_id == user_id,
                Reaction.content_id.in_(content_ids),
                Reaction.type == ReactionType.PASS,
            )
        )
        return {row[0]: row[1] for row in result}

    async def get_interests_with_content(self, user_id: int) -> list[Reaction]:
        result = await self.db.execute(
            select(Reaction)
            .where(
                Reaction.user_id == user_id,
                Reaction.type == ReactionType.INTEREST,
            )
            .options(selectinload(Reaction.content))
            .order_by(Reaction.updated_at.desc())
        )
        return list(result.scalars().all())
