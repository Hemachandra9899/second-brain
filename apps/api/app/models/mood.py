from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MoodEvent(Base):
    __tablename__ = "mood_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    mood: Mapped[str] = mapped_column(String(50), nullable=False)
    intensity: Mapped[str] = mapped_column(String(50), default="medium")
    confidence: Mapped[str] = mapped_column(String(50), default="0.5")

    valence: Mapped[str] = mapped_column(String(50), default="neutral")
    arousal: Mapped[str] = mapped_column(String(50), default="medium")

    recommended_tone: Mapped[str] = mapped_column(String(100), default="calm_supportive")
    theme_name: Mapped[str] = mapped_column(String(100), default="soft_sky")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
