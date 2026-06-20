from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sender_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    direction: Mapped[str] = mapped_column(String(20), default="inbound")
    message_text: Mapped[str] = mapped_column(Text, nullable=False)

    detected_intent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    detected_mood: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_task_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_knowledge_item_id: Mapped[str | None] = mapped_column(String(200), nullable=True)

    raw_payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
