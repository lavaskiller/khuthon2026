from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.content import ReviewStatus
from app.models.onboarding import ContentType
from app.models.user import User, UserRole
from app.schemas.content import ContentDetailUpdate, ContentListItem, ContentRead
from app.services.content_service import ContentService

router = APIRouter(prefix="/contents", tags=["contents"])

_creator_only = Depends(require_roles(UserRole.CREATOR))


@router.post("/upload", response_model=ContentRead, status_code=201)
async def upload_content(
    content_type: Annotated[ContentType, Form()],
    teaser_file: Annotated[UploadFile, File()],
    mvp_file: Annotated[UploadFile, File()],
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await ContentService(db).upload(
        user_id=current_user.id,
        content_type=content_type,
        teaser_file=teaser_file,
        mvp_file=mvp_file,
    )


@router.get("", response_model=list[ContentListItem])
async def list_contents(
    status: ReviewStatus | None = None,
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await ContentService(db).list_contents(user_id=current_user.id, status_filter=status)


@router.get("/{content_id}", response_model=ContentRead)
async def get_content(
    content_id: int,
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await ContentService(db).get_content(
        content_id=content_id, user_id=current_user.id
    )


@router.patch("/{content_id}", response_model=ContentRead)
async def update_content_details(
    content_id: int,
    payload: ContentDetailUpdate,
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await ContentService(db).update_details(
        content_id=content_id, user_id=current_user.id, payload=payload
    )


@router.post("/{content_id}/teaser", response_model=ContentRead)
async def reupload_teaser(
    content_id: int,
    teaser_file: Annotated[UploadFile, File()],
    current_user: User = _creator_only,
    db: AsyncSession = Depends(get_db),
):
    return await ContentService(db).reupload_teaser(
        content_id=content_id, user_id=current_user.id, teaser_file=teaser_file
    )
