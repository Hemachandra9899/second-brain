from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.notion_service import create_notion_task


router = APIRouter()


class CreateNotionTaskRequest(BaseModel):
    title: str
    description: str | None = None
    status: str = "Todo"


@router.post("/tasks")
def notion_create_task(payload: CreateNotionTaskRequest):
    try:
        page = create_notion_task(
            title=payload.title,
            description=payload.description,
            status=payload.status,
        )
        return {"notion_page_id": page["id"], "url": page.get("url")}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
