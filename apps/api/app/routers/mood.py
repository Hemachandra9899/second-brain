from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user
from app.services.mood_service import detect_mood, save_mood_event, get_latest_mood


router = APIRouter()


class MoodDetectRequest(BaseModel):
    text: str
    recent_context: str | None = None
    save: bool = True


@router.post("/detect")
def detect(
    payload: MoodDetectRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mood_data = detect_mood(
        text=payload.text,
        recent_context=payload.recent_context,
    )

    if payload.save:
        save_mood_event(
            db=db,
            text=payload.text,
            mood_data=mood_data,
            user_id=current_user.id if current_user else None,
        )

    return mood_data


@router.get("/latest")
def latest(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_latest_mood(
        db=db,
        user_id=current_user.id if current_user else None,
    )
