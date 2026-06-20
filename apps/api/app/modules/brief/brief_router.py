from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import User
from app.modules.brief.brief_service import get_today_brief

router = APIRouter()


@router.get("/today")
def today_brief(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    return get_today_brief(
        db=db,
        user_id=current_user.id if current_user else None,
    )
