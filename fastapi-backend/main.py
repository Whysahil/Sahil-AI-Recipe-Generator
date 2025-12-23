import os
from typing import List

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DEFAULT_MODEL = "gpt-4o-mini"

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role for the message, e.g., user/system/assistant")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = Field(0.7, ge=0, le=2)
    model: str = DEFAULT_MODEL

class ChatResponse(BaseModel):
    content: str

app = FastAPI(title="Recipe Generator API", version="0.1.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN")
allow_origins = [frontend_origin] if frontend_origin else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate-recipe", response_model=ChatResponse)
async def generate_recipe(payload: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set on the server")

    body = {
        "model": payload.model or DEFAULT_MODEL,
        "messages": [msg.model_dump() for msg in payload.messages],
        "temperature": payload.temperature,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        upstream = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=body,
        )

    if upstream.status_code >= 400:
        # Bubble up upstream error text to help debugging
        text = upstream.text
        raise HTTPException(status_code=upstream.status_code, detail=text)

    data = upstream.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content")
    )

    if not content or not isinstance(content, str):
        raise HTTPException(status_code=502, detail="Invalid response format from OpenAI")

    return {"content": content}
