from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import User
from app.modules.chat.chat_schema import ChatRequest
from app.modules.chat.chat_service import run_chat

router = APIRouter()


@router.post("")
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return run_chat(
        db=db,
        payload=payload,
        current_user=current_user,
    )
