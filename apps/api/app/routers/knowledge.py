from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_service import ask_knowledge_base


router = APIRouter()


class KnowledgeAskRequest(BaseModel):
    query: str


@router.post("/ask")
def ask(payload: KnowledgeAskRequest):
    return ask_knowledge_base(payload.query)
