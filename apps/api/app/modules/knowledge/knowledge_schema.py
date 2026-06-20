from pydantic import BaseModel


class CreateKnowledgeItemRequest(BaseModel):
    title: str
    raw_text: str
    source_type: str = "note"
    source_id: str | None = None


class KnowledgeAskRequest(BaseModel):
    query: str
