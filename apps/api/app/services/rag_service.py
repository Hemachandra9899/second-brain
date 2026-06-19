from app.services.llm_nvidia import ask_llm
from app.services.pinecone_store import search_chunks


def generate_embedding(text: str) -> list[float]:
    from openai import OpenAI
    from app.core.config import settings

    client = OpenAI(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url,
    )

    response = client.embeddings.create(
        model="nvidia/nv-embed-qa-4",
        input=text,
    )
    return response.data[0].embedding


def rag_answer(question: str) -> str:
    embedding = generate_embedding(question)
    results = search_chunks(embedding)

    context_parts = []
    for match in results.matches:
        if match.metadata and "text" in match.metadata:
            context_parts.append(match.metadata["text"])

    context = "\n\n".join(context_parts) if context_parts else "No relevant notes found."

    prompt = (
        "Answer the question based on the context below.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}"
    )

    return ask_llm(prompt, system="You are a precise research assistant.")
