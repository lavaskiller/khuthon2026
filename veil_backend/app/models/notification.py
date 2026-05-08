import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.content import Content
    from app.models.user import User


class NotificationType(str, enum.Enum):
    INFO_REVEAL = "info_reveal"
    EXTERNAL_NOTICE = "external_notice"
    REVIEW_RESULT = "review_result"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipient_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False
    )
    related_content_id: Mapped[int | None] = mapped_column(
        ForeignKey("contents.id", ondelete="SET NULL"), nullable=True
    )
    related_user_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_user_id])
    content: Mapped["Content | None"] = relationship(
        "Content", foreign_keys=[related_content_id]
    )
