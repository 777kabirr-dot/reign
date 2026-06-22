"""
Reign OS — FastAPI application + APScheduler.

Exposes the REST API consumed by the React dashboard and schedules the daily
orchestrator run (06:00 IST) and morning digest (08:00 IST).
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from agents import analyst as analyst_agent
from agents import orchestrator
from database import client as db

IST = "Asia/Kolkata"
scheduler = AsyncIOScheduler(timezone=IST)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Daily orchestrator run at 06:00 IST.
    scheduler.add_job(
        orchestrator.run_all_clients,
        CronTrigger(hour=6, minute=0, timezone=IST),
        id="daily_run",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    # Morning digest at 08:00 IST.
    scheduler.add_job(
        orchestrator.compile_and_send_digest,
        CronTrigger(hour=8, minute=0, timezone=IST),
        id="morning_digest",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.start()
    print("[reign-os] Scheduler started (06:00 run, 08:00 digest, IST).")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="Reign OS", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str
    slug: str
    tier: str = Field(pattern="^(shield|sovereign|dynasty)$")
    context: Optional[str] = ""
    status: str = "active"


class ContextUpdate(BaseModel):
    context: str


class MentionStatusUpdate(BaseModel):
    status: str


class ReportGenerate(BaseModel):
    client: str  # slug
    month: str  # YYYY-MM


class LegalApprove(BaseModel):
    approved_by: str = "Neel"


class LegalEdit(BaseModel):
    draft_text: str


class OrchestratorRun(BaseModel):
    client: str  # slug


# ─────────────────────────────────────────────────────────────────
# Clients
# ─────────────────────────────────────────────────────────────────
@app.get("/clients")
def list_clients():
    return db.list_clients()


@app.post("/clients", status_code=201)
def create_client(payload: ClientCreate):
    if db.get_client_by_slug(payload.slug):
        raise HTTPException(409, "A client with this slug already exists.")
    return db.create_client_row(payload.model_dump())


@app.get("/clients/{slug}")
def get_client(slug: str):
    client = db.get_client_by_slug(slug)
    if not client:
        raise HTTPException(404, "Client not found.")

    cid = client["id"]
    mentions = db.list_mentions(client_id=cid, limit=1000)
    content = db.list_content(client_id=cid, limit=1000)
    drafts = db.list_legal_drafts(client_id=cid)
    reports = db.list_reports(client_id=cid)

    stats = {
        "mentions_total": len(mentions),
        "mentions_critical": sum(1 for m in mentions if m.get("severity") == "critical"),
        "mentions_high": sum(1 for m in mentions if m.get("severity") == "high"),
        "mentions_negative": sum(1 for m in mentions if m.get("sentiment") == "negative"),
        "content_total": len(content),
        "drafts_pending": sum(1 for d in drafts if d.get("status") == "pending"),
        "reports_total": len(reports),
    }
    return {"client": client, "stats": stats}


@app.put("/clients/{slug}/context")
def update_context(slug: str, payload: ContextUpdate):
    updated = db.update_client_context(slug, payload.context)
    if not updated:
        raise HTTPException(404, "Client not found.")
    return updated


# ─────────────────────────────────────────────────────────────────
# Mentions
# ─────────────────────────────────────────────────────────────────
@app.get("/mentions")
def list_mentions(
    client: Optional[str] = None,
    severity: Optional[str] = None,
    sentiment: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
):
    client_id = None
    if client:
        row = db.get_client_by_slug(client)
        if not row:
            raise HTTPException(404, "Client not found.")
        client_id = row["id"]
    return db.list_mentions(
        client_id=client_id,
        severity=severity,
        sentiment=sentiment,
        status=status,
        limit=limit,
        offset=offset,
    )


@app.patch("/mentions/{mention_id}/status")
def patch_mention_status(mention_id: str, payload: MentionStatusUpdate):
    updated = db.update_mention_status(mention_id, payload.status)
    if not updated:
        raise HTTPException(404, "Mention not found.")
    return updated


# ─────────────────────────────────────────────────────────────────
# Content
# ─────────────────────────────────────────────────────────────────
@app.get("/content")
def list_content(client: Optional[str] = None, month: Optional[str] = None):
    client_id = None
    if client:
        row = db.get_client_by_slug(client)
        if not row:
            raise HTTPException(404, "Client not found.")
        client_id = row["id"]
    return db.list_content(client_id=client_id, month=month)


# ─────────────────────────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────────────────────────
@app.get("/reports")
def list_reports(client: Optional[str] = None, month: Optional[str] = None):
    client_id = None
    if client:
        row = db.get_client_by_slug(client)
        if not row:
            raise HTTPException(404, "Client not found.")
        client_id = row["id"]
    return db.list_reports(client_id=client_id, month=month)


@app.post("/reports/generate")
async def generate_report(payload: ReportGenerate):
    client = db.get_client_by_slug(payload.client)
    if not client:
        raise HTTPException(404, "Client not found.")
    path = await analyst_agent.run_analyst(client, payload.month)
    return {"status": "generated", "pdf_path": path, "month": payload.month}


@app.get("/reports/{report_id}/download")
def download_report(report_id: str):
    report = db.get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found.")
    path = report.get("pdf_path")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "Report PDF file is missing on disk.")
    filename = f"reign-report-{report.get('month','')}.pdf"
    return FileResponse(path, media_type="application/pdf", filename=filename)


# ─────────────────────────────────────────────────────────────────
# Legal (Advocate queue)
# ─────────────────────────────────────────────────────────────────
@app.get("/legal")
def list_legal(status: Optional[str] = None, client: Optional[str] = None):
    client_id = None
    if client:
        row = db.get_client_by_slug(client)
        if not row:
            raise HTTPException(404, "Client not found.")
        client_id = row["id"]
    return db.list_legal_drafts(status=status, client_id=client_id)


@app.patch("/legal/{draft_id}/approve")
def approve_legal(draft_id: str, payload: LegalApprove):
    updated = db.update_legal_draft(
        draft_id, {"status": "approved", "approved_by": payload.approved_by}
    )
    if not updated:
        raise HTTPException(404, "Draft not found.")
    return updated


@app.patch("/legal/{draft_id}/reject")
def reject_legal(draft_id: str):
    updated = db.update_legal_draft(draft_id, {"status": "rejected"})
    if not updated:
        raise HTTPException(404, "Draft not found.")
    return updated


@app.put("/legal/{draft_id}")
def edit_legal(draft_id: str, payload: LegalEdit):
    updated = db.update_legal_draft(draft_id, {"draft_text": payload.draft_text})
    if not updated:
        raise HTTPException(404, "Draft not found.")
    return updated


# ─────────────────────────────────────────────────────────────────
# Orchestrator
# ─────────────────────────────────────────────────────────────────
@app.post("/orchestrator/run")
async def manual_run(payload: OrchestratorRun):
    client = db.get_client_by_slug(payload.client)
    if not client:
        raise HTTPException(404, "Client not found.")
    result = await orchestrator.run_client_pipeline(client)
    return result


@app.get("/orchestrator/runs")
def list_runs(limit: int = Query(50, le=200)):
    return db.list_runs(limit=limit)


# ─────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    checks = {
        "anthropic_key": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "serper_key": bool(os.environ.get("SERPER_API_KEY")),
        "supabase": bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY")),
        "scheduler_running": scheduler.running if scheduler else False,
    }
    return {"status": "ok", "service": "reign-os", "version": "1.0.0", "checks": checks}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
