"""Reign Content Publisher — FastAPI entrypoint.

Run locally with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from routers import clients, content, generate, settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Reign Content Publisher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(generate.router)
app.include_router(content.router)
app.include_router(settings.router)


@app.get("/health")
def health():
    from store import store

    return {"status": "ok", "store": store.backend}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=config.port(), reload=True)
