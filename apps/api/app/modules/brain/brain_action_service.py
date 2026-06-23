from datetime import date
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import BrainEdge, BrainItem, Task, User
from app.modules.brain.local_brain_indexer import index_task_to_local_brain


def _item_preview(item: BrainItem) -> dict:
    return {
        "id": item.id,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "title": item.title,
        "preview": (item.body or "")[:220],
        "source_url": item.source_url,
    }


def suggest_brain_actions(
    db: Session,
    *,
    current_user: User,
    limit: int = 8,
) -> dict:
    user_id = current_user.id
    actions = []
    seen = set()

    # 1. Tasks without dates
    undated_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.due_date.is_(None))
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )

    for task in undated_tasks:
        key = f"date:{task.id}"
        if key in seen:
            continue

        seen.add(key)
        actions.append(
            {
                "action_type": "move_task_to_today",
                "title": f'Move "{task.title}" to today',
                "reason": "This task is open but has no due date.",
                "source_type": "task",
                "source_id": task.id,
                "source_item_id": None,
            }
        )

    # 2. Strong brain connections
    edges = (
        db.query(BrainEdge)
        .filter(BrainEdge.user_id == user_id)
        .order_by(BrainEdge.weight.desc())
        .limit(80)
        .all()
    )

    item_ids = set()
    for edge in edges:
        item_ids.add(edge.source_item_id)
        item_ids.add(edge.target_item_id)

    items = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == user_id)
        .filter(BrainItem.id.in_(item_ids))
        .all()
        if item_ids
        else []
    )

    item_by_id = {item.id: item for item in items}

    for edge in edges:
        if len(actions) >= limit:
            break

        a = item_by_id.get(edge.source_item_id)
        b = item_by_id.get(edge.target_item_id)

        if not a or not b:
            continue

        if a.source_type == b.source_type:
            continue

        key = f"{a.id}:{b.id}:{edge.relation_type}"
        if key in seen:
            continue

        seen.add(key)

        actions.append(
            {
                "action_type": "create_task",
                "title": f"Review connection: {a.title} + {b.title}",
                "reason": edge.reason or "These two brain items look related.",
                "source_type": "brain_edge",
                "source_id": edge.id,
                "source_item_id": a.id,
                "target_item_id": b.id,
                "items": [_item_preview(a), _item_preview(b)],
            }
        )

    return {
        "actions": actions[:limit],
        "count": len(actions[:limit]),
    }


def accept_brain_action(
    db: Session,
    *,
    current_user: User,
    action: dict,
) -> dict:
    action_type = action.get("action_type")
    title = action.get("title") or "Review brain suggestion"
    reason = action.get("reason") or "Created from Second Brain action engine."

    if action_type == "move_task_to_today":
        task_id = action.get("source_id")

        task = (
            db.query(Task)
            .filter(Task.user_id == current_user.id)
            .filter(Task.id == task_id)
            .first()
        )

        if not task:
            return {
                "ok": False,
                "message": "Task not found.",
            }

        task.due_date = date.today().isoformat()
        db.commit()
        db.refresh(task)

        try:
            index_task_to_local_brain(db=db, task=task)
        except Exception:
            pass

        return {
            "ok": True,
            "message": "Moved task to today.",
            "task": {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "due_date": task.due_date,
            },
        }

    # Default: create task from pattern
    task = Task(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        description=reason,
        status="Todo",
        priority="Normal",
        due_date=date.today().isoformat(),
        source="brain_action",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    try:
        index_task_to_local_brain(db=db, task=task)
    except Exception:
        pass

    return {
        "ok": True,
        "message": "Created task from brain action.",
        "task": {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "due_date": task.due_date,
        },
    }
