from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.dreams.dream_schema import DreamRunRequest
from app.modules.dreams.dream_service import (
    get_latest_dream,
    list_dreams,
    run_dream,
)

router = APIRouter()


@router.post("/run")
def run_dream_endpoint(
    payload: DreamRunRequest = DreamRunRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return run_dream(db=db, current_user=current_user, mode=payload.mode)


@router.get("/latest")
def latest_dream_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    dream = get_latest_dream(db=db, current_user=current_user)
    return {"dream": dream}


@router.get("")
def list_dreams_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return {"dreams": list_dreams(db=db, current_user=current_user)}
