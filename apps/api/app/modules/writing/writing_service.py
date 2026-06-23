import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import Task, User, WritingDocument
from app.modules.activity.activity_service import create_activity_event
from app.modules.brain.local_brain_indexer import index_writing_to_local_brain
from app.modules.knowledge.knowledge_service import index_knowledge_item
from app.services.llm_nvidia import ask_json_fast


def _blocks_to_markdown(blocks: list[dict]) -> str:
    lines = []

    for block in blocks:
        block_type = block.get("type")
        text = block.get("text", "")

        if block_type == "heading":
            lines.append(f"# {text}")
        elif block_type == "todo":
            checked = "x" if block.get("checked") else " "
            lines.append(f"- [{checked}] {text}")
        elif block_type == "bullet":
            lines.append(f"- {text}")
        elif block_type == "quote":
            lines.append(f"> {text}")
        else:
            lines.append(text)

    return "\n".join(lines).strip()


def clean_writing_text(text: str) -> dict:
    prompt = f"""
Clean this messy Second Brain writing into structured blocks.

Return strict JSON only:
{{
  "title": "short title",
  "cleaned_markdown": "clean markdown",
  "blocks": [
    {{"type":"heading","text":"Todo"}},
    {{"type":"todo","text":"Example task","checked":false}}
  ],
  "tasks": [
    {{"title":"Example task","description":"", "priority":"Normal", "due_date":null}}
  ],
  "topics": [],
  "projects": [],
  "goals": []
}}

Rules:
- Preserve user meaning.
- Convert numbered todos into checklist items.
- If text contains todos, use todo blocks.
- Do not invent facts.
- Keep title short.

Text:
{text}
""".strip()

    fallback_blocks = _fallback_blocks(text)

    return ask_json_fast(
        prompt=prompt,
        system="You clean messy notes into structured Second Brain writing JSON.",
        fallback={
            "title": "Writing",
            "blocks": fallback_blocks,
            "cleaned_markdown": _blocks_to_markdown(fallback_blocks),
            "tasks": [
                {
                    "title": b["text"],
                    "description": "",
                    "priority": "Normal",
                    "due_date": None,
                }
                for b in fallback_blocks
                if b.get("type") == "todo"
            ],
            "topics": [],
            "projects": [],
            "goals": [],
        },
    )


def _fallback_blocks(text: str) -> list[dict]:
    import re

    matches = re.findall(r"(?:^|\s)\d+\.\s*([^0-9]+?)(?=\s+\d+\.|$)", text)
    items = [m.strip(" ?.-") for m in matches if m.strip(" ?.-")]

    if items:
        return [{"type": "heading", "text": "Todo"}] + [
            {"type": "todo", "text": item, "checked": False} for item in items
        ]

    return [
        {"type": "heading", "text": "Note"},
        {"type": "paragraph", "text": text.strip()},
    ]


def create_writing_document(
    db: Session,
    raw_text: str,
    title: str | None = None,
    cleaned_markdown: str | None = None,
    blocks: list[dict] | None = None,
    source_type: str = "manual",
    current_user: User | None = None,
) -> WritingDocument:
    if blocks is None:
        cleaned = clean_writing_text(raw_text)
        blocks = cleaned.get("blocks", [])
        cleaned_markdown = cleaned.get("cleaned_markdown")
        title = title or cleaned.get("title")

    doc = WritingDocument(
        id=str(uuid4()),
        user_id=current_user.id if current_user else None,
        title=title or "Untitled",
        raw_text=raw_text,
        cleaned_markdown=cleaned_markdown or _blocks_to_markdown(blocks),
        blocks_json=json.dumps(blocks),
        source_type=source_type,
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        index_knowledge_item(
            db=db,
            title=doc.title,
            raw_text=doc.cleaned_markdown or doc.raw_text,
            source_type="writing",
            source_id=doc.id,
            user_id=doc.user_id,
        )
    except Exception:
        pass

    try:
        create_activity_event(
            db,
            event_type="writing_saved",
            title=doc.title,
            description="Saved a writing block",
            source_type="writing",
            source_id=doc.id,
            metadata={
                "source_type": doc.source_type,
            },
            current_user=current_user,
            user_id=doc.user_id,
        )
    except Exception:
        pass

    try:
        index_writing_to_local_brain(db=db, doc=doc)
    except Exception:
        pass

    return doc


def extract_tasks_from_writing(
    db: Session,
    doc: WritingDocument,
    current_user: User | None = None,
) -> list[Task]:
    blocks = json.loads(doc.blocks_json or "[]")
    created = []

    for block in blocks:
        if block.get("type") != "todo":
            continue

        title = block.get("text", "").strip()
        if not title:
            continue

        task = Task(
            id=str(uuid4()),
            user_id=current_user.id if current_user else doc.user_id,
            title=title,
            description=f"Extracted from writing: {doc.title}",
            status="Todo",
            priority="Normal",
            source="writing",
        )

        db.add(task)
        created.append(task)

    db.commit()

    for task in created:
        db.refresh(task)

    try:
        create_activity_event(
            db,
            event_type="tasks_extracted",
            title=f"{len(created)} task(s) extracted",
            description=f"Extracted tasks from writing: {doc.title}",
            source_type="writing",
            source_id=doc.id,
            metadata={
                "tasks_created": len(created),
                "task_ids": [task.id for task in created],
            },
            user_id=doc.user_id,
        )
    except Exception:
        pass

    return created


def serialize_writing(doc: WritingDocument) -> dict:
    return {
        "id": doc.id,
        "title": doc.title,
        "raw_text": doc.raw_text,
        "cleaned_markdown": doc.cleaned_markdown,
        "blocks": json.loads(doc.blocks_json or "[]"),
        "source_type": doc.source_type,
        "notion_page_id": doc.notion_page_id,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }
