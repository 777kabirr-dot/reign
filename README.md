# Reign — Content Publisher

A solo-operated reputation-management dashboard. Add a client and a brief; Reign
generates positive, SEO-optimized content with Claude and publishes it to the
configured platforms (WordPress, Medium, LinkedIn). One user, no login.

> Premium dark SaaS aesthetic — black canvas, white-only accents at varying
> opacity, Inter for body and JetBrains Mono for data. Sharp cards, lots of
> breathing room.

## Stack

| Layer     | Tech                                            |
| --------- | ----------------------------------------------- |
| Frontend  | React 18 · Vite · Tailwind CSS · React Router   |
| Backend   | FastAPI · Python 3.11+                           |
| Database  | Supabase (Postgres) — optional in-memory fallback |
| AI        | Claude `claude-sonnet-4-6` via the Anthropic API |
| Publishing| WordPress REST · Medium API · LinkedIn UGC API  |

## Layout

```
backend/            FastAPI service
  main.py           app + CORS + routers
  config.py         .env-backed settings (read/write at runtime)
  store.py          Supabase or in-memory repository
  ai.py             Claude prompts + generation
  publishers.py     WordPress / Medium / LinkedIn publishing
  schemas.py        Pydantic models + content-type catalog
  routers/          clients · generate · content · settings
frontend/           React + Vite + Tailwind app
  src/pages/        Dashboard · Clients · Generate · Library · Settings
supabase/schema.sql Database schema
```

## Run it

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add ANTHROPIC_API_KEY (Supabase optional)
uvicorn main:app --reload --port 8000
```

Without Supabase configured, the backend uses an in-memory store so the whole
app runs end-to-end immediately. Add `SUPABASE_URL` / `SUPABASE_KEY` (and run
`supabase/schema.sql`) to persist.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE defaults to http://localhost:8000
npm run dev                 # http://localhost:5173
```

## How it works

1. **Clients** — name, brand, industry, tone, keywords, brief, and WordPress
   credentials. The brief is the narrative Claude reinforces.
2. **Generate** — pick a client, check the content types (SEO article, press
   release, LinkedIn post, Google Business Profile responses, FAQ page), add an
   optional angle, and run. The backend calls Claude per piece, publishes to the
   mapped platform, and saves everything to `content_published`.
3. **Publishing fallback** — if a platform publish fails (or isn't configured),
   the piece is still saved with `platform = "draft"` and the error is surfaced.
4. **Library** — every published piece, filterable by client / type / platform /
   month, with a slide-in preview of the full text.

## API

| Method | Path                | Purpose                                  |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/dashboard`        | Stats + recent activity + client cards   |
| GET/POST/PUT/DELETE | `/clients`, `/clients/{id}` | Client CRUD            |
| POST   | `/generate`         | Generate + publish a batch               |
| GET    | `/content`          | Content library (filterable)             |
| GET    | `/stats`            | Hero stats                               |
| GET/PUT| `/settings`         | Masked API keys, written to `.env`       |

## Environment

`backend/.env` (see `backend/.env.example`): `ANTHROPIC_API_KEY`,
`ANTHROPIC_MODEL`, `SUPABASE_URL`, `SUPABASE_KEY`, `MEDIUM_TOKEN`,
`MEDIUM_USER_ID`, `LINKEDIN_TOKEN`, `LINKEDIN_AUTHOR_URN`, `PORT`,
`CORS_ORIGINS`. Keys can also be edited from the Settings page.

---

_Note: an earlier static site (`index.html`, `assets/`, the Pages workflow)
remains in the repo root from a previous project and is unrelated to this app._
