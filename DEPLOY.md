# Deployment

## Architecture

| Component | Platform   |
|-----------|------------|
| Frontend  | Vercel     |
| Backend   | Render     |
| Database  | Neon (PostgreSQL) |
| Vector DB | Pinecone   |
| LLM       | NVIDIA API |
| Notion    | optional   |

## Environment Variables

### Render (Backend) — `apps/api`

```
ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
DATABASE_URL=postgresql://...
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=meta/llama-3.1-70b-instruct
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=second-brain-demo
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
PINECONE_DIMENSION=1024
NOTION_API_KEY=optional
NOTION_TASKS_DATABASE_ID=optional
```

### Vercel (Frontend) — `apps/web`

```
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

## Steps

### 1. Deploy Backend to Render

1. Push repo to GitHub.
2. On Render, create a new **Web Service**.
3. Connect your GitHub repo.
4. Set **Root Directory** to `apps/api`.
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add all env vars from above.
8. Deploy.

### 2. Deploy Frontend to Vercel

1. On Vercel, create a new project from the same GitHub repo.
2. Set **Root Directory** to `apps/web`.
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com`.
4. Deploy.

### 3. Seed Demo Data

```bash
curl -X POST https://your-render-backend.onrender.com/demo/seed
```

### 4. Verify

```bash
curl https://your-render-backend.onrender.com/health
curl https://your-render-backend.onrender.com/
```

Open the Vercel URL in a browser.

## Notion (optional)

If you want Notion sync in production:

1. Share your Notion database with the Second Brain integration.
2. Set `NOTION_API_KEY` and `NOTION_TASKS_DATABASE_ID` on Render.
3. Sync via `/integrations/notion/sync/pull` or the Integrations page.

## WhatsApp / OpenWA

Not deployed in public demo. Requires self-hosted OpenWA.

## Local Production Test

```bash
cd apps/api
ENV=production uvicorn app.main:app --port 8000

cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
