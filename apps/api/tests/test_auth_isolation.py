from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.models import User, Task, KnowledgeItem
from app.db.session import Base
from tests.conftest import test_engine, TestSessionLocal


def make_token(user_id: str) -> str:
    import jwt
    from app.core.config import settings
    return jwt.encode(
        {"sub": user_id, "email": "test@example.com"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


class TestAuthIsolation:
    def _add_user(self, db, user_id: str):
        user = User(
            id=user_id,
            provider="google",
            provider_user_id=f"google_{user_id}",
            email=f"{user_id}@example.com",
            name=f"User {user_id}",
        )
        db.add(user)
        db.commit()

    def _add_task(self, db, user_id: str | None, title: str):
        task = Task(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            status="Todo",
            priority="Normal",
            source="test",
        )
        db.add(task)
        db.commit()

    def test_public_data_shows_without_auth(self, client):
        db = TestSessionLocal()
        self._add_task(db, user_id=None, title="Public task")
        db.close()

        res = client.get("/tasks")
        assert res.status_code == 200
        tasks = res.json()
        titles = [t["title"] for t in tasks]
        assert "Public task" in titles

    def test_logged_in_user_sees_only_own_data(self, client):
        db = TestSessionLocal()
        user_a_id = str(uuid4())
        user_b_id = str(uuid4())
        self._add_user(db, user_a_id)
        self._add_user(db, user_b_id)
        self._add_task(db, user_id=user_a_id, title="User A task")
        self._add_task(db, user_id=user_b_id, title="User B task")
        db.close()

        token_a = make_token(user_a_id)
        res = client.get("/tasks", headers={"Authorization": f"Bearer {token_a}"})
        assert res.status_code == 200
        tasks = res.json()
        titles = [t["title"] for t in tasks]
        assert "User A task" in titles
        assert "User B task" not in titles

    def test_anonymous_task_visible_to_logged_in_user(self, client):
        db = TestSessionLocal()
        user_id = str(uuid4())
        self._add_user(db, user_id)
        self._add_task(db, user_id=None, title="Public anonymous task")
        self._add_task(db, user_id=user_id, title="My own task")
        db.close()

        token = make_token(user_id)
        res = client.get("/tasks", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        tasks = res.json()
        titles = [t["title"] for t in tasks]
        assert "Public anonymous task" in titles
        assert "My own task" in titles

    def test_knowledge_isolation(self, client):
        db = TestSessionLocal()
        user_a_id = str(uuid4())
        user_b_id = str(uuid4())
        self._add_user(db, user_a_id)
        self._add_user(db, user_b_id)

        item_a = KnowledgeItem(
            id=str(uuid4()),
            user_id=user_a_id,
            source_type="note",
            source_id="test",
            title="User A note",
            raw_text="Secret A content",
        )
        item_b = KnowledgeItem(
            id=str(uuid4()),
            user_id=user_b_id,
            source_type="note",
            source_id="test",
            title="User B note",
            raw_text="Secret B content",
        )
        db.add_all([item_a, item_b])
        db.commit()
        db.close()

        token_a = make_token(user_a_id)
        res = client.get("/knowledge/items", headers={"Authorization": f"Bearer {token_a}"})
        assert res.status_code == 200
        items = res.json()
        titles = [i["title"] for i in items]
        assert "User A note" in titles
        assert "User B note" not in titles

    def test_project_isolation(self, client):
        from app.models import Project

        db = TestSessionLocal()
        user_a_id = str(uuid4())
        user_b_id = str(uuid4())
        self._add_user(db, user_a_id)
        self._add_user(db, user_b_id)

        proj_a = Project(id=str(uuid4()), user_id=user_a_id, name="User A Project")
        proj_b = Project(id=str(uuid4()), user_id=user_b_id, name="User B Project")
        db.add_all([proj_a, proj_b])
        db.commit()
        db.close()

        token_a = make_token(user_a_id)
        res = client.get("/projects", headers={"Authorization": f"Bearer {token_a}"})
        assert res.status_code == 200
        projects = res.json()
        names = [p["name"] for p in projects]
        assert "User A Project" in names
        assert "User B Project" not in names
