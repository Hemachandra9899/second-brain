from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import (
    Dream,
    MemoryCard,
    NotionTodoPage,
    Task,
    User,
    WritingDocument,
)
from app.modules.brain.brain_timeline_service import get_brain_timeline
from app.modules.brain.brain_action_service import (
    accept_brain_action,
    suggest_brain_actions,
)
from app.modules.brain.brain_project_service import (
    accept_project_suggestion,
    suggest_projects_from_brain,
)
from app.modules.brain.brain_schema import BrainAskRequest
from app.modules.brain.brain_service import ask_brain
from app.modules.brain.brain_relationship_service import (
    get_local_brain_graph,
    rebuild_brain_relationships,
)
from app.modules.brain.local_brain_service import (
    get_local_brain_health,
    rebuild_local_brain,
    search_local_brain,
    think_local_brain,
)
router = APIRouter()


class BrainThinkRequest(BaseModel):
    query: str


class LocalBrainThinkRequest(BaseModel):
    query: str


class BrainActionAcceptRequest(BaseModel):
    action: dict[str, Any]


class ProjectSuggestionAcceptRequest(BaseModel):
    suggestion: dict[str, Any]


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
    return think_local_brain(
        db=db,
        current_user=current_user,
        query=payload.query,
    )


@router.post("/local/reindex")
def reindex_local_brain(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return rebuild_local_brain(
        db=db,
        current_user=current_user,
    )


@router.get("/local/search")
def local_brain_search(
    query: str = Query(default=""),
    source_type: str | None = Query(default=None),
    limit: int = Query(default=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return search_local_brain(
        db=db,
        current_user=current_user,
        query=query,
        source_type=source_type,
        limit=limit,
    )


@router.post("/local/think")
def local_brain_think(
    payload: LocalBrainThinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return think_local_brain(
        db=db,
        current_user=current_user,
        query=payload.query,
    )


@router.get("/local/timeline")
def local_brain_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_brain_timeline(
        db=db,
        current_user=current_user,
    )


@router.get("/local/health")
def local_brain_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_local_brain_health(
        db=db,
        current_user=current_user,
    )


@router.post("/local/relationships/rebuild")
def rebuild_local_brain_relationships(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return rebuild_brain_relationships(
        db=db,
        current_user=current_user,
    )


@router.get("/local/graph")
def local_brain_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_local_brain_graph(
        db=db,
        current_user=current_user,
    )


@router.get("/local/actions")
def get_local_brain_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return suggest_brain_actions(
        db=db,
        current_user=current_user,
    )


@router.post("/local/actions/accept")
def accept_local_brain_action(
    payload: BrainActionAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return accept_brain_action(
        db=db,
        current_user=current_user,
        action=payload.action,
    )


@router.get("/local/project-suggestions")
def get_project_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return suggest_projects_from_brain(
        db=db,
        current_user=current_user,
    )


@router.post("/local/project-suggestions/accept")
def accept_project_suggestion_endpoint(
    payload: ProjectSuggestionAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return accept_project_suggestion(
        db=db,
        current_user=current_user,
        suggestion=payload.suggestion,
    )


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
