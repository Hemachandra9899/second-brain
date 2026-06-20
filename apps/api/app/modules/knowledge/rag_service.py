from sqlalchemy.orm import Session

from app.models import Task, KnowledgeItem, MemoryCard
from app.services.embedding_service import embed_text
from app.services.pinecone_store import search
from app.services.llm_nvidia import ask_llm
from app.modules.knowledge.graph_service import extract_entities_and_relationships, get_related_graph_context


def ask_knowledge_base(db: Session, query: str, user_id: str | None = None):
    query_embedding = embed_text(query, input_type="query")

    results = search(
        embedding=query_embedding,
        top_k=8,
    )

    matches = results.get("matches", []) if isinstance(results, dict) else results.matches

    source_blocks = []

    for match in matches:
        metadata = match.get("metadata", {}) if isinstance(match, dict) else match.metadata

        source_blocks.append(
            {
                "source_type": metadata.get("source_type"),
                "source_id": metadata.get("source_id"),
                "title": metadata.get("title"),
                "text": metadata.get("text"),
                "score": match.get("score") if isinstance(match, dict) else match.score,
            }
        )

    query_graph = extract_entities_and_relationships(
        title="user_query",
        text=query,
    )

    entity_names = [
        entity.get("name")
        for entity in query_graph.get("entities", [])
        if entity.get("name")
    ]

    graph_context = get_related_graph_context(db=db, entity_names=entity_names)

    vector_context = "\n\n".join(
        [
            f"Source: {s['title']}\n{s['text']}"
            for s in source_blocks
            if s.get("text")
        ]
    )

    graph_context_text = "\n".join(
        [
            f"{rel['from']} --{rel['type']}--> {rel['to']}"
            for rel in graph_context
        ]
    )

    prompt = f"""
User question:
{query}

Semantic search context:
{vector_context}

Related graph context:
{graph_context_text}

Answer the user using the context.
Be practical, short, and action-oriented.
If context is missing, say exactly what is missing.

After your answer, suggest a practical next action.
""".strip()

    answer = ask_llm(prompt)

    related_tasks = []
    related_notes = []
    related_memory_cards = []

    for entity_name in entity_names:
        task_matches = (
            db.query(Task)
            .filter(Task.title.ilike(f"%{entity_name}%"))
            .limit(5)
            .all()
        )
        for t in task_matches:
            if t.id not in [rt["id"] for rt in related_tasks]:
                related_tasks.append({
                    "id": t.id,
                    "title": t.title,
                    "status": t.status,
                    "priority": t.priority,
                })

    for entity_name in entity_names:
        note_matches = (
            db.query(KnowledgeItem)
            .filter(
                (KnowledgeItem.title.ilike(f"%{entity_name}%"))
                | (KnowledgeItem.raw_text.ilike(f"%{entity_name}%"))
            )
            .limit(5)
            .all()
        )
        for k in note_matches:
            if k.id not in [rn["id"] for rn in related_notes]:
                related_notes.append({
                    "id": k.id,
                    "title": k.title,
                    "source_type": k.source_type,
                })

    for entity_name in entity_names:
        card_matches = (
            db.query(MemoryCard)
            .filter(MemoryCard.title.ilike(f"%{entity_name}%"))
            .limit(5)
            .all()
        )
        for mc in card_matches:
            if mc.id not in [rm["id"] for rm in related_memory_cards]:
                related_memory_cards.append({
                    "id": mc.id,
                    "title": mc.title,
                    "summary": mc.summary[:300] if mc.summary else "",
                })

    suggested = None
    if related_tasks:
        suggested = f"Check task: {related_tasks[0]['title']}"
    elif source_blocks:
        suggested = f"Review {source_blocks[0]['title']}"

    return {
        "answer": answer,
        "sources": source_blocks,
        "related_tasks": related_tasks,
        "related_notes": related_notes,
        "related_memory_cards": related_memory_cards,
        "graph_context": graph_context,
        "suggested_next_action": suggested,
    }
