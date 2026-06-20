import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import MemoryCard, User
from app.modules.memory.memory_service import consolidate_memories

router = APIRouter()


def serialize_card(card: MemoryCard):
    return {
        "id": card.id,
        "title": card.title,
        "summary": card.summary,
        "tags": json.loads(card.tags) if card.tags else [],
        "source_item_ids": json.loads(card.source_item_ids) if card.source_item_ids else [],
        "created_at": card.created_at.isoformat() if card.created_at else None,
    }


@router.post("/consolidate")
def consolidate(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    cards = consolidate_memories(db=db, current_user=current_user)
    return {
        "ok": True,
        "cards_created": len(cards),
        "cards": cards,
    }


@router.get("/cards")
def list_cards(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    query = db.query(MemoryCard).order_by(MemoryCard.created_at.desc())

    if current_user:
        query = query.filter(MemoryCard.user_id == current_user.id)

    cards = query.all()
    return [serialize_card(card) for card in cards]


@router.delete("/cards/{card_id}")
def delete_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    query = db.query(MemoryCard).filter(MemoryCard.id == card_id)

    if current_user:
        query = query.filter(MemoryCard.user_id == current_user.id)

    card = query.first()

    if not card:
        raise HTTPException(status_code=404, detail="Memory card not found")

    db.delete(card)
    db.commit()

    return {
        "ok": True,
        "deleted_card_id": card_id,
    }
