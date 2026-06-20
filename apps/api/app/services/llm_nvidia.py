import json
from openai import OpenAI, APIError, AuthenticationError, BadRequestError, RateLimitError

from app.core.config import settings


client = OpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url,
)


FAST_MODEL_FALLBACKS = [
    "deepseek-ai/deepseek-v4-flash",
    "stepfun-ai/step-3.7-flash",
    "meta/llama-3.1-70b-instruct",
]

DEEP_MODEL_FALLBACKS = [
    "stepfun-ai/step-3.7-flash",
    "deepseek-ai/deepseek-v4-flash",
    "meta/llama-3.1-70b-instruct",
]


def _try_completion(
    *,
    prompt: str,
    system: str,
    models: list[str],
    temperature: float = 0.2,
    max_tokens: int = 800,
    extra_body: dict | None = None,
) -> str:
    last_error = None

    for model in models:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                top_p=0.95,
                max_tokens=max_tokens,
                extra_body=extra_body or {},
            )

            return response.choices[0].message.content or ""

        except AuthenticationError:
            return "AI provider authentication failed. Please check NVIDIA_API_KEY."

        except (BadRequestError, APIError, RateLimitError) as exc:
            last_error = exc
            continue

        except Exception as exc:
            last_error = exc
            continue

    return f"AI provider is unavailable right now. Last error: {type(last_error).__name__}"


def ask_fast(
    prompt: str,
    system: str = "You are a fast helpful assistant.",
    max_tokens: int = 700,
) -> str:
    return _try_completion(
        prompt=prompt,
        system=system,
        models=FAST_MODEL_FALLBACKS,
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
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end >= 0:
            try:
                return json.loads(raw[start:end + 1])
            except Exception:
                pass

    return fallback


def ask_llm(
    prompt: str,
    system: str = "You are a helpful second-brain assistant.",
    max_tokens: int = 900,
) -> str:
    return _try_completion(
        prompt=prompt,
        system=system,
        models=[
            settings.nvidia_llm_model,
            "stepfun-ai/step-3.7-flash",
            "deepseek-ai/deepseek-v4-flash",
        ],
        temperature=0.2,
        max_tokens=max_tokens,
    )


def ask_deep(
    prompt: str,
    system: str = "You are a careful reasoning assistant.",
    max_tokens: int = 2000,
) -> str:
    return _try_completion(
        prompt=prompt,
        system=system,
        models=DEEP_MODEL_FALLBACKS,
        temperature=0.4,
        max_tokens=max_tokens,
        extra_body={
            "chat_template_kwargs": {
                "thinking": True,
                "reasoning_effort": "medium",
            }
        },
    )
