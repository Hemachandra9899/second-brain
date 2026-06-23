from uuid import uuid4
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User, Task, NotionConnection, NotionTodoPage
from app.modules.chat.chat_schema import ChatRequest
from app.services.llm_nvidia import ask_llm, ask_fast
from app.modules.chat.chat_intent_service import classify_chat_intent
from app.modules.dreams.dream_service import run_dream, get_latest_dream
from app.modules.mood.mood_service import detect_mood, save_mood_event
from app.modules.integrations.notion.notion_oauth_service import (
    get_notion_connection,
    get_decrypted_token,
)
from app.modules.integrations.notion.notion_service import (
    create_notion_task,
    search_relevant_notion_pages,
    retrieve_page_blocks,
    blocks_to_text,
)
from app.modules.integrations.notion.notion_todo_service import (
    _get_access_token,
    create_notion_todo_page,
    create_todo_page_locally,
    create_todo_task_locally,
    get_todos_from_notion_page,
    update_notion_todo_block,
    update_notion_page_title,
    append_todos_to_notion_page,
)
from app.modules.tasks.date_utils import (
    resolve_task_date,
    should_filter_created_at,
    utc_day_range_for_created_at,
)
from app.modules.activity.activity_service import create_activity_event
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

    if intent["intent"] == "create_notion_todo_page":
        return _handle_create_notion_todo_page(db, message, intent, current_user)

    if intent["intent"] == "show_notion_todo_page":
        return _handle_show_notion_todo_page(db, message, intent, current_user)

    if intent["intent"] == "check_notion_todo":
        return _handle_check_notion_todo(db, message, intent, current_user)

    if intent["intent"] == "rename_notion_todo_page":
        return _handle_rename_notion_todo_page(db, message, intent, current_user)

    if intent["intent"] == "add_todos_to_notion_page":
        return _handle_add_todos_to_notion_page(db, message, intent, current_user)

    if intent["intent"] == "connect_existing_notion_page":
        return _handle_connect_existing_page(db, message, intent, current_user)

    if intent["intent"] == "create_notion_task":
        return _handle_create_notion_task(db, message, intent, current_user)

    if intent["intent"] == "query_notion_tasks" or (
        "@notion" in message.lower() and intent["intent"] != "create_notion_task"
    ):
        return _handle_notion_question(db, message, intent, current_user)

    if intent["intent"] == "create_task":
        return _handle_create_task(db, message, intent, current_user)

    if intent["intent"] in ("query_today_tasks", "query_notion_tasks"):
        return _handle_task_query(
            db=db,
            message=message,
            intent=intent,
            current_user=current_user,
            timezone=payload.timezone,
        )

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

    if intent["intent"] == "complete_task_request":
        return _handle_complete_task_request(db, message, intent, current_user)

    if intent["intent"] == "run_dream":
        return _handle_run_dream(db, current_user, mode="nightly")

    if intent["intent"] == "run_think_mode":
        return _handle_run_dream(db, current_user, mode="think")

    if intent["intent"] == "query_latest_dream":
        return _handle_query_latest_dream(db, current_user)

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
    timezone: str | None = "UTC",
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can create this task.",
            "intent": intent,
        }

    title = intent.get("title") or message[:80]
    description = intent.get("description") or message

    due_date = intent.get("due_date")
    if not due_date:
        try:
            due_date = resolve_task_date(message, timezone).isoformat()
        except Exception:
            due_date = None

    task = Task(
        id=str(uuid4()),
        user_id=current_user.id,
        title=title,
        description=description,
        status="Todo",
        priority=intent.get("priority") or "Normal",
        due_date=due_date,
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
    timezone: str | None = "UTC",
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can create this task in your Notion.",
            "intent": intent,
        }

    title = intent.get("title") or message[:80]
    description = intent.get("description") or message
    due_date = intent.get("due_date")
    if not due_date:
        try:
            due_date = resolve_task_date(message, timezone).isoformat()
        except Exception:
            due_date = None
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

    if not conn.default_database_id and not conn.default_data_source_id and not settings.notion_tasks_database_id:
        try:
            index_task_as_knowledge(db=db, task=task)
        except Exception:
            pass
        return {
            "answer": (
                "I created the task locally, but no Notion database is selected.\n\n"
                "Go to your profile → Integrations → Notion, and select a default database."
            ),
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
            database_id=conn.default_database_id or settings.notion_tasks_database_id,
            data_source_id=conn.default_data_source_id,
        )

        page_id = page.get("id")
        page_url = page.get("url")
        page_title = title

        if not page_id or not page_url:
            return {
                "answer": (
                    "I created the task locally, but Notion did not return a usable page URL. "
                    "Please check your Notion connection and selected database."
                ),
                "intent": intent,
                "task_id": task.id,
                "notion_page_id": page_id,
                "created_task": {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "due_date": task.due_date,
                },
            }

        task.notion_page_id = page_id
        db.commit()
        db.refresh(task)

    except Exception as exc:
        try:
            index_task_as_knowledge(db=db, task=task)
        except Exception:
            pass

        return {
            "answer": "I created the task locally, but could not create the Notion page.",
            "intent": intent,
            "task_id": task.id,
            "notion_error": str(exc),
            "notion_page": None,
            "created_task": {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
            },
        }

    try:
        index_task_as_knowledge(db=db, task=task)
    except Exception:
        pass

    try:
        create_activity_event(
            db,
            event_type="notion_page_created",
            title=page_title,
            description="Created a Notion page from chat",
            source_type="notion",
            source_id=page.get("id"),
            url=page.get("url"),
            metadata={
                "task_id": task.id,
                "notion_page_id": page.get("id"),
            },
            current_user=current_user,
        )
    except Exception:
        pass

    return {
        "answer": "Done — I created this in Notion and linked it to your Second Brain.",
        "intent": intent,
        "task_id": task.id,
        "notion_page_id": page_id,
        "notion_page": {
            "id": page_id,
            "title": page_title,
            "url": page_url,
        },
        "created_task": {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
        },
    }


def _handle_task_query(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
    timezone: str | None = "UTC",
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can check your tasks.",
            "intent": intent,
        }

    target_date = resolve_task_date(message, timezone)
    filter_created = should_filter_created_at(message)

    query = db.query(Task).filter(Task.user_id == current_user.id)

    if filter_created:
        start_utc, end_utc = utc_day_range_for_created_at(target_date, timezone)
        query = query.filter(Task.created_at >= start_utc).filter(
            Task.created_at < end_utc
        )
        label = f"tasks saved on {target_date.isoformat()}"
    else:
        query = query.filter(Task.due_date == target_date.isoformat())
        label = f"tasks due on {target_date.isoformat()}"

    tasks = query.order_by(Task.created_at.desc()).limit(50).all()

    if not tasks:
        return {
            "answer": f"I found no {label}.",
            "intent": intent,
            "tasks": [],
            "date": target_date.isoformat(),
            "date_filter_type": "created_at" if filter_created else "due_date",
        }

    lines = [
        f"- {'✅' if t.status == 'Done' else '☐'} {t.title}"
        + (f" ({t.priority})" if t.priority else "")
        for t in tasks
    ]

    return {
        "answer": f"Here are your {label}:\n" + "\n".join(lines),
        "intent": intent,
        "tasks": [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "notion_page_id": task.notion_page_id,
            }
            for task in tasks
        ],
        "date": target_date.isoformat(),
        "date_filter_type": "created_at" if filter_created else "due_date",
    }


def _handle_notion_question(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can read your Notion workspace.",
            "intent": intent,
        }

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {
            "answer": "Connect Notion first, then I can answer using your workspace.",
            "intent": intent,
        }

    access_token = get_decrypted_token(conn)

    try:
        pages = search_relevant_notion_pages(
            access_token=access_token,
            query=message.replace("/notion", "").replace("@notion", "").strip(),
            data_source_id=conn.default_data_source_id,
            database_id=conn.default_database_id or settings.notion_tasks_database_id,
        )

        context_parts = []
        for page in pages[:5]:
            blocks = retrieve_page_blocks(access_token, page["id"])
            text = blocks_to_text(blocks)
            if text:
                context_parts.append(f"Page: {page.get('url')}\n{text[:1200]}")

        if not context_parts:
            return {
                "answer": "I found Notion access, but no relevant page content matched that question.",
                "intent": intent,
            }

        context = "\n\n---\n\n".join(context_parts)

        answer = ask_fast(
            prompt=f"Question: {message}\n\nRelevant Notion context:\n{context}",
            system=(
                "Answer using only the provided Notion context. "
                "If the answer is not present, say what is missing. Keep it concise."
            ),
            max_tokens=800,
        )

        return {
            "answer": answer,
            "intent": intent,
            "notion_pages_used": len(context_parts),
        }

    except Exception as exc:
        return {
            "answer": f"I could not fetch Notion context yet. Reason: `{str(exc)}`",
            "intent": intent,
            "notion_error": str(exc),
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


def _handle_complete_task_request(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {
            "answer": "Please sign in first so I can update your tasks.",
            "intent": intent,
        }

    query = (
        message.lower()
        .replace("completed", "")
        .replace("complete", "")
        .replace("finished", "")
        .replace("done", "")
        .replace("mark", "")
        .replace("task", "")
        .strip()
    )

    task_query = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .filter(Task.status != "Done")
        .order_by(Task.created_at.desc())
    )

    if query:
        like = f"%{query}%"
        task_query = task_query.filter(
            (Task.title.ilike(like)) | (Task.description.ilike(like))
        )

    tasks = task_query.limit(5).all()

    if not tasks:
        return {
            "answer": "I could not find an open matching task. Try opening Tasks and marking it done manually.",
            "intent": intent,
            "task_choices": [],
        }

    return {
        "answer": "Which task should I mark as done?",
        "intent": intent,
        "task_choices": [
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
                "notion_page_id": task.notion_page_id,
            }
            for task in tasks
        ],
    }


def _handle_create_notion_todo_page(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first so I can create a todo page.", "intent": intent}

    title = intent.get("title") or "Todo List"

    lines = [line.strip().lstrip("- ").lstrip("* ").lstrip("0123456789.") for line in message.split("\n") if line.strip() and not line.strip().lower().startswith(("create ", "/create"))]
    todos = [l for l in lines if l and not l.startswith(("due", "priority", "status"))]

    if len(todos) <= 1:
        todos = [message[:80]]

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {"answer": "Connect Notion first so I can create a todo page there.", "intent": intent}

    data_source_id = conn.default_data_source_id
    if not data_source_id:
        return {"answer": "Select a default Notion database in your profile first.", "intent": intent, "task_id": None}

    access_token = get_decrypted_token(conn)

    try:
        notion_result = create_notion_todo_page(
            access_token=access_token,
            title=title,
            todos=todos,
            data_source_id=data_source_id,
        )
    except Exception as exc:
        return {"answer": f"I could not create the Notion page. Reason: {str(exc)}", "intent": intent}

    page = create_todo_page_locally(
        db=db,
        current_user=current_user,
        title=notion_result["title"],
        notion_page_id=notion_result["page_id"],
        notion_page_url=notion_result.get("page_url"),
        data_source_id=data_source_id,
    )

    tasks = []
    for todo in notion_result["todos"]:
        task = create_todo_task_locally(
            db=db,
            current_user=current_user,
            notion_page_id=page.notion_page_id,
            title=todo["text"],
            notion_block_id=todo["block_id"],
        )
        tasks.append(task)

    try:
        create_activity_event(
            db=db,
            event_type="notion_todo_page_created",
            title=title,
            description=f"Created todo page with {len(todos)} items",
            source_type="notion",
            source_id=notion_result["page_id"],
            url=notion_result.get("page_url"),
            metadata={"todo_page_id": page.id},
            current_user=current_user,
        )
    except Exception:
        pass

    return {
        "answer": f"I created '{title}' in Notion with {len(todos)} items.",
        "intent": intent,
        "notion_todo_page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "notion_todo_items": [
            {
                "id": task.id,
                "title": task.title,
                "checked": False,
                "notion_block_id": task.notion_block_id,
            }
            for task in tasks
        ],
    }


def _handle_show_notion_todo_page(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first so I can show your todo pages.", "intent": intent}

    title_hint = intent.get("title") or ""

    query = db.query(NotionTodoPage).filter(NotionTodoPage.user_id == current_user.id)
    if title_hint:
        query = query.filter(NotionTodoPage.title.ilike(f"%{title_hint}%"))
    page = query.order_by(NotionTodoPage.updated_at.desc()).first()

    if not page:
        if title_hint:
            return {"answer": f"I could not find a todo page named '{title_hint}'.", "intent": intent}
        return {"answer": "You have no todo pages yet. Create one with 'create todo list ...'", "intent": intent}

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {"answer": "Connect Notion to fetch the latest todos.", "intent": intent}

    access_token = get_decrypted_token(conn)

    try:
        todos = get_todos_from_notion_page(
            access_token=access_token,
            page_id=page.notion_page_id,
        )
    except Exception as exc:
        return {"answer": f"Could not fetch todos from Notion. Reason: {str(exc)}", "intent": intent}

    lines = "\n".join(f"{'☑' if t['checked'] else '☐'} {t['text']}" for t in todos)
    return {
        "answer": f"**{page.title}**\n\n{lines}",
        "intent": intent,
        "notion_todo_page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "notion_todo_items": todos,
    }


def _handle_check_notion_todo(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first.", "intent": intent}

    text = message.lower().replace("mark", "").replace("done", "").replace("complete", "").replace("checked", "").strip()
    task_title = text.split(" in ")[0].strip() if " in " in text else text
    page_name = text.split(" in ")[-1].strip() if " in " in text else ""

    page_query = db.query(NotionTodoPage).filter(NotionTodoPage.user_id == current_user.id)
    if page_name:
        page_query = page_query.filter(NotionTodoPage.title.ilike(f"%{page_name}%"))
    page = page_query.first()

    if not page:
        return {"answer": f"Could not find todo page '{page_name}'.", "intent": intent}

    task = (
        db.query(Task)
        .filter(
            Task.notion_block_id.isnot(None),
            Task.notion_page_id == page.id,
            Task.title.ilike(f"%{task_title}%"),
            Task.user_id == current_user.id,
        )
        .first()
    )

    if not task or not task.notion_block_id:
        return {"answer": f"Could not find '{task_title}' in {page.title}.", "intent": intent}

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {"answer": "Connect Notion to update todos.", "intent": intent}

    access_token = get_decrypted_token(conn)

    try:
        update_notion_todo_block(
            access_token=access_token,
            block_id=task.notion_block_id,
            checked=True,
        )
    except Exception as exc:
        return {"answer": f"Could not update the todo. Reason: {str(exc)}", "intent": intent}

    task.status = "Done"
    db.commit()

    return {
        "answer": f"Marked '{task.title}' as done in {page.title}.",
        "intent": intent,
        "checked_block_id": task.notion_block_id,
    }


def _handle_rename_notion_todo_page(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first.", "intent": intent}

    parts = message.lower().split(" to ")
    old_name_hint = parts[0].replace("rename", "").strip() if len(parts) > 1 else ""
    new_title = parts[1].strip() if len(parts) > 1 else ""

    if not new_title:
        return {"answer": "Tell me the new name. For example: rename Weekend Plan to Saturday Plan", "intent": intent}

    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.user_id == current_user.id,
            NotionTodoPage.title.ilike(f"%{old_name_hint}%"),
        )
        .first()
    )

    if not page:
        return {"answer": f"Could not find a todo page named '{old_name_hint}'.", "intent": intent}

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {"answer": "Connect Notion to rename the page.", "intent": intent}

    access_token = get_decrypted_token(conn)

    try:
        update_notion_page_title(
            access_token=access_token,
            page_id=page.notion_page_id,
            data_source_id=page.data_source_id,
            new_title=new_title,
        )
    except Exception as exc:
        return {"answer": f"Could not rename the page. Reason: {str(exc)}", "intent": intent}

    page.title = new_title
    db.commit()

    return {
        "answer": f"Renamed '{old_name_hint}' to '{new_title}'.",
        "intent": intent,
        "notion_todo_page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
    }


def _handle_add_todos_to_notion_page(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first.", "intent": intent}

    lines = [line.strip().lstrip("- ").lstrip("* ").lstrip("0123456789.") for line in message.split("\n")]
    lines = [l for l in lines if l and not l.lower().startswith(("add ", "put ", "append "))]

    parts = message.lower().split(" to ")
    page_name = parts[-1].strip() if len(parts) > 1 else ""
    if not page_name:
        page_name = lines[-1] if lines else ""
        todos = lines[:-1] if len(lines) > 1 else lines
    else:
        todos = lines

    if not todos:
        return {"answer": "What todos should I add?", "intent": intent}

    page = (
        db.query(NotionTodoPage)
        .filter(
            NotionTodoPage.user_id == current_user.id,
            NotionTodoPage.title.ilike(f"%{page_name}%"),
        )
        .first()
    )

    if not page:
        return {"answer": f"Could not find todo page '{page_name}'.", "intent": intent}

    conn = get_notion_connection(db, current_user)
    if not conn:
        return {"answer": "Connect Notion to add todos.", "intent": intent}

    access_token = get_decrypted_token(conn)

    try:
        new_blocks = append_todos_to_notion_page(
            access_token=access_token,
            page_id=page.notion_page_id,
            todos=todos,
        )
    except Exception as exc:
        return {"answer": f"Could not add todos. Reason: {str(exc)}", "intent": intent}

    tasks = []
    for block in new_blocks:
        task = create_todo_task_locally(
            db=db,
            current_user=current_user,
            notion_page_id=page.notion_page_id,
            title=block["text"],
            notion_block_id=block["block_id"],
        )
        tasks.append(task)

    return {
        "answer": f"Added {len(tasks)} todo(s) to {page.title}.",
        "intent": intent,
        "notion_todo_page": {
            "id": page.id,
            "title": page.title,
            "notion_page_id": page.notion_page_id,
            "url": page.notion_page_url,
        },
        "notion_todo_items": [
            {
                "id": task.id,
                "title": task.title,
                "checked": False,
                "notion_block_id": task.notion_block_id,
            }
            for task in tasks
        ],
    }


def _handle_connect_existing_page(
    db: Session,
    message: str,
    intent: dict,
    current_user: User | None,
) -> dict:
    return {
        "answer": "To connect an existing Notion page, use the 'Connect existing page' option in settings, or provide the page URL and database.",
        "intent": intent,
    }


def _handle_run_dream(
    db: Session,
    current_user: User | None,
    mode: str = "nightly",
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first so I can run Dream Mode.", "intent": {"intent": f"run_{mode}_mode"}}

    try:
        dream = run_dream(db=db, current_user=current_user, mode=mode)
        return {
            "answer": f"**{dream['title']}**\n\n{dream['summary']}",
            "intent": {"intent": f"run_{mode}_mode"},
            "dream": dream,
        }
    except Exception as exc:
        return {"answer": f"Could not run Dream Mode: {str(exc)}", "intent": {"intent": f"run_{mode}_mode"}}


def _handle_query_latest_dream(
    db: Session,
    current_user: User | None,
) -> dict:
    if not current_user:
        return {"answer": "Please sign in first.", "intent": {"intent": "query_latest_dream"}}

    dream = get_latest_dream(db=db, current_user=current_user)
    if not dream:
        return {
            "answer": "You haven\u2019t run Dream Mode yet. Try saying \u2018run dream\u2019 or \u2018think mode\u2019.",
            "intent": {"intent": "query_latest_dream"},
        }

    return {
        "answer": f"**{dream['title']}**\n\n{dream['summary']}",
        "intent": {"intent": "query_latest_dream"},
        "dream": dream,
    }
