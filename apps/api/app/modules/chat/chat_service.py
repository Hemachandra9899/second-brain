from uuid import uuid4
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User, Task, NotionConnection
from app.modules.chat.chat_schema import ChatRequest
from app.services.llm_nvidia import ask_llm, ask_fast
from app.modules.chat.chat_intent_service import classify_chat_intent
from app.modules.mood.mood_service import detect_mood, save_mood_event
from app.modules.integrations.notion.notion_oauth_service import (
    get_notion_connection,
    get_decrypted_token,
)
from app.modules.integrations.notion.notion_service import create_notion_task
from app.modules.knowledge.knowledge_service import index_task_as_knowledge
from app.modules.knowledge.rag_service import ask_knowledge_base


def run_chat(
    db: Session,
    payload: ChatRequest,
    current_user: User | None = None,
) -> dict:
    message = payload.message.strip()
    intent = classify_chat_intent(message)

    if intent["intent"] == "greeting":
        return {
            "answer": "Hey, I'm here. You can ask me to plan your day, create a task, search memory, or save something.",
            "mood": {"mood": "neutral"},
            "intent": intent,
        }

    if intent["intent"] == "create_notion_task":
        return _handle_create_notion_task(db, message, intent, current_user)

    if intent["intent"] == "create_task":
        return _handle_create_task(db, message, intent, current_user)

    if intent["intent"] in ("query_today_tasks", "query_notion_tasks"):
        return _handle_task_query(db, message, intent, current_user)

    if intent["intent"] == "capture_note":
        return _handle_capture_note(db, message, intent, current_user)

    if intent["intent"] == "knowledge_question":
        answer = ask_knowledge_base(
            db=db,
            query=message,
            user_id=current_user.id if current_user else None,
        )
        return {
            "answer": answer.get("answer", ""),
            "intent": intent,
            "sources": answer.get("sources", []),
            "graph_context": answer.get("graph_context", []),
        }

    user_id = current_user.id if current_user else None

    mood_data = None
    if len(message.split()) > 3:
        mood_data = detect_mood(text=message)
        if user_id:
            save_mood_event(
                db=db,
                text=message,
                mood_data=mood_data,
                user_id=user_id,
            )

    mood = (mood_data or {}).get("mood", "neutral")
    tone = (mood_data or {}).get("recommended_tone", "calm_supportive")

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

    answer = ask_fast(payload.message, system=system_prompt)

    return {
        "answer": answer,
        "mood": mood_data,
        "intent": intent,
    }


def _handle_create_task(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can create this task.",
            "intent": intent,
        }

    title = intent.get("title") or message[:80]
    description = intent.get("description") or message

    task = Task(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        description=description,
        status="Todo",
        priority=intent.get("priority") or "Normal",
        due_date=intent.get("due_date"),
        source="chat",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    try:
        index_task_as_knowledge(db=db, task=task)
    except Exception:
        pass

    return {
        "answer": f"Done — I created '{title}' as a task.",
        "intent": intent,
        "task_id": task.id,
    }


def _handle_create_notion_task(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can create this task in your Notion.",
            "intent": intent,
        }

    title = intent.get("title") or message[:80]
    description = intent.get("description") or message
    due_date = intent.get("due_date")
    priority = intent.get("priority") or "Normal"

    task = Task(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        description=description,
        status="Todo",
        priority=priority,
        due_date=due_date,
        source="notion",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    conn = get_notion_connection(db, current_user)

    if not conn:
        try:
            index_task_as_knowledge(db=db, task=task)
        except Exception:
            pass
        return {
            "answer": "I created the task locally. Connect Notion from your profile menu and I can sync it there too.",
            "intent": intent,
            "task_id": task.id,
        }

    if not settings.notion_tasks_database_id:
        try:
            index_task_as_knowledge(db=db, task=task)
        except Exception:
            pass
        return {
            "answer": "I created the task locally, but NOTION_TASKS_DATABASE_ID is not configured yet.",
            "intent": intent,
            "task_id": task.id,
        }

    access_token = get_decrypted_token(conn)

    try:
        page = create_notion_task(
            access_token=access_token,
            title=title,
            description=description,
            status="Todo",
            due_date=due_date,
            priority=priority,
            database_id=settings.notion_tasks_database_id,
        )

        task.notion_page_id = page.get("id")
        db.commit()
        db.refresh(task)
    except Exception:
        pass

    try:
        index_task_as_knowledge(db=db, task=task)
    except Exception:
        pass

    return {
        "answer": f"Done — I created '{title}' in your Second Brain and Notion.",
        "intent": intent,
        "task_id": task.id,
        "notion_page_id": task.notion_page_id,
    }


def _handle_task_query(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can check your tasks.",
            "intent": intent,
        }

    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .order_by(Task.created_at.desc())
        .limit(10)
        .all()
    )

    if not tasks:
        return {
            "answer": "You have no tasks yet. Want me to create one?",
            "intent": intent,
        }

    lines = [f"- {t.title} ({t.status or 'Todo'})" for t in tasks]
    return {
        "answer": "Here are your recent tasks:\n" + "\n".join(lines),
        "intent": intent,
    }


def _handle_capture_note(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    from app.modules.knowledge.knowledge_service import index_knowledge_item

    title = intent.get("title") or "Captured note"
    description = intent.get("description") or message

    try:
        item = index_knowledge_item(
            db=db,
            title=title,
            raw_text=description,
            source_type="chat_capture",
            user_id=current_user.id if current_user else None,
        )
        return {
            "answer": f"I saved '{title}' as a knowledge note.",
            "intent": intent,
            "item_id": item.id,
        }
    except Exception:
        return {
            "answer": "I captured your note but could not index it into memory.",
            "intent": intent,
        }
