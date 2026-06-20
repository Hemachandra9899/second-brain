from app.services.llm_nvidia import ask_json_fast


def is_simple_greeting(message: str) -> bool:
    text = message.strip().lower()
    return text in {
        "hi",
        "hello",
        "hey",
        "yo",
        "gm",
        "good morning",
        "good evening",
        "sup",
        "hi there",
        "hey there",
    }


def classify_chat_intent(message: str) -> dict:
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

    prompt = f"""
Classify this Second Brain chat message.

Return strict JSON only:
{{
  "intent": "greeting|create_task|create_notion_task|query_today_tasks|query_notion_tasks|capture_note|knowledge_question|general_chat",
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
