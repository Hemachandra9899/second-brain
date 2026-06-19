from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, tasks, chat, notion, whatsapp


app = FastAPI(title="Second Brain API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(notion.router, prefix="/integrations/notion", tags=["notion"])
app.include_router(whatsapp.router, prefix="/integrations/whatsapp", tags=["whatsapp"])
