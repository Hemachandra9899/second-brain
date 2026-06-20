from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    recent_context: str | None = None


class ChatResponse(BaseModel):
    answer: str
    mood: dict | None = None
    intent: dict | None = None
    task_id: str | None = None
    notion_page_id: str | None = None
    item_id: str | None = None
    sources: list[dict] | None = None
    graph_context: list[dict] | None = None
