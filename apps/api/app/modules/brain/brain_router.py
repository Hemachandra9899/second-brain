import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import (
    ActivityEvent,
    Dream,
    MemoryCard,
    NotionTodoPage,
    Task,
    User,
    WritingDocument,
)
from app.modules.brain.brain_schema import BrainAskRequest
from app.modules.brain.brain_service import ask_brain
from app.services.llm_nvidia import ask_deep

router = APIRouter()


class BrainThinkRequest(BaseModel):
    query: str


def _preview(text: str | None, n: int = 260) -> str:
    return (text or "").replace("\n", " ").strip()[:n]


def _node(id: str, label: str, type: str, subtitle: str | None = None):
    return {
        "id": id,
        "label": label,
        "type": type,
        "subtitle": subtitle,
    }


def _edge(source: str, target: str, label: str):
    return {
        "source": source,
        "target": target,
        "label": label,
    }


@router.get("/map")
def get_brain_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    user_id = current_user.id

    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .limit(30)
        .all()
    )

    memories = (
        db.query(MemoryCard)
        .filter(MemoryCard.user_id == user_id)
        .order_by(MemoryCard.created_at.desc())
        .limit(20)
        .all()
    )

    writings = (
        db.query(WritingDocument)
        .filter(WritingDocument.user_id == user_id)
        .order_by(WritingDocument.created_at.desc())
        .limit(15)
        .all()
    )

    notion_pages = (
        db.query(NotionTodoPage)
        .filter(NotionTodoPage.user_id == user_id)
        .order_by(NotionTodoPage.created_at.desc())
        .limit(15)
        .all()
    )

    dreams = (
        db.query(Dream)
        .filter(Dream.user_id == user_id)
        .order_by(Dream.created_at.desc())
        .limit(5)
        .all()
    )

    nodes = [
        _node("brain:user", "You", "brain", "Your Second Brain"),
        _node("hub:tasks", "Tasks", "hub"),
        _node("hub:memory", "Memory", "hub"),
        _node("hub:notion", "Notion", "hub"),
        _node("hub:dreams", "Dreams", "hub"),
        _node("hub:writing", "Writing", "hub"),
    ]

    edges = [
        _edge("brain:user", "hub:tasks", "contains"),
        _edge("brain:user", "hub:memory", "contains"),
        _edge("brain:user", "hub:notion", "contains"),
        _edge("brain:user", "hub:dreams", "contains"),
        _edge("brain:user", "hub:writing", "contains"),
    ]

    for task in tasks:
        task_id = f"task:{task.id}"
        nodes.append(
            _node(
                task_id,
                task.title,
                "task",
                f"{task.status} · due {task.due_date or 'none'}",
            )
        )
        edges.append(_edge("hub:tasks", task_id, "task"))

        if task.notion_page_id:
            notion_id = f"notion-page:{task.notion_page_id}"
            edges.append(_edge(task_id, notion_id, "linked_to_notion"))

    for memory in memories:
        memory_id = f"memory:{memory.id}"
        nodes.append(
            _node(
                memory_id,
                memory.title,
                "memory",
                _preview(memory.summary, 120),
            )
        )
        edges.append(_edge("hub:memory", memory_id, "memory"))

    for doc in writings:
        doc_id = f"writing:{doc.id}"
        nodes.append(
            _node(
                doc_id,
                doc.title,
                "writing",
                _preview(doc.cleaned_markdown or doc.raw_text, 120),
            )
        )
        edges.append(_edge("hub:writing", doc_id, "writing"))

        if doc.notion_page_id:
            notion_id = f"notion-page:{doc.notion_page_id}"
            edges.append(_edge(doc_id, notion_id, "synced_to_notion"))

    for page in notion_pages:
        page_id = f"notion-page:{page.notion_page_id}"
        nodes.append(
            _node(
                page_id,
                page.title,
                "notion",
                page.notion_page_url,
            )
        )
        edges.append(_edge("hub:notion", page_id, "notion_page"))

    for dream in dreams:
        dream_id = f"dream:{dream.id}"
        nodes.append(
            _node(
                dream_id,
                dream.title,
                "dream",
                _preview(dream.summary, 120),
            )
        )
        edges.append(_edge("hub:dreams", dream_id, "dream"))

        related = {}
        try:
            related = json.loads(dream.related_ids_json or "{}")
        except Exception:
            related = {}

        for task_id in related.get("task_ids", [])[:8]:
            edges.append(_edge(dream_id, f"task:{task_id}", "noticed"))

        for memory_id in related.get("memory_ids", [])[:8]:
            edges.append(_edge(dream_id, f"memory:{memory_id}", "connected"))

    return {
        "nodes": nodes,
        "edges": edges,
        "counts": {
            "tasks": len(tasks),
            "memories": len(memories),
            "writings": len(writings),
            "notion_pages": len(notion_pages),
            "dreams": len(dreams),
        },
    }


@router.post("/think")
def brain_think(
    payload: BrainThinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    user_id = current_user.id

    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .limit(20)
        .all()
    )

    memories = (
        db.query(MemoryCard)
        .filter(MemoryCard.user_id == user_id)
        .order_by(MemoryCard.created_at.desc())
        .limit(12)
        .all()
    )

    writings = (
        db.query(WritingDocument)
        .filter(WritingDocument.user_id == user_id)
        .order_by(WritingDocument.created_at.desc())
        .limit(8)
        .all()
    )

    dreams = (
        db.query(Dream)
        .filter(Dream.user_id == user_id)
        .order_by(Dream.created_at.desc())
        .limit(3)
        .all()
    )

    sources = []

    for task in tasks:
        sources.append(
            {
                "id": task.id,
                "type": "task",
                "title": task.title,
                "preview": _preview(task.description),
                "date": task.due_date,
            }
        )

    for memory in memories:
        sources.append(
            {
                "id": memory.id,
                "type": "memory",
                "title": memory.title,
                "preview": _preview(memory.summary),
            }
        )

    for doc in writings:
        sources.append(
            {
                "id": doc.id,
                "type": "writing",
                "title": doc.title,
                "preview": _preview(doc.cleaned_markdown or doc.raw_text),
            }
        )

    for dream in dreams:
        sources.append(
            {
                "id": dream.id,
                "type": "dream",
                "title": dream.title,
                "preview": _preview(dream.summary),
            }
        )

    context = json.dumps(sources, ensure_ascii=False, indent=2)

    answer = ask_deep(
        prompt=f"""
User question:
{payload.query}

Second Brain sources:
{context}

Answer using only the sources above.
Return:
1. Direct answer
2. Sources used
3. Gaps / what is missing
4. One next action
""".strip(),
        system=(
            "You are Second Brain Think Mode. "
            "Be concise. Do not invent facts. "
            "Always mention gaps if evidence is missing."
        ),
        max_tokens=1200,
    )

    gaps = []

    if not tasks:
        gaps.append("No tasks found.")
    if not memories:
        gaps.append("No memory cards found.")
    if not writings:
        gaps.append("No writing documents found.")
    if not dreams:
        gaps.append("No Dream Mode output found.")

    return {
        "answer": answer,
        "sources": sources[:12],
        "gaps": gaps,
    }


@router.post("/ask")
def ask_my_brain(
    payload: BrainAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return ask_brain(
        db=db,
        query=payload.query,
        source_hint=payload.source_hint,
        current_user=current_user,
    )
