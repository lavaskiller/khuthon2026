from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserRead, UserRoleUpdate, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).update_me(current_user, payload)


@router.get("", response_model=list[UserRead])
async def list_users(
    _: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).list_users()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    _: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).get_user(user_id)


@router.patch("/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    _: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).update_role(user_id, payload)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    _: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await UserService(db).delete_user(user_id)
