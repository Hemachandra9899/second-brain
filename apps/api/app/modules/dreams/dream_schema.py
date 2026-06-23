from pydantic import BaseModel


class DreamRunRequest(BaseModel):
    mode: str = "nightly"


class DreamSuggestedAction(BaseModel):
    title: str
    reason: str | None = None
    action_type: str | None = None
    source_type: str | None = None
    source_id: str | None = None


class DreamResponse(BaseModel):
    id: str
    dream_date: str
    dream_type: str
    title: str
    summary: str
    patterns: list[str]
    forgotten_items: list[str]
    suggested_actions: list[dict]
    tomorrow_plan: list[str]
    related_ids: dict
    created_at: str | None = None
