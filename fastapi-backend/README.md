# FastAPI backend for Recipe Generator

Minimal FastAPI service mirroring the existing Vercel endpoints.

## Endpoints
- POST /api/generate-recipe — same payload/response as the current app: `messages` (array), optional `temperature` (default 0.7), optional `model` (default gpt-4o-mini). Returns `{ "content": "..." }`.
- GET /health — simple health check.

## Env vars
- OPENAI_API_KEY (required)
- FRONTEND_ORIGIN (optional, e.g., https://your-vercel-app.com for CORS; defaults to *)

## Setup (local)
```bash
python -m venv .venv
# activate the venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Deploy
Use any Python-friendly host (Railway/Render/Fly/Azure/AWS). Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
Set env vars in your host panel.

## Notes
- CORS allows only FRONTEND_ORIGIN if set, otherwise "*".
- Timeout to OpenAI is 30s; upstream errors bubble via HTTPException.
