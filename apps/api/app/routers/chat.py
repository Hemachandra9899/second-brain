from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm_nvidia import ask_llm


router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    answer = ask_llm(payload.message)
    return ChatResponse(answer=answer)
