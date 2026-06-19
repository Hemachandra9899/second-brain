from uuid import uuid4
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Task
from app.services.notion_service import create_notion_task
from app.services.knowledge_service import index_task_as_knowledge


router = APIRouter()


class CreateTaskRequest(BaseModel):
    title: str
    description: str | None = None
    status: str = "Todo"
    priority: str = "Normal"
    due_date: str | None = None
    sync_to_notion: bool = False


@router.get("")
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()

    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "source": task.source,
            "notion_page_id": task.notion_page_id,
        }
        for task in tasks
    ]


@router.post("")
def create_task(payload: CreateTaskRequest, db: Session = Depends(get_db)):
    task = Task(
        id=str(uuid4()),
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
        source="second_brain",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    if payload.sync_to_notion:
        try:
            page = create_notion_task(
                title=task.title,
                description=task.description,
                status=task.status,
                due_date=task.due_date,
                priority=task.priority,
            )
            task.notion_page_id = page.get("id")
            db.commit()
            db.refresh(task)
        except Exception:
            pass

    try:
        index_task_as_knowledge(db=db, task=task)
    except Exception:
        pass

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "source": task.source,
        "notion_page_id": task.notion_page_id,
    }
