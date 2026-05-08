import os

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import MAX_MVP_BYTES, MAX_TEASER_BYTES, get_video_duration, save_file
from app.models.content import Content, ContentGenre, ReviewStatus, TEASER_LENGTH_RULES
from app.models.onboarding import ContentType
from app.repositories.content_repository import ContentRepository
from app.schemas.content import ContentDetailUpdate


class ContentService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = ContentRepository(db)

    async def upload(
        self,
        user_id: int,
        content_type: ContentType,
        teaser_file: UploadFile,
        mvp_file: UploadFile,
    ) -> Content:
        teaser_url, teaser_path, teaser_hash = await save_file(
            teaser_file, "teasers", MAX_TEASER_BYTES
        )

        if await self.repo.get_by_teaser_hash(teaser_hash):
            os.unlink(teaser_path)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 업로드된 영상입니다",
            )

        duration = await get_video_duration(teaser_path)
        min_sec, max_sec = TEASER_LENGTH_RULES[content_type]
        if not (min_sec <= duration <= max_sec):
            os.unlink(teaser_path)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"티저 영상은 {min_sec}~{max_sec}초여야 합니다 (현재: {duration}초)",
            )

        mvp_url, _, _ = await save_file(mvp_file, "mvp", MAX_MVP_BYTES)

        content = Content(
            user_id=user_id,
            content_type=content_type,
            teaser_url=teaser_url,
            teaser_hash=teaser_hash,
            teaser_length=duration,
            mvp_url=mvp_url,
        )
        return await self.repo.create(content)

    async def update_details(
        self,
        content_id: int,
        user_id: int,
        payload: ContentDetailUpdate,
    ) -> Content:
        content = await self._get_owned(content_id, user_id)
        self._assert_editable(content)

        simple_fields = {"title", "director_staff", "synopsis", "age_rating", "release_date", "external_link"}
        for field in simple_fields:
            if field in payload.model_fields_set:
                setattr(content, field, getattr(payload, field))

        if payload.genres is not None:
            await self.repo.db.execute(
                delete(ContentGenre).where(ContentGenre.content_id == content.id)
            )
            for genre in payload.genres:
                self.repo.db.add(ContentGenre(content_id=content.id, genre=genre))

        return await self.repo.update(content)

    async def list_contents(
        self,
        user_id: int,
        status_filter: ReviewStatus | None = None,
    ) -> list[Content]:
        return await self.repo.list_by_user(user_id, status_filter)

    async def get_content(self, content_id: int, user_id: int) -> Content:
        return await self._get_owned(content_id, user_id)

    async def reupload_teaser(
        self,
        content_id: int,
        user_id: int,
        teaser_file: UploadFile,
    ) -> Content:
        content = await self._get_owned(content_id, user_id)
        self._assert_editable(content)

        teaser_url, teaser_path, teaser_hash = await save_file(
            teaser_file, "teasers", MAX_TEASER_BYTES
        )
        if await self.repo.get_by_teaser_hash(teaser_hash):
            os.unlink(teaser_path)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 업로드된 영상입니다",
            )

        duration = await get_video_duration(teaser_path)
        min_sec, max_sec = TEASER_LENGTH_RULES[content.content_type]
        if not (min_sec <= duration <= max_sec):
            os.unlink(teaser_path)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"티저 영상은 {min_sec}~{max_sec}초여야 합니다 (현재: {duration}초)",
            )

        content.teaser_url = teaser_url
        content.teaser_hash = teaser_hash
        content.teaser_length = duration
        content.review_status = ReviewStatus.PENDING
        return await self.repo.update(content)

    # ─── helpers ──────────────────────────────────────────────────────────────

    async def _get_owned(self, content_id: int, user_id: int) -> Content:
        content = await self.repo.get(content_id)
        if content is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        if content.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return content

    @staticmethod
    def _assert_editable(content: Content) -> None:
        if content.review_status == ReviewStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="승인된 컨텐츠는 수정할 수 없습니다",
            )
