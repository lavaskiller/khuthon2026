import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Genre(str, enum.Enum):
    ACTION = "ACTION"
    DRAMA = "DRAMA"
    COMEDY = "COMEDY"
    ROMANCE = "ROMANCE"
    THRILLER = "THRILLER"
    HORROR = "HORROR"
    SF = "SF"
    FANTASY = "FANTASY"
    MYSTERY = "MYSTERY"
    DOCUMENTARY = "DOCUMENTARY"
    ANIMATION = "ANIMATION"
    FAMILY = "FAMILY"
    MUSIC = "MUSIC"


class ContentType(str, enum.Enum):
    MOVIE = "MOVIE"
    DRAMA = "DRAMA"
    BOOK = "BOOK"
    PERFORMANCE = "PERFORMANCE"


class UserGenre(Base):
    __tablename__ = "user_genres"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    genre: Mapped[Genre] = mapped_column(Enum(Genre), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="genres")


class UserContentType(Base):
    __tablename__ = "user_content_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="content_types")
