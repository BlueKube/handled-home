
-- Rollup tables for Module 14 Reporting & Analytics

CREATE TABLE public.ops_kpi_snapshots_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, metric_key)
);

CREATE TABLE public.ops_kpi_snapshots_realtime (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL UNIQUE,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id),
  snapshot_date DATE NOT NULL,
  capacity_pct NUMERIC DEFAULT 0,
  issue_rate NUMERIC DEFAULT 0,
  proof_compliance NUMERIC DEFAULT 0,
  active_subs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_id, snapshot_date)
);

CREATE TABLE public.provider_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  snapshot_date DATE NOT NULL,
  completed_jobs INTEGER DEFAULT 0,
  issue_rate NUMERIC DEFAULT 0,
  proof_compliance NUMERIC DEFAULT 0,
  avg_time_on_site_minutes NUMERIC DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_org_id, snapshot_date)
);

ALTER TABLE public.ops_kpi_snapshots_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_kpi_snapshots_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ops_kpi_snapshots_daily" ON public.ops_kpi_snapshots_daily FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can read ops_kpi_snapshots_realtime" ON public.ops_kpi_snapshots_realtime FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can read zone_health_snapshots" ON public.zone_health_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can read provider_health_snapshots" ON public.provider_health_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Providers can read own snapshots via RPC function
CREATE POLICY "Providers can read own health snapshots" ON public.provider_health_snapshots FOR SELECT USING (
  public.is_provider_org_member(provider_org_id)
);

CREATE INDEX idx_ops_kpi_daily_date ON public.ops_kpi_snapshots_daily(snapshot_date);
CREATE INDEX idx_zone_health_zone_date ON public.zone_health_snapshots(zone_id, snapshot_date);
CREATE INDEX idx_provider_health_org_date ON public.provider_health_snapshots(provider_org_id, snapshot_date);
