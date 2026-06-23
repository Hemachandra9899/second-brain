from uuid import uuid4

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User, NotionTodoPage, Task
from app.modules.brain.local_brain_indexer import index_notion_todo_page_to_local_brain
from app.modules.integrations.notion.notion_service import (
    _build_notion_headers,
    _plain_text_block,
    _rich_text,
    _title_prop,
    find_title_property as _find_title_property,
    notion_blocks_from_writing_blocks,
    retrieve_data_source,
    retrieve_page_blocks,
)
from app.modules.integrations.notion.notion_oauth_service import (
    get_notion_connection,
    get_decrypted_token,
)


def _get_access_token(db: Session, current_user: User) -> str:
    conn = get_notion_connection(db, current_user)
    if not conn:
        raise RuntimeError("Notion not connected. Connect Notion from your profile.")
    return get_decrypted_token(conn)


def create_notion_todo_page(
    access_token: str,
    title: str,
    todos: list[str],
    data_source_id: str,
) -> dict:
    schema = retrieve_data_source(access_token, data_source_id)
    title_property_name = _find_title_property(schema)

    headers = _build_notion_headers(access_token)

    payload = {
        "parent": {
            "data_source_id": data_source_id,
        },
        "properties": {
            title_property_name: {
                "title": [
                    {
                        "text": {
                            "content": title[:180],
                        }
                    }
                ]
            }
        },
        "children": [
            *[
                {
                    "object": "block",
                    "type": "to_do",
                    "to_do": {
                        "rich_text": [{"type": "text", "text": {"content": todo[:1800]}}],
                        "checked": False,
                    },
                }
                for todo in todos
            ],
        ],
    }

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion create todo page failed: {response.status_code} {response.text}"
        )

    page = response.json()
    page_id = page["id"]

    blocks = retrieve_page_blocks(access_token, page_id)

    todo_blocks = []
    for block in blocks:
        if block.get("type") != "to_do":
            continue
        todo = block.get("to_do") or {}
        text = "".join(
            rt.get("plain_text", "") for rt in todo.get("rich_text", [])
        ).strip()
        todo_blocks.append(
            {
                "block_id": block["id"],
                "text": text,
                "checked": todo.get("checked", False),
            }
        )

    return {
        "page_id": page_id,
        "page_url": page.get("url"),
        "title": title,
        "todos": todo_blocks,
    }


def get_todos_from_notion_page(
    access_token: str,
    page_id: str,
) -> list[dict]:
    blocks = retrieve_page_blocks(access_token, page_id)

    todos = []
    for block in blocks:
        if block.get("type") != "to_do":
            continue
        todo = block.get("to_do") or {}
        text = "".join(
            rt.get("plain_text", "") for rt in todo.get("rich_text", [])
        ).strip()
        todos.append(
            {
                "block_id": block["id"],
                "text": text,
                "checked": todo.get("checked", False),
            }
        )

    return todos


def update_notion_todo_block(
    access_token: str,
    block_id: str,
    checked: bool,
) -> dict:
    headers = _build_notion_headers(access_token)

    response = requests.patch(
        f"https://api.notion.com/v1/blocks/{block_id}",
        headers=headers,
        json={
            "to_do": {
                "checked": checked,
            }
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion update todo block failed: {response.status_code} {response.text}"
        )

    return response.json()


def append_todos_to_notion_page(
    access_token: str,
    page_id: str,
    todos: list[str],
) -> list[dict]:
    headers = _build_notion_headers(access_token)

    children = [
        {
            "object": "block",
            "type": "to_do",
            "to_do": {
                "rich_text": [{"type": "text", "text": {"content": todo[:1800]}}],
                "checked": False,
            },
        }
        for todo in todos
    ]

    response = requests.patch(
        f"https://api.notion.com/v1/blocks/{page_id}/children",
        headers=headers,
        json={"children": children},
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion append todos failed: {response.status_code} {response.text}"
        )

    results = response.json().get("results", [])

    return [
        {
            "block_id": block["id"],
            "text": "".join(
                rt.get("plain_text", "")
                for rt in (block.get("to_do") or {}).get("rich_text", [])
            ).strip(),
            "checked": False,
        }
        for block in results
    ]


def update_notion_page_title(
    access_token: str,
    page_id: str,
    data_source_id: str,
    new_title: str,
) -> dict:
    schema = retrieve_data_source(access_token, data_source_id)
    title_property_name = _find_title_property(schema)

    headers = _build_notion_headers(access_token)

    response = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=headers,
        json={
            "properties": {
                title_property_name: {
                    "title": [
                        {
                            "text": {
                                "content": new_title[:180],
                            }
                        }
                    ]
                }
            }
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion rename page failed: {response.status_code} {response.text}"
        )

    return response.json()


def create_todo_page_locally(
    db: Session,
    current_user: User,
    title: str,
    notion_page_id: str,
    notion_page_url: str | None,
    data_source_id: str | None,
) -> NotionTodoPage:
    page = NotionTodoPage(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        notion_page_id=notion_page_id,
        notion_page_url=notion_page_url,
        data_source_id=data_source_id,
    )
    db.add(page)
    db.commit()
    db.refresh(page)

    try:
        index_notion_todo_page_to_local_brain(db=db, page=page)
    except Exception:
        pass

    return page


def create_todo_task_locally(
    db: Session,
    current_user: User,
    notion_page_id: str,
    title: str,
    notion_block_id: str | None,
) -> Task:
    task = Task(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        status="Todo",
        source="notion_todo",
        notion_page_id=notion_page_id,
        notion_block_id=notion_block_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
