from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user
from app.services.llm_nvidia import ask_llm
from app.services.mood_service import detect_mood, save_mood_event


router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    recent_context: str | None = None


@router.post("")
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mood_data = detect_mood(
        text=payload.message,
        recent_context=payload.recent_context,
    )

    save_mood_event(
        db=db,
        text=payload.message,
        mood_data=mood_data,
        user_id=current_user.id if current_user else None,
    )

    tone = mood_data.get("recommended_tone", "calm_supportive")
    mood = mood_data.get("mood", "neutral")

    system_prompt = f"""
You are Second Brain, a supportive AI assistant.

The user's current detected mood is: {mood}
Recommended response tone: {tone}

Respond naturally.
If the user seems angry, frustrated, anxious, stressed, sad, or lonely:
- Be calm and grounding.
- Do not be dramatic.
- Do not over-apologize.
- Help them take one clear next step.
- Keep answer concise and kind.

If the user is neutral or happy:
- Be helpful and efficient.
""".strip()

    answer = ask_llm(
        payload.message,
        system=system_prompt,
    )

    return {
        "answer": answer,
        "mood": mood_data,
    }
