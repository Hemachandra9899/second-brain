from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.integrations.notion.notion_oauth_service import (
    get_decrypted_token,
    get_notion_connection,
)
from app.modules.uploads.upload_service import upload_image_to_notion_page

router = APIRouter()


@router.post("/image/notion")
async def upload_image_to_notion(
    file: UploadFile = File(...),
    title: str = Form(default="Uploaded image"),
    caption: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    content = await file.read()

    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Keep it under 20MB for direct Notion upload.",
        )

    conn = get_notion_connection(db, current_user)
    if not conn:
        raise HTTPException(status_code=400, detail="Connect Notion first")

    access_token = get_decrypted_token(conn)

    return upload_image_to_notion_page(
        db=db,
        access_token=access_token,
        image_bytes=content,
        filename=file.filename or "image.png",
        content_type=file.content_type,
        title=title,
        caption=caption,
        current_user=current_user,
    )
