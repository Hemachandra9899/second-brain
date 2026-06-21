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
    print("INSTAGRAM_IMPORT_POST_TRIGGERED", flush=True)
    print(f"filename={file.filename} content_type={file.content_type}", flush=True)

    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an Instagram .zip export",
        )

    content = await file.read()
    print(f"instagram_zip_size_bytes={len(content)}", flush=True)

    if len(content) > 250 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="ZIP file is too large. Keep it under 250MB.",
        )

    return import_instagram_zip(
        db=db,
        zip_bytes=content,
        current_user=current_user,
    )
