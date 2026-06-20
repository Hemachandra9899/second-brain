import json
from datetime import date
from sqlalchemy.orm import Session

from app.models import Task, KnowledgeItem, MoodEvent
from app.services.llm_nvidia import ask_llm


def get_today_brief(db: Session, user_id: str | None = None) -> dict:
    today = date.today().isoformat()

    task_query = db.query(Task)
    knowledge_query = db.query(KnowledgeItem)
    mood_query = db.query(MoodEvent)

    if user_id:
        task_query = task_query.filter(Task.user_id == user_id)
        knowledge_query = knowledge_query.filter(KnowledgeItem.user_id == user_id)
        mood_query = mood_query.filter(MoodEvent.user_id == user_id)

    active_tasks = (
        task_query
        .filter(Task.status != "Done")
        .order_by(Task.created_at.desc())
        .limit(10)
        .all()
    )

    scheduled_tasks = (
        task_query
        .filter(Task.due_date.isnot(None))
        .filter(Task.status != "Done")
        .order_by(Task.due_date.asc())
        .limit(10)
        .all()
    )

    recent_knowledge = (
        knowledge_query
        .order_by(KnowledgeItem.created_at.desc())
        .limit(8)
        .all()
    )

    latest_mood = (
        mood_query
        .order_by(MoodEvent.created_at.desc())
        .first()
    )

    task_context = "\n".join(
        [
            f"- {t.title} | status={t.status} | priority={t.priority} | due={t.due_date}"
            for t in active_tasks
        ]
    )

    scheduled_context = "\n".join(
        [
            f"- {t.title} | due={t.due_date} | priority={t.priority}"
            for t in scheduled_tasks
        ]
    )

    knowledge_context = "\n".join(
        [
            f"- {k.title}: {k.raw_text[:300]}"
            for k in recent_knowledge
        ]
    )

    mood_context = (
        f"{latest_mood.mood}, intensity={latest_mood.intensity}"
        if latest_mood
        else "neutral"
    )

    prompt = f"""
Create a Today Brief for a Second Brain user.

Today: {today}

Active tasks:
{task_context}

Scheduled tasks:
{scheduled_context}

Recent knowledge:
{knowledge_context}

Latest mood:
{mood_context}

Return strict JSON only:
{{
  "greeting": "Good morning",
  "summary": "short useful summary",
  "priorities": [
    {{
      "title": "priority title",
      "reason": "why this matters",
      "source_type": "task|knowledge|mood"
    }}
  ],
  "mood_note": "gentle mood-aware note",
  "suggested_next_action": "one concrete next step"
}}

Rules:
- Keep it concise.
- Choose at most 3 priorities.
- If user seems stressed/anxious/frustrated, suggest one small first step.
- Do not invent tasks that are not supported by context.
""".strip()

    raw = ask_llm(
        prompt,
        system="You create concise, practical daily briefs. Return valid JSON only.",
    )

    try:
        return json.loads(raw)
    except Exception:
        return {
            "greeting": "Good morning",
            "summary": "You have a few active items in your Second Brain.",
            "priorities": [
                {
                    "title": task.title,
                    "reason": "This is an active task.",
                    "source_type": "task",
                }
                for task in active_tasks[:3]
            ],
            "mood_note": "Start with one small step.",
            "suggested_next_action": active_tasks[0].title if active_tasks else "Capture one thing you want to remember.",
        }
