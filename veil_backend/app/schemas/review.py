from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.content import AgeRating, ReviewStatus
from app.models.onboarding import ContentType, Genre


def mask_email(email: str) -> str:
    local, domain = email.split("@", 1)
    masked = local[:2] + "***" if len(local) > 2 else "***"
    return f"{masked}@{domain}"


class PendingContentItem(BaseModel):
    id: int
    content_type: ContentType
    created_at: datetime
    creator_email_masked: str


class PaginatedPendingContents(BaseModel):
    items: list[PendingContentItem]
    total: int
    page: int
    page_size: int


class ContentAdminDetail(BaseModel):
    id: int
    user_id: int
    content_type: ContentType
    teaser_url: str
    teaser_length: int
    synopsis: str | None
    mvp_url: str
    title: str | None
    director_staff: str | None
    genres: list[Genre] = []
    age_rating: AgeRating | None
    release_date: date | None
    external_link: str | None
    review_status: ReviewStatus
    rejection_reason: str | None
    reviewed_by_id: int | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    creator_email: str

    @field_validator("genres", mode="before")
    @classmethod
    def _extract_genres(cls, v):
        if v and hasattr(v[0], "genre"):
            return [item.genre for item in v]
        return v or []


class RejectPayload(BaseModel):
    rejection_reason: str


class ReviewHistoryItem(BaseModel):
    id: int
    title: str | None
    content_type: ContentType
    review_status: ReviewStatus
    rejection_reason: str | None
    reviewed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
