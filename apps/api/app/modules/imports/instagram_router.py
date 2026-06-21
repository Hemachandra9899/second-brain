from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_current_user
from app.db.session import get_db
from app.models import ImportJob, User
from app.modules.imports.instagram_service import process_instagram_import_job

router = APIRouter()

MAX_ZIP_BYTES = 150 * 1024 * 1024
UPLOAD_DIR = Path("/tmp/second-brain-imports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/instagram")
async def upload_instagram_zip(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    print("INSTAGRAM_IMPORT_POST_TRIGGERED", flush=True)

    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an Instagram .zip export.",
        )

    import uuid
    job = ImportJob(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        source_type="instagram",
        status="queued",
        filename=file.filename,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    zip_path = UPLOAD_DIR / f"{job.id}.zip"

    total = 0
    with zip_path.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break

            total += len(chunk)

            if total > MAX_ZIP_BYTES:
                job.status = "failed"
                job.error = "ZIP is too large. Please upload a file under 150MB."
                db.commit()

                try:
                    zip_path.unlink(missing_ok=True)
                except Exception:
                    pass

                raise HTTPException(
                    status_code=413,
                    detail="ZIP is too large. Please upload a file under 150MB.",
                )

            out.write(chunk)

    print(f"instagram_zip_saved job_id={job.id} size={total}", flush=True)

    background_tasks.add_task(
        process_instagram_import_job,
        str(job.id),
        str(zip_path),
        str(current_user.id),
    )

    return {
        "ok": True,
        "job_id": str(job.id),
        "status": "queued",
        "message": "Instagram import started.",
    }


@router.get("/instagram/jobs/{job_id}")
def get_instagram_import_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    job = (
        db.query(ImportJob)
        .filter(ImportJob.id == job_id)
        .filter(ImportJob.user_id == current_user.id)
        .first()
    )

    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    return {
        "id": str(job.id),
        "status": job.status,
        "filename": job.filename,
        "total_items": job.total_items,
        "processed_items": job.processed_items,
        "knowledge_items": job.knowledge_items,
        "activity_events": job.activity_events,
        "error": job.error,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }
