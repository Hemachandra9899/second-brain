import requests

from app.core.config import settings


def _build_notion_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": settings.notion_api_version,
        "Content-Type": "application/json",
    }


def _clean_select_value(value: str | None, default: str) -> str:
    if not value:
        return default
    return value.strip()


def create_notion_task(
    access_token: str,
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
    database_id: str | None = None,
):
    resolved_database_id = database_id or settings.notion_tasks_database_id

    if not resolved_database_id:
        raise RuntimeError("No Notion task database configured")

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

    children = []

    if description:
        children.append(
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": description[:1800],
                            },
                        }
                    ]
                },
            }
        )

    payload = {
        "parent": {"database_id": resolved_database_id},
        "properties": properties,
    }

    if children:
        payload["children"] = children

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion create page failed: {response.status_code} {response.text}"
        )

    return response.json()


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


def search_notion_databases(access_token: str):
    headers = _build_notion_headers(access_token)

    response = requests.post(
        "https://api.notion.com/v1/search",
        headers=headers,
        json={
            "filter": {
                "property": "object",
                "value": "database",
            },
            "sort": {
                "direction": "descending",
                "timestamp": "last_edited_time",
            },
            "page_size": 20,
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion search databases failed: {response.status_code} {response.text}"
        )

    return response.json().get("results", [])
