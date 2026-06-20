from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_current_user
from app.db.session import get_db
from app.db.models import Project, Goal


router = APIRouter()


class CreateProjectRequest(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class CreateGoalRequest(BaseModel):
    title: str
    project_id: str | None = None
    description: str | None = None
    target_date: str | None = None
    status: str = "active"


class UpdateGoalRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    target_date: str | None = None
    status: str | None = None


def serialize_project(p: Project):
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def serialize_goal(g: Goal):
    return {
        "id": g.id,
        "project_id": g.project_id,
        "title": g.title,
        "description": g.description,
        "target_date": g.target_date,
        "status": g.status,
        "created_at": g.created_at.isoformat() if g.created_at else None,
    }


@router.post("")
def create_project(
    payload: CreateProjectRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = Project(
        id=str(uuid4()),
        user_id=current_user.id if current_user else None,
        name=payload.name,
        description=payload.description,
        status=payload.status,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return serialize_project(project)


@router.get("")
def list_projects(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Project).order_by(Project.created_at.desc())

    if current_user:
        query = query.filter(Project.user_id == current_user.id)

    projects = query.all()
    return [serialize_project(p) for p in projects]


@router.patch("/{project_id}")
def update_project(
    project_id: str,
    payload: UpdateProjectRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Project).filter(Project.id == project_id)

    if current_user:
        query = query.filter(Project.user_id == current_user.id)

    project = query.first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name

    if payload.description is not None:
        project.description = payload.description

    if payload.status is not None:
        project.status = payload.status

    db.commit()
    db.refresh(project)

    return serialize_project(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Project).filter(Project.id == project_id)

    if current_user:
        query = query.filter(Project.user_id == current_user.id)

    project = query.first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    return {
        "ok": True,
        "deleted_project_id": project_id,
    }


@router.post("/goals")
def create_goal(
    payload: CreateGoalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    goal = Goal(
        id=str(uuid4()),
        user_id=current_user.id if current_user else None,
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        status=payload.status,
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return serialize_goal(goal)


@router.get("/goals")
def list_goals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Goal).order_by(Goal.created_at.desc())

    if current_user:
        query = query.filter(Goal.user_id == current_user.id)

    goals = query.all()
    return [serialize_goal(g) for g in goals]


@router.patch("/goals/{goal_id}")
def update_goal(
    goal_id: str,
    payload: UpdateGoalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Goal).filter(Goal.id == goal_id)

    if current_user:
        query = query.filter(Goal.user_id == current_user.id)

    goal = query.first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.title is not None:
        goal.title = payload.title

    if payload.description is not None:
        goal.description = payload.description

    if payload.target_date is not None:
        goal.target_date = payload.target_date

    if payload.status is not None:
        goal.status = payload.status

    db.commit()
    db.refresh(goal)

    return serialize_goal(goal)


@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Goal).filter(Goal.id == goal_id)

    if current_user:
        query = query.filter(Goal.user_id == current_user.id)

    goal = query.first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()

    return {
        "ok": True,
        "deleted_goal_id": goal_id,
    }
