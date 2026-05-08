from datetime import datetime

from pydantic import BaseModel, computed_field

from app.models.notification import NotificationType


class NotificationItem(BaseModel):
    id: int
    notification_type: NotificationType
    related_content_id: int | None
    related_user_id: str | None
    extra_data: dict | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    total: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    count: int
    display: str  # "0"~"9" 또는 "9+"
