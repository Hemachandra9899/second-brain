import pytest


class TestBasicEndpoints:
    def test_root(self, client):
        res = client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert "app" in data
        assert "endpoints" in data

    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

    def test_docs(self, client):
        res = client.get("/docs")
        assert res.status_code == 200


class TestCaptureEndpoint:
    def test_capture_note(self, client):
        res = client.post("/capture", json={"text": "Remember to buy groceries"})
        assert res.status_code == 200
        data = res.json()
        assert data["capture_type"] in ("task", "note", "idea", "link", "meeting_note", "question", "project_update")

    def test_capture_empty(self, client):
        res = client.post("/capture", json={"text": ""})
        assert res.status_code == 200


class TestBriefEndpoint:
    def test_today_brief(self, client):
        res = client.get("/brief/today")
        assert res.status_code == 200
        data = res.json()
        assert "greeting" in data
        assert "summary" in data


class TestTasksEndpoint:
    def test_list_tasks(self, client):
        res = client.get("/tasks")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_task(self, client):
        res = client.post("/tasks", json={"title": "Test task", "status": "Todo"})
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Test task"
        assert "id" in data

    def test_create_and_delete_task(self, client):
        create = client.post("/tasks", json={"title": "Delete me"})
        task_id = create.json()["id"]
        delete = client.delete(f"/tasks/{task_id}")
        assert delete.status_code == 200
        assert delete.json()["ok"] is True


class TestKnowledgeEndpoint:
    def test_list_items(self, client):
        res = client.get("/knowledge/items")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_ask(self, client):
        res = client.post("/knowledge/ask", json={"query": "What do I know?"})
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data

    def test_create_knowledge_item(self, client):
        res = client.post("/knowledge/items", json={
            "title": "Test note",
            "raw_text": "This is a test note for the knowledge base.",
            "source_type": "note",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Test note"
        assert "id" in data


class TestMoodEndpoint:
    def test_detect_mood(self, client):
        res = client.post("/mood/detect", json={"text": "I feel great today!"})
        assert res.status_code == 200
        data = res.json()
        assert "mood" in data
        assert "theme" in data

    def test_latest_mood(self, client):
        res = client.get("/mood/latest")
        assert res.status_code == 200
        data = res.json()
        assert "mood" in data


class TestMemoryEndpoint:
    def test_consolidate(self, client):
        res = client.post("/memory/consolidate")
        assert res.status_code == 200
        data = res.json()
        assert "ok" in data

    def test_list_cards(self, client):
        res = client.get("/memory/cards")
        assert res.status_code == 200
        assert isinstance(res.json(), list)


class TestProjectsEndpoint:
    def test_create_project(self, client):
        res = client.post("/projects", json={"name": "Test Project"})
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Test Project"
        assert "id" in data

    def test_list_projects(self, client):
        res = client.get("/projects")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_goal(self, client):
        res = client.post("/projects/goals", json={"title": "Test Goal"})
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Test Goal"


class TestDemoEndpoint:
    def test_seed(self, client):
        res = client.post("/demo/seed")
        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert "task_id" in data
        assert "knowledge_item_id" in data
