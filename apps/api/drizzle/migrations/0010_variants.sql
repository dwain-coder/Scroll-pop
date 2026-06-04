-- DOWN: DROP TABLE IF EXISTS variants;
-- A/B variants: alternative designs for a campaign, served by weight. Tenant-scoped with RLS.
-- See CTO-AUDIT P0-4 / P1-10.

CREATE TABLE IF NOT EXISTS variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  weight          INTEGER NOT NULL DEFAULT 50,
  config          JSONB NOT NULL DEFAULT '{}',
  affiliate_slots JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY variants_all_tenant_isolation ON variants
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS variants_campaign_idx ON variants (campaign_id);
