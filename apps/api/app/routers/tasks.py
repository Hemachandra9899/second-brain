from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Task
from app.services.notion_service import create_notion_task


router = APIRouter()


class CreateTaskRequest(BaseModel):
    title: str
    description: str | None = None
    sync_to_notion: bool = False


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    notion_page_id: str | None


@router.post("", response_model=TaskResponse)
def create_task(payload: CreateTaskRequest, db: Session = Depends(get_db)):
    task = Task(
        title=payload.title,
        description=payload.description,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    if payload.sync_to_notion:
        try:
            notion_page = create_notion_task(
                title=payload.title,
                description=payload.description,
            )
            task.notion_page_id = notion_page["id"]
            db.commit()
        except RuntimeError:
            pass

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        notion_page_id=task.notion_page_id,
    )


@router.get("", response_model=list[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            status=t.status,
            notion_page_id=t.notion_page_id,
        )
        for t in tasks
    ]
