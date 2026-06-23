from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.projects.project_schema import CreateProjectRequest, UpdateProjectRequest, CreateGoalRequest, UpdateGoalRequest
from app.modules.projects.project_brain_service import get_project_brain
from app.modules.projects.project_service import (
    create_project,
    list_projects,
    update_project,
    delete_project,
    create_goal,
    list_goals,
    update_goal,
    delete_goal,
)

router = APIRouter()


@router.post("")
def create_project_endpoint(
    payload: CreateProjectRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return create_project(
        db=db,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.get("")
def list_projects_endpoint(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return list_projects(
        db=db,
        user_id=current_user.id if current_user else None,
    )


@router.patch("/{project_id}")
def update_project_endpoint(
    project_id: str,
    payload: UpdateProjectRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return update_project(
        db=db,
        project_id=project_id,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.delete("/{project_id}")
def delete_project_endpoint(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return delete_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id if current_user else None,
    )


@router.post("/goals")
def create_goal_endpoint(
    payload: CreateGoalRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return create_goal(
        db=db,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.get("/goals")
def list_goals_endpoint(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return list_goals(
        db=db,
        user_id=current_user.id if current_user else None,
    )


@router.patch("/goals/{goal_id}")
def update_goal_endpoint(
    goal_id: str,
    payload: UpdateGoalRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return update_goal(
        db=db,
        goal_id=goal_id,
        payload=payload,
        user_id=current_user.id if current_user else None,
    )


@router.get("/{project_id}/brain")
def project_brain(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_project_brain(
        db=db,
        current_user=current_user,
        project_id=project_id,
    )


@router.delete("/goals/{goal_id}")
def delete_goal_endpoint(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return delete_goal(
        db=db,
        goal_id=goal_id,
        user_id=current_user.id if current_user else None,
    )
