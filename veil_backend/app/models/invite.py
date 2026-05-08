import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.content import Content
    from app.models.user import User


class InviteStatus(str, enum.Enum):
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    VIEWED = "VIEWED"


class ScreeningInvite(Base):
    __tablename__ = "screening_invites"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(
        ForeignKey("contents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    creator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[InviteStatus] = mapped_column(
        Enum(InviteStatus), default=InviteStatus.SENT, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    content: Mapped["Content"] = relationship("Content", foreign_keys=[content_id])
    creator: Mapped["User"] = relationship("User", foreign_keys=[creator_id])
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


class ExternalNotice(Base):
    __tablename__ = "external_notices"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(
        ForeignKey("contents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    creator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    content: Mapped["Content"] = relationship("Content", foreign_keys=[content_id])
    creator: Mapped["User"] = relationship("User", foreign_keys=[creator_id])
    recipients: Mapped[list["ExternalNoticeRecipient"]] = relationship(
        "ExternalNoticeRecipient", back_populates="notice", cascade="all, delete-orphan"
    )


class ExternalNoticeRecipient(Base):
    __tablename__ = "external_notice_recipients"

    id: Mapped[int] = mapped_column(primary_key=True)
    notice_id: Mapped[int] = mapped_column(
        ForeignKey("external_notices.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    viewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    notice: Mapped["ExternalNotice"] = relationship("ExternalNotice", back_populates="recipients")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
