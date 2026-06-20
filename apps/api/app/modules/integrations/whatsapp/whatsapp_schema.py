from pydantic import BaseModel


class WebhookResponse(BaseModel):
    ok: bool
    intent: str | None = None
    mood: dict | None = None
    action_result: dict | None = None
    reply: str | None = None
    send_result: dict | None = None
