from pydantic import BaseModel


class BrainAskRequest(BaseModel):
    query: str
    source_hint: str | None = None


class BrainSource(BaseModel):
    title: str
    type: str
    id: str | None = None
    url: str | None = None
    preview: str | None = None


class BrainAskResponse(BaseModel):
    answer: str
    sources: list[BrainSource] = []
