import requests

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User
from app.modules.activity.activity_service import create_activity_event


def _notion_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": settings.notion_api_version,
    }


def create_notion_file_upload(
    access_token: str,
    filename: str,
    content_type: str,
) -> dict:
    response = requests.post(
        "https://api.notion.com/v1/file_uploads",
        headers={
            **_notion_headers(access_token),
            "Content-Type": "application/json",
        },
        json={
            "filename": filename,
            "content_type": content_type,
            "mode": "single_part",
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion create file upload failed: {response.status_code} {response.text}"
        )

    return response.json()


def send_notion_file_upload(
    access_token: str,
    file_upload_id: str,
    image_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict:
    response = requests.post(
        f"https://api.notion.com/v1/file_uploads/{file_upload_id}/send",
        headers=_notion_headers(access_token),
        files={
            "file": (filename, image_bytes, content_type),
        },
        timeout=60,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion send file upload failed: {response.status_code} {response.text}"
        )

    return response.json()


def create_page_with_uploaded_image(
    access_token: str,
    title: str,
    file_upload_id: str,
    caption: str | None = None,
) -> dict:
    children = [
        {
            "object": "block",
            "type": "image",
            "image": {
                "type": "file_upload",
                "file_upload": {
                    "id": file_upload_id,
                },
            },
        }
    ]

    if caption:
        children.append(
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": caption[:1800]},
                        }
                    ]
                },
            }
        )

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers={
            **_notion_headers(access_token),
            "Content-Type": "application/json",
        },
        json={
            "parent": {
                "page_id": settings.notion_uploads_parent_page_id,
            },
            "properties": {
                "title": [
                    {
                        "text": {
                            "content": title[:180],
                        }
                    }
                ]
            },
            "children": children,
        },
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Notion create image page failed: {response.status_code} {response.text}"
        )

    return response.json()


def upload_image_to_notion_page(
    db: Session,
    access_token: str,
    image_bytes: bytes,
    filename: str,
    content_type: str,
    title: str,
    caption: str | None,
    current_user: User,
) -> dict:
    if not settings.notion_uploads_parent_page_id:
        raise RuntimeError("NOTION_UPLOADS_PARENT_PAGE_ID is not configured")

    upload = create_notion_file_upload(
        access_token=access_token,
        filename=filename,
        content_type=content_type,
    )

    file_upload_id = upload["id"]

    send_notion_file_upload(
        access_token=access_token,
        file_upload_id=file_upload_id,
        image_bytes=image_bytes,
        filename=filename,
        content_type=content_type,
    )

    page = create_page_with_uploaded_image(
        access_token=access_token,
        title=title,
        file_upload_id=file_upload_id,
        caption=caption,
    )

    try:
        create_activity_event(
            db,
            event_type="notion_image_uploaded",
            title=title,
            description=caption or "Image uploaded to Notion from Second Brain",
            source_type="notion",
            source_id=page.get("id"),
            url=page.get("url"),
            metadata={
                "filename": filename,
                "content_type": content_type,
                "file_upload_id": file_upload_id,
            },
            current_user=current_user,
        )
    except Exception:
        pass

    return {
        "ok": True,
        "notion_page": {
            "id": page.get("id"),
            "title": title,
            "url": page.get("url"),
        },
        "file_upload_id": file_upload_id,
    }
