from uuid import uuid4
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Task
from app.services.notion_service import pull_notion_tasks
from app.services.knowledge_service import index_task_as_knowledge


router = APIRouter()


def extract_title(page: dict) -> str:
    prop = page.get("properties", {}).get("Name", {})
    title_items = prop.get("title", [])
    if not title_items:
        return "Untitled"
    return title_items[0].get("plain_text", "Untitled")


def extract_select(page: dict, key: str, default: str) -> str:
    prop = page.get("properties", {}).get(key, {})
    select = prop.get("select")
    if not select:
        return default
    return select.get("name", default)


def extract_date(page: dict, key: str) -> str | None:
    prop = page.get("properties", {}).get(key, {})
    date = prop.get("date")
    if not date:
        return None
    return date.get("start")


@router.post("/sync/pull")
def pull_from_notion(db: Session = Depends(get_db)):
    pages = pull_notion_tasks()
    synced = 0

    for page in pages:
        notion_page_id = page["id"]

        existing = db.query(Task).filter(Task.notion_page_id == notion_page_id).first()

        title = extract_title(page)
        status = extract_select(page, "Status", "Todo")
        priority = extract_select(page, "Priority", "Normal")
        due_date = extract_date(page, "Due Date")

        if existing:
            existing.title = title
            existing.status = status
            existing.priority = priority
            existing.due_date = due_date
            task = existing
        else:
            task = Task(
                id=str(uuid4()),
                title=title,
                description=None,
                status=status,
                priority=priority,
                due_date=due_date,
                source="notion",
                notion_page_id=notion_page_id,
            )
            db.add(task)

        db.commit()
        db.refresh(task)

        try:
            index_task_as_knowledge(db=db, task=task)
        except Exception:
            pass

        synced += 1

    return {
        "ok": True,
        "synced": synced,
    }


@router.post("/bootstrap")
def bootstrap_notion():
    return {
        "ok": True,
        "message": "For now, create the Notion database manually with properties: Name, Status, Priority, Due Date, Source. Then set NOTION_TASKS_DATABASE_ID.",
    }
