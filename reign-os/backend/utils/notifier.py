"""
Morning digest notifier for Reign OS.

Posts a plain-text daily brief to NOTIFICATION_WEBHOOK (WhatsApp / Slack /
generic webhook). The payload is sent as both `text` and `content` keys so it
works with Slack-style and Discord-style incoming webhooks without config.
"""
from __future__ import annotations

import os
from typing import Any

import httpx


def build_digest(date_str: str, stats: dict[str, Any]) -> str:
    """Compose the plain-text morning digest."""
    errors = stats.get("errors") or []
    health = "All agents OK" if not errors else "Issues: " + "; ".join(errors)
    return (
        f"Reign OS — Daily Brief | {date_str}\n"
        f"Active clients: {stats.get('active_clients', 0)}\n"
        f"New threats: {stats.get('new_threats', 0)} "
        f"(Critical: {stats.get('critical', 0)} | High: {stats.get('high', 0)})\n"
        f"Content published: {stats.get('content_published', 0)} pieces\n"
        f"Legal drafts pending Neel's review: {stats.get('pending_drafts', 0)}\n"
        f"System health: {health}"
    )


async def send_digest(text: str) -> bool:
    """POST the digest to the configured webhook. Returns success bool."""
    webhook = os.environ.get("NOTIFICATION_WEBHOOK")
    if not webhook:
        # No webhook configured — log to stdout so nothing is silently lost.
        print("[notifier] NOTIFICATION_WEBHOOK not set. Digest:\n" + text)
        return False
    payload = {"text": text, "content": text}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(webhook, json=payload)
            resp.raise_for_status()
        return True
    except Exception as exc:  # noqa: BLE001 - notifier must never crash a run
        print(f"[notifier] Failed to send digest: {exc}")
        return False
