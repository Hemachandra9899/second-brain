from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.models import Task, KnowledgeItem, KnowledgeChunk
from app.services.embedding_service import embed_text
from app.services.pinecone_store import upsert_text, delete_vector
from app.services.graph_service import extract_and_store_graph


def chunk_text(text: str, max_chars: int = 1200) -> list[str]:
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = start + max_chars
        chunks.append(text[start:end])
        start = end

    return chunks


def index_knowledge_item(
    db: Session,
    title: str,
    raw_text: str,
    source_type: str = "note",
    source_id: str | None = None,
) -> KnowledgeItem:
    item = KnowledgeItem(
        id=str(uuid4()),
        source_type=source_type,
        source_id=source_id or str(uuid4()),
        title=title,
        raw_text=raw_text,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    chunks = chunk_text(raw_text)

    for idx, chunk_text_value in enumerate(chunks):
        chunk_id = f"knowledge_{item.id}_chunk_{idx}"
        vector_id = chunk_id

        chunk = KnowledgeChunk(
            id=chunk_id,
            item_id=item.id,
            chunk_text=chunk_text_value,
            pinecone_vector_id=vector_id,
        )

        db.add(chunk)

        embedding = embed_text(chunk_text_value)

        upsert_text(
            vector_id=vector_id,
            embedding=embedding,
            metadata={
                "source_type": source_type,
                "source_id": item.id,
                "title": title,
                "text": chunk_text_value,
            },
        )

    db.commit()

    extract_and_store_graph(
        db=db,
        source_item_id=item.id,
        title=title,
        text=raw_text,
    )

    return item


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

    extract_and_store_graph(
        db=db,
        source_item_id=item_id,
        title=task.title,
        text=raw_text,
    )


def delete_knowledge_item(db: Session, item_id: str):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()

    if not item:
        return False

    chunks = db.query(KnowledgeChunk).filter(KnowledgeChunk.item_id == item_id).all()

    for chunk in chunks:
        if chunk.pinecone_vector_id:
            delete_vector(chunk.pinecone_vector_id)
        db.delete(chunk)

    db.delete(item)
    db.commit()

    return True


def delete_task_from_knowledge(db: Session, task_id: str):
    item_id = f"task_{task_id}"
    chunk_id = f"{item_id}_chunk_0"

    delete_vector(chunk_id)

    chunk = db.query(KnowledgeChunk).filter(KnowledgeChunk.id == chunk_id).first()
    if chunk:
        db.delete(chunk)

    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if item:
        db.delete(item)

    db.commit()
