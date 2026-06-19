import json
from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.models import Entity, Relationship
from app.services.llm_nvidia import ask_llm


def _safe_json_loads(text: str):
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end >= 0:
            return json.loads(text[start : end + 1])
        return {"entities": [], "relationships": []}


def extract_entities_and_relationships(title: str, text: str) -> dict:
    prompt = f"""
Extract a small knowledge graph from this text.

Return strict JSON only:
{{
  "entities": [
    {{"name": "entity name", "type": "person|project|topic|task|tool|date|company|other"}}
  ],
  "relationships": [
    {{"from": "entity name", "to": "entity name", "type": "mentions|related_to|depends_on|belongs_to|scheduled_for|uses"}}
  ]
}}

Title:
{title}

Text:
{text}
""".strip()

    result = ask_llm(
        prompt,
        system="You extract compact knowledge graphs. Return valid JSON only.",
    )

    return _safe_json_loads(result)


def get_or_create_entity(db: Session, name: str, type_: str) -> Entity:
    normalized_name = name.strip()

    existing = (
        db.query(Entity)
        .filter(Entity.name == normalized_name)
        .filter(Entity.type == type_)
        .first()
    )

    if existing:
        return existing

    entity = Entity(
        id=str(uuid4()),
        name=normalized_name,
        type=type_,
    )

    db.add(entity)
    db.commit()
    db.refresh(entity)

    return entity


def extract_and_store_graph(db: Session, source_item_id: str, title: str, text: str):
    graph = extract_entities_and_relationships(title=title, text=text)

    entities = graph.get("entities", [])
    relationships = graph.get("relationships", [])

    entity_map = {}

    for entity_data in entities:
        name = entity_data.get("name")
        type_ = entity_data.get("type", "other")

        if not name:
            continue

        entity = get_or_create_entity(db, name=name, type_=type_)
        entity_map[name] = entity

    source_entity = get_or_create_entity(
        db=db,
        name=f"knowledge_item:{source_item_id}",
        type_="source",
    )

    for entity in entity_map.values():
        relationship = Relationship(
            id=str(uuid4()),
            from_entity_id=source_entity.id,
            to_entity_id=entity.id,
            relation_type="mentions",
        )
        db.add(relationship)

    for rel in relationships:
        from_name = rel.get("from")
        to_name = rel.get("to")
        rel_type = rel.get("type", "related_to")

        if from_name not in entity_map or to_name not in entity_map:
            continue

        relationship = Relationship(
            id=str(uuid4()),
            from_entity_id=entity_map[from_name].id,
            to_entity_id=entity_map[to_name].id,
            relation_type=rel_type,
        )

        db.add(relationship)

    db.commit()


def get_related_graph_context(db: Session, entity_names: list[str], limit: int = 20) -> list[dict]:
    if not entity_names:
        return []

    entities = db.query(Entity).filter(Entity.name.in_(entity_names)).all()
    entity_ids = [entity.id for entity in entities]

    if not entity_ids:
        return []

    relationships = (
        db.query(Relationship)
        .filter(
            (Relationship.from_entity_id.in_(entity_ids))
            | (Relationship.to_entity_id.in_(entity_ids))
        )
        .limit(limit)
        .all()
    )

    id_to_entity = {
        entity.id: entity
        for entity in db.query(Entity).all()
    }

    context = []

    for rel in relationships:
        from_entity = id_to_entity.get(rel.from_entity_id)
        to_entity = id_to_entity.get(rel.to_entity_id)

        if not from_entity or not to_entity:
            continue

        context.append(
            {
                "from": from_entity.name,
                "to": to_entity.name,
                "type": rel.relation_type,
            }
        )

    return context
