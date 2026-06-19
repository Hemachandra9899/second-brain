from pinecone import Pinecone, ServerlessSpec

from app.core.config import settings


pc = Pinecone(api_key=settings.pinecone_api_key)


def ensure_index() -> None:
    if not pc.has_index(settings.pinecone_index):
        pc.create_index(
            name=settings.pinecone_index,
            vector_type="dense",
            dimension=settings.pinecone_dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.pinecone_cloud,
                region=settings.pinecone_region,
            ),
            deletion_protection="disabled",
        )


def get_index():
    ensure_index()
    return pc.Index(settings.pinecone_index)


def upsert_chunk(chunk_id: str, embedding: list[float], metadata: dict):
    index = get_index()
    index.upsert(
        vectors=[
            {
                "id": chunk_id,
                "values": embedding,
                "metadata": metadata,
            }
        ]
    )


def search_chunks(embedding: list[float], top_k: int = 8):
    index = get_index()
    return index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
    )
