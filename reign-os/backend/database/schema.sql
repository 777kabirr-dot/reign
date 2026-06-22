-- ════════════════════════════════════════════════════════════════
-- Reign OS v1.0 — Supabase / PostgreSQL schema
-- Run this once against your Supabase project (SQL editor or psql).
-- ════════════════════════════════════════════════════════════════

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  tier       TEXT CHECK (tier IN ('shield', 'sovereign', 'dynasty')),
  status     TEXT DEFAULT 'active',
  context    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- mentions
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  title       TEXT,
  snippet     TEXT,
  source      TEXT,
  sentiment   TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  severity    TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status      TEXT DEFAULT 'new',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- A client should not have the same URL twice — used to skip duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS mentions_client_url_uniq
  ON mentions (client_id, url);

CREATE INDEX IF NOT EXISTS mentions_client_idx   ON mentions (client_id);
CREATE INDEX IF NOT EXISTS mentions_severity_idx ON mentions (severity);
CREATE INDEX IF NOT EXISTS mentions_status_idx   ON mentions (status);

-- ─────────────────────────────────────────────────────────────────
-- content_published
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_published (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  title        TEXT,
  type         TEXT CHECK (type IN ('article', 'press_release', 'social_post', 'gbp_response')),
  platform     TEXT,
  url          TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_client_idx ON content_published (client_id);

-- ─────────────────────────────────────────────────────────────────
-- reports
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  month        TEXT,
  pdf_path     TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_client_idx ON reports (client_id);

-- ─────────────────────────────────────────────────────────────────
-- legal_drafts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  mention_id   UUID REFERENCES mentions(id) ON DELETE SET NULL,
  type         TEXT CHECK (type IN ('takedown', 'cease_desist', 'platform_report', 'dmca')),
  draft_text   TEXT,
  status       TEXT DEFAULT 'pending',
  approved_by  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS legal_client_idx ON legal_drafts (client_id);
CREATE INDEX IF NOT EXISTS legal_status_idx ON legal_drafts (status);

-- ─────────────────────────────────────────────────────────────────
-- orchestrator_runs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orchestrator_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  run_date     DATE,
  agents_run   JSONB,
  status       TEXT DEFAULT 'running',
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS runs_client_idx ON orchestrator_runs (client_id);
CREATE INDEX IF NOT EXISTS runs_date_idx   ON orchestrator_runs (run_date);
