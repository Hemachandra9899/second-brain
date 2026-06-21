import json
import re
import tempfile
import zipfile
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import ImportJob, KnowledgeItem, User
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


def import_instagram_zip_from_path(
    db: Session,
    *,
    zip_path: Path,
    current_user: User,
) -> dict:
    try:
        items = parse_instagram_zip(zip_path)
    except Exception as exc:
        return {
            "ok": False,
            "imported_items": 0,
            "knowledge_items": 0,
            "activity_events": 0,
            "preview": [],
            "error": f"Could not parse ZIP: {str(exc)}",
        }

    knowledge_count = 0
    activity_count = 0
    preview = []

    for item in items[:100]:
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

        except Exception as exc:
            print(f"INSTAGRAM_ITEM_IMPORT_FAILED: {repr(exc)}", flush=True)
            continue

    return {
        "ok": True,
        "imported_items": len(items),
        "knowledge_items": knowledge_count,
        "activity_events": activity_count,
        "preview": preview,
    }


MAX_IMPORT_ITEMS = 250


def process_instagram_import_job(
    job_id: str,
    zip_path_str: str,
    user_id: str,
):
    db = SessionLocal()
    zip_path = Path(zip_path_str)

    try:
        job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
        if not job:
            print(f"INSTAGRAM_IMPORT_JOB_NOT_FOUND: {job_id}", flush=True)
            return

        job.status = "processing"
        db.commit()

        items = parse_instagram_zip(zip_path, max_items=MAX_IMPORT_ITEMS)

        job.total_items = len(items)
        db.commit()

        for index, item in enumerate(items[:MAX_IMPORT_ITEMS], start=1):
            try:
                knowledge = KnowledgeItem(
                    user_id=user_id,
                    title=item["title"],
                    raw_text=item["text"],
                    source_type=item["source_type"],
                    source_id=item["id"],
                )
                db.add(knowledge)
                db.commit()
                db.refresh(knowledge)

                create_activity_event(
                    db,
                    event_type="instagram_imported",
                    title=item["title"],
                    description=item["text"][:240],
                    source_type=item["source_type"],
                    source_id=str(knowledge.id),
                    metadata={
                        "source_file": item.get("source_file"),
                    },
                    user_id=user_id,
                )

                job.knowledge_items += 1
                job.activity_events += 1
                job.processed_items = index

                if index % 10 == 0:
                    db.commit()

            except Exception as exc:
                print(f"INSTAGRAM_ITEM_FAILED {index}: {repr(exc)}", flush=True)
                job.processed_items = index
                db.commit()
                continue

        job.status = "completed"
        db.commit()

    except Exception as exc:
        print(f"INSTAGRAM_IMPORT_JOB_FAILED: {repr(exc)}", flush=True)

        try:
            job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error = str(exc)
                db.commit()
        except Exception:
            pass

    finally:
        db.close()

        try:
            zip_path.unlink(missing_ok=True)
        except Exception:
            pass
