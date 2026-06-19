import httpx
from app.core.config import settings


def _headers():
    headers = {
        "Content-Type": "application/json",
    }

    if settings.openwa_api_key:
        headers["Authorization"] = f"Bearer {settings.openwa_api_key}"
        headers["x-api-key"] = settings.openwa_api_key

    return headers


async def send_whatsapp_text(
    session_id: str,
    to: str,
    text: str,
):
    url = f"{settings.openwa_base_url}/api/sessions/{session_id}/messages/send-text"

    payload = {
        "to": to,
        "text": text,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            json=payload,
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()
