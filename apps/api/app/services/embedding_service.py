from openai import OpenAI
from app.core.config import settings


client = OpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url,
)


def embed_text(text: str, input_type: str = "passage") -> list[float]:
    response = client.embeddings.create(
        model="nvidia/nv-embedqa-e5-v5",
        input=[text],
        extra_body={"input_type": input_type},
    )
    return response.data[0].embedding
