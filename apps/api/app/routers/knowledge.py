from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import KnowledgeItem
from app.core.auth import get_current_user
from app.schemas.knowledge import CreateKnowledgeItemRequest, KnowledgeAskRequest
from app.services.knowledge_service import index_knowledge_item, delete_knowledge_item
from app.services.rag_service import ask_knowledge_base


router = APIRouter()


def serialize_item(item: KnowledgeItem):
    return {
        "id": item.id,
        "title": item.title,
        "raw_text": item.raw_text,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@router.get("/items")
def list_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc())

    if current_user:
        query = query.filter(KnowledgeItem.user_id == current_user.id)

    items = query.all()
    return [serialize_item(item) for item in items]


@router.post("/items")
def create_item(
    payload: CreateKnowledgeItemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = index_knowledge_item(
        db=db,
        title=payload.title,
        raw_text=payload.raw_text,
        source_type=payload.source_type,
        source_id=payload.source_id,
        user_id=current_user.id if current_user else None,
    )

    return serialize_item(item)


@router.delete("/items/{item_id}")
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = delete_knowledge_item(
        db=db,
        item_id=item_id,
        user_id=current_user.id if current_user else None,
    )

    if not deleted:
        raise HTTPException(status_code=404, detail="Knowledge item not found")

    return {
        "ok": True,
        "deleted_item_id": item_id,
    }


@router.post("/ask")
def ask(
    payload: KnowledgeAskRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return ask_knowledge_base(
        db=db,
        query=payload.query,
        user_id=current_user.id if current_user else None,
    )
