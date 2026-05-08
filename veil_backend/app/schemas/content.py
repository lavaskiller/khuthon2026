from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.content import AgeRating, ReviewStatus
from app.models.onboarding import ContentType, Genre


class ContentDetailUpdate(BaseModel):
    title: str | None = None
    director_staff: str | None = None
    synopsis: str | None = None
    genres: list[Genre] | None = None
    age_rating: AgeRating | None = None
    release_date: date | None = None
    external_link: str | None = None


class ContentRead(BaseModel):
    id: int
    user_id: int
    content_type: ContentType
    teaser_url: str
    teaser_length: int
    synopsis: str | None
    title: str | None
    director_staff: str | None
    genres: list[Genre] = []
    age_rating: AgeRating | None
    release_date: date | None
    external_link: str | None
    review_status: ReviewStatus
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime

    @field_validator("genres", mode="before")
    @classmethod
    def _extract_genres(cls, v):
        if v and hasattr(v[0], "genre"):
            return [item.genre for item in v]
        return v or []

    model_config = {"from_attributes": True}


class ContentListItem(BaseModel):
    id: int
    title: str | None
    content_type: ContentType
    review_status: ReviewStatus
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
