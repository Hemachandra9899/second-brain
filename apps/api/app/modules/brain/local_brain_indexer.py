import re
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import ActivityEvent, BrainItem, Dream, Goal, MemoryCard, NotionTodoPage, Project, Task, WritingDocument


def _clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def upsert_brain_item(
    db: Session,
    *,
    user_id: str | None,
    source_type: str,
    source_id: str,
    title: str,
    body: str,
    source_url: str | None = None,
    tags: str | None = None,
    commit: bool = True,
) -> BrainItem | None:
    if not user_id:
        return None

    item = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == user_id)
        .filter(BrainItem.source_type == source_type)
        .filter(BrainItem.source_id == source_id)
        .first()
    )

    if not item:
        item = BrainItem(
            user_id=user_id,
            source_type=source_type,
            source_id=source_id,
            title="Untitled",
            body="",
        )
        db.add(item)

    item.title = _clean(title)[:500] or "Untitled"
    item.body = _clean(body) or item.title
    item.source_url = source_url
    item.tags = tags
    item.updated_at = datetime.utcnow()

    if commit:
        db.commit()
        db.refresh(item)

        try:
            from app.modules.brain.brain_relationship_service import relate_item_to_local_brain

            relate_item_to_local_brain(db=db, item=item)
        except Exception:
            pass

    return item


def delete_brain_item(
    db: Session,
    *,
    user_id: str | None,
    source_type: str,
    source_id: str,
    commit: bool = True,
) -> bool:
    if not user_id:
        return False

    item = (
        db.query(BrainItem)
        .filter(BrainItem.user_id == user_id)
        .filter(BrainItem.source_type == source_type)
        .filter(BrainItem.source_id == source_id)
        .first()
    )

    if not item:
        return False

    db.delete(item)

    if commit:
        db.commit()

    return True


def index_task_to_local_brain(
    db: Session,
    task: Task,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Task: {task.title}
Description: {task.description or ""}
Status: {task.status}
Priority: {task.priority}
Due date: {task.due_date or "none"}
Source: {task.source}
Notion page ID: {task.notion_page_id or "none"}
Notion block ID: {task.notion_block_id or "none"}
""".strip()

    return upsert_brain_item(
        db,
        user_id=task.user_id,
        source_type="task",
        source_id=task.id,
        title=task.title,
        body=body,
        tags=f"task,{task.status},{task.priority},{task.due_date or ''}",
        commit=commit,
    )


def index_activity_to_local_brain(
    db: Session,
    event: ActivityEvent,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Activity: {event.title}
Description: {event.description or ""}
Event type: {event.event_type}
Source type: {event.source_type or ""}
Source ID: {event.source_id or ""}
URL: {event.url or ""}
Metadata: {event.metadata_json or ""}
""".strip()

    return upsert_brain_item(
        db,
        user_id=event.user_id,
        source_type="activity",
        source_id=event.id,
        source_url=event.url,
        title=event.title,
        body=body,
        tags=event.event_type,
        commit=commit,
    )


def index_dream_to_local_brain(
    db: Session,
    dream: Dream,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Dream: {dream.title}
Summary: {dream.summary}
Patterns: {dream.patterns_json or ""}
Forgotten items: {dream.forgotten_items_json or ""}
Suggested actions: {dream.suggested_actions_json or ""}
Tomorrow plan: {dream.tomorrow_plan_json or ""}
""".strip()

    return upsert_brain_item(
        db,
        user_id=dream.user_id,
        source_type="dream",
        source_id=dream.id,
        title=dream.title,
        body=body,
        tags=f"dream,{dream.dream_type}",
        commit=commit,
    )


def index_memory_to_local_brain(
    db: Session,
    memory: MemoryCard,
    *,
    commit: bool = True,
) -> BrainItem | None:
    return upsert_brain_item(
        db,
        user_id=memory.user_id,
        source_type="memory",
        source_id=memory.id,
        title=memory.title,
        body=memory.summary,
        tags=memory.tags,
        commit=commit,
    )


def index_writing_to_local_brain(
    db: Session,
    doc: WritingDocument,
    *,
    commit: bool = True,
) -> BrainItem | None:
    return upsert_brain_item(
        db,
        user_id=doc.user_id,
        source_type="writing",
        source_id=doc.id,
        title=doc.title,
        body=doc.cleaned_markdown or doc.raw_text,
        tags=doc.source_type,
        commit=commit,
    )


def index_project_to_local_brain(
    db: Session,
    project: Project,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Project: {project.name}
Description: {project.description or ""}
Status: {project.status}
""".strip()

    return upsert_brain_item(
        db,
        user_id=project.user_id,
        source_type="project",
        source_id=project.id,
        title=project.name,
        body=body,
        tags=f"project,{project.status}",
        commit=commit,
    )


def index_goal_to_local_brain(
    db: Session,
    goal: Goal,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Goal: {goal.title}
Description: {goal.description or ""}
Project ID: {goal.project_id or ""}
Target date: {goal.target_date or ""}
Status: {goal.status}
""".strip()

    return upsert_brain_item(
        db,
        user_id=goal.user_id,
        source_type="goal",
        source_id=goal.id,
        title=goal.title,
        body=body,
        tags=f"goal,{goal.status},{goal.target_date or ''}",
        commit=commit,
    )


def index_notion_todo_page_to_local_brain(
    db: Session,
    page: NotionTodoPage,
    *,
    commit: bool = True,
) -> BrainItem | None:
    body = f"""
Notion todo page: {page.title}
Notion page ID: {page.notion_page_id}
URL: {page.notion_page_url or ""}
Data source ID: {page.data_source_id or ""}
""".strip()

    return upsert_brain_item(
        db,
        user_id=page.user_id,
        source_type="notion",
        source_id=page.notion_page_id,
        source_url=page.notion_page_url,
        title=page.title,
        body=body,
        tags="notion,todo,page",
        commit=commit,
    )
