from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import KnowledgeItem, MemoryCard, Task, User
from app.services.llm_nvidia import ask_fast

try:
    from app.models import WritingDocument
except Exception:
    WritingDocument = None


def infer_source_hint(query: str, source_hint: str | None = None) -> str:
    if source_hint:
        return source_hint

    text = query.lower()

    if "@notion" in text or text.startswith("/notion"):
        return "notion"

    if "@tasks" in text or text.startswith("/today") or text.startswith("/task"):
        return "tasks"

    if "@writing" in text or text.startswith("/write"):
        return "writing"

    if "@memory" in text or text.startswith("/memory"):
        return "memory"

    return "all"


def clean_query(query: str) -> str:
    return (
        query.replace("@notion", "")
        .replace("@memory", "")
        .replace("@tasks", "")
        .replace("@writing", "")
        .replace("/notion", "")
        .replace("/memory", "")
        .replace("/today", "")
        .replace("/task", "")
        .replace("/write", "")
        .strip()
    )


def _like_query(query: str) -> str:
    words = [w.strip() for w in query.split() if len(w.strip()) >= 3]
    if not words:
        return f"%{query}%"
    return "%" + "%".join(words[:4]) + "%"


def search_tasks(db: Session, user_id: str, query: str, limit: int = 8) -> list[dict]:
    like = _like_query(query)

    rows = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(
            or_(
                Task.title.ilike(like),
                Task.description.ilike(like),
                Task.status.ilike(like),
                Task.priority.ilike(like),
                Task.due_date.ilike(like),
            )
        )
        .order_by(Task.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "title": task.title,
            "type": "task",
            "id": task.id,
            "url": None,
            "preview": f"{task.status or 'Todo'} · {task.priority or 'Normal'} · {task.description or ''}"[:500],
            "content": f"Task: {task.title}\nStatus: {task.status}\nPriority: {task.priority}\nDue: {task.due_date}\nDescription: {task.description or ''}",
        }
        for task in rows
    ]


def search_memory(db: Session, user_id: str, query: str, limit: int = 8) -> list[dict]:
    like = _like_query(query)

    rows = (
        db.query(MemoryCard)
        .filter(MemoryCard.user_id == user_id)
        .filter(
            or_(
                MemoryCard.title.ilike(like),
                MemoryCard.summary.ilike(like),
                MemoryCard.tags.ilike(like),
            )
        )
        .order_by(MemoryCard.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "title": card.title,
            "type": "memory",
            "id": card.id,
            "url": None,
            "preview": card.summary[:500],
            "content": f"Memory: {card.title}\n{card.summary}",
        }
        for card in rows
    ]


def search_knowledge(db: Session, user_id: str, query: str, limit: int = 8) -> list[dict]:
    like = _like_query(query)

    rows = (
        db.query(KnowledgeItem)
        .filter(KnowledgeItem.user_id == user_id)
        .filter(
            or_(
                KnowledgeItem.title.ilike(like),
                KnowledgeItem.raw_text.ilike(like),
                KnowledgeItem.source_type.ilike(like),
            )
        )
        .order_by(KnowledgeItem.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "title": item.title,
            "type": item.source_type or "knowledge",
            "id": item.id,
            "url": None,
            "preview": item.raw_text[:500],
            "content": f"Knowledge: {item.title}\nSource: {item.source_type}\n{item.raw_text[:1500]}",
        }
        for item in rows
    ]


def search_writing(db: Session, user_id: str, query: str, limit: int = 8) -> list[dict]:
    if WritingDocument is None:
        return []

    like = _like_query(query)

    rows = (
        db.query(WritingDocument)
        .filter(WritingDocument.user_id == user_id)
        .filter(
            or_(
                WritingDocument.title.ilike(like),
                WritingDocument.raw_text.ilike(like),
                WritingDocument.cleaned_markdown.ilike(like),
            )
        )
        .order_by(WritingDocument.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "title": doc.title,
            "type": "writing",
            "id": doc.id,
            "url": f"/writing/{doc.id}",
            "preview": (doc.cleaned_markdown or doc.raw_text)[:500],
            "content": f"Writing: {doc.title}\n{(doc.cleaned_markdown or doc.raw_text)[:1800]}",
        }
        for doc in rows
    ]


def search_notion_context(
    db: Session,
    user: User,
    query: str,
    limit: int = 5,
) -> list[dict]:
    try:
        from app.modules.integrations.notion.notion_oauth_service import (
            get_decrypted_token,
            get_notion_connection,
        )
        from app.modules.integrations.notion.notion_service import (
            blocks_to_text,
            retrieve_page_blocks,
            search_relevant_notion_pages,
        )

        conn = get_notion_connection(db, user)
        if not conn:
            return []

        access_token = get_decrypted_token(conn)

        pages = search_relevant_notion_pages(
            access_token=access_token,
            query=query,
            data_source_id=getattr(conn, "default_data_source_id", None),
            database_id=getattr(conn, "default_database_id", None) or settings.notion_tasks_database_id,
        )

        sources = []

        for page in pages[:limit]:
            page_id = page.get("id")
            if not page_id:
                continue

            blocks = retrieve_page_blocks(access_token, page_id)
            text = blocks_to_text(blocks)

            title = extract_notion_page_title(page) or "Notion page"
            url = page.get("url")

            sources.append(
                {
                    "title": title,
                    "type": "notion",
                    "id": page_id,
                    "url": url,
                    "preview": text[:500],
                    "content": f"Notion page: {title}\nURL: {url}\n{text[:1800]}",
                }
            )

        return sources

    except Exception as exc:
        return [
            {
                "title": "Notion fetch failed",
                "type": "error",
                "id": None,
                "url": None,
                "preview": str(exc),
                "content": f"Notion fetch failed: {str(exc)}",
            }
        ]


def extract_notion_page_title(page: dict) -> str | None:
    properties = page.get("properties") or {}

    for _, prop in properties.items():
        if prop.get("type") == "title":
            title_items = prop.get("title") or []
            if title_items:
                return title_items[0].get("plain_text")

    title_items = page.get("title") or []
    if title_items:
        return title_items[0].get("plain_text")

    return None


def dedupe_sources(sources: list[dict]) -> list[dict]:
    seen = set()
    deduped = []

    for source in sources:
        key = f"{source.get('type')}:{source.get('id')}:{source.get('title')}"
        if key in seen:
            continue
        seen.add(key)
        deduped.append(source)

    return deduped


def build_context(sources: list[dict], max_sources: int = 10) -> str:
    chunks = []

    for index, source in enumerate(sources[:max_sources], start=1):
        chunks.append(
            f"[Source {index}]\n"
            f"Title: {source.get('title')}\n"
            f"Type: {source.get('type')}\n"
            f"URL: {source.get('url') or ''}\n"
            f"Content:\n{source.get('content') or source.get('preview') or ''}"
        )

    return "\n\n---\n\n".join(chunks)


def ask_brain(
    db: Session,
    *,
    query: str,
    current_user: User,
    source_hint: str | None = None,
) -> dict:
    hint = infer_source_hint(query, source_hint)
    cleaned_query = clean_query(query)

    sources: list[dict] = []

    if hint in ("tasks", "all"):
        sources.extend(search_tasks(db, current_user.id, cleaned_query))

    if hint in ("writing", "memory", "all"):
        sources.extend(search_writing(db, current_user.id, cleaned_query))

    if hint in ("memory", "all"):
        sources.extend(search_memory(db, current_user.id, cleaned_query))
        sources.extend(search_knowledge(db, current_user.id, cleaned_query))

    if hint == "notion":
        sources.extend(search_notion_context(db, current_user, cleaned_query))

    sources = dedupe_sources(sources)

    if not sources and hint in ("all", "memory"):
        sources.extend(search_writing(db, current_user.id, "", limit=5))
        sources.extend(search_tasks(db, current_user.id, "", limit=5))
        sources.extend(search_memory(db, current_user.id, "", limit=5))
        sources = dedupe_sources(sources)

    if not sources:
        return {
            "answer": "I could not find relevant memory for that yet. Try saving a writing block, task, or Notion page first.",
            "sources": [],
        }

    context = build_context(sources)

    answer = ask_fast(
        prompt=f"""
Question:
{cleaned_query}

Retrieved context:
{context}
""".strip(),
        system=(
            "You are Second Brain. Answer using only the retrieved context. "
            "Be concise, practical, and mention uncertainty if context is incomplete. "
            "Do not invent facts. If helpful, refer to source titles naturally."
        ),
        max_tokens=800,
    )

    return {
        "answer": answer,
        "sources": [
            {
                "title": source.get("title"),
                "type": source.get("type"),
                "id": source.get("id"),
                "url": source.get("url"),
                "preview": source.get("preview"),
            }
            for source in sources[:8]
            if source.get("type") != "error"
        ],
    }
