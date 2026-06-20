from pydantic import BaseModel


class WritingCleanRequest(BaseModel):
    text: str


class WritingCreateRequest(BaseModel):
    title: str | None = None
    raw_text: str
    cleaned_markdown: str | None = None
    blocks: list[dict] | None = None
    source_type: str = "manual"


class WritingPatchRequest(BaseModel):
    title: str | None = None
    raw_text: str | None = None
    cleaned_markdown: str | None = None
    blocks: list[dict] | None = None


class WritingResponse(BaseModel):
    id: str
    title: str
    raw_text: str
    cleaned_markdown: str | None = None
    blocks: list[dict] = []
    source_type: str
    notion_page_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
