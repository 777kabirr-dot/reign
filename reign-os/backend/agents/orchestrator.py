"""
ORCHESTRATOR — master controller.

Runs every agent for every active client on the daily schedule, logs each run
to orchestrator_runs, and compiles the morning digest.

Daily flow per client (run in parallel across clients via asyncio.gather):
  1. Create orchestrator_run (status='running')
  2. Sentinel  → threat_summary
  3. Publisher  (if tier in sovereign/dynasty)  with threat_summary
  4. Advocate   (if any high/critical mentions exist)
  5. Analyst    (if today is the 1st of the month)
  6. Complete the run with an agents_run JSON log
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from agents import advocate, analyst, publisher, sentinel
from database import client as db
from utils import notifier

IST = ZoneInfo("Asia/Kolkata")


def _today_ist() -> datetime:
    return datetime.now(IST)


async def run_client_pipeline(client: dict[str, Any], run_day: datetime | None = None) -> dict[str, Any]:
    """Execute the full agent pipeline for a single client."""
    run_day = run_day or _today_ist()
    run = db.create_run(client["id"], run_day.date().isoformat())
    agents_log: dict[str, Any] = {}
    status = "completed"

    # 1 + 2. Sentinel
    try:
        threat_summary = await sentinel.run_sentinel(client)
        agents_log["sentinel"] = threat_summary
    except Exception as exc:  # noqa: BLE001
        threat_summary = {"new_threats": 0, "critical": 0, "high": 0}
        agents_log["sentinel"] = {"error": str(exc)}
        status = "error"

    # 3. Publisher — sovereign / dynasty tiers only.
    if client.get("tier") in ("sovereign", "dynasty"):
        try:
            agents_log["publisher"] = await publisher.run_publisher(client, threat_summary)
        except Exception as exc:  # noqa: BLE001
            agents_log["publisher"] = {"error": str(exc)}
            status = "error"
    else:
        agents_log["publisher"] = {"skipped": "tier not eligible"}

    # 4. Advocate — only when high/critical mentions exist.
    has_serious = bool(
        db.mentions_for_client_by_severity(client["id"], ["high", "critical"], status="new")
    )
    if has_serious:
        try:
            agents_log["advocate"] = await advocate.run_advocate(client)
        except Exception as exc:  # noqa: BLE001
            agents_log["advocate"] = {"error": str(exc)}
            status = "error"
    else:
        agents_log["advocate"] = {"skipped": "no high/critical mentions"}

    # 5. Analyst — on the 1st of the month, report on the previous month.
    if run_day.day == 1:
        try:
            prev_month = (run_day.replace(day=1) - __import__("datetime").timedelta(days=1)).strftime("%Y-%m")
            path = await analyst.run_analyst(client, prev_month)
            agents_log["analyst"] = {"report": path, "month": prev_month}
        except Exception as exc:  # noqa: BLE001
            agents_log["analyst"] = {"error": str(exc)}
            status = "error"
    else:
        agents_log["analyst"] = {"skipped": "not 1st of month"}

    db.complete_run(run["id"], agents_log, status=status)
    return {"client": client["slug"], "status": status, "agents": agents_log}


async def run_all_clients() -> list[dict[str, Any]]:
    """Run the pipeline for every active client, concurrently."""
    clients = db.list_clients(active_only=True)
    if not clients:
        print("[orchestrator] No active clients to process.")
        return []
    results = await asyncio.gather(
        *(run_client_pipeline(c) for c in clients), return_exceptions=True
    )
    normalized: list[dict[str, Any]] = []
    for c, r in zip(clients, results):
        if isinstance(r, Exception):
            normalized.append({"client": c["slug"], "status": "error", "error": str(r)})
        else:
            normalized.append(r)
    return normalized


async def compile_and_send_digest() -> str:
    """Aggregate today's activity and POST the morning digest."""
    today = _today_ist()
    date_str = today.strftime("%d %b %Y")
    clients = db.list_clients(active_only=True)

    new_threats = critical = high = content_count = 0
    errors: list[str] = []

    start_iso = today.date().isoformat()
    for c in clients:
        # Mentions detected today.
        sb = db.get_client()
        todays_mentions = (
            sb.table("mentions")
            .select("severity")
            .eq("client_id", c["id"])
            .gte("detected_at", f"{start_iso}T00:00:00+05:30")
            .execute()
            .data
            or []
        )
        new_threats += len(todays_mentions)
        critical += sum(1 for m in todays_mentions if m.get("severity") == "critical")
        high += sum(1 for m in todays_mentions if m.get("severity") == "high")

        todays_content = (
            sb.table("content_published")
            .select("id")
            .eq("client_id", c["id"])
            .gte("published_at", f"{start_iso}T00:00:00+05:30")
            .execute()
            .data
            or []
        )
        content_count += len(todays_content)

    # Today's runs with errors.
    runs = db.list_runs(limit=100)
    for r in runs:
        if r.get("run_date") == start_iso and r.get("status") == "error":
            errors.append(f"{r.get('clients', {}).get('slug', r.get('client_id'))} run error")

    pending = len(db.list_legal_drafts(status="pending"))

    text = notifier.build_digest(
        date_str,
        {
            "active_clients": len(clients),
            "new_threats": new_threats,
            "critical": critical,
            "high": high,
            "content_published": content_count,
            "pending_drafts": pending,
            "errors": errors,
        },
    )
    await notifier.send_digest(text)
    return text
