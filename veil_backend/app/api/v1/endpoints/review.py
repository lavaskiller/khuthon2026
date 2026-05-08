from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.onboarding import ContentType
from app.models.user import User, UserRole
from app.schemas.review import (
    ContentAdminDetail,
    PaginatedPendingContents,
    RejectPayload,
    ReviewHistoryItem,
)
from app.services.review_service import ReviewService

router = APIRouter(prefix="/review", tags=["review"])

_admin_only = Depends(require_roles(UserRole.ADMIN))


@router.get("/pending", response_model=PaginatedPendingContents)
async def list_pending(
    page: int = 1,
    page_size: int = 10,
    content_type: ContentType | None = None,
    uploaded_from: date | None = None,
    uploaded_to: date | None = None,
    current_user: User = _admin_only,
    db: AsyncSession = Depends(get_db),
):
    return await ReviewService(db).list_pending(
        content_type=content_type,
        uploaded_from=uploaded_from,
        uploaded_to=uploaded_to,
        page=page,
        page_size=page_size,
    )


@router.get("/{content_id}", response_model=ContentAdminDetail)
async def get_for_review(
    content_id: int,
    _: User = _admin_only,
    db: AsyncSession = Depends(get_db),
):
    return await ReviewService(db).get_for_review(content_id)


@router.post("/{content_id}/approve", response_model=ContentAdminDetail)
async def approve_content(
    content_id: int,
    current_user: User = _admin_only,
    db: AsyncSession = Depends(get_db),
):
    return await ReviewService(db).approve(content_id, admin_id=current_user.id)


@router.post("/{content_id}/reject", response_model=ContentAdminDetail)
async def reject_content(
    content_id: int,
    payload: RejectPayload,
    current_user: User = _admin_only,
    db: AsyncSession = Depends(get_db),
):
    return await ReviewService(db).reject(
        content_id, admin_id=current_user.id, rejection_reason=payload.rejection_reason
    )


@router.get("/history/me", response_model=list[ReviewHistoryItem])
async def my_review_history(
    current_user: User = _admin_only,
    db: AsyncSession = Depends(get_db),
):
    return await ReviewService(db).list_history(admin_id=current_user.id)
