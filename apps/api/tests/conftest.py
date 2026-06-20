import json
import os
from unittest.mock import MagicMock

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["NVIDIA_API_KEY"] = "test_nvidia_key"
os.environ["NVIDIA_BASE_URL"] = "https://test.nvidia.com/v1"
os.environ["PINECONE_API_KEY"] = "test_pinecone_key"
os.environ["GOOGLE_CLIENT_ID"] = "test_google_client_id"
os.environ["JWT_SECRET"] = "test_jwt_secret"
os.environ["NOTION_OAUTH_CLIENT_ID"] = "test_notion_client_id"
os.environ["NOTION_OAUTH_CLIENT_SECRET"] = "test_notion_client_secret"
os.environ["NOTION_OAUTH_REDIRECT_URI"] = "http://localhost:8000/integrations/notion/callback"
os.environ["NOTION_API_VERSION"] = "2026-03-11"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db


mock_llm_response = MagicMock()
mock_llm_response.choices = [
    MagicMock(message=MagicMock(content="Mock LLM response"))
]

mock_embed_response = MagicMock()
mock_embed_response.data = [
    MagicMock(embedding=[0.1] * 1024)
]


import app.services.llm_nvidia
import app.services.embedding_service
import app.services.pinecone_store

app.services.llm_nvidia.client = MagicMock()
app.services.llm_nvidia.client.chat.completions.create.return_value = mock_llm_response

app.services.embedding_service.client = MagicMock()
app.services.embedding_service.client.embeddings.create.return_value = mock_embed_response

app.services.pinecone_store.pc = MagicMock()
app.services.pinecone_store.pc.list_indexes.return_value = [{"name": "second-brain"}]
app.services.pinecone_store.pc.Index.return_value.query.return_value = {"matches": []}
app.services.pinecone_store.pc.Index.return_value.upsert.return_value = None
app.services.pinecone_store.pc.Index.return_value.delete.return_value = None

from app.main import app


test_engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})


@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)
