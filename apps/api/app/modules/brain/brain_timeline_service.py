from sqlalchemy.orm import Session

from app.models import ActivityEvent, BrainItem, User


def get_brain_timeline(
    db: Session,
    *,
    current_user: User,
    limit: int = 30,
) -> dict:
    items = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == current_user.id)
        .order_by(BrainItem.updated_at.desc())
        .limit(limit)
        .all()
    )

    activity = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == current_user.id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    events = []

    for item in items:
        events.append(
            {
                "id": f"brain:{item.id}",
                "type": "brain_item",
                "source_type": item.source_type,
                "title": item.title,
                "preview": (item.body or "")[:240],
                "created_at": item.updated_at.isoformat() if item.updated_at else None,
            }
        )

    for event in activity:
        events.append(
            {
                "id": f"activity:{event.id}",
                "type": "activity",
                "source_type": event.event_type,
                "title": event.title,
                "preview": event.description,
                "created_at": event.created_at.isoformat() if event.created_at else None,
            }
        )

    events.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {
        "events": events[:limit],
        "count": len(events[:limit]),
    }
