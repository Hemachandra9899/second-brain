import base64
from datetime import datetime
from urllib.parse import urlencode
from uuid import uuid4

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.crypto import decrypt_token, encrypt_token
from app.models import NotionConnection, User


def build_notion_auth_url(state: str) -> str:
    if not settings.notion_oauth_client_id:
        raise RuntimeError("NOTION_OAUTH_CLIENT_ID is not configured")

    params = {
        "owner": "user",
        "client_id": settings.notion_oauth_client_id,
        "redirect_uri": settings.notion_oauth_redirect_uri,
        "response_type": "code",
        "state": state,
    }

    return f"https://api.notion.com/v1/oauth/authorize?{urlencode(params)}"


def exchange_code_for_token(code: str) -> dict:
    raw = f"{settings.notion_oauth_client_id}:{settings.notion_oauth_client_secret}"
    encoded = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

    response = requests.post(
        "https://api.notion.com/v1/oauth/token",
        headers={
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Notion-Version": settings.notion_api_version,
        },
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.notion_oauth_redirect_uri,
        },
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def upsert_notion_connection(
    db: Session,
    current_user: User,
    token_payload: dict,
) -> NotionConnection:
    owner = token_payload.get("owner") or {}
    owner_user = owner.get("user") or {}
    person = owner_user.get("person") or {}

    conn = (
        db.query(NotionConnection)
        .filter(NotionConnection.user_id == current_user.id)
        .first()
    )

    if conn is None:
        conn = NotionConnection(
            id=str(uuid4()),
            user_id=current_user.id,
            encrypted_access_token=encrypt_token(token_payload["access_token"]),
        )
        db.add(conn)
    else:
        conn.encrypted_access_token = encrypt_token(token_payload["access_token"])

    conn.encrypted_refresh_token = (
        encrypt_token(token_payload["refresh_token"])
        if token_payload.get("refresh_token")
        else None
    )
    conn.bot_id = token_payload.get("bot_id")
    conn.workspace_id = token_payload.get("workspace_id")
    conn.workspace_name = token_payload.get("workspace_name")
    conn.workspace_icon = token_payload.get("workspace_icon")

    conn.owner_type = owner.get("type")
    conn.owner_user_id = owner_user.get("id")
    conn.owner_name = owner_user.get("name")
    conn.owner_email = person.get("email")
    conn.owner_avatar_url = owner_user.get("avatar_url")
    conn.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(conn)
    return conn


def get_notion_connection(db: Session, current_user: User) -> NotionConnection | None:
    return _get_connection_by_user_id(db, current_user.id)


def _get_connection_by_user_id(db: Session, user_id: str) -> NotionConnection | None:
    return (
        db.query(NotionConnection)
        .filter(NotionConnection.user_id == user_id)
        .first()
    )


def get_notion_token(db: Session, user_id: str | None) -> str | None:
    if not user_id:
        return None
    conn = _get_connection_by_user_id(db, user_id)
    if not conn:
        return None
    return get_decrypted_token(conn)


def get_decrypted_token(conn: NotionConnection) -> str:
    return decrypt_token(conn.encrypted_access_token)


def get_decrypted_refresh_token(conn: NotionConnection) -> str | None:
    if not conn.encrypted_refresh_token:
        return None
    return decrypt_token(conn.encrypted_refresh_token)


def disconnect_notion(db: Session, current_user: User) -> None:
    conn = get_notion_connection(db, current_user)
    if conn:
        db.delete(conn)
        db.commit()


def refresh_notion_token(db: Session, conn: NotionConnection) -> NotionConnection:
    refresh_token = get_decrypted_refresh_token(conn)
    if not refresh_token:
        return conn

    raw = f"{settings.notion_oauth_client_id}:{settings.notion_oauth_client_secret}"
    encoded = base64.b64encode(raw.encode("utf-8")).decode("utf-8")

    response = requests.post(
        "https://api.notion.com/v1/oauth/token",
        headers={
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Notion-Version": settings.notion_api_version,
        },
        json={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        timeout=30,
    )

    response.raise_for_status()
    data = response.json()

    conn.encrypted_access_token = encrypt_token(data["access_token"])
    conn.encrypted_refresh_token = (
        encrypt_token(data["refresh_token"])
        if data.get("refresh_token")
        else None
    )
    conn.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(conn)
    return conn
