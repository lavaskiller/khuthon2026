import hashlib
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Content, ReviewStatus
from app.models.notification import Notification, NotificationType
from app.repositories.invite_repository import InviteRepository
from app.schemas.invite import (
    InterestedConsumerItem,
    ReceivedNoticeItem,
    SendNoticePayload,
    SendNoticeResult,
)


def _age_group(birth_date: date) -> str:
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    return f"{(age // 10) * 10}대"


def _anon_id(user_id: int, content_id: int) -> str:
    raw = f"veil:{content_id}:{user_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


class InviteService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = InviteRepository(db)
        self.db = db

    async def get_interested_consumers(
        self, content_id: int, creator_id: int
    ) -> list[InterestedConsumerItem]:
        await self._assert_content_owned(content_id, creator_id)

        reactions = await self.repo.get_interests_with_users(content_id)
        notified = await self.repo.get_notified_user_ids(content_id)

        return [
            InterestedConsumerItem(
                user_id=r.user.id,
                anon_id=_anon_id(r.user.id, content_id),
                age_group=_age_group(r.user.birth_date),
                gender=r.user.gender,
                region=r.user.region,
                interested_at=r.updated_at,
                notice_sent=r.user.id in notified,
                notice_sent_at=notified.get(r.user.id),
            )
            for r in reactions
        ]

    async def send_external_notice(
        self, content_id: int, creator_id: int, payload: SendNoticePayload
    ) -> SendNoticeResult:
        await self._assert_content_owned(content_id, creator_id)
        await self._check_duplicate(content_id, creator_id, payload.url)

        # 대상이 실제 해당 컨텐츠에 관심을 누른 유저인지 검증
        reactions = await self.repo.get_interests_with_users(content_id)
        valid_ids = {r.user.id for r in reactions}
        target_ids = [uid for uid in payload.user_ids if uid in valid_ids]
        if not target_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="유효한 발송 대상이 없습니다",
            )

        notice = await self.repo.create_notice(
            content_id=content_id,
            creator_id=creator_id,
            url=payload.url,
            message=payload.message,
            label=payload.label,
            user_ids=target_ids,
        )

        # 인앱 알림 생성
        for uid in target_ids:
            self.db.add(
                Notification(
                    user_id=uid,
                    type=NotificationType.EXTERNAL_NOTICE,
                    content_id=content_id,
                )
            )
        await self.db.commit()

        return SendNoticeResult(sent_count=len(target_ids), notice_id=notice.id)

    async def get_received_notices(self, user_id: int) -> list[ReceivedNoticeItem]:
        recipients = await self.repo.get_received_by_user(user_id)
        return [
            ReceivedNoticeItem(
                notice_id=r.notice.id,
                content_id=r.notice.content_id,
                url=r.notice.url,
                message=r.notice.message,
                label=r.notice.label,
                sent_at=r.notice.sent_at,
            )
            for r in recipients
        ]

    # ─── helpers ──────────────────────────────────────────────────────────────

    async def _assert_content_owned(self, content_id: int, creator_id: int) -> None:
        content = await self.db.get(Content, content_id)
        if content is None or content.review_status != ReviewStatus.APPROVED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        if content.user_id != creator_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    async def _check_duplicate(
        self, content_id: int, creator_id: int, url: str
    ) -> None:
        since = datetime.now(timezone.utc) - timedelta(days=3)
        recent = await self.repo.get_recent_notices(content_id, creator_id, since)

        if not recent:
            return

        # URL이 변경된 경우 새 안내로 간주 → 허용
        if recent[0].url != url:
            return

        # 동일 URL 3일 이내 2회 이상 → 차단
        if len(recent) >= 2:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="3일 이내 동일 URL로 최대 2회까지 발송 가능합니다",
            )
