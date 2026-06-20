from pydantic import BaseModel


class MoodDetectRequest(BaseModel):
    text: str
    recent_context: str | None = None
    save: bool = True
