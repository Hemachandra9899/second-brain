import json
from app.services.llm_nvidia import ask_llm


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
        "intent": "general_chat",
        "title": None,
        "description": text,
        "due_date": None,
        "priority": "Normal",
    }


def classify_whatsapp_intent(message: str) -> dict:
    prompt = f"""
Classify this WhatsApp message for a Second Brain app.

Return strict JSON only:
{{
  "intent": "create_task|save_note|ask_question|general_chat",
  "title": "short title or null",
  "description": "clean description",
  "due_date": "YYYY-MM-DD or null",
  "priority": "Low|Normal|High",
  "should_sync_to_notion": true
}}

Rules:
- If user says "add task", "remind me", "todo", "need to", use create_task.
- If user sends an idea, link, meeting note, or memory, use save_note.
- If user asks "what", "how", "when", "summarize", use ask_question.
- If unsure, use general_chat.
- Do not invent exact dates unless clearly stated.
- Keep title short.

Message:
{message}
""".strip()

    result = ask_llm(
        prompt,
        system="You classify WhatsApp messages into app actions. Return valid JSON only.",
    )

    return _safe_json_loads(result)
