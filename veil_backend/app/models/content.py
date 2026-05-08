import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.onboarding import ContentType, Genre

if TYPE_CHECKING:
    from app.models.user import User


class AgeRating(str, enum.Enum):
    ALL = "ALL"
    TWELVE_PLUS = "TWELVE_PLUS"
    FIFTEEN_PLUS = "FIFTEEN_PLUS"
    ADULT_ONLY = "ADULT_ONLY"


class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# 콘텐츠 타입별 티저 허용 길이 (초)
TEASER_LENGTH_RULES: dict[ContentType, tuple[int, int]] = {
    ContentType.MOVIE: (15, 45),
    ContentType.DRAMA: (15, 30),
    ContentType.BOOK: (15, 30),
    ContentType.PERFORMANCE: (15, 45),
}


class Content(Base):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # 공개 정보
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType), nullable=False)
    teaser_url: Mapped[str] = mapped_column(String(500), nullable=False)
    teaser_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    teaser_length: Mapped[int] = mapped_column(Integer, nullable=False)  # 초 단위
    synopsis: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 비공개 정보
    mvp_url: Mapped[str] = mapped_column(String(500), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    director_staff: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_rating: Mapped[AgeRating | None] = mapped_column(Enum(AgeRating), nullable=True)
    release_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    external_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 심사
    review_status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="contents")
    genres: Mapped[list["ContentGenre"]] = relationship(
        "ContentGenre", back_populates="content", cascade="all, delete-orphan", lazy="selectin"
    )


class ContentGenre(Base):
    __tablename__ = "content_genres"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(
        ForeignKey("contents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    genre: Mapped[Genre] = mapped_column(Enum(Genre), nullable=False)

    content: Mapped["Content"] = relationship("Content", back_populates="genres")
