from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.activity.activity_service import list_recent_activity

router = APIRouter()


@router.get("/recent")
def recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return list_recent_activity(db, current_user=current_user)
