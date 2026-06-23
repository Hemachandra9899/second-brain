import json
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import BrainInboxItem, Goal, MemoryCard, Project, Task, User
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


def _serialize(item: BrainInboxItem) -> dict:
    return {
        "id": item.id,
        "raw_text": item.raw_text,
        "suggested_type": item.suggested_type,
        "title": item.title,
        "description": item.description,
        "due_date": item.due_date,
        "priority": item.priority,
        "tags": _safe_json(item.tags_json or "[]"),
        "status": item.status,
        "created_item_type": item.created_item_type,
        "created_item_id": item.created_item_id,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def create_brain_inbox_item(
    db: Session,
    *,
    current_user: User,
    text: str,
) -> dict:
    parsed = _safe_json(
        ask_json_fast(
            prompt=f"""
Classify this messy user capture.

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
""".strip(),
            system="You turn messy captures into structured Second Brain draft items.",
            fallback={"type": "memory", "title": text[:80], "description": text, "tags": []},
        )
    )

    item = BrainInboxItem(
        user_id=current_user.id,
        raw_text=text,
        suggested_type=parsed.get("type") or "memory",
        title=parsed.get("title") or text[:80] or "Untitled",
        description=parsed.get("description") or text,
        due_date=parsed.get("due_date"),
        priority=parsed.get("priority") or "Normal",
        tags_json=json.dumps(parsed.get("tags") or []),
        status="pending",
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "item": _serialize(item),
    }


def list_brain_inbox_items(
    db: Session,
    *,
    current_user: User,
) -> dict:
    items = (
        db.query(BrainInboxItem)
        .filter(BrainInboxItem.user_id == current_user.id)
        .filter(BrainInboxItem.status == "pending")
        .order_by(BrainInboxItem.created_at.desc())
        .limit(30)
        .all()
    )

    return {
        "items": [_serialize(item) for item in items],
        "count": len(items),
    }


def accept_brain_inbox_item(
    db: Session,
    *,
    current_user: User,
    item_id: str,
) -> dict:
    item = (
        db.query(BrainInboxItem)
        .filter(BrainInboxItem.user_id == current_user.id)
        .filter(BrainInboxItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inbox item not found")

    if item.status != "pending":
        return {
            "ok": True,
            "message": "Inbox item already handled.",
            "item": _serialize(item),
        }

    created_type = item.suggested_type
    created_id = None

    if created_type == "task":
        task = Task(
            id=str(uuid4()),
            user_id=current_user.id,
            title=item.title,
            description=item.description,
            status="Todo",
            priority=item.priority or "Normal",
            due_date=item.due_date,
            source="brain_inbox",
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        try:
            index_task_to_local_brain(db=db, task=task)
        except Exception:
            pass

        created_id = task.id

    elif created_type == "project":
        project = Project(
            id=str(uuid4()),
            user_id=current_user.id,
            name=item.title,
            description=item.description,
            status="active",
        )

        db.add(project)
        db.commit()
        db.refresh(project)

        try:
            index_project_to_local_brain(db=db, project=project)
        except Exception:
            pass

        created_id = project.id

    elif created_type == "goal":
        goal = Goal(
            id=str(uuid4()),
            user_id=current_user.id,
            title=item.title,
            description=item.description,
            target_date=item.due_date,
            status="active",
        )

        db.add(goal)
        db.commit()
        db.refresh(goal)

        try:
            index_goal_to_local_brain(db=db, goal=goal)
        except Exception:
            pass

        created_id = goal.id

    else:
        memory = MemoryCard(
            id=str(uuid4()),
            user_id=current_user.id,
            title=item.title,
            summary=item.description or item.raw_text,
            tags=",".join(_safe_json(item.tags_json or "[]")),
        )

        db.add(memory)
        db.commit()
        db.refresh(memory)

        try:
            index_memory_to_local_brain(db=db, memory=memory)
        except Exception:
            pass

        created_type = "memory"
        created_id = memory.id

    item.status = "accepted"
    item.created_item_type = created_type
    item.created_item_id = created_id

    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "message": f"Saved as {created_type}.",
        "item": _serialize(item),
    }


def update_brain_inbox_item(
    db: Session,
    *,
    current_user: User,
    item_id: str,
    updates: dict,
) -> dict:
    item = (
        db.query(BrainInboxItem)
        .filter(BrainInboxItem.user_id == current_user.id)
        .filter(BrainInboxItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inbox item not found")

    if item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending inbox items can be edited")

    if "suggested_type" in updates and updates["suggested_type"]:
        item.suggested_type = updates["suggested_type"]

    if "title" in updates and updates["title"]:
        item.title = updates["title"]

    if "description" in updates:
        item.description = updates["description"]

    if "due_date" in updates:
        item.due_date = updates["due_date"]

    if "priority" in updates and updates["priority"]:
        item.priority = updates["priority"]

    if "tags" in updates:
        item.tags_json = json.dumps(updates["tags"] or [])

    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "message": "Inbox draft updated.",
        "item": _serialize(item),
    }


def dismiss_brain_inbox_item(
    db: Session,
    *,
    current_user: User,
    item_id: str,
) -> dict:
    item = (
        db.query(BrainInboxItem)
        .filter(BrainInboxItem.user_id == current_user.id)
        .filter(BrainInboxItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inbox item not found")

    item.status = "dismissed"
    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "message": "Dismissed.",
        "item": _serialize(item),
    }
