from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.models import Task, KnowledgeItem, KnowledgeChunk
from app.services.embedding_service import embed_text
from app.services.pinecone_store import upsert_text


def index_task_as_knowledge(db: Session, task: Task):
    raw_text = f"""
Task: {task.title}
Description: {task.description or ""}
Status: {task.status}
Priority: {task.priority}
Due date: {task.due_date or "None"}
Source: {task.source}
""".strip()

    item_id = f"task_{task.id}"

    existing = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()

    if not existing:
        item = KnowledgeItem(
            id=item_id,
            source_type="task",
            source_id=task.id,
            title=task.title,
            raw_text=raw_text,
        )
        db.add(item)
    else:
        item = existing
        item.title = task.title
        item.raw_text = raw_text

    chunk_id = f"{item_id}_chunk_0"
    vector_id = chunk_id

    existing_chunk = db.query(KnowledgeChunk).filter(KnowledgeChunk.id == chunk_id).first()

    if not existing_chunk:
        chunk = KnowledgeChunk(
            id=chunk_id,
            item_id=item_id,
            chunk_text=raw_text,
            pinecone_vector_id=vector_id,
        )
        db.add(chunk)
    else:
        chunk = existing_chunk
        chunk.chunk_text = raw_text

    db.commit()

    embedding = embed_text(raw_text)

    upsert_text(
        vector_id=vector_id,
        embedding=embedding,
        metadata={
            "source_type": "task",
            "source_id": task.id,
            "title": task.title,
            "text": raw_text,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date or "",
            "notion_page_id": task.notion_page_id or "",
        },
    )
