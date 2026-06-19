from notion_client import Client
from app.core.config import settings


def get_notion_client() -> Client:
    if not settings.notion_api_key:
        raise RuntimeError("NOTION_API_KEY is missing")
    return Client(auth=settings.notion_api_key)


def create_notion_task(
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
):
    if not settings.notion_tasks_database_id:
        raise RuntimeError("NOTION_TASKS_DATABASE_ID is missing")

    notion = get_notion_client()

    properties = {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": title
                    }
                }
            ]
        },
        "Status": {
            "select": {
                "name": status
            }
        },
        "Priority": {
            "select": {
                "name": priority
            }
        },
        "Source": {
            "select": {
                "name": "Second Brain"
            }
        },
    }

    if due_date:
        properties["Due Date"] = {
            "date": {
                "start": due_date
            }
        }

    return notion.pages.create(
        parent={"database_id": settings.notion_tasks_database_id},
        properties=properties,
        children=[
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": description or ""
                            }
                        }
                    ]
                },
            }
        ],
    )


def update_notion_task(
    page_id: str,
    title: str,
    description: str | None = None,
    status: str = "Todo",
    due_date: str | None = None,
    priority: str = "Normal",
):
    notion = get_notion_client()

    properties = {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": title
                    }
                }
            ]
        },
        "Status": {
            "select": {
                "name": status
            }
        },
        "Priority": {
            "select": {
                "name": priority
            }
        },
        "Source": {
            "select": {
                "name": "Second Brain"
            }
        },
    }

    if due_date:
        properties["Due Date"] = {
            "date": {
                "start": due_date
            }
        }

    return notion.pages.update(
        page_id=page_id,
        properties=properties,
    )


def pull_notion_tasks():
    if not settings.notion_tasks_database_id:
        raise RuntimeError("NOTION_TASKS_DATABASE_ID is missing")

    notion = get_notion_client()

    result = notion.databases.query(
        database_id=settings.notion_tasks_database_id,
        sorts=[
            {
                "timestamp": "last_edited_time",
                "direction": "descending",
            }
        ],
    )

    return result.get("results", [])
