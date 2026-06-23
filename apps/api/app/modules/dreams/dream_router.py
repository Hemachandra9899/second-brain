from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.dreams.dream_schema import DreamRunRequest
from app.modules.dreams.dream_service import (
    accept_dream_action,
    get_dream_by_id,
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


@router.post("/{dream_id}/actions/{action_index}/accept")
def accept_dream_action_endpoint(
    dream_id: str,
    action_index: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    try:
        result = accept_dream_action(
            db=db,
            current_user=current_user,
            dream_id=dream_id,
            action_index=action_index,
        )
        return {"success": True, "result": result}
    except ValueError as e:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=404, content={"error": str(e)})
