from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.projects.project_schema import CreateProjectRequest, UpdateProjectRequest, CreateGoalRequest, UpdateGoalRequest
from app.modules.projects.project_brain_service import (
    apply_project_brain_action,
    get_project_brain,
    think_project_brain,
)
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


class ProjectThinkRequest(BaseModel):
    query: str


@router.post("/{project_id}/brain/think")
def project_brain_think(
    project_id: str,
    payload: ProjectThinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return think_project_brain(
        db=db,
        current_user=current_user,
        project_id=project_id,
        query=payload.query,
    )


class ProjectActionRequest(BaseModel):
    action: dict[str, Any]


@router.post("/{project_id}/brain/action")
def project_brain_action(
    project_id: str,
    payload: ProjectActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return apply_project_brain_action(
        db=db,
        current_user=current_user,
        project_id=project_id,
        action=payload.action,
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
