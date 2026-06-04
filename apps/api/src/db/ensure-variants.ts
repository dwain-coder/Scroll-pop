import { sqlClient } from './client.js';

/**
 * Ensure the A/B variants schema (migration 0010) exists. Runs on API boot, idempotently,
 * so a deploy that ships A/B code never fails on a prod DB that hasn't had the migration
 * applied yet. Mirrors ensureLeadsSchema. See CTO-AUDIT P0-4 / P1-10.
 */
export async function ensureVariantsSchema(
  log: { info: (msg: string) => void; error: (obj: unknown, msg: string) => void },
): Promise<void> {
  try {
    await sqlClient.unsafe(`
      CREATE TABLE IF NOT EXISTS variants (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL,
        campaign_id     UUID NOT NULL,
        name            TEXT NOT NULL,
        weight          INTEGER NOT NULL DEFAULT 50,
        config          JSONB NOT NULL DEFAULT '{}',
        affiliate_slots JSONB NOT NULL DEFAULT '[]',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        CREATE POLICY variants_all_tenant_isolation ON variants USING (true) WITH CHECK (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      CREATE INDEX IF NOT EXISTS variants_campaign_idx ON variants (campaign_id);
    `);
    log.info('[schema] variants schema ensured');
  } catch (err) {
    log.error(err, '[schema] failed to ensure variants schema (continuing startup)');
  }
}
