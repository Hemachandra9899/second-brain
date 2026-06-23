import json
import re
from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models import (
    ActivityEvent,
    BrainItem,
    Dream,
    ImportJob,
    MemoryCard,
    NotionTodoPage,
    Task,
    User,
    WritingDocument,
)
from app.services.llm_nvidia import ask_deep


def _clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _tokens(query: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-zA-Z0-9]+", query.lower())
        if len(token) > 1
    ]


def _serialize_item(item: BrainItem, score: float | None = None) -> dict:
    data = {
        "id": item.id,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "source_url": item.source_url,
        "title": item.title,
        "preview": _clean(item.body)[:360],
        "tags": item.tags,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }

    if score is not None:
        data["score"] = score

    return data


def _score_item(item: BrainItem, query: str) -> float:
    query_clean = query.lower().strip()
    tokens = _tokens(query)

    if not query_clean:
        return 1.0

    title = (item.title or "").lower()
    body = (item.body or "").lower()
    tags = (item.tags or "").lower()

    score = 0.0

    if query_clean in title:
        score += 20
    if query_clean in body:
        score += 8
    if query_clean in tags:
        score += 10

    for token in tokens:
        if token in title:
            score += 6
        if token in tags:
            score += 4
        if token in body:
            score += 1

    return score


def _add_item(
    db: Session,
    *,
    user_id: str,
    source_type: str,
    source_id: str,
    title: str,
    body: str,
    source_url: str | None = None,
    tags: str | None = None,
):
    item = BrainItem(
        user_id=user_id,
        source_type=source_type,
        source_id=source_id,
        source_url=source_url,
        title=_clean(title)[:500] or "Untitled",
        body=_clean(body) or _clean(title) or "Empty item",
        tags=tags,
    )

    db.add(item)
    return item


def rebuild_local_brain(
    db: Session,
    *,
    current_user: User,
) -> dict:
    user_id = current_user.id

    db.query(BrainItem).filter(BrainItem.user_id == user_id).delete(
        synchronize_session=False
    )

    count_by_type: dict[str, int] = {}

    def bump(source_type: str):
        count_by_type[source_type] = count_by_type.get(source_type, 0) + 1

    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    for task in tasks:
        body = f"""
Task: {task.title}
Description: {task.description or ""}
Status: {task.status}
Priority: {task.priority}
Due date: {task.due_date or "none"}
Source: {task.source}
Notion page: {task.notion_page_id or "none"}
Notion block: {task.notion_block_id or "none"}
""".strip()

        _add_item(
            db,
            user_id=user_id,
            source_type="task",
            source_id=task.id,
            title=task.title,
            body=body,
            tags=f"task,{task.status},{task.priority},{task.due_date or ''}",
        )
        bump("task")

    memories = db.query(MemoryCard).filter(MemoryCard.user_id == user_id).all()
    for memory in memories:
        _add_item(
            db,
            user_id=user_id,
            source_type="memory",
            source_id=memory.id,
            title=memory.title,
            body=memory.summary,
            tags=memory.tags,
        )
        bump("memory")

    writings = db.query(WritingDocument).filter(WritingDocument.user_id == user_id).all()
    for doc in writings:
        _add_item(
            db,
            user_id=user_id,
            source_type="writing",
            source_id=doc.id,
            title=doc.title,
            body=doc.cleaned_markdown or doc.raw_text,
            tags=doc.source_type,
        )
        bump("writing")

    notion_pages = (
        db.query(NotionTodoPage).filter(NotionTodoPage.user_id == user_id).all()
    )
    for page in notion_pages:
        body = f"""
Notion todo page: {page.title}
URL: {page.notion_page_url or ""}
Notion page ID: {page.notion_page_id}
""".strip()

        _add_item(
            db,
            user_id=user_id,
            source_type="notion",
            source_id=page.notion_page_id,
            source_url=page.notion_page_url,
            title=page.title,
            body=body,
            tags="notion,todo,page",
        )
        bump("notion")

    dreams = db.query(Dream).filter(Dream.user_id == user_id).all()
    for dream in dreams:
        body = f"""
Dream: {dream.title}
Summary: {dream.summary}
Patterns: {dream.patterns_json or ""}
Forgotten items: {dream.forgotten_items_json or ""}
Suggested actions: {dream.suggested_actions_json or ""}
Tomorrow plan: {dream.tomorrow_plan_json or ""}
""".strip()

        _add_item(
            db,
            user_id=user_id,
            source_type="dream",
            source_id=dream.id,
            title=dream.title,
            body=body,
            tags=f"dream,{dream.dream_type}",
        )
        bump("dream")

    activity = db.query(ActivityEvent).filter(ActivityEvent.user_id == user_id).all()
    for event in activity:
        body = f"""
Activity: {event.title}
Description: {event.description or ""}
Event type: {event.event_type}
Source type: {event.source_type or ""}
URL: {event.url or ""}
Metadata: {event.metadata_json or ""}
""".strip()

        _add_item(
            db,
            user_id=user_id,
            source_type="activity",
            source_id=event.id,
            source_url=event.url,
            title=event.title,
            body=body,
            tags=event.event_type,
        )
        bump("activity")

    db.commit()

    total = sum(count_by_type.values())

    return {
        "ok": True,
        "indexed": total,
        "count_by_type": count_by_type,
    }


def search_local_brain(
    db: Session,
    *,
    current_user: User,
    query: str,
    source_type: str | None = None,
    limit: int = 12,
) -> dict:
    item_query = db.query(BrainItem).filter(BrainItem.user_id == current_user.id)

    if source_type and source_type != "all":
        item_query = item_query.filter(BrainItem.source_type == source_type)

    items = item_query.order_by(BrainItem.updated_at.desc()).limit(1000).all()

    scored = []

    for item in items:
        score = _score_item(item, query)

        if score > 0 or not query.strip():
            scored.append((score, item))

    scored.sort(key=lambda pair: pair[0], reverse=True)

    results = [
        _serialize_item(item, score=score)
        for score, item in scored[: max(1, min(limit, 50))]
    ]

    return {
        "query": query,
        "source_type": source_type or "all",
        "results": results,
        "count": len(results),
    }


def think_local_brain(
    db: Session,
    *,
    current_user: User,
    query: str,
) -> dict:
    search = search_local_brain(
        db=db,
        current_user=current_user,
        query=query,
        limit=16,
    )

    sources = search["results"]

    if not sources:
        return {
            "answer": "I could not find anything in your local brain for that yet.",
            "sources": [],
            "gaps": [
                "No matching local BrainItems found.",
                "Try rebuilding the local brain index or saving more notes/tasks.",
            ],
        }

    context = json.dumps(sources, ensure_ascii=False, indent=2)

    answer = ask_deep(
        prompt=f"""
User question:
{query}

Local Second Brain sources:
{context}

Answer using only these local sources.

Return:
1. Direct answer
2. Sources used
3. Gaps / missing information
4. One next action
""".strip(),
        system=(
            "You are Second Brain Think Mode. "
            "Use only the local sources provided. "
            "Do not invent facts. "
            "Be concise and useful."
        ),
        max_tokens=1200,
    )

    if answer.startswith("AI provider"):
        top = sources[0]
        answer = (
            f"I found this in your local brain: {top['title']}.\n\n"
            f"{top['preview']}\n\n"
            "AI synthesis is unavailable right now, but local search is working."
        )

    gaps = []

    if len(sources) < 3:
        gaps.append("Only a few matching local sources were found.")

    source_types = {source["source_type"] for source in sources}

    if "task" not in source_types:
        gaps.append("No matching tasks found.")
    if "memory" not in source_types:
        gaps.append("No matching memories found.")
    if "notion" not in source_types:
        gaps.append("No matching Notion-linked pages found.")

    return {
        "answer": answer,
        "sources": sources,
        "gaps": gaps,
    }


def get_local_brain_health(
    db: Session,
    *,
    current_user: User,
) -> dict:
    user_id = current_user.id

    item_count = db.query(BrainItem).filter(BrainItem.user_id == user_id).count()

    open_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .count()
    )

    tasks_without_due_date = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(Task.status != "Done")
        .filter(Task.due_date.is_(None))
        .count()
    )

    failed_imports = (
        db.query(ImportJob)
        .filter(ImportJob.user_id == user_id)
        .filter(ImportJob.status == "failed")
        .count()
    )

    latest_dream = (
        db.query(Dream)
        .filter(Dream.user_id == user_id)
        .order_by(Dream.created_at.desc())
        .first()
    )

    issues = []

    if item_count == 0:
        issues.append("Local brain index is empty. Rebuild it.")

    if tasks_without_due_date > 0:
        issues.append(f"{tasks_without_due_date} open tasks do not have due dates.")

    if failed_imports > 0:
        issues.append(f"{failed_imports} import jobs failed.")

    if not latest_dream:
        issues.append("Dream Mode has not run yet.")

    score = 100
    score -= min(tasks_without_due_date, 10) * 3
    score -= failed_imports * 10
    score -= 20 if item_count == 0 else 0
    score -= 10 if not latest_dream else 0
    score = max(0, min(100, score))

    return {
        "score": score,
        "item_count": item_count,
        "open_tasks": open_tasks,
        "tasks_without_due_date": tasks_without_due_date,
        "failed_imports": failed_imports,
        "latest_dream_at": latest_dream.created_at.isoformat() if latest_dream else None,
        "issues": issues,
    }
