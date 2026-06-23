from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Dream(Base):
    __tablename__ = "dreams"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)

    dream_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    dream_type: Mapped[str] = mapped_column(String(50), default="nightly")

    title: Mapped[str] = mapped_column(String(500), nullable=False, default="Brain Dream")
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    patterns_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    forgotten_items_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_actions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    tomorrow_plan_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_ids_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
