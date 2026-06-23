import re
from collections import Counter, defaultdict
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import BrainEdge, BrainItem, Project, Task, User
from app.modules.brain.local_brain_indexer import upsert_brain_item


STOPWORDS = {
    "task", "todo", "memory", "writing", "dream", "notion", "page", "created",
    "today", "tomorrow", "none", "normal", "open", "done", "review", "create",
    "with", "from", "that", "this", "your", "brain", "second",
}


def _tokens(text: str | None) -> list[str]:
    raw = re.findall(r"[a-zA-Z0-9]+", (text or "").lower())
    return [t for t in raw if len(t) > 2 and t not in STOPWORDS]


def _title_from_items(items: list[BrainItem]) -> str:
    words = []

    for item in items:
        words.extend(_tokens(f"{item.title} {item.tags or ''}")[:8])

    common = [word for word, _ in Counter(words).most_common(4)]

    if not common:
        return "New Brain Project"

    title = " ".join(common[:3]).title()

    return title


def _item_preview(item: BrainItem) -> dict:
    return {
        "id": item.id,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "title": item.title,
        "preview": (item.body or "")[:220],
    }


def suggest_projects_from_brain(
    db: Session,
    *,
    current_user: User,
    limit: int = 5,
) -> dict:
    user_id = current_user.id

    edges = (
        db.query(BrainEdge)
        .filter(BrainEdge.user_id == user_id)
        .filter(BrainEdge.weight >= 0.3)
        .order_by(BrainEdge.weight.desc())
        .limit(150)
        .all()
    )

    if not edges:
        return {
            "suggestions": [],
            "count": 0,
        }

    adjacency: dict[str, set[str]] = defaultdict(set)

    for edge in edges:
        adjacency[edge.source_item_id].add(edge.target_item_id)
        adjacency[edge.target_item_id].add(edge.source_item_id)

    candidate_ids = set(adjacency.keys())

    items = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == user_id)
        .filter(BrainItem.id.in_(candidate_ids))
        .all()
    )

    item_by_id = {item.id: item for item in items}
    suggestions = []
    used_clusters: set[str] = set()

    for item_id, neighbors in adjacency.items():
        if item_id in used_clusters:
            continue

        cluster_ids = [item_id] + list(neighbors)[:8]
        cluster_items = [
            item_by_id[i]
            for i in cluster_ids
            if i in item_by_id
        ]

        if len(cluster_items) < 3:
            continue

        source_types = {item.source_type for item in cluster_items}

        if len(source_types) < 2:
            continue

        title = _title_from_items(cluster_items)

        existing = (
            db.query(Project)
            .filter(Project.user_id == user_id)
            .filter(Project.name.ilike(f"%{title}%"))
            .first()
        )

        if existing:
            continue

        used_clusters.update(cluster_ids)

        task_ids = [
            item.source_id
            for item in cluster_items
            if item.source_type == "task"
        ]

        suggestions.append(
            {
                "title": title,
                "description": (
                    "Created from connected brain items: "
                    + ", ".join(sorted(source_types))
                ),
                "item_ids": [item.id for item in cluster_items],
                "task_ids": task_ids,
                "items": [_item_preview(item) for item in cluster_items[:6]],
                "source_types": sorted(source_types),
            }
        )

        if len(suggestions) >= limit:
            break

    return {
        "suggestions": suggestions,
        "count": len(suggestions),
    }


def accept_project_suggestion(
    db: Session,
    *,
    current_user: User,
    suggestion: dict,
) -> dict:
    title = suggestion.get("title") or "New Brain Project"
    description = suggestion.get("description") or "Created from Second Brain connections."
    task_ids = suggestion.get("task_ids") or []

    project = Project(
        id=str(uuid4()),
        user_id=current_user.id,
        name=title,
        description=description,
        status="active",
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    linked_tasks = []

    if task_ids:
        tasks = (
            db.query(Task)
            .filter(Task.user_id == current_user.id)
            .filter(Task.id.in_(task_ids))
            .all()
        )

        for task in tasks:
            task.project_id = project.id
            linked_tasks.append(
                {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "due_date": task.due_date,
                }
            )

        db.commit()

    try:
        upsert_brain_item(
            db,
            user_id=current_user.id,
            source_type="project",
            source_id=project.id,
            title=project.name,
            body=project.description or project.name,
            tags="project,brain-generated",
        )
    except Exception:
        pass

    return {
        "ok": True,
        "message": "Created project from brain connections.",
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
        },
        "linked_tasks": linked_tasks,
    }
