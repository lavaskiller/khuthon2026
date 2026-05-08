import re
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.user import Gender

_URL_RE = re.compile(r"^https?://.+")


class InterestedConsumerItem(BaseModel):
    user_id: int          # 프론트에서 발송 선택에 사용, UI에는 표시 안 함
    anon_id: str          # 컨텐츠별 익명 식별자 (UI 표시용)
    age_group: str        # "20대", "30대" 등
    gender: Gender | None
    region: str | None
    interested_at: datetime
    notice_sent: bool
    notice_sent_at: datetime | None


class SendNoticePayload(BaseModel):
    url: str
    message: str
    label: str | None = None
    user_ids: list[int]

    @field_validator("url")
    @classmethod
    def _validate_url(cls, v: str) -> str:
        if not _URL_RE.match(v):
            raise ValueError("URL은 http:// 또는 https://로 시작해야 합니다")
        return v

    @field_validator("user_ids")
    @classmethod
    def _not_empty(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("발송 대상을 1명 이상 선택해야 합니다")
        return v


class SendNoticeResult(BaseModel):
    sent_count: int
    notice_id: int


class ReceivedNoticeItem(BaseModel):
    notice_id: int
    content_id: int
    url: str
    message: str
    label: str | None
    sent_at: datetime
