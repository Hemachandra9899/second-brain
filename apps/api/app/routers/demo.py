from uuid import uuid4
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Task
from app.services.knowledge_service import index_task_as_knowledge, index_knowledge_item


router = APIRouter()


@router.post("/seed")
def seed_demo(db: Session = Depends(get_db)):
    task = Task(
        id=str(uuid4()),
        title="Prepare Second Brain public demo",
        description="Show tasks, calendar, mood-aware UI, knowledge base, Pinecone search, and GraphRAG.",
        status="Todo",
        priority="High",
        due_date="2026-06-22",
        source="demo",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    index_task_as_knowledge(db=db, task=task)

    item = index_knowledge_item(
        db=db,
        title="Second Brain product idea",
        raw_text=(
            "Second Brain is a mood-aware AI workspace that combines tasks, calendar, "
            "personal knowledge, semantic search, and GraphRAG over user context."
        ),
        source_type="demo",
        source_id="public_demo",
    )

    return {
        "ok": True,
        "task_id": task.id,
        "knowledge_item_id": item.id,
    }
