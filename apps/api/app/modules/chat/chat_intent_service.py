import re

from app.services.llm_nvidia import ask_json_fast


_SIMPLE_GREETINGS = {
    "hi", "hello", "hey", "yo", "gm", "good morning",
    "good evening", "sup", "hi there", "hey there",
}


def is_simple_greeting(message: str) -> bool:
    return message.strip().lower() in _SIMPLE_GREETINGS


def _rule_based_intent(message: str) -> dict | None:
    """Fast rule-based classification — avoids LLM call for common patterns."""
    text = message.strip().lower()

    if is_simple_greeting(message):
        return {
            "intent": "greeting",
            "title": None,
            "description": None,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": False,
            "needs_graphrag": False,
        }

    if text.startswith("/notion") or "@notion" in text:
        if re.search(r"(what|show|list|get|today|all)", text):
            return {
                "intent": "query_notion_tasks",
                "title": None,
                "description": text,
                "priority": "Normal",
                "due_date": None,
                "needs_notion": True,
                "needs_graphrag": False,
            }
        return {
            "intent": "create_notion_task",
            "title": _extract_title_after_slash(text, "notion"),
            "description": text,
            "priority": "Normal",
            "due_date": _extract_due_date(text),
            "needs_notion": True,
            "needs_graphrag": False,
        }

    if text.startswith("/today"):
        return {
            "intent": "query_today_tasks",
            "title": None,
            "description": text,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": False,
            "needs_graphrag": False,
        }

    if text.startswith("/task"):
        return {
            "intent": "create_task",
            "title": _extract_title_after_slash(text, "task"),
            "description": text,
            "priority": "Normal",
            "due_date": _extract_due_date(text),
            "needs_notion": False,
            "needs_graphrag": False,
        }

    if text.startswith("/memory") or "@memory" in text:
        return {
            "intent": "knowledge_question",
            "title": None,
            "description": text,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": False,
            "needs_graphrag": True,
        }

    if re.search(r"\b(done|completed|complete|finished|mark.*done)\b", text):
        return {
            "intent": "complete_task_request",
            "title": text,
            "description": text,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": True,
            "needs_graphrag": False,
        }

    if text.startswith("/"):
        return {
            "intent": "general_chat",
            "title": None,
            "description": text,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": False,
            "needs_graphrag": False,
        }

    return None


def _extract_title_after_slash(text: str, command: str) -> str | None:
    pattern = rf"^/{command}\s+(create|add|make|new)?\s*(.*)"
    m = re.match(pattern, text)
    if m:
        raw = m.group(2).strip()
        if raw and not raw.startswith("due"):
            parts = re.split(r"\s+(due|by|for)\s+", raw, maxsplit=1)
            return parts[0].strip()[:120] or None
    return None


def _extract_due_date(text: str) -> str | None:
    m = re.search(
        r"(due|by|for)\s+(tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
        r"\d{4}-\d{2}-\d{2})",
        text,
        re.IGNORECASE,
    )
    if m:
        raw = m.group(2).lower()
        from datetime import date, timedelta

        today = date.today()
        if raw == "today":
            return today.isoformat()
        if raw == "tomorrow":
            return (today + timedelta(days=1)).isoformat()
        if raw == "next week":
            return (today + timedelta(weeks=1)).isoformat()

        days_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2,
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
        }
        if raw in days_map:
            target = days_map[raw]
            days_ahead = (target - today.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            return (today + timedelta(days=days_ahead)).isoformat()

        return raw
    return None


def classify_chat_intent(message: str) -> dict:
    rule_based = _rule_based_intent(message)
    if rule_based is not None:
        return rule_based

    prompt = f"""
Classify this Second Brain chat message.

Return strict JSON only:
{{
  "intent": "greeting|create_task|create_notion_task|query_today_tasks|query_notion_tasks|complete_task_request|capture_note|knowledge_question|general_chat",
  "title": "short title or null",
  "description": "description or null",
  "priority": "Low|Normal|High",
  "due_date": "YYYY-MM-DD or null",
  "needs_notion": true/false,
  "needs_graphrag": true/false
}}

Rules:
- If user asks to add/create/put a task in Notion, use create_notion_task.
- If user asks what tasks are today, use query_today_tasks.
- If user asks what is in Notion, use query_notion_tasks.
- If user asks about memories/knowledge/projects, use knowledge_question.
- If user gives a note/idea to save, use capture_note.
- If casual, use general_chat.

Message:
{message}
""".strip()

    return ask_json_fast(
        prompt=prompt,
        system="You classify chat messages for a Second Brain app. Return JSON only.",
        fallback={
            "intent": "general_chat",
            "title": None,
            "description": message,
            "priority": "Normal",
            "due_date": None,
            "needs_notion": False,
            "needs_graphrag": False,
        },
    )
