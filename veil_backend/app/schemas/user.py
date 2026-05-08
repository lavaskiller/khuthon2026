from datetime import date

from pydantic import BaseModel, EmailStr, field_validator

from app.models.onboarding import ContentType, Genre
from app.models.user import Gender, UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    birth_date: date
    gender: Gender
    region: str | None = None
    genres: list[Genre]
    content_types: list[ContentType] = []

    @field_validator("genres")
    @classmethod
    def _genres_not_empty(cls, v: list[Genre]) -> list[Genre]:
        if not v:
            raise ValueError("At least one genre is required")
        return v


class UserUpdate(BaseModel):
    name: str | None = None
    birth_date: date | None = None
    gender: Gender | None = None
    region: str | None = None
    genres: list[Genre] | None = None
    content_types: list[ContentType] | None = None

    @field_validator("genres")
    @classmethod
    def _genres_not_empty(cls, v: list[Genre] | None) -> list[Genre] | None:
        if v is not None and not v:
            raise ValueError("At least one genre is required")
        return v


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: UserRole
    birth_date: date
    gender: Gender
    region: str | None
    is_active: bool
    genres: list[Genre] = []
    content_types: list[ContentType] = []

    @field_validator("genres", mode="before")
    @classmethod
    def _extract_genres(cls, v):
        if v and hasattr(v[0], "genre"):
            return [item.genre for item in v]
        return v or []

    @field_validator("content_types", mode="before")
    @classmethod
    def _extract_content_types(cls, v):
        if v and hasattr(v[0], "content_type"):
            return [item.content_type for item in v]
        return v or []

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
