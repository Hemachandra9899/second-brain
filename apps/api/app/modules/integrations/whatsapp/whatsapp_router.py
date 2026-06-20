import json
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models import Task, WhatsAppMessage, User
from app.modules.integrations.whatsapp.intent_service import classify_whatsapp_intent
from app.modules.mood.mood_service import detect_mood, save_mood_event
from app.modules.knowledge.knowledge_service import index_task_as_knowledge, index_knowledge_item
from app.modules.knowledge.rag_service import ask_knowledge_base
from app.modules.integrations.whatsapp.whatsapp_service import send_whatsapp_text

router = APIRouter()


def extract_openwa_message(payload: dict) -> dict:
    message = payload.get("message") or payload.get("data") or payload

    text = (
        message.get("body")
        or message.get("text")
        or message.get("message")
        or message.get("content")
        or ""
    )

    phone = (
        message.get("from")
        or message.get("sender")
        or message.get("chatId")
        or message.get("fromNumber")
    )

    sender_name = (
        message.get("notifyName")
        or message.get("senderName")
        or message.get("pushName")
    )

    session_id = (
        payload.get("sessionId")
        or payload.get("session_id")
        or message.get("sessionId")
        or "default"
    )

    return {
        "text": text.strip(),
        "phone": phone,
        "sender_name": sender_name,
        "session_id": session_id,
    }


def build_reply(intent: str, action_result: dict, mood_data: dict) -> str:
    mood = mood_data.get("mood", "neutral")

    if intent == "create_task":
        return f"Done — I added this as a task. Mood noted as {mood}. I'll keep things calm and clear."

    if intent == "save_note":
        return f"Saved this into your knowledge base. Mood noted as {mood}."

    if intent == "ask_question":
        return action_result.get("answer", "I searched your Second Brain, but I could not find enough context.")

    return "Got it. I saved the context and I'm here to help."


@router.post("/webhook")
async def openwa_webhook(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    payload = await request.json()
    normalized = extract_openwa_message(payload)

    text = normalized["text"]
    phone = normalized["phone"]
    sender_name = normalized["sender_name"]
    session_id = normalized["session_id"]

    if not text:
        return {"ok": False, "reason": "empty_message"}

    user_id = current_user.id if current_user else None

    mood_data = detect_mood(text=text)
    save_mood_event(db=db, text=text, mood_data=mood_data, user_id=user_id)

    intent_data = classify_whatsapp_intent(text)
    intent = intent_data.get("intent", "general_chat")

    message_row = WhatsAppMessage(
        id=str(uuid4()),
        user_id=user_id,
        phone=phone,
        sender_name=sender_name,
        direction="inbound",
        message_text=text,
        detected_intent=intent,
        detected_mood=mood_data.get("mood", "neutral"),
        raw_payload=json.dumps(payload),
    )

    db.add(message_row)
    db.commit()
    db.refresh(message_row)

    action_result = {}

    if intent == "create_task":
        task = Task(
            id=str(uuid4()),
            user_id=user_id,
            title=intent_data.get("title") or text[:80],
            description=intent_data.get("description") or text,
            status="Todo",
            priority=intent_data.get("priority") or "Normal",
            due_date=intent_data.get("due_date"),
            source="whatsapp",
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        index_task_as_knowledge(db=db, task=task)

        message_row.created_task_id = task.id
        db.commit()

        action_result = {
            "task_id": task.id,
            "title": task.title,
        }

    elif intent == "save_note":
        item = index_knowledge_item(
            db=db,
            title=intent_data.get("title") or "WhatsApp note",
            raw_text=intent_data.get("description") or text,
            source_type="whatsapp",
            source_id=message_row.id,
            user_id=user_id,
        )

        message_row.created_knowledge_item_id = item.id
        db.commit()

        action_result = {
            "knowledge_item_id": item.id,
            "title": item.title,
        }

    elif intent == "ask_question":
        action_result = ask_knowledge_base(
            db=db,
            query=text,
            user_id=user_id,
        )

    else:
        item = index_knowledge_item(
            db=db,
            title="WhatsApp message",
            raw_text=text,
            source_type="whatsapp",
            source_id=message_row.id,
            user_id=user_id,
        )

        message_row.created_knowledge_item_id = item.id
        db.commit()

        action_result = {
            "knowledge_item_id": item.id,
        }

    reply = build_reply(
        intent=intent,
        action_result=action_result,
        mood_data=mood_data,
    )

    send_result = None

    if phone:
        try:
            send_result = await send_whatsapp_text(
                session_id=session_id,
                to=phone,
                text=reply,
            )
        except Exception as e:
            send_result = {
                "ok": False,
                "error": str(e),
            }

    return {
        "ok": True,
        "intent": intent,
        "mood": mood_data,
        "action_result": action_result,
        "reply": reply,
        "send_result": send_result,
    }
