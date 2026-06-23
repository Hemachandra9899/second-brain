import json
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models import ActivityEvent, Dream, MemoryCard, NotionTodoPage, Task


def _safe_loads(value: str | None, default):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def _local_today(timezone: str | None) -> date:
    try:
        tz = ZoneInfo(timezone or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    return datetime.now(tz).date()


def _utc_day_range(target: date, timezone: str | None):
    try:
        tz = ZoneInfo(timezone or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    start_local = datetime.combine(target, time.min, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    return (
        start_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None),
        end_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None),
    )


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
        "notion_block_id": task.notion_block_id,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }


def _activity_json(event: ActivityEvent) -> dict:
    return {
        "id": event.id,
        "event_type": event.event_type,
        "title": event.title,
        "description": event.description,
        "source_type": event.source_type,
        "source_id": event.source_id,
        "url": event.url,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


def _memory_json(memory: MemoryCard) -> dict:
    return {
        "id": memory.id,
        "title": memory.title,
        "summary": memory.summary,
        "tags": memory.tags,
        "created_at": memory.created_at.isoformat() if memory.created_at else None,
    }


def _dream_json(dream: Dream | None) -> dict | None:
    if not dream:
        return None
    return {
        "id": dream.id,
        "title": dream.title,
        "summary": dream.summary,
        "dream_date": dream.dream_date.isoformat(),
        "dream_type": dream.dream_type,
        "patterns": _safe_loads(dream.patterns_json, []),
        "suggested_actions": _safe_loads(dream.suggested_actions_json, []),
        "tomorrow_plan": _safe_loads(dream.tomorrow_plan_json, []),
        "created_at": dream.created_at.isoformat() if dream.created_at else None,
    }


def get_today_brief(
    db: Session,
    user_id: str | None = None,
    timezone: str | None = "UTC",
) -> dict:
    today = _local_today(timezone)
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    if not user_id:
        return {
            "greeting": "Good morning",
            "today": today.isoformat(),
            "summary": "Sign in to see your tasks, memories, Notion todos, and Dream Mode insights.",
            "counts": {
                "today_tasks": 0,
                "overdue_tasks": 0,
                "unfinished_yesterday": 0,
                "notion_todos": 0,
            },
            "today_tasks": [],
            "overdue_tasks": [],
            "unfinished_yesterday": [],
            "notion_todos": [],
            "recent_memories": [],
            "recent_activity": [],
            "latest_dream": None,
            "suggested_next_action": {
                "title": "Sign in",
                "reason": "Your Second Brain needs your account to load personal context.",
                "action_type": "sign_in",
            },
        }

    today_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.due_date == today.isoformat())
        .order_by(Task.created_at.desc())
        .limit(20)
        .all()
    )

    overdue_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.due_date.isnot(None))
        .filter(Task.due_date < today.isoformat())
        .order_by(Task.due_date.asc())
        .limit(20)
        .all()
    )

    start_yesterday, end_yesterday = _utc_day_range(yesterday, timezone)

    unfinished_yesterday = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.created_at >= start_yesterday)
        .filter(Task.created_at < end_yesterday)
        .order_by(Task.created_at.desc())
        .limit(20)
        .all()
    )

    notion_todos = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.notion_page_id.isnot(None))
        .order_by(Task.created_at.desc())
        .limit(20)
        .all()
    )

    recent_memories = (
        db.query(MemoryCard)
        .filter(MemoryCard.user_id == user_id)
        .order_by(MemoryCard.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activity = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(8)
        .all()
    )

    latest_dream = (
        db.query(Dream)
        .filter(Dream.user_id == user_id)
        .order_by(Dream.created_at.desc())
        .first()
    )

    notion_pages = (
        db.query(NotionTodoPage)
        .filter(NotionTodoPage.user_id == user_id)
        .order_by(NotionTodoPage.created_at.desc())
        .limit(5)
        .all()
    )

    suggested_next_action = _choose_next_action(
        today_tasks=today_tasks,
        overdue_tasks=overdue_tasks,
        unfinished_yesterday=unfinished_yesterday,
        latest_dream=latest_dream,
    )

    summary = _build_summary(
        today=today,
        today_tasks=today_tasks,
        overdue_tasks=overdue_tasks,
        unfinished_yesterday=unfinished_yesterday,
        notion_todos=notion_todos,
        latest_dream=latest_dream,
    )

    return {
        "greeting": "Good morning",
        "today": today.isoformat(),
        "yesterday": yesterday.isoformat(),
        "tomorrow": tomorrow.isoformat(),
        "summary": summary,
        "counts": {
            "today_tasks": len(today_tasks),
            "overdue_tasks": len(overdue_tasks),
            "unfinished_yesterday": len(unfinished_yesterday),
            "notion_todos": len(notion_todos),
            "recent_memories": len(recent_memories),
            "recent_activity": len(recent_activity),
        },
        "today_tasks": [_task_json(task) for task in today_tasks],
        "overdue_tasks": [_task_json(task) for task in overdue_tasks],
        "unfinished_yesterday": [_task_json(task) for task in unfinished_yesterday],
        "notion_todos": [_task_json(task) for task in notion_todos],
        "notion_pages": [
            {
                "id": page.id,
                "title": page.title,
                "notion_page_id": page.notion_page_id,
                "notion_page_url": page.notion_page_url,
            }
            for page in notion_pages
        ],
        "recent_memories": [_memory_json(memory) for memory in recent_memories],
        "recent_activity": [_activity_json(event) for event in recent_activity],
        "latest_dream": _dream_json(latest_dream),
        "suggested_next_action": suggested_next_action,
    }


def _build_summary(
    *,
    today: date,
    today_tasks: list[Task],
    overdue_tasks: list[Task],
    unfinished_yesterday: list[Task],
    notion_todos: list[Task],
    latest_dream: Dream | None,
) -> str:
    parts = []

    if today_tasks:
        parts.append(f"{len(today_tasks)} task{'s' if len(today_tasks) != 1 else ''} due today")

    if overdue_tasks:
        parts.append(f"{len(overdue_tasks)} overdue")

    if unfinished_yesterday:
        parts.append(f"{len(unfinished_yesterday)} unfinished from yesterday")

    if notion_todos:
        parts.append(f"{len(notion_todos)} open Notion todo{'s' if len(notion_todos) != 1 else ''}")

    if not parts:
        return f"No urgent tasks for {today.isoformat()}. Capture one thing you want to remember."

    summary = "You have " + ", ".join(parts) + "."

    if latest_dream:
        summary += f" Dream Mode noticed: {latest_dream.summary[:160]}"

    return summary


def _choose_next_action(
    *,
    today_tasks: list[Task],
    overdue_tasks: list[Task],
    unfinished_yesterday: list[Task],
    latest_dream: Dream | None,
) -> dict:
    if latest_dream:
        dream_actions = _safe_loads(latest_dream.suggested_actions_json, [])
        if dream_actions:
            first = dream_actions[0]
            return {
                "title": first.get("title") or "Review Dream Mode suggestion",
                "reason": first.get("reason") or "Dream Mode found this as the best next action.",
                "action_type": first.get("action_type") or "review_dream",
                "source_type": first.get("source_type"),
                "source_id": first.get("source_id"),
                "dream_id": latest_dream.id,
            }

    if overdue_tasks:
        task = overdue_tasks[0]
        return {
            "title": task.title,
            "reason": "This task is overdue.",
            "action_type": "open_task",
            "source_type": "task",
            "source_id": task.id,
        }

    if today_tasks:
        task = today_tasks[0]
        return {
            "title": task.title,
            "reason": "This task is due today.",
            "action_type": "open_task",
            "source_type": "task",
            "source_id": task.id,
        }

    if unfinished_yesterday:
        task = unfinished_yesterday[0]
        return {
            "title": task.title,
            "reason": "This was saved yesterday and is still open.",
            "action_type": "move_to_today",
            "source_type": "task",
            "source_id": task.id,
        }

    return {
        "title": "Capture one useful thing",
        "reason": "Your day looks clear. Save one thought, task, or memory.",
        "action_type": "capture",
        "source_type": None,
        "source_id": None,
    }
