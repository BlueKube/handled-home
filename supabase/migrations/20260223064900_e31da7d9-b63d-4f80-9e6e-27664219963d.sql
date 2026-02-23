-- Add unique constraints needed for upsert in snapshot-rollup edge function

-- ops_kpi_snapshots_daily: unique on (snapshot_date, metric_key)
ALTER TABLE public.ops_kpi_snapshots_daily
  ADD CONSTRAINT ops_kpi_snapshots_daily_date_key_unique UNIQUE (snapshot_date, metric_key);

-- ops_kpi_snapshots_realtime: unique on (metric_key)
ALTER TABLE public.ops_kpi_snapshots_realtime
  ADD CONSTRAINT ops_kpi_snapshots_realtime_key_unique UNIQUE (metric_key);

-- zone_health_snapshots: add columns used by the edge function if missing, then unique constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_health_snapshots' AND column_name = 'capacity_pct') THEN
    ALTER TABLE public.zone_health_snapshots ADD COLUMN capacity_pct integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_health_snapshots' AND column_name = 'active_subs') THEN
    ALTER TABLE public.zone_health_snapshots ADD COLUMN active_subs integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_health_snapshots' AND column_name = 'completed_jobs_7d') THEN
    ALTER TABLE public.zone_health_snapshots ADD COLUMN completed_jobs_7d integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zone_health_snapshots' AND column_name = 'issue_rate_7d') THEN
    ALTER TABLE public.zone_health_snapshots ADD COLUMN issue_rate_7d integer DEFAULT 0;
  END IF;
END $$;

ALTER TABLE public.zone_health_snapshots
  ADD CONSTRAINT zone_health_snapshots_zone_date_unique UNIQUE (zone_id, snapshot_date);

-- provider_health_snapshots: unique on (provider_org_id, snapshot_date)
ALTER TABLE public.provider_health_snapshots
  ADD CONSTRAINT provider_health_snapshots_org_date_unique UNIQUE (provider_org_id, snapshot_date);