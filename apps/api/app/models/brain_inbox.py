import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class BrainInboxItem(Base):
    __tablename__ = "brain_inbox_items"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    suggested_type: Mapped[str] = mapped_column(String(50), default="memory")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="Normal")
    tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)

    created_item_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_item_id: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
