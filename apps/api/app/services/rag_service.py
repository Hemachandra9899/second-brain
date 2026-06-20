from sqlalchemy.orm import Session

from app.services.embedding_service import embed_text
from app.services.pinecone_store import search
from app.services.llm_nvidia import ask_llm
from app.services.graph_service import extract_entities_and_relationships, get_related_graph_context


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
""".strip()

    answer = ask_llm(prompt)

    return {
        "answer": answer,
        "sources": source_blocks,
        "graph_context": graph_context,
    }
