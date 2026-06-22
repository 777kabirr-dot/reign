"""
Supabase client wrapper for Reign OS.

Thin, typed-ish helpers around the Supabase Python SDK so the agents and
FastAPI routes never touch raw SDK calls directly. All functions are
synchronous (the Supabase SDK is sync); agents call them inside async code,
which is fine because the calls are short-lived network requests.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

_client: Optional[Client] = None


def get_client() -> Client:
    """Return a singleton Supabase client built from env vars."""
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set in the environment."
            )
        _client = create_client(url, key)
    return _client


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────────────────────────
# Clients
# ─────────────────────────────────────────────────────────────────
def list_clients(active_only: bool = False) -> list[dict[str, Any]]:
    q = get_client().table("clients").select("*").order("created_at", desc=True)
    if active_only:
        q = q.eq("status", "active")
    return q.execute().data or []


def get_client_by_slug(slug: str) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("clients")
        .select("*")
        .eq("slug", slug)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def get_client_by_id(client_id: str) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("clients")
        .select("*")
        .eq("id", client_id)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def create_client_row(payload: dict[str, Any]) -> dict[str, Any]:
    return get_client().table("clients").insert(payload).execute().data[0]


def update_client_context(slug: str, context: str) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("clients")
        .update({"context": context})
        .eq("slug", slug)
        .execute()
        .data
    )
    return rows[0] if rows else None


# ─────────────────────────────────────────────────────────────────
# Mentions
# ─────────────────────────────────────────────────────────────────
def mention_exists(client_id: str, url: str) -> bool:
    rows = (
        get_client()
        .table("mentions")
        .select("id")
        .eq("client_id", client_id)
        .eq("url", url)
        .limit(1)
        .execute()
        .data
    )
    return bool(rows)


def insert_mention(payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    rows = get_client().table("mentions").insert(payload).execute().data
    return rows[0] if rows else None


def list_mentions(
    client_id: Optional[str] = None,
    severity: Optional[str] = None,
    sentiment: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    q = get_client().table("mentions").select("*, clients(name, slug)")
    if client_id:
        q = q.eq("client_id", client_id)
    if severity:
        q = q.eq("severity", severity)
    if sentiment:
        q = q.eq("sentiment", sentiment)
    if status:
        q = q.eq("status", status)
    q = q.order("detected_at", desc=True).range(offset, offset + limit - 1)
    return q.execute().data or []


def mentions_for_client_by_severity(
    client_id: str, severities: list[str], status: Optional[str] = None
) -> list[dict[str, Any]]:
    q = (
        get_client()
        .table("mentions")
        .select("*")
        .eq("client_id", client_id)
        .in_("severity", severities)
    )
    if status:
        q = q.eq("status", status)
    return q.order("detected_at", desc=True).execute().data or []


def update_mention_status(mention_id: str, status: str) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("mentions")
        .update({"status": status})
        .eq("id", mention_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


# ─────────────────────────────────────────────────────────────────
# Content
# ─────────────────────────────────────────────────────────────────
def insert_content(payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    rows = get_client().table("content_published").insert(payload).execute().data
    return rows[0] if rows else None


def list_content(
    client_id: Optional[str] = None,
    month: Optional[str] = None,
    limit: int = 200,
) -> list[dict[str, Any]]:
    q = get_client().table("content_published").select("*, clients(name, slug)")
    if client_id:
        q = q.eq("client_id", client_id)
    if month:
        # month is "YYYY-MM"
        start = f"{month}-01T00:00:00+00:00"
        q = q.gte("published_at", start)
    return (
        q.order("published_at", desc=True).limit(limit).execute().data or []
    )


# ─────────────────────────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────────────────────────
def insert_report(payload: dict[str, Any]) -> dict[str, Any]:
    return get_client().table("reports").insert(payload).execute().data[0]


def list_reports(
    client_id: Optional[str] = None, month: Optional[str] = None
) -> list[dict[str, Any]]:
    q = get_client().table("reports").select("*, clients(name, slug)")
    if client_id:
        q = q.eq("client_id", client_id)
    if month:
        q = q.eq("month", month)
    return q.order("generated_at", desc=True).execute().data or []


def get_report(report_id: str) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("reports")
        .select("*")
        .eq("id", report_id)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


# ─────────────────────────────────────────────────────────────────
# Legal drafts
# ─────────────────────────────────────────────────────────────────
def insert_legal_draft(payload: dict[str, Any]) -> dict[str, Any]:
    return get_client().table("legal_drafts").insert(payload).execute().data[0]


def list_legal_drafts(
    status: Optional[str] = None, client_id: Optional[str] = None
) -> list[dict[str, Any]]:
    q = get_client().table("legal_drafts").select("*, clients(name, slug)")
    if status:
        q = q.eq("status", status)
    if client_id:
        q = q.eq("client_id", client_id)
    return q.order("created_at", desc=True).execute().data or []


def update_legal_draft(draft_id: str, payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    rows = (
        get_client()
        .table("legal_drafts")
        .update(payload)
        .eq("id", draft_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


# ─────────────────────────────────────────────────────────────────
# Orchestrator runs
# ─────────────────────────────────────────────────────────────────
def create_run(client_id: str, run_date: str) -> dict[str, Any]:
    payload = {
        "client_id": client_id,
        "run_date": run_date,
        "status": "running",
        "agents_run": {},
    }
    return get_client().table("orchestrator_runs").insert(payload).execute().data[0]


def complete_run(run_id: str, agents_run: dict[str, Any], status: str = "completed") -> None:
    get_client().table("orchestrator_runs").update(
        {
            "status": status,
            "agents_run": agents_run,
            "completed_at": _now_iso(),
        }
    ).eq("id", run_id).execute()


def list_runs(limit: int = 50) -> list[dict[str, Any]]:
    return (
        get_client()
        .table("orchestrator_runs")
        .select("*, clients(name, slug)")
        .order("run_date", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )
