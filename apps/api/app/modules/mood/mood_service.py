import json
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import MoodEvent
from app.services.llm_nvidia import ask_llm


CALMING_THEMES = {
    "angry": {
        "theme_name": "cool_mint",
        "background": "from-sky-50 via-cyan-100 to-emerald-100",
        "primary": "bg-sky-500 hover:bg-sky-600",
        "accent": "text-emerald-700",
        "card": "bg-white/80",
        "reason": "Use cool blues and mint to reduce intensity. Avoid red.",
    },
    "frustrated": {
        "theme_name": "cool_mint",
        "background": "from-sky-50 via-cyan-100 to-emerald-100",
        "primary": "bg-sky-500 hover:bg-sky-600",
        "accent": "text-emerald-700",
        "card": "bg-white/80",
        "reason": "Use cool blues and mint to reduce intensity. Avoid red.",
    },
    "anxious": {
        "theme_name": "soft_lavender",
        "background": "from-blue-50 via-sky-100 to-violet-100",
        "primary": "bg-blue-500 hover:bg-blue-600",
        "accent": "text-violet-700",
        "card": "bg-white/80",
        "reason": "Use stable blue and soft lavender to create safety.",
    },
    "stressed": {
        "theme_name": "soft_lavender",
        "background": "from-blue-50 via-sky-100 to-violet-100",
        "primary": "bg-blue-500 hover:bg-blue-600",
        "accent": "text-violet-700",
        "card": "bg-white/80",
        "reason": "Use stable blue and soft lavender to create safety.",
    },
    "sad": {
        "theme_name": "warm_calm",
        "background": "from-cyan-50 via-blue-50 to-amber-50",
        "primary": "bg-cyan-500 hover:bg-cyan-600",
        "accent": "text-cyan-700",
        "card": "bg-white/85",
        "reason": "Use gentle warmth with cyan to feel supportive.",
    },
    "lonely": {
        "theme_name": "warm_calm",
        "background": "from-cyan-50 via-blue-50 to-amber-50",
        "primary": "bg-cyan-500 hover:bg-cyan-600",
        "accent": "text-cyan-700",
        "card": "bg-white/85",
        "reason": "Use gentle warmth with cyan to feel supportive.",
    },
    "happy": {
        "theme_name": "fresh_sky",
        "background": "from-sky-50 via-cyan-100 to-blue-200",
        "primary": "bg-sky-500 hover:bg-sky-600",
        "accent": "text-sky-700",
        "card": "bg-white/75",
        "reason": "Keep the existing bright calm blue theme.",
    },
    "calm": {
        "theme_name": "fresh_sky",
        "background": "from-sky-50 via-cyan-100 to-blue-200",
        "primary": "bg-sky-500 hover:bg-sky-600",
        "accent": "text-sky-700",
        "card": "bg-white/75",
        "reason": "Keep the existing bright calm blue theme.",
    },
    "neutral": {
        "theme_name": "fresh_sky",
        "background": "from-sky-50 via-cyan-100 to-blue-200",
        "primary": "bg-sky-500 hover:bg-sky-600",
        "accent": "text-sky-700",
        "card": "bg-white/75",
        "reason": "Default calm blue theme.",
    },
}


def _safe_json_loads(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")

        if start >= 0 and end >= 0:
            try:
                return json.loads(text[start : end + 1])
            except Exception:
                pass

    return {
        "mood": "neutral",
        "intensity": "medium",
        "confidence": 0.5,
        "valence": "neutral",
        "arousal": "medium",
        "recommended_tone": "calm_supportive",
    }


def get_theme_for_mood(mood: str) -> dict:
    normalized = mood.lower().strip()
    return CALMING_THEMES.get(normalized, CALMING_THEMES["neutral"])


def detect_mood(text: str, recent_context: str | None = None) -> dict:
    prompt = f"""
Detect the user's current emotional state from the message.

Return strict JSON only:
{{
  "mood": "angry|frustrated|anxious|stressed|sad|lonely|happy|calm|confused|neutral",
  "intensity": "low|medium|high",
  "confidence": 0.0,
  "valence": "negative|neutral|positive",
  "arousal": "low|medium|high",
  "recommended_tone": "calm_supportive|encouraging|clarifying|celebratory"
}}

Rules:
- Do not over-diagnose.
- Infer only from text.
- If unsure, use neutral.
- If user sounds angry or frustrated, recommended_tone should be calm_supportive.
- If user sounds anxious or stressed, recommended_tone should be reassuring and grounding.

Recent context:
{recent_context or ""}

Message:
{text}
""".strip()

    result = ask_llm(
        prompt,
        system="You are a careful emotion classifier. Return valid JSON only.",
    )

    mood_data = _safe_json_loads(result)

    mood = str(mood_data.get("mood", "neutral")).lower()
    theme = get_theme_for_mood(mood)

    return {
        "mood": mood,
        "intensity": str(mood_data.get("intensity", "medium")),
        "confidence": float(mood_data.get("confidence", 0.5)),
        "valence": str(mood_data.get("valence", "neutral")),
        "arousal": str(mood_data.get("arousal", "medium")),
        "recommended_tone": str(mood_data.get("recommended_tone", "calm_supportive")),
        "theme": theme,
    }


def save_mood_event(db: Session, text: str, mood_data: dict, user_id: str | None = None) -> MoodEvent:
    event = MoodEvent(
        id=str(uuid4()),
        user_id=user_id,
        text=text,
        mood=mood_data.get("mood", "neutral"),
        intensity=mood_data.get("intensity", "medium"),
        confidence=str(mood_data.get("confidence", 0.5)),
        valence=mood_data.get("valence", "neutral"),
        arousal=mood_data.get("arousal", "medium"),
        recommended_tone=mood_data.get("recommended_tone", "calm_supportive"),
        theme_name=mood_data.get("theme", {}).get("theme_name", "fresh_sky"),
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def get_latest_mood(db: Session, user_id: str | None = None) -> dict:
    query = db.query(MoodEvent).order_by(MoodEvent.created_at.desc())

    if user_id:
        query = query.filter(MoodEvent.user_id == user_id)

    event = query.first()

    if not event:
        mood = "neutral"
        return {
            "mood": mood,
            "intensity": "medium",
            "confidence": 0.5,
            "valence": "neutral",
            "arousal": "medium",
            "recommended_tone": "calm_supportive",
            "theme": get_theme_for_mood(mood),
        }

    mood = event.mood

    return {
        "mood": mood,
        "intensity": event.intensity,
        "confidence": float(event.confidence),
        "valence": event.valence,
        "arousal": event.arousal,
        "recommended_tone": event.recommended_tone,
        "theme": get_theme_for_mood(mood),
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }
