from unittest.mock import patch
from uuid import uuid4

import pytest
from app.core.crypto import encrypt_token, decrypt_token
from app.models import NotionConnection, User
from tests.conftest import TestSessionLocal


def make_token(user_id: str) -> str:
    from datetime import datetime, timedelta
    from jose import jwt
    from app.core.config import settings

    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _add_user(db, user_id: str) -> User:
    user = User(
        id=user_id,
        provider="google",
        provider_user_id=f"google_{user_id}",
        email=f"{user_id}@test.com",
        name=f"User {user_id}",
    )
    db.add(user)
    db.commit()
    return user


class TestEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        plaintext = "secret_notion_token_123"
        encrypted = encrypt_token(plaintext)
        assert encrypted != plaintext
        decrypted = decrypt_token(encrypted)
        assert decrypted == plaintext

    def test_encryption_produces_different_outputs(self):
        plaintext = "same_token"
        e1 = encrypt_token(plaintext)
        e2 = encrypt_token(plaintext)
        assert e1 != e2


class TestNotionOAuthEndpoints:
    def test_notion_connect_requires_auth(self, client):
        res = client.get("/integrations/notion/connect")
        assert res.status_code == 401

    def test_notion_connect_returns_auth_url(self, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        _add_user(db, user_id)
        db.close()

        token = make_token(user_id)
        res = client.get(
            "/integrations/notion/connect",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "auth_url" in data
        assert "api.notion.com/v1/oauth/authorize" in data["auth_url"]
        assert user_id in data["auth_url"]

    def test_notion_status_unauthenticated(self, client):
        res = client.get("/integrations/notion/status")
        assert res.status_code == 200
        assert res.json() == {"connected": False}

    def test_notion_status_no_connection(self, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        _add_user(db, user_id)
        db.close()

        token = make_token(user_id)
        res = client.get(
            "/integrations/notion/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        assert res.json() == {"connected": False}

    @patch("app.modules.integrations.notion.notion_router.exchange_code_for_token")
    def test_notion_callback_success(self, mock_exchange, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        _add_user(db, user_id)
        db.close()

        mock_exchange.return_value = {
            "access_token": "ntn_test_access_token",
            "refresh_token": "ntn_test_refresh_token",
            "bot_id": "bot_123",
            "workspace_id": "ws_456",
            "workspace_name": "Test Workspace",
            "workspace_icon": None,
            "owner": {
                "type": "user",
                "user": {
                    "id": "owner_789",
                    "name": "Test Owner",
                    "avatar_url": None,
                    "person": {"email": "owner@test.com"},
                },
            },
        }

        res = client.get(
            "/integrations/notion/callback",
            params={"code": "test_code", "state": user_id},
            follow_redirects=False,
        )
        assert res.status_code == 307
        assert "notion=connected" in res.headers["location"]

        db2 = TestSessionLocal()
        conn = (
            db2.query(NotionConnection)
            .filter(NotionConnection.user_id == user_id)
            .first()
        )
        assert conn is not None
        assert conn.workspace_name == "Test Workspace"
        assert conn.bot_id == "bot_123"
        assert conn.owner_email == "owner@test.com"
        assert conn.encrypted_access_token != "ntn_test_access_token"

        from app.core.crypto import decrypt_token
        assert decrypt_token(conn.encrypted_access_token) == "ntn_test_access_token"
        assert decrypt_token(conn.encrypted_refresh_token) == "ntn_test_refresh_token"
        db2.close()

    def test_notion_callback_missing_code(self, client):
        res = client.get(
            "/integrations/notion/callback",
            params={"state": "some_user"},
            follow_redirects=False,
        )
        assert res.status_code == 307
        assert "notion=error" in res.headers["location"]

    def test_notion_callback_with_error(self, client):
        res = client.get(
            "/integrations/notion/callback",
            params={"error": "access_denied", "state": "some_user"},
            follow_redirects=False,
        )
        assert res.status_code == 307
        assert "notion=error" in res.headers["location"]

    def test_notion_status_after_connection(self, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        _add_user(db, user_id)
        conn = NotionConnection(
            id=str(uuid4()),
            user_id=user_id,
            encrypted_access_token=encrypt_token("test_token"),
            workspace_name="My Workspace",
            owner_email="me@test.com",
        )
        db.add(conn)
        db.commit()
        db.close()

        token = make_token(user_id)
        res = client.get(
            "/integrations/notion/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["connected"] is True
        assert data["workspace_name"] == "My Workspace"
        assert data["owner_email"] == "me@test.com"
        assert "access_token" not in data

    def test_notion_disconnect(self, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        _add_user(db, user_id)
        conn = NotionConnection(
            id=str(uuid4()),
            user_id=user_id,
            encrypted_access_token=encrypt_token("test_token"),
        )
        db.add(conn)
        db.commit()
        db.close()

        token = make_token(user_id)
        res = client.delete(
            "/integrations/notion/disconnect",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        assert res.json() == {"ok": True}

        db2 = TestSessionLocal()
        remaining = (
            db2.query(NotionConnection)
            .filter(NotionConnection.user_id == user_id)
            .first()
        )
        assert remaining is None
        db2.close()

    def test_notion_disconnect_requires_auth(self, client):
        res = client.delete("/integrations/notion/disconnect")
        assert res.status_code == 401
