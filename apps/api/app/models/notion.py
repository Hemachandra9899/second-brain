from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class NotionConnection(Base):
    __tablename__ = "notion_connections"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)

    encrypted_access_token: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    bot_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    workspace_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    workspace_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    workspace_icon: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    owner_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    owner_email: Mapped[str | None] = mapped_column(String(500), nullable=True)
    owner_avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    default_database_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_data_source_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_database_title: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
