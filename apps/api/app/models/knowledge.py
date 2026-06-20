from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    project_id: Mapped[str | None] = mapped_column(String, ForeignKey("projects.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    item_id: Mapped[str] = mapped_column(String, ForeignKey("knowledge_items.id"))
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    pinecone_vector_id: Mapped[str | None] = mapped_column(String(300), nullable=True)

    item = relationship("KnowledgeItem")


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)


class Relationship(Base):
    __tablename__ = "relationships"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    from_entity_id: Mapped[str] = mapped_column(String, ForeignKey("entities.id"))
    to_entity_id: Mapped[str] = mapped_column(String, ForeignKey("entities.id"))
    relation_type: Mapped[str] = mapped_column(String(100), nullable=False)
