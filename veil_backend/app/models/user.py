import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.content import Content
    from app.models.onboarding import UserContentType, UserGenre


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CREATOR = "CREATOR"
    USER = "USER"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    genres: Mapped[list["UserGenre"]] = relationship(
        "UserGenre", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    content_types: Mapped[list["UserContentType"]] = relationship(
        "UserContentType", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    contents: Mapped[list["Content"]] = relationship(
        "Content", back_populates="user", cascade="all, delete-orphan"
    )
