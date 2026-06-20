from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    credential: str


class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
