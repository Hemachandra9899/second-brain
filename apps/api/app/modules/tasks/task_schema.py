from pydantic import BaseModel


class CreateTaskRequest(BaseModel):
    title: str
    description: str | None = None
    status: str = "Todo"
    priority: str = "Normal"
    due_date: str | None = None
    sync_to_notion: bool = False


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None
    sync_to_notion: bool = False


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: str | None = None
    source: str
    notion_page_id: str | None = None
