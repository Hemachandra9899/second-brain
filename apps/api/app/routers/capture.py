from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.services.capture_service import handle_capture


router = APIRouter()


class CaptureRequest(BaseModel):
    text: str


@router.post("")
def capture(
    payload: CaptureRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return handle_capture(
        db=db,
        text=payload.text,
        user_id=current_user.id if current_user else None,
    )
