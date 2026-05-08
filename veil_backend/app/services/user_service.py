from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRoleUpdate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def update_me(self, user: User, payload: UserUpdate) -> User:
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(user, field, value)
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
