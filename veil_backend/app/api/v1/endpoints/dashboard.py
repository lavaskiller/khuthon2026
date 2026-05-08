from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    sort: Literal["activity", "created"] = "created",
    current_user: User = Depends(require_roles(UserRole.CREATOR)),
    db: AsyncSession = Depends(get_db),
):
    return await DashboardService(db).get_dashboard(
        creator_id=current_user.id, sort=sort
    )
