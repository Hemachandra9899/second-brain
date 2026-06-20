from openai import OpenAI, AuthenticationError, APIError, RateLimitError

from app.core.config import settings


client = OpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url,
)


def ask_llm(
    prompt: str,
    system: str = "You are a helpful second-brain assistant.",
    fallback: str | None = None,
) -> str:
    try:
        response = client.chat.completions.create(
            model=settings.nvidia_llm_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content or ""

    except AuthenticationError:
        return fallback or (
            "AI provider authentication failed. Please check NVIDIA_API_KEY on the backend."
        )

    except RateLimitError:
        return fallback or (
            "The AI provider is rate-limited right now. Please try again shortly."
        )

    except APIError:
        return fallback or (
            "The AI provider is temporarily unavailable. Please try again."
        )

    except Exception:
        return fallback or (
            "Something went wrong while calling the AI provider."
        )
