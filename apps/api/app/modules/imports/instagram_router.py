from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.imports.instagram_service import import_instagram_zip

router = APIRouter()


@router.post("/instagram")
async def upload_instagram_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload an Instagram .zip export")

    content = await file.read()

    if len(content) > 250 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ZIP file is too large. Keep it under 250MB.")

    return import_instagram_zip(
        db=db,
        zip_bytes=content,
        current_user=current_user,
    )
