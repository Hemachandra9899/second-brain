from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import User
from app.modules.tasks.task_schema import CreateTaskRequest, UpdateTaskRequest
from app.modules.tasks.task_service import (
    list_tasks,
    list_scheduled_tasks,
    create_task,
    update_task,
    delete_task,
    sync_task_to_notion,
)

router = APIRouter()


@router.get("")
def list_tasks_endpoint(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return list_tasks(
        db=db,
        user_id=current_user.id if current_user else None,
    )


@router.get("/scheduled")
def list_scheduled_tasks_endpoint(
    from_date: str | None = Query(default=None),
    to_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return list_scheduled_tasks(
        db=db,
        from_date=from_date,
        to_date=to_date,
        user_id=current_user.id if current_user else None,
    )


@router.post("")
def create_task_endpoint(
    payload: CreateTaskRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return create_task(
        db=db,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.patch("/{task_id}")
def update_task_endpoint(
    task_id: str,
    payload: UpdateTaskRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return update_task(
        db=db,
        task_id=task_id,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.post("/{task_id}/sync/notion")
def sync_task_to_notion_endpoint(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return sync_task_to_notion(
        db=db,
        task_id=task_id,
        user_id=current_user.id if current_user else None,
    )


@router.delete("/{task_id}")
def delete_task_endpoint(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return delete_task(
        db=db,
        task_id=task_id,
        user_id=current_user.id if current_user else None,
    )
