from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models.content import ReviewStatus
from app.models.notification import NotificationType
from app.models.onboarding import ContentType


class ContentSummary(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int


class NotificationPreview(BaseModel):
    id: int
    type: NotificationType
    content_id: int | None
    created_at: datetime


class NotificationArea(BaseModel):
    unread_count: int
    recent: list[NotificationPreview]


class ContentCardItem(BaseModel):
    id: int
    title: str | None
    content_type: ContentType
    review_status: ReviewStatus
    exposure_count: int
    interest_count: int
    created_at: datetime
    last_activity_at: datetime | None


class DashboardResponse(BaseModel):
    summary: ContentSummary
    notifications: NotificationArea
    contents: list[ContentCardItem]
