import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import ActivityEvent, User


def create_activity_event(
    db: Session,
    *,
    event_type: str,
    title: str,
    description: str | None = None,
    source_type: str | None = None,
    source_id: str | None = None,
    url: str | None = None,
    metadata: dict | None = None,
    current_user: User | None = None,
    user_id: str | None = None,
) -> ActivityEvent:
    event = ActivityEvent(
        id=str(uuid4()),
        user_id=user_id or (current_user.id if current_user else None),
        event_type=event_type,
        title=title,
        description=description,
        source_type=source_type,
        source_id=source_id,
        url=url,
        metadata_json=json.dumps(metadata or {}),
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def serialize_activity_event(event: ActivityEvent) -> dict:
    metadata = {}

    if event.metadata_json:
        try:
            metadata = json.loads(event.metadata_json)
        except Exception:
            metadata = {}

    return {
        "id": event.id,
        "event_type": event.event_type,
        "title": event.title,
        "description": event.description,
        "source_type": event.source_type,
        "source_id": event.source_id,
        "url": event.url,
        "metadata": metadata,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


def list_recent_activity(
    db: Session,
    *,
    current_user: User,
    limit: int = 30,
) -> list[dict]:
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == current_user.id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    return [serialize_activity_event(event) for event in events]
