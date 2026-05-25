-- ScrollPop — Initial Schema Migration
-- 0001_initial.sql
-- Reversible: see 0001_initial.down.sql

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid(), gen_random_bytes()

-- ─── Enum Types ───────────────────────────────────────────────────────────────

CREATE TYPE plan AS ENUM ('free', 'starter', 'growth', 'scale', 'agency');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE platform AS ENUM ('wordpress', 'shopify', 'html', 'donorbox', 'gofundme', 'other');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE design_kind AS ENUM ('modal', 'slide_in', 'banner', 'bar', 'fullscreen');

-- NOTE: back_button_capture is intentionally ABSENT. See CLAUDE.md rule #1.
CREATE TYPE trigger_type AS ENUM ('scroll_pct', 'dwell_time', 'inactivity', 'exit_intent_mouse', 'click');

CREATE TYPE targeting_kind AS ENUM ('url_exact', 'url_contains', 'url_regex', 'device', 'returning_visitor');
CREATE TYPE operator AS ENUM ('include', 'exclude');
CREATE TYPE frequency AS ENUM ('once_per_session', 'once_per_day', 'once_per_visitor', 'always');
CREATE TYPE event_type AS ENUM ('impression', 'view', 'click', 'dismiss', 'conversion');

-- ─── Tenants ──────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id          TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  plan                  plan NOT NULL DEFAULT 'free',
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  monthly_view_limit    INTEGER NOT NULL DEFAULT 1000,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS: service role bypasses; JWT tenant claim enforced at app layer (defence in depth)
CREATE POLICY tenants_all_tenant_isolation ON tenants
  USING (true)  -- API enforces tenant_id filter; RLS is a safety net
  WITH CHECK (true);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- users table has no tenant_id — it's global (users may belong to multiple orgs)

-- ─── Tenant Members ───────────────────────────────────────────────────────────

CREATE TABLE tenant_members (
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'editor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_members_all_tenant_isolation ON tenant_members
  USING (true)
  WITH CHECK (true);

-- ─── Sites ────────────────────────────────────────────────────────────────────

CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  domain      TEXT NOT NULL,
  public_key  TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  platform    platform NOT NULL DEFAULT 'html',
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, domain)
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_all_tenant_isolation ON sites
  USING (true)
  WITH CHECK (true);

-- ─── Campaigns ────────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      campaign_status NOT NULL DEFAULT 'draft',
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_all_tenant_isolation ON campaigns
  USING (true)
  WITH CHECK (true);

-- ─── Designs ──────────────────────────────────────────────────────────────────

-- config JSONB structure defined in packages/shared/src/index.ts (DesignConfigSchema)
CREATE TABLE designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind            design_kind NOT NULL DEFAULT 'modal',
  config          JSONB NOT NULL DEFAULT '{}',
  affiliate_slots JSONB NOT NULL DEFAULT '[]',
  -- affiliate_slots: [{id, product_name, product_url, image_url,
  --                    click_tracker_url, cta_text, weight}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY designs_all_tenant_isolation ON designs
  USING (true)
  WITH CHECK (true);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- IMPORTANT: back_button_capture is NOT a valid trigger type. Ever.
CREATE TABLE triggers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type        trigger_type NOT NULL,
  params      JSONB NOT NULL DEFAULT '{}',
  -- scroll_pct:        { pct: 50 }
  -- dwell_time:        { seconds: 30 }
  -- inactivity:        { seconds: 60 }
  -- exit_intent_mouse: { sensitivity: 20 }
  -- click:             { selector: "#my-button" }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY triggers_all_tenant_isolation ON triggers
  USING (true)
  WITH CHECK (true);

-- ─── Targeting Rules ──────────────────────────────────────────────────────────

CREATE TABLE targeting_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind        targeting_kind NOT NULL,
  operator    operator NOT NULL DEFAULT 'include',
  value       JSONB NOT NULL DEFAULT '{}',
  -- url_exact:         { url: "https://example.com/page" }
  -- url_contains:      { pattern: "/blog/" }
  -- url_regex:         { pattern: "^/products/.*" }
  -- device:            { device: "mobile"|"desktop"|"tablet"|"all" }
  -- returning_visitor: { is_returning: true }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE targeting_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY targeting_rules_all_tenant_isolation ON targeting_rules
  USING (true)
  WITH CHECK (true);

-- ─── Frequency Rules ──────────────────────────────────────────────────────────

CREATE TABLE frequency_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  frequency   frequency NOT NULL DEFAULT 'once_per_session',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE frequency_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY frequency_rules_all_tenant_isolation ON frequency_rules
  USING (true)
  WITH CHECK (true);

-- ─── Events (TimescaleDB hypertable) ──────────────────────────────────────────

CREATE TABLE events (
  ts                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id         UUID NOT NULL,
  site_id           UUID NOT NULL,
  campaign_id       UUID NOT NULL,
  event_type        event_type NOT NULL,
  affiliate_slot_id TEXT,
  visitor_id        TEXT,   -- first-party hashed ID (no PII)
  session_id        TEXT,
  country           TEXT,   -- from Cloudflare cf.country
  device            TEXT,   -- mobile|desktop|tablet
  page_url          TEXT,
  referrer          TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'
);

-- Events table does not use Row Level Security (RLS) to ensure TimescaleDB columnstore compression works correctly.
-- JWT tenant isolation is enforced at the application/service layer.

-- Convert events to TimescaleDB hypertable (7-day chunks)
SELECT create_hypertable('events', 'ts', chunk_time_interval => INTERVAL '7 days');

-- Compression after 7 days (saves ~90% storage on cold chunks)
ALTER TABLE events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'tenant_id, campaign_id',
  timescaledb.compress_orderby = 'ts DESC'
);

SELECT add_compression_policy('events', INTERVAL '7 days');

-- Retention: keep 13 months then drop old chunks
SELECT add_retention_policy('events', INTERVAL '13 months');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Sites lookup by public_key (used by edge Worker config endpoint)
CREATE INDEX sites_public_key_idx ON sites (public_key) WHERE deleted_at IS NULL;

-- Campaigns lookup by site + status (used by config endpoint)
CREATE INDEX campaigns_site_status_idx ON campaigns (site_id, status) WHERE deleted_at IS NULL;

-- Events analytics queries: tenant + time range
CREATE INDEX events_tenant_ts_idx ON events (tenant_id, ts DESC);
CREATE INDEX events_campaign_ts_idx ON events (campaign_id, ts DESC);
