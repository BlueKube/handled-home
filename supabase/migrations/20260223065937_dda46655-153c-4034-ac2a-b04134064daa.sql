-- Drop the duplicate named unique constraints added by the second migration.
-- The inline UNIQUE constraints from the first migration already exist.
ALTER TABLE public.ops_kpi_snapshots_daily
  DROP CONSTRAINT IF EXISTS ops_kpi_snapshots_daily_date_key_unique;

ALTER TABLE public.ops_kpi_snapshots_realtime
  DROP CONSTRAINT IF EXISTS ops_kpi_snapshots_realtime_key_unique;

ALTER TABLE public.zone_health_snapshots
  DROP CONSTRAINT IF EXISTS zone_health_snapshots_zone_date_unique;

ALTER TABLE public.provider_health_snapshots
  DROP CONSTRAINT IF EXISTS provider_health_snapshots_org_date_unique;
