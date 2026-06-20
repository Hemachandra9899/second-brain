import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_current_user
from app.db.session import get_db
from app.models import User, WritingDocument
from app.modules.writing.writing_schema import (
    WritingCleanRequest,
    WritingCreateRequest,
    WritingPatchRequest,
)
from app.modules.writing.writing_service import (
    clean_writing_text,
    create_writing_document,
    extract_tasks_from_writing,
    serialize_writing,
)

router = APIRouter()


@router.post("/clean")
def clean_writing(payload: WritingCleanRequest):
    return clean_writing_text(payload.text)


@router.post("/documents")
def create_document(
    payload: WritingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    doc = create_writing_document(
        db=db,
        raw_text=payload.raw_text,
        title=payload.title,
        cleaned_markdown=payload.cleaned_markdown,
        blocks=payload.blocks,
        source_type=payload.source_type,
        current_user=current_user,
    )

    return serialize_writing(doc)


@router.get("/documents")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    docs = (
        db.query(WritingDocument)
        .filter(WritingDocument.user_id == current_user.id)
        .order_by(WritingDocument.created_at.desc())
        .limit(50)
        .all()
    )

    return [serialize_writing(doc) for doc in docs]


@router.get("/documents/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    doc = (
        db.query(WritingDocument)
        .filter(
            WritingDocument.id == document_id,
            WritingDocument.user_id == current_user.id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Writing document not found")

    return serialize_writing(doc)


@router.patch("/documents/{document_id}")
def patch_document(
    document_id: str,
    payload: WritingPatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    doc = (
        db.query(WritingDocument)
        .filter(
            WritingDocument.id == document_id,
            WritingDocument.user_id == current_user.id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Writing document not found")

    if payload.title is not None:
        doc.title = payload.title
    if payload.raw_text is not None:
        doc.raw_text = payload.raw_text
    if payload.cleaned_markdown is not None:
        doc.cleaned_markdown = payload.cleaned_markdown
    if payload.blocks is not None:
        doc.blocks_json = json.dumps(payload.blocks)

    db.commit()
    db.refresh(doc)

    return serialize_writing(doc)


@router.post("/documents/{document_id}/extract")
def extract_document_tasks(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    doc = (
        db.query(WritingDocument)
        .filter(
            WritingDocument.id == document_id,
            WritingDocument.user_id == current_user.id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Writing document not found")

    tasks = extract_tasks_from_writing(db, doc, current_user)

    return {
        "ok": True,
        "tasks_created": len(tasks),
        "tasks": [
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
            }
            for task in tasks
        ],
    }
