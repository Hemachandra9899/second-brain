from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models import Task, User
from app.modules.integrations.notion.notion_oauth_service import (
    build_notion_auth_url,
    disconnect_notion,
    exchange_code_for_token,
    get_notion_connection,
    get_decrypted_token,
    upsert_notion_connection,
)
from app.modules.integrations.notion.notion_service import (
    pull_notion_tasks,
    search_notion_databases,
    retrieve_notion_database,
    resolve_data_source_id,
)
from app.modules.knowledge.knowledge_service import index_task_as_knowledge

router = APIRouter()


class DefaultNotionDatabaseRequest(BaseModel):
    database_id: str
    title: str | None = None


@router.get("/connect")
def connect_notion(
    current_user: User = Depends(require_current_user),
):
    auth_url = build_notion_auth_url(state=current_user.id)
    return {"auth_url": auth_url}


@router.get("/databases")
def list_notion_databases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    conn = get_notion_connection(db, current_user)
    if not conn:
        raise HTTPException(status_code=400, detail="Notion not connected")

    access_token = get_decrypted_token(conn)
    databases = search_notion_databases(access_token)

    return {"databases": databases}


@router.post("/default-database")
def set_default_notion_database(
    payload: DefaultNotionDatabaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    conn = get_notion_connection(db, current_user)
    if not conn:
        raise HTTPException(status_code=400, detail="Notion not connected")

    access_token = get_decrypted_token(conn)
    data_source_id = resolve_data_source_id(access_token, payload.database_id)

    conn.default_database_id = payload.database_id
    conn.default_data_source_id = data_source_id
    conn.default_database_title = payload.title

    db.commit()
    db.refresh(conn)

    return {
        "ok": True,
        "database_id": conn.default_database_id,
        "data_source_id": conn.default_data_source_id,
        "title": conn.default_database_title,
    }


@router.get("/callback")
def notion_callback(
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    state: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse(
            f"{settings.frontend_url}/settings/integrations?notion=error&reason={error}"
        )

    if not code or not state:
        return RedirectResponse(
            f"{settings.frontend_url}/settings/integrations?notion=error"
        )

    user = db.query(User).filter(User.id == state).first()

    if not user:
        return RedirectResponse(
            f"{settings.frontend_url}/settings/integrations?notion=invalid_state"
        )

    try:
        token_payload = exchange_code_for_token(code)
        upsert_notion_connection(db, user, token_payload)
    except Exception:
        return RedirectResponse(
            f"{settings.frontend_url}/settings/integrations?notion=token_error"
        )

    return RedirectResponse(
        f"{settings.frontend_url}/settings/integrations?notion=connected"
    )


@router.get("/status")
def notion_status(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if not current_user:
        return {"connected": False}

    conn = get_notion_connection(db, current_user)

    if not conn:
        return {"connected": False}

    return {
        "connected": True,
        "workspace_name": conn.workspace_name,
        "workspace_id": conn.workspace_id,
        "workspace_icon": conn.workspace_icon,
        "owner_name": conn.owner_name,
        "owner_email": conn.owner_email,
        "default_database_id": conn.default_database_id,
        "default_data_source_id": conn.default_data_source_id,
        "default_database_title": conn.default_database_title,
    }


@router.delete("/disconnect")
def notion_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    disconnect_notion(db, current_user)
    return {"ok": True}


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
def pull_from_notion(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not settings.notion_tasks_database_id:
        raise HTTPException(status_code=400, detail="NOTION_TASKS_DATABASE_ID not configured")

    conn = get_notion_connection(db, current_user)
    if not conn:
        raise HTTPException(status_code=400, detail="Notion not connected")

    access_token = get_decrypted_token(conn)

    pages = pull_notion_tasks(access_token, settings.notion_tasks_database_id)
    synced = 0

    for page in pages:
        notion_page_id = page["id"]

        existing = (
            db.query(Task)
            .filter(Task.notion_page_id == notion_page_id)
            .first()
        )

        title = extract_title(page)
        status_val = extract_select(page, "Status", "Todo")
        priority = extract_select(page, "Priority", "Normal")
        due_date = extract_date(page, "Due Date")

        if existing:
            existing.title = title
            existing.status = status_val
            existing.priority = priority
            existing.due_date = due_date
            task = existing
        else:
            task = Task(
                id=str(uuid4()),
                user_id=current_user.id,
                title=title,
                description=None,
                status=status_val,
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
        "message": "Create a Notion integration at https://www.notion.com/my-integrations, set up OAuth, then connect from the integrations page.",
    }
