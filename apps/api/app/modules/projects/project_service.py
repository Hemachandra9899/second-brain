from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Project, Goal
from app.modules.brain.local_brain_indexer import (
    delete_brain_item,
    index_goal_to_local_brain,
    index_project_to_local_brain,
)
from app.modules.projects.project_schema import CreateProjectRequest, UpdateProjectRequest, CreateGoalRequest, UpdateGoalRequest


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


def create_project(db: Session, payload: CreateProjectRequest, user_id: str | None = None) -> dict:
    project = Project(
        id=str(uuid4()),
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    try:
        index_project_to_local_brain(db=db, project=project)
    except Exception:
        pass

    return serialize_project(project)


def list_projects(db: Session, user_id: str | None = None) -> list[dict]:
    query = db.query(Project).order_by(Project.created_at.desc())

    if user_id:
        query = query.filter(Project.user_id == user_id)

    projects = query.all()
    return [serialize_project(p) for p in projects]


def update_project(db: Session, project_id: str, payload: UpdateProjectRequest, user_id: str | None = None) -> dict:
    query = db.query(Project).filter(Project.id == project_id)

    if user_id:
        query = query.filter(Project.user_id == user_id)

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

    try:
        index_project_to_local_brain(db=db, project=project)
    except Exception:
        pass

    return serialize_project(project)


def delete_project(db: Session, project_id: str, user_id: str | None = None) -> dict:
    query = db.query(Project).filter(Project.id == project_id)

    if user_id:
        query = query.filter(Project.user_id == user_id)

    project = query.first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        delete_brain_item(
            db,
            user_id=project.user_id,
            source_type="project",
            source_id=project.id,
        )
    except Exception:
        pass

    db.delete(project)
    db.commit()

    return {
        "ok": True,
        "deleted_project_id": project_id,
    }


def create_goal(db: Session, payload: CreateGoalRequest, user_id: str | None = None) -> dict:
    goal = Goal(
        id=str(uuid4()),
        user_id=user_id,
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        status=payload.status,
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    try:
        index_goal_to_local_brain(db=db, goal=goal)
    except Exception:
        pass

    return serialize_goal(goal)


def list_goals(db: Session, user_id: str | None = None) -> list[dict]:
    query = db.query(Goal).order_by(Goal.created_at.desc())

    if user_id:
        query = query.filter(Goal.user_id == user_id)

    goals = query.all()
    return [serialize_goal(g) for g in goals]


def update_goal(db: Session, goal_id: str, payload: UpdateGoalRequest, user_id: str | None = None) -> dict:
    query = db.query(Goal).filter(Goal.id == goal_id)

    if user_id:
        query = query.filter(Goal.user_id == user_id)

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

    try:
        index_goal_to_local_brain(db=db, goal=goal)
    except Exception:
        pass

    return serialize_goal(goal)


def delete_goal(db: Session, goal_id: str, user_id: str | None = None) -> dict:
    query = db.query(Goal).filter(Goal.id == goal_id)

    if user_id:
        query = query.filter(Goal.user_id == user_id)

    goal = query.first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    try:
        delete_brain_item(
            db,
            user_id=goal.user_id,
            source_type="goal",
            source_id=goal.id,
        )
    except Exception:
        pass

    db.delete(goal)
    db.commit()

    return {
        "ok": True,
        "deleted_goal_id": goal_id,
    }
