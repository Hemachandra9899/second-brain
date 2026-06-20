import requests

from app.core.config import settings


def _build_notion_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": settings.notion_api_version,
        "Content-Type": "application/json",
    }


def _rich_text(text: str) -> list[dict]:
    return [
        {
            "type": "text",
            "text": {
                "content": text[:1800],
            },
        }
    ]


def _title_prop(title: str) -> dict:
    return {
        "title": [
            {
                "text": {
                    "content": title[:180],
                }
            }
        ]
    }


def _select_prop(value: str) -> dict:
    return {
        "select": {
            "name": value,
        }
    }


def _date_prop(value: str) -> dict:
    return {
        "date": {
            "start": value,
        }
    }


def _notion_error(prefix: str, response: requests.Response) -> RuntimeError:
    return RuntimeError(f"{prefix}: {response.status_code} {response.text}")


def search_notion_databases(access_token: str) -> list[dict]:
    """
    Notion 2026-03-11 returns data_sources, not legacy databases.
    UI can still call these "databases" for user clarity.
    """
    headers = _build_notion_headers(access_token)

    response = requests.post(
        "https://api.notion.com/v1/search",
        headers=headers,
        json={
            "filter": {
                "property": "object",
                "value": "data_source",
            },
            "sort": {
                "direction": "descending",
                "timestamp": "last_edited_time",
            },
            "page_size": 50,
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion data source search failed", response)

    results = response.json().get("results", [])

    normalized = []

    for item in results:
        title_items = item.get("title") or []
        title = "Untitled"

        if title_items:
            title = title_items[0].get("plain_text") or "Untitled"

        normalized.append(
            {
                "id": item.get("id"),
                "title": title,
                "url": item.get("url"),
                "object": item.get("object"),
                "data_source_id": item.get("id"),
            }
        )

    return normalized


def retrieve_notion_database(access_token: str, database_id: str) -> dict:
    headers = _build_notion_headers(access_token)

    response = requests.get(
        f"https://api.notion.com/v1/databases/{database_id}",
        headers=headers,
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion retrieve database failed", response)

    return response.json()


def resolve_data_source_id(access_token: str, database_id_or_data_source_id: str) -> str:
    try:
        database = retrieve_notion_database(access_token, database_id_or_data_source_id)
        data_sources = database.get("data_sources") or []
        if data_sources:
            return data_sources[0]["id"]
    except Exception:
        pass

    return database_id_or_data_source_id


def query_notion_data_source(
    access_token: str,
    data_source_id: str,
    query: str | None = None,
    page_size: int = 10,
) -> list[dict]:
    headers = _build_notion_headers(access_token)

    body: dict = {
        "page_size": page_size,
        "sorts": [
            {
                "timestamp": "last_edited_time",
                "direction": "descending",
            }
        ],
    }

    if query:
        body["filter"] = {
            "or": [
                {
                    "property": "Name",
                    "title": {
                        "contains": query[:100],
                    },
                }
            ]
        }

    response = requests.post(
        f"https://api.notion.com/v1/data_sources/{data_source_id}/query",
        headers=headers,
        json=body,
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion data source query failed", response)

    return response.json().get("results", [])


def create_notion_task(
    access_token: str,
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
    database_id: str | None = None,
    data_source_id: str | None = None,
):
    headers = _build_notion_headers(access_token)

    resolved_data_source_id = data_source_id
    if not resolved_data_source_id:
        configured_id = database_id or settings.notion_tasks_database_id
        if configured_id:
            resolved_data_source_id = resolve_data_source_id(access_token, configured_id)

    if not resolved_data_source_id:
        raise RuntimeError("No Notion data source/database selected for task creation.")

    properties = {
        "Name": _title_prop(title),
    }

    if status:
        properties["Status"] = _select_prop(status)
    if priority:
        properties["Priority"] = _select_prop(priority)
    if due_date:
        properties["Due Date"] = _date_prop(due_date)

    children = [
        {
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": _rich_text("Task details"),
            },
        },
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": _rich_text(description or title),
            },
        },
        {
            "object": "block",
            "type": "to_do",
            "to_do": {
                "rich_text": _rich_text(title),
                "checked": False,
            },
        },
    ]

    payload = {
        "parent": {
            "data_source_id": resolved_data_source_id,
        },
        "properties": properties,
        "children": children,
    }

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion create page failed", response)

    return response.json()


def search_relevant_notion_pages(
    access_token: str,
    query: str,
    data_source_id: str | None = None,
    database_id: str | None = None,
) -> list[dict]:
    if data_source_id or database_id:
        resolved = data_source_id or resolve_data_source_id(access_token, database_id)
        return query_notion_data_source(access_token, resolved, query=query, page_size=8)

    headers = _build_notion_headers(access_token)

    response = requests.post(
        "https://api.notion.com/v1/search",
        headers=headers,
        json={
            "query": query[:100],
            "filter": {
                "property": "object",
                "value": "page",
            },
            "page_size": 8,
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion page search failed", response)

    return response.json().get("results", [])


def retrieve_page_blocks(access_token: str, page_id: str) -> list[dict]:
    headers = _build_notion_headers(access_token)

    response = requests.get(
        f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=25",
        headers=headers,
        timeout=30,
    )

    if response.status_code >= 400:
        raise _notion_error("Notion retrieve page blocks failed", response)

    return response.json().get("results", [])


def blocks_to_text(blocks: list[dict]) -> str:
    lines = []

    for block in blocks:
        block_type = block.get("type")
        body = block.get(block_type) or {}
        rich_text = body.get("rich_text") or []

        text = "".join([rt.get("plain_text", "") for rt in rich_text]).strip()
        if text:
            lines.append(text)

    return "\n".join(lines)


def _clean_select_value(value: str | None, default: str) -> str:
    if not value:
        return default
    return value.strip()


def update_notion_task(
    access_token: str,
    page_id: str,
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
):
    headers = _build_notion_headers(access_token)

    properties = {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": title[:180],
                    }
                }
            ]
        },
        "Status": {
            "select": {
                "name": _clean_select_value(status, "Todo"),
            }
        },
        "Priority": {
            "select": {
                "name": _clean_select_value(priority, "Normal"),
            }
        },
        "Source": {
            "select": {
                "name": "Second Brain",
            }
        },
    }

    if due_date:
        properties["Due Date"] = {
            "date": {
                "start": due_date,
            }
        }

    response = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=headers,
        json={"properties": properties},
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion update page failed: {response.status_code} {response.text}"
        )

    return response.json()


def pull_notion_tasks(access_token: str, database_id: str):
    headers = _build_notion_headers(access_token)

    response = requests.post(
        f"https://api.notion.com/v1/databases/{database_id}/query",
        headers=headers,
        json={
            "sorts": [
                {
                    "timestamp": "last_edited_time",
                    "direction": "descending",
                }
            ]
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion query database failed: {response.status_code} {response.text}"
        )

    return response.json().get("results", [])
