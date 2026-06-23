import re
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import BrainEdge, BrainItem, User


STOPWORDS = {
    "the", "and", "for", "with", "from", "this", "that", "your", "you",
    "task", "todo", "none", "page", "created", "brain", "second",
}


def _tokens(text: str | None) -> set[str]:
    raw = re.findall(r"[a-zA-Z0-9]+", (text or "").lower())
    return {t for t in raw if len(t) > 2 and t not in STOPWORDS}


def _item_text(item: BrainItem) -> str:
    return f"{item.title or ''} {item.body or ''} {item.tags or ''}"


def _relation_between(a: BrainItem, b: BrainItem) -> dict | None:
    a_text = _item_text(a)
    b_text = _item_text(b)

    # Strong relation: local task links to Notion page id/url.
    if a.source_type == "task" and b.source_type == "notion":
        if b.source_id and b.source_id in a_text:
            return {
                "relation_type": "linked_to_notion",
                "weight": 1.0,
                "reason": "Task references this Notion page.",
            }

    if b.source_type == "task" and a.source_type == "notion":
        if a.source_id and a.source_id in b_text:
            return {
                "relation_type": "linked_to_notion",
                "weight": 1.0,
                "reason": "Task references this Notion page.",
            }

    a_tokens = _tokens(a_text)
    b_tokens = _tokens(b_text)

    shared = a_tokens.intersection(b_tokens)

    if len(shared) >= 4:
        return {
            "relation_type": "strong_overlap",
            "weight": min(1.0, len(shared) / 10),
            "reason": "Shared terms: " + ", ".join(sorted(list(shared))[:8]),
        }

    if len(shared) >= 2:
        return {
            "relation_type": "related",
            "weight": min(0.7, len(shared) / 10),
            "reason": "Shared terms: " + ", ".join(sorted(list(shared))[:6]),
        }

    return None


def _edge_exists(
    db: Session,
    *,
    user_id: str,
    source_item_id: str,
    target_item_id: str,
    relation_type: str,
) -> bool:
    return (
        db.query(BrainEdge)
        .filter(BrainEdge.user_id == user_id)
        .filter(BrainEdge.source_item_id == source_item_id)
        .filter(BrainEdge.target_item_id == target_item_id)
        .filter(BrainEdge.relation_type == relation_type)
        .first()
        is not None
    )


def relate_item_to_local_brain(
    db: Session,
    *,
    item: BrainItem,
    commit: bool = True,
) -> dict:
    # Remove old edges touching this item, then rebuild fresh.
    db.query(BrainEdge).filter(BrainEdge.user_id == item.user_id).filter(
        (BrainEdge.source_item_id == item.id) | (BrainEdge.target_item_id == item.id)
    ).delete(synchronize_session=False)

    candidates = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == item.user_id)
        .filter(BrainItem.id != item.id)
        .order_by(BrainItem.updated_at.desc())
        .limit(250)
        .all()
    )

    created = 0

    for other in candidates:
        relation = _relation_between(item, other)

        if not relation:
            continue

        edge = BrainEdge(
            id=str(uuid4()),
            user_id=item.user_id,
            source_item_id=item.id,
            target_item_id=other.id,
            relation_type=relation["relation_type"],
            reason=relation["reason"],
            weight=relation["weight"],
        )

        db.add(edge)
        created += 1

    if commit:
        db.commit()

    return {
        "ok": True,
        "item_id": item.id,
        "edges_created": created,
    }


def rebuild_brain_relationships(
    db: Session,
    *,
    current_user: User,
) -> dict:
    user_id = current_user.id

    db.query(BrainEdge).filter(BrainEdge.user_id == user_id).delete(
        synchronize_session=False
    )

    items = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == user_id)
        .order_by(BrainItem.updated_at.desc())
        .limit(400)
        .all()
    )

    created = 0

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a = items[i]
            b = items[j]

            relation = _relation_between(a, b)

            if not relation:
                continue

            edge = BrainEdge(
                id=str(uuid4()),
                user_id=user_id,
                source_item_id=a.id,
                target_item_id=b.id,
                relation_type=relation["relation_type"],
                reason=relation["reason"],
                weight=relation["weight"],
            )

            db.add(edge)
            created += 1

    db.commit()

    return {
        "ok": True,
        "items_checked": len(items),
        "edges_created": created,
    }


def get_local_brain_graph(
    db: Session,
    *,
    current_user: User,
    limit: int = 120,
) -> dict:
    items = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == current_user.id)
        .order_by(BrainItem.updated_at.desc())
        .limit(limit)
        .all()
    )

    item_ids = [item.id for item in items]

    edges = (
        db.query(BrainEdge)
        .filter(BrainEdge.user_id == current_user.id)
        .filter(BrainEdge.source_item_id.in_(item_ids))
        .filter(BrainEdge.target_item_id.in_(item_ids))
        .order_by(BrainEdge.weight.desc())
        .limit(250)
        .all()
    )

    return {
        "nodes": [
            {
                "id": item.id,
                "label": item.title,
                "type": item.source_type,
                "subtitle": (item.body or "")[:140],
                "source_id": item.source_id,
                "source_url": item.source_url,
            }
            for item in items
        ],
        "edges": [
            {
                "id": edge.id,
                "source": edge.source_item_id,
                "target": edge.target_item_id,
                "label": edge.relation_type,
                "reason": edge.reason,
                "weight": edge.weight,
            }
            for edge in edges
        ],
        "counts": {
            "nodes": len(items),
            "edges": len(edges),
        },
    }
