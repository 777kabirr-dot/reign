# Reign OS v1.0

A fully autonomous, multi-agent **Online Reputation Management (ORM)** platform
for **Reign**, a boutique agency in Pune, India. Reign OS monitors search
results, generates and distributes positive content, drafts legal
communications for human review, and produces branded monthly intelligence
reports — for 3–10 high-net-worth clients in parallel, on a daily 6 AM IST
schedule with minimal human intervention.

> Human approval is required **only** for legal communications (Advocate agent).
> The Advocate **never** auto-sends anything — Neel reviews and sends manually.

---

## Architecture

```
reign-os/
├── backend/        FastAPI + APScheduler + 5 agents + Supabase + ReportLab
└── frontend/       React 18 + Vite + Tailwind + Recharts (6-page dashboard)
```

### The five agents

| Agent | File | Role |
|-------|------|------|
| **Sentinel** | `agents/sentinel.py` | Monitors SERPs (Serper API) for every client, classifies each result with Claude (sentiment / severity / reason), stores new mentions. |
| **Publisher** | `agents/publisher.py` | Generates an 800-word SEO article, a press release, two LinkedIn posts (and GBP responses for Sovereign/Dynasty), publishes the article to WordPress, submits it to Google Indexing. |
| **Analyst** | `agents/analyst.py` | Builds a branded monthly PDF report (ReportLab, navy/cream/gold). |
| **Advocate** | `agents/advocate.py` | Drafts legal communications (takedown / cease & desist / platform report / DMCA) as **pending** records. Never sends. |
| **Orchestrator** | `agents/orchestrator.py` | Runs every agent for every active client in parallel, logs runs, sends the 8 AM morning digest. |

### Tech stack

- **Backend:** Python 3.11, FastAPI, APScheduler, Anthropic SDK (`claude-sonnet-4-6`), Supabase, ReportLab, httpx
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router v6
- **Database:** Supabase (PostgreSQL)
- **External APIs:** Serper (SERP), Google Indexing, WordPress REST, EIN Presswire

---

## 1. Database setup (Supabase)

1. Create a Supabase project.
2. Open the SQL editor and run [`backend/database/schema.sql`](backend/database/schema.sql).
   This creates all six tables (`clients`, `mentions`, `content_published`,
   `reports`, `legal_drafts`, `orchestrator_runs`) plus indexes.
3. Copy your project URL and a service-role / anon key for the env vars below.

---

## 2. Environment variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude — all AI operations |
| `SERPER_API_KEY` | SERP monitoring (Sentinel) |
| `SUPABASE_URL`, `SUPABASE_KEY` | Database |
| `GOOGLE_INDEXING_KEY` | Google Indexing API bearer token |
| `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` | WordPress publishing |
| `NOTIFICATION_WEBHOOK` | WhatsApp/Slack/Discord morning digest |
| `PORT` | Server port (default 8000) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. your Vercel URL) |

For the frontend, copy `frontend/.env.example` → `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

> The app degrades gracefully: if WordPress / Indexing / the webhook are not
> configured, those steps are skipped and logged rather than crashing a run.

---

## 3. Run locally

### Backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API serves on `http://localhost:8000`. APScheduler starts automatically
(daily run at 06:00 IST, digest at 08:00 IST). Check `GET /health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard on `http://localhost:5173`.

---

## 4. Adding a new client

**From the dashboard (recommended):** Clients → **+ Add Client**. Fill in name,
slug, tier (`shield` / `sovereign` / `dynasty`) and the context markdown.

**The context file** is what every agent reads to tailor its work. Use
[`backend/clients/template.md`](backend/clients/template.md) as the structure —
keep the `Key: Value` lines (Sentinel and Publisher parse them):

```
Client Name: Aurelia Kapoor
Brand Name: Kapoor Estates
Location: Pune, India
Industry: Luxury Real Estate
Tone: Authoritative, refined, visionary
Key Search Terms: Kapoor Estates Pune, Aurelia Kapoor real estate
```

A complete example lives at
[`backend/clients/sample-client/context.md`](backend/clients/sample-client/context.md).

**Via API:**

```bash
curl -X POST http://localhost:8000/clients \
  -H 'Content-Type: application/json' \
  -d '{"name":"Aurelia Kapoor","slug":"aurelia-kapoor","tier":"sovereign","context":"Client Name: Aurelia Kapoor\nBrand Name: Kapoor Estates\n..."}'
```

### Tier behaviour

| Tier | Sentinel | Publisher | Advocate | Analyst |
|------|:--------:|:---------:|:--------:|:-------:|
| shield | ✅ | — | ✅ (if high/critical) | ✅ |
| sovereign | ✅ | ✅ + GBP responses | ✅ | ✅ |
| dynasty | ✅ | ✅ + GBP responses | ✅ | ✅ |

---

## 5. API reference

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/clients` | List all clients |
| POST | `/clients` | Create client |
| GET | `/clients/{slug}` | Client + computed stats |
| PUT | `/clients/{slug}/context` | Update context |
| GET | `/mentions?client=&severity=&sentiment=&status=` | Mention feed |
| PATCH | `/mentions/{id}/status` | Update mention status |
| GET | `/content?client=&month=` | Published content |
| GET | `/reports?client=&month=` | Report list |
| POST | `/reports/generate` | Trigger Analyst (`{client, month}`) |
| GET | `/reports/{id}/download` | Stream the PDF |
| GET | `/legal?status=&client=` | Legal draft queue |
| PATCH | `/legal/{id}/approve` | Approve (records approver) |
| PATCH | `/legal/{id}/reject` | Reject |
| PUT | `/legal/{id}` | Edit draft text |
| POST | `/orchestrator/run` | Manual run for one client (`{client}`) |
| GET | `/orchestrator/runs` | Run history |
| GET | `/health` | Health + config checks |

---

## 6. Deploy

### Backend → Railway

1. New project → Deploy from repo, root directory `reign-os/backend`.
2. Railway auto-detects Python (Nixpacks). Start command is in
   [`railway.json`](backend/railway.json) / [`Procfile`](backend/Procfile):
   `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Add every variable from `.env.example` in the Railway dashboard.
4. Set `CORS_ORIGINS` to your Vercel URL.

> Reports are written to `backend/reports/`. On Railway, attach a **volume**
> mounted at `/data/reports` and set `REPORTS_DIR=/data/reports` so generated
> PDFs survive redeploys.

### Frontend → Vercel

1. New project → import repo, root directory `reign-os/frontend`.
2. Framework preset: **Vite**. Build `npm run build`, output `dist`.
3. Add env var `VITE_API_URL` = your Railway backend URL.
4. [`vercel.json`](frontend/vercel.json) rewrites all routes to `index.html`
   for client-side routing.

---

## 7. Design system

**Dashboard** — Background `#080808`, Surface `#111111`, Border `#222222`,
Gold `#C9A84C`, Text `#E2E2E2`, Dim `#888888`, Danger `#C0392B`, Safe
`#27AE60`. Inter + JetBrains Mono.

**PDF reports** — Dark navy `#1B2A4A`, cream `#F4F1EA`, gold `#C9A84C`,
Helvetica. Footer: *Prepared by Reign | Confidential | reign.in*.

---

## 8. Safety note on the Advocate

The Advocate agent is deliberately constrained: its only side effects are
reading mentions, calling Claude, and inserting **pending** `legal_drafts`. It
makes **no** outbound HTTP calls and sends **no** email. Every legal
communication is reviewed and dispatched by a human (Neel) from the **Legal**
page. This is a hard system invariant.
