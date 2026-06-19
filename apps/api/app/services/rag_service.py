from app.services.embedding_service import embed_text
from app.services.pinecone_store import search
from app.services.llm_nvidia import ask_llm


def ask_knowledge_base(query: str):
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

    context = "\n\n".join(
        [
            f"Source: {s['title']}\n{s['text']}"
            for s in source_blocks
            if s.get("text")
        ]
    )

    prompt = f"""
User question:
{query}

Relevant Second Brain context:
{context}

Answer the user using only the context when possible.
Be practical, short, and action-oriented.
If context is not enough, say what is missing.
""".strip()

    answer = ask_llm(prompt)

    return {
        "answer": answer,
        "sources": source_blocks,
    }
