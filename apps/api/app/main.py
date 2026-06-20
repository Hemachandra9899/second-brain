from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app.db.migrate import run_migrations
from app.routers import auth, health, tasks, chat, notion, whatsapp, knowledge, mood, demo, capture, brief, memory, projects


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


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(notion.router, prefix="/integrations/notion", tags=["notion"])
app.include_router(whatsapp.router, prefix="/integrations/whatsapp", tags=["whatsapp"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(mood.router, prefix="/mood", tags=["mood"])
app.include_router(demo.router, prefix="/demo", tags=["demo"])
app.include_router(capture.router, prefix="/capture", tags=["capture"])
app.include_router(brief.router, prefix="/brief", tags=["brief"])
app.include_router(memory.router, prefix="/memory", tags=["memory"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
