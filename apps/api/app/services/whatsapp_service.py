import httpx

from app.core.config import settings


def send_message(to: str, text: str) -> dict:
    with httpx.Client(base_url=settings.openwa_base_url) as client:
        response = client.post(
            "/api/sendText",
            json={
                "chatId": to,
                "text": text,
                "session": "default",
            },
            headers={"Authorization": f"Bearer {settings.openwa_api_key}"},
        )
        response.raise_for_status()
        return response.json()
