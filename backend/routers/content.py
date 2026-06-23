"""Content library + dashboard stats endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from schemas import CONTENT_TYPES
from store import store

router = APIRouter(tags=["content"])


def _enrich(rows: list[dict], clients_by_id: dict[str, dict]) -> list[dict]:
    out = []
    for r in rows:
        meta = CONTENT_TYPES.get(r["type"], {"label": r["type"]})
        client = clients_by_id.get(r["client_id"], {})
        out.append(
            {
                **r,
                "type_label": meta["label"],
                "client_name": client.get("name", "Unknown client"),
            }
        )
    return out


@router.get("/content")
def list_content(
    client_id: str | None = None,
    type: str | None = None,
    platform: str | None = None,
    month: str | None = None,
    limit: int | None = None,
):
    rows = store.list_content(
        client_id=client_id, type_=type, platform=platform, month=month, limit=limit
    )
    clients_by_id = {c["id"]: c for c in store.list_clients()}
    return _enrich(rows, clients_by_id)


@router.get("/stats")
def stats():
    return store.stats()


@router.get("/dashboard")
def dashboard():
    clients = store.list_clients()
    clients_by_id = {c["id"]: c for c in clients}
    recent = _enrich(store.list_content(limit=10), clients_by_id)
    return {
        "stats": store.stats(),
        "recent": recent,
        "clients": [
            {
                "id": c["id"],
                "name": c.get("name", ""),
                "tone": c.get("tone", ""),
                "industry": c.get("industry", ""),
                "last_generated_at": c.get("last_generated_at"),
            }
            for c in clients
        ],
        "content_types": CONTENT_TYPES,
        "backend": store.backend,
    }
