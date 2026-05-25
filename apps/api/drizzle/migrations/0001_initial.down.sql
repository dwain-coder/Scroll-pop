-- ScrollPop — Initial Schema DOWN Migration
-- 0001_initial.down.sql
-- Drops everything created in 0001_initial.sql in reverse dependency order

-- Drop indexes (auto-dropped with tables, but explicit for clarity)
DROP INDEX IF EXISTS events_campaign_ts_idx;
DROP INDEX IF EXISTS events_tenant_ts_idx;
DROP INDEX IF EXISTS campaigns_site_status_idx;
DROP INDEX IF EXISTS sites_public_key_idx;

-- Drop tables in reverse FK order
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS frequency_rules;
DROP TABLE IF EXISTS targeting_rules;
DROP TABLE IF EXISTS triggers;
DROP TABLE IF EXISTS designs;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS tenant_members;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- Drop enum types
DROP TYPE IF EXISTS event_type;
DROP TYPE IF EXISTS frequency;
DROP TYPE IF EXISTS operator;
DROP TYPE IF EXISTS targeting_kind;
DROP TYPE IF EXISTS trigger_type;
DROP TYPE IF EXISTS design_kind;
DROP TYPE IF EXISTS campaign_status;
DROP TYPE IF EXISTS platform;
DROP TYPE IF EXISTS member_role;
DROP TYPE IF EXISTS plan;
