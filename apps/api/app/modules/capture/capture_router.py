from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import User
from app.modules.capture.capture_schema import CaptureRequest
from app.modules.capture.capture_service import handle_capture

router = APIRouter()


@router.post("")
def capture(
    payload: CaptureRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return handle_capture(
        db=db,
        text=payload.text,
        user_id=current_user.id if current_user else None,
    )
