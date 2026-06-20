from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    recent_context: str | None = None


class ChatResponse(BaseModel):
    answer: str
    mood: dict | None = None
