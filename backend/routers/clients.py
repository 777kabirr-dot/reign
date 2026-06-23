"""Client CRUD endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from schemas import ClientIn, ClientOut
from store import store

router = APIRouter(prefix="/clients", tags=["clients"])


def _to_out(row: dict) -> ClientOut:
    data = {**row}
    data.pop("wp_pass", None)
    return ClientOut(
        id=row["id"],
        wp_configured=bool(row.get("wp_url") and row.get("wp_user") and row.get("wp_pass")),
        last_generated_at=row.get("last_generated_at"),
        created_at=row.get("created_at"),
        **{
            k: row.get(k, "")
            for k in (
                "name", "brand", "industry", "tone", "keywords",
                "brief", "location", "wp_url", "wp_user",
            )
        },
    )


@router.get("", response_model=list[ClientOut])
def list_clients():
    return [_to_out(r) for r in store.list_clients()]


@router.post("", response_model=ClientOut, status_code=201)
def create_client(payload: ClientIn):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")
    row = store.create_client(payload.model_dump())
    return _to_out(row)


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: str):
    row = store.get_client(client_id)
    if not row:
        raise HTTPException(status_code=404, detail="Client not found.")
    return _to_out(row)


@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: str, payload: ClientIn):
    existing = store.get_client(client_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found.")
    data = payload.model_dump()
    # Don't wipe a stored WordPress password if the form left it blank.
    if not data.get("wp_pass"):
        data["wp_pass"] = existing.get("wp_pass", "")
    row = store.update_client(client_id, data)
    return _to_out(row)


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: str):
    if not store.get_client(client_id):
        raise HTTPException(status_code=404, detail="Client not found.")
    store.delete_client(client_id)
