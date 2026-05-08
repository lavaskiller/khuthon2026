from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.invite import (
    InterestedConsumerItem,
    ReceivedNoticeItem,
    SendNoticePayload,
    SendNoticeResult,
)
from app.services.invite_service import InviteService

router = APIRouter(prefix="/invite", tags=["invite"])

_creator_only = Depends(require_roles(UserRole.CREATOR))


@router.get("/{content_id}/interested", response_model=list[InterestedConsumerItem])
async def get_interested_consumers(
    content_id: int,
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await InviteService(db).get_interested_consumers(
        content_id=content_id, creator_id=current_user.id
    )


@router.post("/{content_id}/send", response_model=SendNoticeResult)
async def send_external_notice(
    content_id: int,
    payload: SendNoticePayload,
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await InviteService(db).send_external_notice(
        content_id=content_id, creator_id=current_user.id, payload=payload
    )


@router.get("/notices", response_model=list[ReceivedNoticeItem])
async def get_received_notices(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await InviteService(db).get_received_notices(user_id=current_user.id)
