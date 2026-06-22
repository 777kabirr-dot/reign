"""
ANALYST — monthly PDF report generation agent.

Aggregates a client's activity for a given month from Supabase, asks Claude to
write a 3-paragraph executive summary, renders a branded ReportLab PDF, and
records the report path in the reports table.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from database import client as db
from utils import claude_client
from utils.pdf_generator import build_report_pdf

REPORTS_ROOT = os.environ.get("REPORTS_DIR", os.path.join(os.path.dirname(__file__), "..", "reports"))


def _month_bounds(month: str) -> tuple[str, str]:
    """Return ISO start (inclusive) and end (exclusive) for a YYYY-MM string."""
    year, mon = (int(p) for p in month.split("-"))
    start = datetime(year, mon, 1, tzinfo=timezone.utc)
    if mon == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, mon + 1, 1, tzinfo=timezone.utc)
    return start.isoformat(), end.isoformat()


def _gather(client_id: str, month: str) -> dict[str, Any]:
    start, end = _month_bounds(month)
    sb = db.get_client()

    mentions = (
        sb.table("mentions")
        .select("*")
        .eq("client_id", client_id)
        .gte("detected_at", start)
        .lt("detected_at", end)
        .order("detected_at", desc=True)
        .execute()
        .data
        or []
    )
    content = (
        sb.table("content_published")
        .select("*")
        .eq("client_id", client_id)
        .gte("published_at", start)
        .lt("published_at", end)
        .order("published_at", desc=True)
        .execute()
        .data
        or []
    )
    runs = (
        sb.table("orchestrator_runs")
        .select("*")
        .eq("client_id", client_id)
        .gte("run_date", start[:10])
        .lt("run_date", end[:10])
        .execute()
        .data
        or []
    )

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for m in mentions:
        sentiment_counts[m.get("sentiment", "neutral")] = sentiment_counts.get(m.get("sentiment", "neutral"), 0) + 1
        severity_counts[m.get("severity", "low")] = severity_counts.get(m.get("severity", "low"), 0) + 1

    type_counts: dict[str, int] = {}
    for c in content:
        type_counts[c.get("type", "other")] = type_counts.get(c.get("type", "other"), 0) + 1

    runs_ok = sum(1 for r in runs if r.get("status") == "completed")
    runs_fail = sum(1 for r in runs if r.get("status") not in ("completed", "running"))

    # "Significance" ranking for the mention log.
    sev_rank = {"critical": 3, "high": 2, "medium": 1, "low": 0}
    mentions_sorted = sorted(
        mentions, key=lambda m: sev_rank.get(m.get("severity", "low"), 0), reverse=True
    )

    return {
        "mentions": mentions,
        "mentions_sorted": mentions_sorted,
        "content": content,
        "sentiment_counts": sentiment_counts,
        "severity_counts": severity_counts,
        "type_counts": type_counts,
        "runs_ok": runs_ok,
        "runs_fail": runs_fail,
    }


async def _executive_summary(client: dict[str, Any], month: str, data: dict[str, Any]) -> str:
    prompt = (
        "You are a senior reputation strategist at Reign, a boutique ORM agency in Pune. "
        f"Write a 3-paragraph executive summary for the monthly intelligence report for "
        f"client {client.get('name')} for {month}.\n\n"
        f"Data:\n"
        f"- Mentions monitored: {len(data['mentions'])}\n"
        f"- Sentiment breakdown: {data['sentiment_counts']}\n"
        f"- Severity breakdown: {data['severity_counts']}\n"
        f"- Content published by type: {data['type_counts']}\n"
        f"- Automated runs completed: {data['runs_ok']} (failed: {data['runs_fail']})\n\n"
        "Tone: confident, precise, reassuring to a high-net-worth client. "
        "Paragraph 1: state of the client's online reputation this month. "
        "Paragraph 2: actions taken (monitoring + content suppression). "
        "Paragraph 3: outlook and recommendation. "
        "Return exactly three paragraphs separated by blank lines, plain text, no headings."
    )
    return await claude_client.complete(prompt, max_tokens=900, temperature=0.5)


async def run_analyst(client: dict[str, Any], month: str) -> str:
    """Generate the monthly PDF report for a client. Returns the PDF path."""
    data = _gather(client["id"], month)
    summary = await _executive_summary(client, month, data)

    negative_suppressed = data["sentiment_counts"].get("negative", 0)
    metrics = {
        "mentions_monitored": len(data["mentions"]),
        "negative_suppressed": negative_suppressed,
        "content_published": len(data["content"]),
        # Heuristic: pieces of content published as a proxy for SERP wins.
        "serp_improvements": len(data["content"]),
    }

    slug = client.get("slug", "client")
    out_path = os.path.abspath(os.path.join(REPORTS_ROOT, slug, f"{month}.pdf"))
    build_report_pdf(
        out_path=out_path,
        client=client,
        month=month,
        summary_text=summary,
        metrics=metrics,
        mention_log=data["mentions_sorted"],
        content_log=data["content"],
    )

    db.insert_report(
        {
            "client_id": client["id"],
            "month": month,
            "pdf_path": out_path,
        }
    )
    return out_path
