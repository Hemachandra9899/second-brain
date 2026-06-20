from pydantic import BaseModel


class CaptureRequest(BaseModel):
    text: str
