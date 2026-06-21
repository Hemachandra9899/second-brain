import json
import re
import tempfile
import zipfile
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import User
from app.modules.activity.activity_service import create_activity_event
from app.modules.knowledge.knowledge_service import index_knowledge_item


def _safe_json_loads(raw: bytes):
    try:
        return json.loads(raw.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(raw.decode("latin-1"))
    except Exception:
        return None


def _flatten_strings(obj) -> list[str]:
    texts = []

    if isinstance(obj, dict):
        for key, value in obj.items():
            key_lower = str(key).lower()

            if any(k in key_lower for k in ["caption", "comment", "message", "text", "title", "string_map_data", "value"]):
                texts.extend(_flatten_strings(value))
            elif isinstance(value, (dict, list)):
                texts.extend(_flatten_strings(value))

    elif isinstance(obj, list):
        for item in obj:
            texts.extend(_flatten_strings(item))

    elif isinstance(obj, str):
        cleaned = obj.strip()
        if len(cleaned) > 2:
            texts.append(cleaned)

    return texts


def _category_from_path(path: str) -> str:
    lower = path.lower()

    if "message" in lower or "inbox" in lower:
        return "instagram_messages"
    if "post" in lower or "media" in lower or "reels" in lower:
        return "instagram_posts"
    if "comment" in lower:
        return "instagram_comments"
    if "like" in lower:
        return "instagram_likes"
    if "saved" in lower:
        return "instagram_saved"

    return "instagram_data"


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()[:3500]


def parse_instagram_zip(zip_path: Path, max_items: int = 250) -> list[dict]:
    items = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        json_files = [
            name for name in zf.namelist()
            if name.lower().endswith(".json") and not name.endswith("/")
        ]

        for name in json_files:
            try:
                data = _safe_json_loads(zf.read(name))
            except Exception:
                continue

            if data is None:
                continue

            category = _category_from_path(name)
            records = data if isinstance(data, list) else [data]

            for record in records:
                text = _clean_text(" ".join(_flatten_strings(record)))

                if len(text) < 15:
                    continue

                title = category.replace("instagram_", "Instagram ").replace("_", " ").title()

                items.append(
                    {
                        "id": str(uuid4()),
                        "title": f"{title} #{len(items) + 1}",
                        "text": text,
                        "source_type": category,
                        "source_file": name,
                    }
                )

                if len(items) >= max_items:
                    return items

    return items


def import_instagram_zip(
    db: Session,
    *,
    zip_bytes: bytes,
    current_user: User,
) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = Path(tmpdir) / "instagram_export.zip"
        zip_path.write_bytes(zip_bytes)
        items = parse_instagram_zip(zip_path)

    knowledge_count = 0
    activity_count = 0
    preview = []

    for item in items:
        try:
            knowledge = index_knowledge_item(
                db=db,
                title=item["title"],
                raw_text=item["text"],
                source_type=item["source_type"],
                source_id=item["id"],
                user_id=current_user.id,
            )
            knowledge_count += 1

            create_activity_event(
                db,
                event_type="instagram_imported",
                title=item["title"],
                description=item["text"][:240],
                source_type=item["source_type"],
                source_id=knowledge.id,
                metadata={
                    "source_file": item["source_file"],
                },
                current_user=current_user,
            )
            activity_count += 1

            if len(preview) < 8:
                preview.append(
                    {
                        "title": item["title"],
                        "source_type": item["source_type"],
                        "preview": item["text"][:240],
                    }
                )

        except Exception:
            continue

    return {
        "ok": True,
        "imported_items": len(items),
        "knowledge_items": knowledge_count,
        "activity_events": activity_count,
        "preview": preview,
    }
