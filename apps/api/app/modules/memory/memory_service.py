import json
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import Task, KnowledgeItem, MemoryCard, User
from app.services.llm_nvidia import ask_llm
from app.services.embedding_service import embed_text
from app.services.pinecone_store import upsert_text
from app.modules.knowledge.graph_service import extract_and_store_graph


def _safe_json_loads(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end >= 0:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                pass
    return {"memory_cards": []}


def consolidate_memories(db: Session, current_user: User | None = None) -> list[dict]:
    user_id = current_user.id if current_user else None

    task_query = db.query(Task)
    knowledge_query = db.query(KnowledgeItem)

    if user_id:
        task_query = task_query.filter(Task.user_id == user_id)
        knowledge_query = knowledge_query.filter(KnowledgeItem.user_id == user_id)
    else:
        task_query = task_query.filter(Task.user_id.is_(None))
        knowledge_query = knowledge_query.filter(KnowledgeItem.user_id.is_(None))

    recent_tasks = (
        task_query
        .order_by(Task.created_at.desc())
        .limit(20)
        .all()
    )

    recent_knowledge = (
        knowledge_query
        .order_by(KnowledgeItem.created_at.desc())
        .limit(20)
        .all()
    )

    raw_items = []

    for t in recent_tasks:
        raw_items.append(f"Task: {t.title} | status={t.status} | priority={t.priority} | due={t.due_date} | id={t.id}")

    for k in recent_knowledge:
        raw_items.append(f"Note: {k.title} | {k.raw_text[:500]} | type={k.source_type} | id={k.id}")

    if not raw_items:
        return []

    context = "\n\n".join(raw_items)

    prompt = f"""
You are consolidating a user's raw Second Brain data into long-term memory cards.

Create concise memory cards from the raw tasks and notes.

Return strict JSON only:
{{
  "memory_cards": [
    {{
      "title": "short title",
      "summary": "clean durable memory",
      "tags": ["tag1", "tag2"],
      "source_item_ids": ["id1", "id2"]
    }}
  ]
}}

Rules:
- Merge related raw notes.
- Do not duplicate.
- Keep memories useful long-term.
- Do not invent facts.

Raw items:
{context}
""".strip()

    raw = ask_llm(
        prompt,
        system="You consolidate raw data into durable memory cards. Return valid JSON only.",
    )

    parsed = _safe_json_loads(raw)
    cards_data = parsed.get("memory_cards", [])

    created_cards = []

    for card_data in cards_data:
        source_ids = card_data.get("source_item_ids", [])
        tags = card_data.get("tags", [])

        card = MemoryCard(
            id=str(uuid4()),
            user_id=user_id,
            title=card_data.get("title", "Memory card"),
            summary=card_data.get("summary", ""),
            tags=json.dumps(tags) if tags else None,
            source_item_ids=json.dumps(source_ids) if source_ids else None,
        )

        db.add(card)
        db.commit()
        db.refresh(card)

        try:
            embedding = embed_text(f"{card.title}: {card.summary}")
            upsert_text(
                vector_id=f"memory_{card.id}",
                embedding=embedding,
                metadata={
                    "source_type": "memory_card",
                    "source_id": card.id,
                    "title": card.title,
                    "text": card.summary,
                    "tags": ",".join(tags),
                },
            )
        except Exception:
            pass

        try:
            extract_and_store_graph(
                db=db,
                source_item_id=card.id,
                title=card.title,
                text=card.summary,
                user_id=user_id,
            )
        except Exception:
            pass

        created_cards.append({
            "id": card.id,
            "title": card.title,
            "summary": card.summary,
            "tags": tags,
            "created_at": card.created_at.isoformat() if card.created_at else None,
        })

    return created_cards
