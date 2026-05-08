from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.content import AgeRating
from app.models.onboarding import ContentType, Genre
from app.models.reaction import ReactionType


class FeedItem(BaseModel):
    id: int
    content_type: ContentType
    teaser_url: str
    teaser_length: int

    model_config = {"from_attributes": True}


class FeedPage(BaseModel):
    items: list[FeedItem]
    has_more: bool
    page: int
    page_size: int


class ContentRevealRead(BaseModel):
    id: int
    content_type: ContentType
    title: str | None
    director_staff: str | None
    synopsis: str | None
    genres: list[Genre] = []
    release_date: date | None
    age_rating: AgeRating | None
    external_link: str | None

    @field_validator("genres", mode="before")
    @classmethod
    def _extract_genres(cls, v):
        if v and hasattr(v[0], "genre"):
            return [item.genre for item in v]
        return v or []

    model_config = {"from_attributes": True}


class ReactionRead(BaseModel):
    id: int
    content_id: int
    type: ReactionType | None
    pass_count: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class InterestListItem(BaseModel):
    reaction_id: int
    content_id: int
    content_type: ContentType
    title: str | None
    genres: list[Genre] = []
    interested_at: datetime
