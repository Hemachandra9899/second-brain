from pydantic import BaseModel


class MemoryCardResponse(BaseModel):
    id: str
    title: str
    summary: str
    tags: list[str]
    source_item_ids: list[str]
    created_at: str | None = None
