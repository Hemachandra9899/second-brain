import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import MemoryCard, Project, Goal, Task, User
from app.modules.brain.local_brain_indexer import (
    index_goal_to_local_brain,
    index_memory_to_local_brain,
    index_project_to_local_brain,
    index_task_to_local_brain,
)
from app.services.llm_nvidia import ask_json_fast


def _safe_json(value):
    if isinstance(value, dict):
        return value

    try:
        return json.loads(value)
    except Exception:
        return {}


def capture_to_brain(
    db: Session,
    *,
    current_user: User,
    text: str,
) -> dict:
    prompt = f"""
Classify this user capture into one item.

Capture:
{text}

Return JSON only:
{{
  "type": "task | memory | project | goal",
  "title": "...",
  "description": "...",
  "due_date": null,
  "priority": "Low | Normal | High",
  "tags": ["..."]
}}
""".strip()

    parsed = _safe_json(
        ask_json_fast(
            prompt=prompt,
            system="You classify messy user captures into structured Second Brain items.",
            fallback={"type": "memory", "title": text[:80], "description": text, "tags": []},
        )
    )

    item_type = parsed.get("type") or "memory"
    title = parsed.get("title") or text[:80] or "Untitled"
    description = parsed.get("description") or text
    due_date = parsed.get("due_date")
    priority = parsed.get("priority") or "Normal"
    tags = parsed.get("tags") or []

    created = None

    if item_type == "task":
        task = Task(
            id=str(uuid4()),
            user_id=current_user.id,
            title=title,
            description=description,
            status="Todo",
            priority=priority,
            due_date=due_date,
            source="brain_capture",
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        try:
            index_task_to_local_brain(db=db, task=task)
        except Exception:
            pass

        created = {
            "type": "task",
            "id": task.id,
            "title": task.title,
        }

    elif item_type == "project":
        project = Project(
            id=str(uuid4()),
            user_id=current_user.id,
            name=title,
            description=description,
            status="active",
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        try:
            index_project_to_local_brain(db=db, project=project)
        except Exception:
            pass

        created = {
            "type": "project",
            "id": project.id,
            "title": project.name,
        }

    elif item_type == "goal":
        goal = Goal(
            id=str(uuid4()),
            user_id=current_user.id,
            title=title,
            description=description,
            target_date=due_date,
            status="active",
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)

        try:
            index_goal_to_local_brain(db=db, goal=goal)
        except Exception:
            pass

        created = {
            "type": "goal",
            "id": goal.id,
            "title": goal.title,
        }

    else:
        memory = MemoryCard(
            id=str(uuid4()),
            user_id=current_user.id,
            title=title,
            summary=description,
            tags=",".join(tags) if tags else "",
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)

        try:
            index_memory_to_local_brain(db=db, memory=memory)
        except Exception:
            pass

        created = {
            "type": "memory",
            "id": memory.id,
            "title": memory.title,
        }

    return {
        "ok": True,
        "created": created,
        "classification": parsed,
    }
