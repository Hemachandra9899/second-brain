def _build_notion_headers(access_token: str) -> dict:
    from app.core.config import settings

    return {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": settings.notion_api_version,
        "Content-Type": "application/json",
    }


def create_notion_task(
    access_token: str,
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
    database_id: str | None = None,
):
    headers = _build_notion_headers(access_token)

    properties = {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": title,
                    }
                }
            ]
        },
        "Status": {
            "select": {
                "name": status,
            }
        },
        "Priority": {
            "select": {
                "name": priority,
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

        from app.core.config import settings as _settings

    resolved_database_id = database_id or _settings.notion_tasks_database_id
    if not resolved_database_id:
        raise RuntimeError("No Notion database configured for task sync")

    import requests

    payload: dict = {
        "parent": {"database_id": resolved_database_id},
        "properties": properties,
        "children": [
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": description or "",
                            },
                        }
                    ]
                },
            }
        ],
    }

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=payload,
        timeout=30,
    )

    response.raise_for_status()
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
                        "content": title,
                    }
                }
            ]
        },
        "Status": {
            "select": {
                "name": status,
            }
        },
        "Priority": {
            "select": {
                "name": priority,
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

    import requests

    response = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=headers,
        json={"properties": properties},
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def pull_notion_tasks(access_token: str, database_id: str):
    headers = _build_notion_headers(access_token)

    import requests

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

    response.raise_for_status()
    return response.json().get("results", [])
