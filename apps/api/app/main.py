from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app.db.migrate import run_migrations
from app.modules.auth.auth_router import router as auth_router
from app.modules.chat.chat_router import router as chat_router
from app.modules.tasks.task_router import router as task_router
from app.modules.knowledge.knowledge_router import router as knowledge_router
from app.modules.mood.mood_router import router as mood_router
from app.modules.capture.capture_router import router as capture_router
from app.modules.brief.brief_router import router as brief_router
from app.modules.memory.memory_router import router as memory_router
from app.modules.projects.project_router import router as project_router
from app.modules.demo.demo_router import router as demo_router
from app.modules.integrations.whatsapp.whatsapp_router import router as whatsapp_router
from app.modules.integrations.notion.notion_router import router as notion_router
from app.modules.integrations.notion.notion_todo_router import router as notion_todo_router
from app.modules.writing.writing_router import router as writing_router
from app.modules.activity.activity_router import router as activity_router
from app.modules.brain.brain_router import router as brain_router
from app.modules.uploads.upload_router import router as upload_router
from app.modules.imports.instagram_router import router as instagram_import_router
from app.modules.dreams.dream_router import router as dream_router


Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="Second Brain API", version="0.2.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.frontend_url and settings.frontend_url not in origins:
    origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": "Second Brain API",
        "version": "0.2.0",
        "env": settings.env,
        "endpoints": {
            "health": "/health",
            "auth_google": "/auth/google",
            "capture": "/capture",
            "brief_today": "/brief/today",
            "memory_consolidate": "/memory/consolidate",
            "memory_cards": "/memory/cards",
            "projects": "/projects",
            "projects_goals": "/projects/goals",
            "tasks": "/tasks",
            "chat": "/chat",
            "assistant": "/chat",
            "knowledge": "/knowledge/items",
            "knowledge_ask": "/knowledge/ask",
            "mood_detect": "/mood/detect",
            "mood_latest": "/mood/latest",
            "notion_sync": "/integrations/notion/sync/pull",
            "notion_bootstrap": "/integrations/notion/bootstrap",
            "whatsapp_webhook": "/integrations/whatsapp/webhook",
            "demo_seed": "/demo/seed",
        },
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(task_router, prefix="/tasks", tags=["tasks"])
app.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])
app.include_router(mood_router, prefix="/mood", tags=["mood"])
app.include_router(capture_router, prefix="/capture", tags=["capture"])
app.include_router(brief_router, prefix="/brief", tags=["brief"])
app.include_router(memory_router, prefix="/memory", tags=["memory"])
app.include_router(project_router, prefix="/projects", tags=["projects"])
app.include_router(demo_router, prefix="/demo", tags=["demo"])
app.include_router(notion_router, prefix="/integrations/notion", tags=["notion"])
app.include_router(notion_todo_router, prefix="/integrations/notion", tags=["notion"])
app.include_router(whatsapp_router, prefix="/integrations/whatsapp", tags=["whatsapp"])
app.include_router(writing_router, prefix="/writing", tags=["writing"])
app.include_router(activity_router, prefix="/activity", tags=["activity"])
app.include_router(brain_router, prefix="/brain", tags=["brain"])
app.include_router(upload_router, prefix="/uploads", tags=["uploads"])
app.include_router(instagram_import_router, prefix="/imports", tags=["imports"])
app.include_router(dream_router, prefix="/dreams", tags=["dreams"])
