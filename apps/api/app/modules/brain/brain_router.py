from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.brain.brain_schema import BrainAskRequest
from app.modules.brain.brain_service import ask_brain

router = APIRouter()


@router.post("/ask")
def ask_my_brain(
    payload: BrainAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return ask_brain(
        db=db,
        query=payload.query,
        source_hint=payload.source_hint,
        current_user=current_user,
    )
