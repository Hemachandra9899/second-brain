import json
from datetime import date, datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import (
    ActivityEvent,
    Dream,
    MemoryCard,
    NotionTodoPage,
    Task,
    User,
    WritingDocument,
)
from app.modules.activity.activity_service import create_activity_event
from app.services.llm_nvidia import ask_deep, ask_json_fast


def _loads(value: str | None, default):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def _dumps(value) -> str:
    return json.dumps(value or [], ensure_ascii=False)


def _safe_json_from_text(raw: str, fallback: dict) -> dict:
    try:
        return json.loads(raw)
    except Exception:
        pass
    start = raw.find("{")
    end = raw.rfind("}")
    if start >= 0 and end >= 0:
        try:
            return json.loads(raw[start : end + 1])
        except Exception:
            pass
    return fallback


def serialize_dream(dream: Dream) -> dict:
    return {
        "id": dream.id,
        "dream_date": dream.dream_date.isoformat(),
        "dream_type": dream.dream_type,
        "title": dream.title,
        "summary": dream.summary,
        "patterns": _loads(dream.patterns_json, []),
        "forgotten_items": _loads(dream.forgotten_items_json, []),
        "suggested_actions": _loads(dream.suggested_actions_json, []),
        "tomorrow_plan": _loads(dream.tomorrow_plan_json, []),
        "related_ids": _loads(dream.related_ids_json, {}),
        "created_at": dream.created_at.isoformat() if dream.created_at else None,
    }


def _collect_recent_activity(db: Session, user_id: str, hours: int = 48) -> list[dict]:
    since = datetime.utcnow() - timedelta(hours=hours)
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user_id)
        .filter(ActivityEvent.created_at >= since)
        .order_by(ActivityEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "title": event.title,
            "description": event.description,
            "source_type": event.source_type,
            "source_id": event.source_id,
            "url": event.url,
            "created_at": event.created_at.isoformat() if event.created_at else None,
        }
        for event in events
    ]


def _collect_open_tasks(db: Session, user_id: str) -> list[dict]:
    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .order_by(Task.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
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
        for task in tasks
    ]


def _collect_due_tomorrow_tasks(db: Session, user_id: str) -> list[dict]:
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.due_date == tomorrow)
        .order_by(Task.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "source": task.source,
            "notion_page_id": task.notion_page_id,
        }
        for task in tasks
    ]


def _collect_recent_memories(db: Session, user_id: str) -> list[dict]:
    cards = (
        db.query(MemoryCard)
        .filter(MemoryCard.user_id == user_id)
        .order_by(MemoryCard.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": card.id,
            "title": card.title,
            "summary": card.summary,
            "tags": card.tags,
            "created_at": card.created_at.isoformat() if card.created_at else None,
        }
        for card in cards
    ]


def _collect_recent_writing(db: Session, user_id: str) -> list[dict]:
    docs = (
        db.query(WritingDocument)
        .filter(WritingDocument.user_id == user_id)
        .order_by(WritingDocument.created_at.desc())
        .limit(15)
        .all()
    )
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "source_type": doc.source_type,
            "preview": (doc.cleaned_markdown or doc.raw_text or "")[:500],
            "notion_page_id": doc.notion_page_id,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in docs
    ]


def _collect_notion_todo_pages(db: Session, user_id: str) -> list[dict]:
    pages = (
        db.query(NotionTodoPage)
        .filter(NotionTodoPage.user_id == user_id)
        .order_by(NotionTodoPage.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "notion_page_url": page.notion_page_url,
            "data_source_id": page.data_source_id,
            "created_at": page.created_at.isoformat() if page.created_at else None,
        }
        for page in pages
    ]


def _build_dream_context(db: Session, user: User) -> dict:
    user_id = user.id
    return {
        "recent_activity": _collect_recent_activity(db, user_id),
        "open_tasks": _collect_open_tasks(db, user_id),
        "due_tomorrow_tasks": _collect_due_tomorrow_tasks(db, user_id),
        "recent_memories": _collect_recent_memories(db, user_id),
        "recent_writing": _collect_recent_writing(db, user_id),
        "notion_todo_pages": _collect_notion_todo_pages(db, user_id),
    }


def _fallback_dream(context: dict, mode: str) -> dict:
    open_tasks = context.get("open_tasks", [])
    recent_activity = context.get("recent_activity", [])
    return {
        "title": "Your Brain Dream",
        "summary": (
            f"I reviewed {len(recent_activity)} recent activity items and "
            f"{len(open_tasks)} open tasks. I found a few loose threads worth checking."
        ),
        "patterns": [
            "Recent activity is collecting inside your Second Brain.",
            "Open tasks should be reviewed and assigned dates.",
        ],
        "forgotten_items": [task["title"] for task in open_tasks[:3]],
        "suggested_actions": [
            {
                "title": "Review open tasks",
                "reason": "Some tasks are still open and may need a due date or priority.",
                "action_type": "review_tasks",
                "source_type": "task",
                "source_id": None,
            }
        ],
        "tomorrow_plan": [
            "Check today's open tasks.",
            "Finish one high-priority item.",
            "Move unfinished tasks to the right date.",
        ],
        "related_ids": {
            "task_ids": [task["id"] for task in open_tasks[:10]],
            "activity_ids": [event["id"] for event in recent_activity[:10]],
        },
    }


def run_dream(
    db: Session,
    *,
    current_user: User,
    mode: str = "nightly",
) -> dict:
    mode = mode if mode in {"nightly", "think", "weekly"} else "nightly"
    context = _build_dream_context(db, current_user)
    fallback = _fallback_dream(context, mode)

    system = """
You are Dream Mode for Second Brain.
Your job is to quietly organize the user's recent life data.
Use only the provided data. Do not invent facts.
Be useful, specific, and concise.
Return valid JSON only:
{
  "title": "...",
  "summary": "...",
  "patterns": ["..."],
  "forgotten_items": ["..."],
  "suggested_actions": [
    {
      "title": "...",
      "reason": "...",
      "action_type": "create_task|review_tasks|move_to_today|create_project|open_notion|save_memory|dismiss",
      "source_type": "task|memory|writing|notion|activity|null",
      "source_id": "..."
    }
  ],
  "tomorrow_plan": ["..."],
  "related_ids": {
    "task_ids": [],
    "memory_ids": [],
    "writing_ids": [],
    "notion_page_ids": [],
    "activity_ids": []
  }
}
""".strip()

    prompt = f"""
Dream type: {mode}
User data:
{json.dumps(context, ensure_ascii=False, indent=2)}
Create a useful Second Brain dream.
""".strip()

    if mode == "think":
        raw = ask_deep(prompt=prompt, system=system, max_tokens=1800)
        dream_json = _safe_json_from_text(raw, fallback)
    else:
        dream_json = ask_json_fast(prompt=prompt, system=system, fallback=fallback)

    dream = Dream(
        id=str(uuid4()),
        user_id=current_user.id,
        dream_date=date.today(),
        dream_type=mode,
        title=dream_json.get("title") or fallback["title"],
        summary=dream_json.get("summary") or fallback["summary"],
        patterns_json=_dumps(dream_json.get("patterns") or []),
        forgotten_items_json=_dumps(dream_json.get("forgotten_items") or []),
        suggested_actions_json=_dumps(dream_json.get("suggested_actions") or []),
        tomorrow_plan_json=_dumps(dream_json.get("tomorrow_plan") or []),
        related_ids_json=json.dumps(dream_json.get("related_ids") or {}, ensure_ascii=False),
    )
    db.add(dream)
    db.commit()
    db.refresh(dream)

    try:
        create_activity_event(
            db,
            event_type="dream_created",
            title=dream.title,
            description=dream.summary[:240],
            source_type="dream",
            source_id=dream.id,
            metadata={"dream_type": mode},
            current_user=current_user,
        )
    except Exception:
        pass

    return serialize_dream(dream)


def get_latest_dream(db: Session, *, current_user: User) -> dict | None:
    dream = (
        db.query(Dream)
        .filter(Dream.user_id == current_user.id)
        .order_by(Dream.created_at.desc())
        .first()
    )
    return serialize_dream(dream) if dream else None


def list_dreams(db: Session, *, current_user: User, limit: int = 20) -> list[dict]:
    dreams = (
        db.query(Dream)
        .filter(Dream.user_id == current_user.id)
        .order_by(Dream.created_at.desc())
        .limit(limit)
        .all()
    )
    return [serialize_dream(dream) for dream in dreams]
