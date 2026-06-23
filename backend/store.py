"""Persistence layer.

Uses Supabase when SUPABASE_URL/SUPABASE_KEY are configured; otherwise falls
back to an in-memory store so the app runs end-to-end in local dev without any
external services. The two backends expose the same method surface.
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone

from config import get_setting

CLIENT_FIELDS = [
    "name", "brand", "industry", "tone", "keywords", "brief",
    "location", "wp_url", "wp_user", "wp_pass",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _month_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


class Store:
    def __init__(self) -> None:
        self.sb = None
        url = get_setting("SUPABASE_URL")
        key = get_setting("SUPABASE_KEY")
        if url and key:
            try:
                from supabase import create_client

                self.sb = create_client(url, key)
            except Exception:
                self.sb = None
        # In-memory fallback storage.
        self._lock = threading.Lock()
        self._clients: dict[str, dict] = {}
        self._content: dict[str, dict] = {}

    @property
    def backend(self) -> str:
        return "supabase" if self.sb else "memory"

    # ── Clients ─────────────────────────────────────────────────────────────
    def list_clients(self) -> list[dict]:
        if self.sb:
            res = self.sb.table("clients").select("*").order("created_at", desc=True).execute()
            return res.data or []
        with self._lock:
            return sorted(
                self._clients.values(),
                key=lambda c: c.get("created_at", ""),
                reverse=True,
            )

    def get_client(self, client_id: str) -> dict | None:
        if self.sb:
            res = self.sb.table("clients").select("*").eq("id", client_id).limit(1).execute()
            return (res.data or [None])[0]
        with self._lock:
            return self._clients.get(client_id)

    def create_client(self, data: dict) -> dict:
        row = {k: data.get(k, "") for k in CLIENT_FIELDS}
        row["created_at"] = _now()
        row["last_generated_at"] = None
        if self.sb:
            res = self.sb.table("clients").insert(row).execute()
            return res.data[0]
        row["id"] = str(uuid.uuid4())
        with self._lock:
            self._clients[row["id"]] = row
        return row

    def update_client(self, client_id: str, data: dict) -> dict | None:
        row = {k: data[k] for k in CLIENT_FIELDS if k in data}
        if self.sb:
            res = self.sb.table("clients").update(row).eq("id", client_id).execute()
            return (res.data or [None])[0]
        with self._lock:
            existing = self._clients.get(client_id)
            if not existing:
                return None
            existing.update(row)
            return existing

    def touch_client(self, client_id: str) -> None:
        when = _now()
        if self.sb:
            self.sb.table("clients").update({"last_generated_at": when}).eq("id", client_id).execute()
            return
        with self._lock:
            if client_id in self._clients:
                self._clients[client_id]["last_generated_at"] = when

    def delete_client(self, client_id: str) -> None:
        if self.sb:
            self.sb.table("clients").delete().eq("id", client_id).execute()
            return
        with self._lock:
            self._clients.pop(client_id, None)

    # ── Published content ───────────────────────────────────────────────────
    def create_content(self, data: dict) -> dict:
        row = {
            "client_id": data["client_id"],
            "title": data["title"],
            "type": data["type"],
            "platform": data["platform"],
            "url": data.get("url"),
            "content_text": data["content_text"],
            "word_count": data["word_count"],
            "published_at": _now(),
        }
        if self.sb:
            res = self.sb.table("content_published").insert(row).execute()
            return res.data[0]
        row["id"] = str(uuid.uuid4())
        with self._lock:
            self._content[row["id"]] = row
        return row

    def list_content(
        self,
        client_id: str | None = None,
        type_: str | None = None,
        platform: str | None = None,
        month: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        if self.sb:
            q = self.sb.table("content_published").select("*").order("published_at", desc=True)
            if client_id:
                q = q.eq("client_id", client_id)
            if type_:
                q = q.eq("type", type_)
            if platform:
                q = q.eq("platform", platform)
            if limit:
                q = q.limit(limit)
            rows = q.execute().data or []
            if month:
                rows = [r for r in rows if (r.get("published_at") or "").startswith(month)]
            return rows
        with self._lock:
            rows = sorted(
                self._content.values(),
                key=lambda r: r.get("published_at", ""),
                reverse=True,
            )
        if client_id:
            rows = [r for r in rows if r["client_id"] == client_id]
        if type_:
            rows = [r for r in rows if r["type"] == type_]
        if platform:
            rows = [r for r in rows if r["platform"] == platform]
        if month:
            rows = [r for r in rows if (r.get("published_at") or "").startswith(month)]
        if limit:
            rows = rows[:limit]
        return rows

    def stats(self) -> dict:
        rows = self.list_content()
        month = _month_prefix()
        this_month = [r for r in rows if (r.get("published_at") or "").startswith(month)]
        return {
            "total_clients": len(self.list_clients()),
            "articles_this_month": sum(
                1 for r in this_month if r["type"] in ("seo_article", "faq_page")
            ),
            "press_releases_sent": sum(1 for r in rows if r["type"] == "press_release"),
            "linkedin_posts_live": sum(
                1
                for r in rows
                if r["type"] == "linkedin_post" and r["platform"] == "linkedin"
            ),
        }


store = Store()
