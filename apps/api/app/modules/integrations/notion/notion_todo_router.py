from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User, NotionTodoPage, Task
from app.modules.activity.activity_service import create_activity_event
from app.modules.integrations.notion.notion_todo_schema import (
    AppendTodosRequest,
    CheckTodoBlockRequest,
    ConnectExistingPageRequest,
    CreateTodoPageRequest,
    RenameTodoPageRequest,
)
from app.modules.integrations.notion.notion_todo_service import (
    _get_access_token,
    append_todos_to_notion_page,
    create_notion_todo_page,
    create_todo_page_locally,
    create_todo_task_locally,
    get_todos_from_notion_page,
    update_notion_page_title,
    update_notion_todo_block,
)
from app.modules.integrations.notion.notion_oauth_service import get_notion_connection

router = APIRouter()


@router.post("/todo-pages")
def api_create_todo_page(
    payload: CreateTodoPageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    access_token = _get_access_token(db, current_user)

    notion_result = create_notion_todo_page(
        access_token=access_token,
        title=payload.title,
        todos=payload.todos,
        data_source_id=payload.data_source_id,
    )

    page = create_todo_page_locally(
        db=db,
        current_user=current_user,
        title=notion_result["title"],
        notion_page_id=notion_result["page_id"],
        notion_page_url=notion_result.get("page_url"),
        data_source_id=payload.data_source_id,
    )

    tasks = []
    for todo in notion_result["todos"]:
        task = create_todo_task_locally(
            db=db,
            current_user=current_user,
            notion_page_id=page.notion_page_id,
            title=todo["text"],
            notion_block_id=todo["block_id"],
        )
        tasks.append(task)

    try:
        create_activity_event(
            db=db,
            event_type="notion_todo_page_created",
            title=payload.title,
            description=f"Created todo page with {len(payload.todos)} items",
            source_type="notion",
            source_id=notion_result["page_id"],
            url=notion_result.get("page_url"),
            metadata={"todo_page_id": page.id},
            current_user=current_user,
        )
    except Exception:
        pass

    return {
        "ok": True,
        "page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "todos": [
            {
                "id": task.id,
                "title": task.title,
                "checked": False,
                "notion_block_id": task.notion_block_id,
            }
            for task in tasks
        ],
    }


@router.get("/todo-pages")
def api_list_todo_pages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    pages = (
        db.query(NotionTodoPage)
        .filter(NotionTodoPage.user_id == current_user.id)
        .order_by(NotionTodoPage.updated_at.desc())
        .all()
    )

    return {
        "ok": True,
        "pages": [
            {
                "id": p.id,
                "title": p.title,
                "notion_page_id": p.notion_page_id,
                "url": p.notion_page_url,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pages
        ],
    }


@router.get("/todo-pages/{page_id}")
def api_get_todo_page(
    page_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.id == page_id,
            NotionTodoPage.user_id == current_user.id,
        )
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Todo page not found")

    access_token = _get_access_token(db, current_user)

    try:
        todos = get_todos_from_notion_page(
            access_token=access_token,
            page_id=page.notion_page_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch todos from Notion: {str(exc)}",
        )

    return {
        "ok": True,
        "page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "todos": todos,
    }


@router.post("/todo-pages/{page_id}/todos")
def api_add_todos(
    page_id: str,
    payload: AppendTodosRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.id == page_id,
            NotionTodoPage.user_id == current_user.id,
        )
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Todo page not found")

    access_token = _get_access_token(db, current_user)

    new_blocks = append_todos_to_notion_page(
        access_token=access_token,
        page_id=page.notion_page_id,
        todos=payload.todos,
    )

    tasks = []
    for block in new_blocks:
        task = create_todo_task_locally(
            db=db,
            current_user=current_user,
            notion_page_id=page.notion_page_id,
            title=block["text"],
            notion_block_id=block["block_id"],
        )
        tasks.append(task)

    return {
        "ok": True,
        "todos": [
            {
                "id": task.id,
                "title": task.title,
                "checked": False,
                "notion_block_id": task.notion_block_id,
            }
            for task in tasks
        ],
    }


@router.patch("/todo-pages/{page_id}/todos/{block_id}")
def api_check_todo(
    page_id: str,
    block_id: str,
    payload: CheckTodoBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.id == page_id,
            NotionTodoPage.user_id == current_user.id,
        )
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Todo page not found")

    access_token = _get_access_token(db, current_user)

    update_notion_todo_block(
        access_token=access_token,
        block_id=block_id,
        checked=payload.checked,
    )

    task = (
        db.query(Task)
        .filter(
            Task.notion_block_id == block_id,
            Task.user_id == current_user.id,
        )
        .first()
    )
    if task:
        task.status = "Done" if payload.checked else "Todo"
        db.commit()

    return {"ok": True, "checked": payload.checked}


@router.patch("/todo-pages/{page_id}/title")
def api_rename_todo_page(
    page_id: str,
    payload: RenameTodoPageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.id == page_id,
            NotionTodoPage.user_id == current_user.id,
        )
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Todo page not found")

    access_token = _get_access_token(db, current_user)

    update_notion_page_title(
        access_token=access_token,
        page_id=page.notion_page_id,
        data_source_id=page.data_source_id,
        new_title=payload.title,
    )

    page.title = payload.title
    db.commit()
    db.refresh(page)

    return {
        "ok": True,
        "page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
    }


@router.post("/todo-pages/connect")
def api_connect_existing_page(
    payload: ConnectExistingPageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    access_token = _get_access_token(db, current_user)

    todos = get_todos_from_notion_page(
        access_token=access_token,
        page_id=payload.notion_page_id,
    )

    page = create_todo_page_locally(
        db=db,
        current_user=current_user,
        title=payload.title,
        notion_page_id=payload.notion_page_id,
        notion_page_url=None,
        data_source_id=payload.data_source_id,
    )

    tasks = []
    for todo in todos:
        task = create_todo_task_locally(
            db=db,
            current_user=current_user,
            notion_page_id=page.notion_page_id,
            title=todo["text"],
            notion_block_id=todo["block_id"],
        )
        tasks.append(task)

    return {
        "ok": True,
        "page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "todos": [
            {
                "id": task.id,
                "title": task.title,
                "checked": todo["checked"],
                "notion_block_id": task.notion_block_id,
            }
            for task, todo in zip(tasks, todos)
        ],
    }
