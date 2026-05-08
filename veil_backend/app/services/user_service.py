from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.onboarding import UserContentType, UserGenre
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRoleUpdate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def update_me(self, user: User, payload: UserUpdate) -> User:
        SIMPLE_FIELDS = {"name", "birth_date", "gender", "region"}
        for field in SIMPLE_FIELDS:
            value = getattr(payload, field)
            # None은 "변경 안 함"이지만 region은 nullable이므로 명시적으로 set된 경우 반영
            if field in payload.model_fields_set:
                setattr(user, field, value)

        if payload.genres is not None:
            await self.repo.db.execute(
                delete(UserGenre).where(UserGenre.user_id == user.id)
            )
            for genre in payload.genres:
                self.repo.db.add(UserGenre(user_id=user.id, genre=genre))

        if payload.content_types is not None:
            await self.repo.db.execute(
                delete(UserContentType).where(UserContentType.user_id == user.id)
            )
            for ct in payload.content_types:
                self.repo.db.add(UserContentType(user_id=user.id, content_type=ct))

        return await self.repo.update(user)

    async def list_users(self) -> list[User]:
        return await self.repo.list()

    async def get_user(self, user_id: int) -> User:
        user = await self.repo.get(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_role(self, user_id: int, payload: UserRoleUpdate) -> User:
        user = await self.get_user(user_id)
        user.role = payload.role
        return await self.repo.update(user)

    async def delete_user(self, user_id: int) -> None:
        user = await self.get_user(user_id)
        await self.repo.delete(user)
