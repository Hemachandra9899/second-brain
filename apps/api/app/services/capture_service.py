import json
from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.models import Task
from app.services.llm_nvidia import ask_llm
from app.services.knowledge_service import index_task_as_knowledge, index_knowledge_item
from app.services.rag_service import ask_knowledge_base


def _safe_json_loads(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end >= 0:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                pass

    return {
        "capture_type": "note",
        "title": "Captured note",
        "description": text,
        "due_date": None,
        "priority": "Normal",
        "summary": "Saved as a note.",
        "suggested_next_action": "Review it later.",
    }


def classify_capture(text: str) -> dict:
    prompt = f"""
Classify this input for a Second Brain app.

Return strict JSON only:
{{
  "capture_type": "task|note|idea|link|meeting_note|question|project_update",
  "title": "short title",
  "description": "clean useful description",
  "due_date": "YYYY-MM-DD or null",
  "priority": "Low|Normal|High",
  "summary": "one sentence summary",
  "suggested_next_action": "one practical next action"
}}

Rules:
- If it sounds like a todo, reminder, deadline, or action item, use task.
- If it is a URL, use link.
- If it starts with idea or sounds like a concept, use idea.
- If it mentions meeting, call, discussion, investor, team, use meeting_note.
- If it asks a question, use question.
- If it mentions progress/update/blocker/status, use project_update.
- Do not invent exact due dates unless clearly present.

Input:
{text}
""".strip()

    result = ask_llm(
        prompt,
        system="You classify user captures into structured Second Brain actions. Return valid JSON only.",
    )

    return _safe_json_loads(result)


def handle_capture(db: Session, text: str, user_id: str | None = None) -> dict:
    data = classify_capture(text)
    capture_type = data.get("capture_type", "note")

    created_task = None
    created_knowledge_item = None
    answer = None

    if capture_type == "task":
        task = Task(
            id=str(uuid4()),
            user_id=user_id,
            title=data.get("title") or text[:80],
            description=data.get("description") or text,
            status="Todo",
            priority=data.get("priority") or "Normal",
            due_date=data.get("due_date"),
            source="capture",
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        index_task_as_knowledge(db=db, task=task)

        created_task = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "source": task.source,
        }

    elif capture_type == "question":
        answer = ask_knowledge_base(
            db=db,
            query=text,
            user_id=user_id,
        )

    else:
        item = index_knowledge_item(
            db=db,
            title=data.get("title") or "Captured memory",
            raw_text=data.get("description") or text,
            source_type=capture_type,
            source_id=str(uuid4()),
            user_id=user_id,
        )

        created_knowledge_item = {
            "id": item.id,
            "title": item.title,
            "raw_text": item.raw_text,
            "source_type": item.source_type,
        }

    return {
        "capture_type": capture_type,
        "summary": data.get("summary"),
        "suggested_next_action": data.get("suggested_next_action"),
        "created_task": created_task,
        "created_knowledge_item": created_knowledge_item,
        "answer": answer,
    }
