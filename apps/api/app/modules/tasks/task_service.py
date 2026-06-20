from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Task, User
from app.modules.tasks.task_schema import CreateTaskRequest, UpdateTaskRequest
from app.modules.knowledge.knowledge_service import index_task_as_knowledge, delete_task_from_knowledge
from app.modules.integrations.notion.notion_oauth_service import (
    get_notion_token,
    get_notion_connection,
    get_decrypted_token,
)


def serialize_task(task: Task) -> dict:
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


def list_tasks(db: Session, user_id: str | None = None) -> list[dict]:
    query = db.query(Task).order_by(Task.created_at.desc())

    if user_id:
        query = query.filter((Task.user_id == user_id) | (Task.user_id.is_(None)))

    tasks = query.all()
    return [serialize_task(task) for task in tasks]


def list_scheduled_tasks(
    db: Session,
    from_date: str | None = None,
    to_date: str | None = None,
    user_id: str | None = None,
) -> list[dict]:
    query = db.query(Task).filter(Task.due_date.isnot(None))

    if user_id:
        query = query.filter((Task.user_id == user_id) | (Task.user_id.is_(None)))

    if from_date:
        query = query.filter(Task.due_date >= from_date)

    if to_date:
        query = query.filter(Task.due_date <= to_date)

    tasks = query.order_by(Task.due_date.asc()).all()
    return [serialize_task(task) for task in tasks]


def create_task(
    db: Session,
    payload: CreateTaskRequest,
    user_id: str | None = None,
) -> dict:
    task = Task(
        id=str(uuid4()),
        user_id=user_id,
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

    if payload.sync_to_notion and user_id:
        try:
            notion_token = get_notion_token(db, user_id)
            if notion_token:
                from app.modules.integrations.notion.notion_service import create_notion_task
                page = create_notion_task(
                    access_token=notion_token,
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


def update_task(
    db: Session,
    task_id: str,
    payload: UpdateTaskRequest,
    user_id: str | None = None,
) -> dict:
    query = db.query(Task).filter(Task.id == task_id)

    if user_id:
        query = query.filter(Task.user_id == user_id)

    task = query.first()

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

    if payload.sync_to_notion and user_id:
        try:
            notion_token = get_notion_token(db, user_id)
            if notion_token:
                from app.modules.integrations.notion.notion_service import (
                    create_notion_task,
                    update_notion_task,
                )
                if task.notion_page_id:
                    update_notion_task(
                        access_token=notion_token,
                        page_id=task.notion_page_id,
                        title=task.title,
                        description=task.description,
                        status=task.status,
                        due_date=task.due_date,
                        priority=task.priority,
                    )
                else:
                    page = create_notion_task(
                        access_token=notion_token,
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


def sync_task_to_notion(
    db: Session,
    task_id: str,
    user_id: str | None = None,
) -> dict:
    query = db.query(Task).filter(Task.id == task_id)

    if user_id:
        query = query.filter(Task.user_id == user_id)

    task = query.first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if user_id:
        notion_token = get_notion_token(db, user_id)
        if notion_token:
            from app.modules.integrations.notion.notion_service import (
                create_notion_task,
                update_notion_task,
            )
            if task.notion_page_id:
                update_notion_task(
                    access_token=notion_token,
                    page_id=task.notion_page_id,
                    title=task.title,
                    description=task.description,
                    status=task.status,
                    due_date=task.due_date,
                    priority=task.priority,
                )
            else:
                page = create_notion_task(
                    access_token=notion_token,
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


def complete_task_and_sync_to_notion(
    db: Session,
    task_id: str,
    current_user: User | None,
) -> dict:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "Done"
    db.commit()
    db.refresh(task)

    notion_result = None
    notion_error = None

    if task.notion_page_id:
        try:
            conn = get_notion_connection(db, current_user)

            if conn:
                access_token = get_decrypted_token(conn)

                from app.modules.integrations.notion.notion_service import (
                    mark_notion_task_done,
                )

                notion_result = mark_notion_task_done(
                    access_token=access_token,
                    page_id=task.notion_page_id,
                    task_title=task.title,
                )
            else:
                notion_error = "Notion is not connected"

        except Exception as exc:
            notion_error = str(exc)

    try:
        index_task_as_knowledge(db=db, task=task)
    except Exception:
        pass

    return {
        "ok": True,
        "task": serialize_task(task),
        "notion_updated": bool(
            notion_result
            and (
                notion_result.get("status_updated")
                or notion_result.get("todo_block_updated")
            )
        ),
        "notion_result": notion_result,
        "notion_error": notion_error,
    }


def delete_task(
    db: Session,
    task_id: str,
    user_id: str | None = None,
) -> dict:
    query = db.query(Task).filter(Task.id == task_id)

    if user_id:
        query = query.filter(Task.user_id == user_id)

    task = query.first()

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
