from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.onboarding import ContentType
from app.models.user import User
from app.schemas.explore import (
    ContentRevealRead,
    FeedPage,
    InterestListItem,
    ReactionRead,
)
from app.services.explore_service import ExploreService

router = APIRouter(prefix="/explore", tags=["explore"])


@router.get("/feed", response_model=FeedPage)
async def get_feed(
    content_types: list[ContentType] | None = Query(default=None),
    exclude_ids: list[int] = Query(default=[]),
    page: int = 1,
    page_size: int = 5,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExploreService(db).get_feed(
        user=current_user,
        content_types=content_types,
        exclude_ids=exclude_ids,
        page=page,
        page_size=page_size,
    )


@router.post("/{content_id}/pass", response_model=ReactionRead)
async def pass_content(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExploreService(db).pass_content(
        user_id=current_user.id, content_id=content_id
    )


@router.post("/{content_id}/interest", response_model=ContentRevealRead)
async def interest_content(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    reveal, _ = await ExploreService(db).interest_content(
        user_id=current_user.id, content_id=content_id
    )
    return reveal


@router.get("/interests", response_model=list[InterestListItem])
async def get_interest_list(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExploreService(db).get_interest_list(user_id=current_user.id)


@router.get("/{content_id}/reveal", response_model=ContentRevealRead)
async def get_reveal(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    reveal, _ = await ExploreService(db).interest_content(
        user_id=current_user.id, content_id=content_id
    )
    return reveal


@router.delete("/{content_id}/interest", status_code=204)
async def remove_interest(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await ExploreService(db).remove_interest(
        user_id=current_user.id, content_id=content_id
    )
