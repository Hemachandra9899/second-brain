from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import BrainEdge, BrainItem, Project, Task, User


def _task_json(task: Task) -> dict:
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


def _item_json(item: BrainItem) -> dict:
    return {
        "id": item.id,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "source_url": item.source_url,
        "title": item.title,
        "preview": (item.body or "")[:260],
        "tags": item.tags,
    }


def _edge_json(edge: BrainEdge) -> dict:
    return {
        "id": edge.id,
        "source": edge.source_item_id,
        "target": edge.target_item_id,
        "label": edge.relation_type,
        "reason": edge.reason,
        "weight": edge.weight,
    }


def get_project_brain(
    db: Session,
    *,
    current_user: User,
    project_id: str,
) -> dict:
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .filter(Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .filter(Task.project_id == project.id)
        .order_by(Task.created_at.desc())
        .all()
    )

    task_ids = [task.id for task in tasks]

    task_brain_items = []

    if task_ids:
        task_brain_items = (
            db.query(BrainItem)
            .filter(BrainItem.user_id == current_user.id)
            .filter(BrainItem.source_type == "task")
            .filter(BrainItem.source_id.in_(task_ids))
            .all()
        )

    task_item_ids = [item.id for item in task_brain_items]

    edges = []

    if task_item_ids:
        edges = (
            db.query(BrainEdge)
            .filter(BrainEdge.user_id == current_user.id)
            .filter(
                (BrainEdge.source_item_id.in_(task_item_ids))
                | (BrainEdge.target_item_id.in_(task_item_ids))
            )
            .order_by(BrainEdge.weight.desc())
            .limit(80)
            .all()
        )

    related_item_ids = set(task_item_ids)

    for edge in edges:
        related_item_ids.add(edge.source_item_id)
        related_item_ids.add(edge.target_item_id)

    related_items = []

    if related_item_ids:
        related_items = (
            db.query(BrainItem)
            .filter(BrainItem.user_id == current_user.id)
            .filter(BrainItem.id.in_(related_item_ids))
            .order_by(BrainItem.updated_at.desc())
            .limit(60)
            .all()
        )

    open_tasks = [task for task in tasks if task.status != "Done"]
    overdue_or_undated = [
        task for task in open_tasks if not task.due_date
    ]

    if overdue_or_undated:
        next_action = {
            "title": overdue_or_undated[0].title,
            "reason": "This project task is still open and needs attention.",
            "action_type": "open_task",
            "source_id": overdue_or_undated[0].id,
        }
    elif open_tasks:
        next_action = {
            "title": open_tasks[0].title,
            "reason": "This is the next open task in the project.",
            "action_type": "open_task",
            "source_id": open_tasks[0].id,
        }
    else:
        next_action = {
            "title": "Add the next task",
            "reason": "This project has no open tasks.",
            "action_type": "create_task",
            "source_id": project.id,
        }

    source_counts = {}

    for item in related_items:
        source_counts[item.source_type] = source_counts.get(item.source_type, 0) + 1

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "created_at": project.created_at.isoformat() if project.created_at else None,
        },
        "counts": {
            "tasks": len(tasks),
            "open_tasks": len(open_tasks),
            "related_items": len(related_items),
            "connections": len(edges),
            "source_counts": source_counts,
        },
        "tasks": [_task_json(task) for task in tasks],
        "related_items": [_item_json(item) for item in related_items],
        "edges": [_edge_json(edge) for edge in edges],
        "next_action": next_action,
    }


import json

from app.services.llm_nvidia import ask_deep


def think_project_brain(
    db: Session,
    *,
    current_user: User,
    project_id: str,
    query: str,
) -> dict:
    brain = get_project_brain(
        db=db,
        current_user=current_user,
        project_id=project_id,
    )

    sources = []

    for task in brain["tasks"]:
        sources.append(
            {
                "type": "task",
                "id": task["id"],
                "title": task["title"],
                "preview": task.get("description") or "",
                "status": task.get("status"),
                "due_date": task.get("due_date"),
            }
        )

    for item in brain["related_items"]:
        sources.append(
            {
                "type": item["source_type"],
                "id": item["id"],
                "title": item["title"],
                "preview": item["preview"],
                "url": item.get("source_url"),
            }
        )

    gaps = []

    if not brain["tasks"]:
        gaps.append("No tasks are linked to this project yet.")

    if not brain["related_items"]:
        gaps.append("No related brain items found for this project.")

    if not brain["edges"]:
        gaps.append("No strong brain connections found yet.")

    context = {
        "project": brain["project"],
        "counts": brain["counts"],
        "next_action": brain["next_action"],
        "sources": sources[:30],
    }

    answer = ask_deep(
        prompt=f"""
User question:
{query}

Project brain context:
{json.dumps(context, ensure_ascii=False, indent=2)}

Answer using only this project context.

Return:
1. Direct answer
2. Sources used
3. Gaps / missing information
4. One concrete next action
""".strip(),
        system=(
            "You are Project Think Mode inside Second Brain. "
            "Be concise, practical, and honest. "
            "Do not invent facts. "
            "If evidence is missing, say what is missing."
        ),
        max_tokens=1000,
    )

    if answer.startswith("AI provider"):
        answer = (
            f"Project: {brain['project']['name']}\n\n"
            f"Next action: {brain['next_action']['title']}\n"
            f"Reason: {brain['next_action']['reason']}\n\n"
            "AI synthesis is unavailable right now, but project context loaded."
        )

    return {
        "answer": answer,
        "sources": sources[:12],
        "gaps": gaps,
        "next_action": brain["next_action"],
    }
