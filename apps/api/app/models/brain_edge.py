import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class BrainEdge(Base):
    __tablename__ = "brain_edges"

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

    source_item_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("brain_items.id"),
        nullable=False,
        index=True,
    )

    target_item_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("brain_items.id"),
        nullable=False,
        index=True,
    )

    relation_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
