# Second Brain

A personal knowledge management system powered by semantic search, LLMs, and vector embeddings.

## Architecture

```
Next.js UI  →  FastAPI API  →  Postgres + Pinecone + NVIDIA + Notion + OpenWA
```

## Structure

```
second-brain/
  apps/
    web/          # Next.js frontend (port 3000)
    api/          # FastAPI backend (port 8000)
  docker-compose.yml
  docker-compose.openwa.yml
  .env.example
```

## Quick Start

```bash
cp .env.example .env
# Edit .env with your API keys
docker compose up --build
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Services

| Service | Technology | Role |
|---------|-----------|------|
| Web | Next.js (standalone) | UI |
| API | FastAPI / Python | Business logic |
| Database | PostgreSQL 16 | Source of truth |
| Vector DB | Pinecone | Semantic search |
| LLM | NVIDIA (Llama 3.1 70B) | Chat & embeddings |
| Sync | Notion API | Task sync target |
| Messaging | OpenWA | WhatsApp gateway |
| Cache | Redis | Rate limiting / sessions |

## Data Flow

```
User creates task in Next.js
        ↓
FastAPI /tasks
        ↓
Save task in Postgres
        ↓
Create embedding → upsert to Pinecone
        ↓
Optional: sync to Notion
        ↓
Optional: send/receive WhatsApp via OpenWA
```

## Environment Variables

See `.env.example` for all required config. Never commit `.env` to git.
