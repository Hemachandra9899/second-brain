import json
from openai import OpenAI, APIError, AuthenticationError, RateLimitError

from app.core.config import settings


client = OpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url,
)


def _create_completion(
    prompt: str,
    system: str,
    model: str,
    temperature: float = 0.2,
    max_tokens: int = 900,
    extra_body: dict | None = None,
) -> str:
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            extra_body=extra_body or {},
        )
        return response.choices[0].message.content or ""

    except AuthenticationError:
        return "AI provider authentication failed. Please check NVIDIA_API_KEY."

    except RateLimitError:
        return "The AI provider is rate-limited right now. Please try again shortly."

    except APIError:
        return "The AI provider is temporarily unavailable. Please try again."

    except Exception:
        return "Something went wrong while calling the AI provider."


def ask_llm(
    prompt: str,
    system: str = "You are a helpful second-brain assistant.",
    max_tokens: int = 900,
) -> str:
    return _create_completion(
        prompt=prompt,
        system=system,
        model=settings.nvidia_llm_model,
        temperature=0.2,
        max_tokens=max_tokens,
    )


def ask_fast(
    prompt: str,
    system: str = "You are a fast helpful assistant.",
    max_tokens: int = 700,
) -> str:
    return _create_completion(
        prompt=prompt,
        system=system,
        model=getattr(settings, "nvidia_fast_model", settings.nvidia_llm_model),
        temperature=0.2,
        max_tokens=max_tokens,
    )


def ask_json_fast(prompt: str, system: str, fallback: dict) -> dict:
    raw = ask_fast(
        prompt=prompt,
        system=system,
        max_tokens=512,
    )

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start >= 0 and end >= 0:
        try:
            return json.loads(raw[start:end + 1])
        except json.JSONDecodeError:
            pass

    return fallback


def ask_deep(
    prompt: str,
    system: str = "You are a careful reasoning assistant.",
    max_tokens: int = 2000,
) -> str:
    return _create_completion(
        prompt=prompt,
        system=system,
        model=getattr(settings, "nvidia_deep_model", settings.nvidia_llm_model),
        temperature=0.3,
        max_tokens=max_tokens,
        extra_body={
            "chat_template_kwargs": {
                "thinking": True,
                "reasoning_effort": "medium",
            }
        },
    )
