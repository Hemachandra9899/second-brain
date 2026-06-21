import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import User
from app.modules.imports.instagram_service import import_instagram_zip_from_path

router = APIRouter()

MAX_ZIP_BYTES = 150 * 1024 * 1024


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
            detail="Please upload an Instagram .zip export.",
        )

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = Path(tmpdir) / "instagram_export.zip"

            total = 0
            with zip_path.open("wb") as out:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break

                    total += len(chunk)

                    if total > MAX_ZIP_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail="ZIP is too large. Please upload a file under 150MB.",
                        )

                    out.write(chunk)

            print(f"instagram_zip_size_bytes={total}", flush=True)

            return import_instagram_zip_from_path(
                db=db,
                zip_path=zip_path,
                current_user=current_user,
            )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"INSTAGRAM_IMPORT_FAILED: {repr(exc)}", flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Instagram import failed: {str(exc)}",
        )
