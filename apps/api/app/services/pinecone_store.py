from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings


pc = Pinecone(api_key=settings.pinecone_api_key)


def ensure_index() -> None:
    existing = [index["name"] for index in pc.list_indexes()]

    if settings.pinecone_index not in existing:
        pc.create_index(
            name=settings.pinecone_index,
            dimension=settings.pinecone_dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.pinecone_cloud,
                region=settings.pinecone_region,
            ),
        )


def get_index():
    ensure_index()
    return pc.Index(settings.pinecone_index)


def upsert_text(vector_id: str, embedding: list[float], metadata: dict):
    index = get_index()
    index.upsert(
        vectors=[
            {
                "id": vector_id,
                "values": embedding,
                "metadata": metadata,
            }
        ]
    )


def search(embedding: list[float], top_k: int = 8, filter: dict | None = None):
    index = get_index()
    return index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter,
    )


def delete_vector(vector_id: str):
    index = get_index()
    index.delete(ids=[vector_id])
