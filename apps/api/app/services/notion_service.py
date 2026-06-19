from notion_client import Client

from app.core.config import settings


def get_notion_client():
    if not settings.notion_api_key:
        raise RuntimeError("NOTION_API_KEY is missing")
    return Client(auth=settings.notion_api_key)


def create_notion_task(title: str, description: str | None = None, status: str = "Todo"):
    if not settings.notion_tasks_database_id:
        raise RuntimeError("NOTION_TASKS_DATABASE_ID is missing")

    notion = get_notion_client()

    return notion.pages.create(
        parent={"database_id": settings.notion_tasks_database_id},
        properties={
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
        },
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
