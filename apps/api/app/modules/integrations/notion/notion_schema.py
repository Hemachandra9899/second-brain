from pydantic import BaseModel


class NotionStatusResponse(BaseModel):
    connected: bool
    workspace_name: str | None = None
    workspace_id: str | None = None
    workspace_icon: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None


class NotionConnectResponse(BaseModel):
    auth_url: str
