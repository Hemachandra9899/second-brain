from pydantic import BaseModel


class BriefPriority(BaseModel):
    title: str
    reason: str
    source_type: str


class TodayBriefResponse(BaseModel):
    greeting: str
    summary: str
    priorities: list[BriefPriority]
    mood_note: str
    suggested_next_action: str
