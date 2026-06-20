import re

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


def retrieve_data_source(access_token: str, data_source_id: str) -> dict:
    headers = _build_notion_headers(access_token)

    response = requests.get(
        f"https://api.notion.com/v1/data_sources/{data_source_id}",
        headers=headers,
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion retrieve data source failed: {response.status_code} {response.text}"
        )

    return response.json()


def find_title_property(schema: dict) -> str:
    properties = schema.get("properties", {})

    for name, prop in properties.items():
        if prop.get("type") == "title":
            return name

    return "Name"


def build_safe_properties(
    schema: dict,
    title: str,
    status: str | None = None,
    priority: str | None = None,
    due_date: str | None = None,
) -> dict:
    properties_schema = schema.get("properties", {})
    title_prop = find_title_property(schema)

    properties = {
        title_prop: {
            "title": [
                {
                    "text": {
                        "content": title[:180],
                    }
                }
            ]
        }
    }

    if "Status" in properties_schema and status:
        prop_type = properties_schema["Status"].get("type")
        if prop_type == "status":
            properties["Status"] = {"status": {"name": status}}
        elif prop_type == "select":
            properties["Status"] = {"select": {"name": status}}

    if "Priority" in properties_schema and priority:
        prop_type = properties_schema["Priority"].get("type")
        if prop_type == "select":
            properties["Priority"] = {"select": {"name": priority}}
        elif prop_type == "status":
            properties["Priority"] = {"status": {"name": priority}}

    if "Due Date" in properties_schema and due_date:
        properties["Due Date"] = {
            "date": {
                "start": due_date,
            }
        }

    return properties


def extract_todo_items(message: str) -> list[str]:
    matches = re.findall(r"(?:^|\s)\d+\.\s*([^0-9]+?)(?=\s+\d+\.|$)", message)

    items = [m.strip(" ?.-") for m in matches if m.strip(" ?.-")]

    if items:
        return items

    cleaned = (
        message.replace("/notion", "")
        .replace("@notion", "")
        .replace("create todo", "")
        .replace("create a todo", "")
        .replace("add", "")
        .strip(" ?.-")
    )

    return [cleaned] if cleaned else ["New todo"]


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

    schema = retrieve_data_source(access_token, resolved_data_source_id)

    todo_items = extract_todo_items(description or title)
    page_title = title if title and title.lower() != "todo" else "Todo"

    properties = build_safe_properties(
        schema=schema,
        title=page_title,
        status=status,
        priority=priority,
        due_date=due_date,
    )

    children = [
        {
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "Todo"},
                    }
                ]
            },
        },
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": "Created from Second Brain chat.",
                        },
                    }
                ]
            },
        },
    ]

    for item in todo_items:
        children.append(
            {
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": item[:1800]},
                        }
                    ],
                    "checked": False,
                },
            }
        )

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


def _plain_text_block(text: str) -> list[dict]:
    return [
        {
            "type": "text",
            "text": {
                "content": (text or "")[:1800],
            },
        }
    ]


def notion_blocks_from_writing_blocks(blocks: list[dict]) -> list[dict]:
    notion_blocks = []

    for block in blocks:
        block_type = block.get("type")
        text = (block.get("text") or "").strip()

        if not text:
            continue

        if block_type == "heading":
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": _plain_text_block(text),
                    },
                }
            )

        elif block_type == "todo":
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "to_do",
                    "to_do": {
                        "rich_text": _plain_text_block(text),
                        "checked": bool(block.get("checked", False)),
                    },
                }
            )

        elif block_type == "bullet":
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": _plain_text_block(text),
                    },
                }
            )

        elif block_type == "quote":
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "quote",
                    "quote": {
                        "rich_text": _plain_text_block(text),
                    },
                }
            )

        elif block_type == "code":
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "code",
                    "code": {
                        "rich_text": _plain_text_block(text),
                        "language": "plain text",
                    },
                }
            )

        else:
            notion_blocks.append(
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": _plain_text_block(text),
                    },
                }
            )

    if not notion_blocks:
        notion_blocks.append(
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": _plain_text_block("Created from Second Brain."),
                },
            }
        )

    return notion_blocks


def _find_title_property(schema: dict) -> str:
    properties = schema.get("properties", {})

    for name, prop in properties.items():
        if prop.get("type") == "title":
            return name

    return "Name"


def _build_title_only_properties(schema: dict, title: str) -> dict:
    title_property = _find_title_property(schema)

    return {
        title_property: {
            "title": [
                {
                    "text": {
                        "content": title[:180],
                    }
                }
            ]
        }
    }


def create_notion_page_from_blocks(
    access_token: str,
    title: str,
    blocks: list[dict],
    data_source_id: str | None = None,
    database_id: str | None = None,
):
    resolved_data_source_id = data_source_id

    if not resolved_data_source_id and database_id:
        resolved_data_source_id = resolve_data_source_id(access_token, database_id)

    if not resolved_data_source_id:
        raise RuntimeError("No Notion data source selected for writing sync.")

    headers = _build_notion_headers(access_token)
    schema = retrieve_data_source(access_token, resolved_data_source_id)

    payload = {
        "parent": {
            "data_source_id": resolved_data_source_id,
        },
        "properties": _build_title_only_properties(schema, title),
        "children": notion_blocks_from_writing_blocks(blocks),
    }

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion create writing page failed: {response.status_code} {response.text}"
        )

    return response.json()
