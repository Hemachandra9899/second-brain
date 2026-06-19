from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Task
from app.services.notion_service import create_notion_task, update_notion_task
from app.services.knowledge_service import index_task_as_knowledge, delete_task_from_knowledge


router = APIRouter()


class CreateTaskRequest(BaseModel):
    title: str
    description: str | None = None
    status: str = "Todo"
    priority: str = "Normal"
    due_date: str | None = None
    sync_to_notion: bool = False


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None
    sync_to_notion: bool = False


def serialize_task(task: Task):
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


@router.get("")
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [serialize_task(task) for task in tasks]


@router.get("/scheduled")
def list_scheduled_tasks(
    from_date: str | None = Query(default=None),
    to_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.due_date.isnot(None))

    if from_date:
        query = query.filter(Task.due_date >= from_date)

    if to_date:
        query = query.filter(Task.due_date <= to_date)

    tasks = query.order_by(Task.due_date.asc()).all()
    return [serialize_task(task) for task in tasks]


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

    return serialize_task(task)


@router.patch("/{task_id}")
def update_task(task_id: str, payload: UpdateTaskRequest, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title

    if payload.description is not None:
        task.description = payload.description

    if payload.status is not None:
        task.status = payload.status

    if payload.priority is not None:
        task.priority = payload.priority

    if payload.due_date is not None:
        task.due_date = payload.due_date

    db.commit()
    db.refresh(task)

    if payload.sync_to_notion:
        try:
            if task.notion_page_id:
                update_notion_task(
                    page_id=task.notion_page_id,
                    title=task.title,
                    description=task.description,
                    status=task.status,
                    due_date=task.due_date,
                    priority=task.priority,
                )
            else:
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

    return serialize_task(task)


@router.post("/{task_id}/sync/notion")
def sync_task_to_notion(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.notion_page_id:
        update_notion_task(
            page_id=task.notion_page_id,
            title=task.title,
            description=task.description,
            status=task.status,
            due_date=task.due_date,
            priority=task.priority,
        )
    else:
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

    return serialize_task(task)


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        delete_task_from_knowledge(db=db, task_id=task.id)
    except Exception:
        pass

    db.delete(task)
    db.commit()

    return {
        "ok": True,
        "deleted_task_id": task_id,
    }
