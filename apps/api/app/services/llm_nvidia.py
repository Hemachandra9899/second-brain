from openai import OpenAI

from app.core.config import settings


client = OpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url,
)


def ask_llm(prompt: str, system: str = "You are a helpful second-brain assistant.") -> str:
    response = client.chat.completions.create(
        model=settings.nvidia_llm_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
