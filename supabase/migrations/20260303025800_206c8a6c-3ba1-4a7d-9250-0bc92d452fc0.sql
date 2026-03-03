
-- =============================================
-- PRD-300 Sprint 2, Phase 1: Zone Builder Schema
-- =============================================

-- Status enum for zone builder runs
CREATE TYPE public.zone_builder_run_status AS ENUM ('draft', 'preview', 'committed', 'archived');

-- Seed strategy enum
CREATE TYPE public.zone_seed_strategy AS ENUM ('auto', 'demand_first', 'provider_first');

-- =============================================
-- Table 1: zone_builder_runs
-- Stores each generation run with config dials
-- =============================================
CREATE TABLE public.zone_builder_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  status public.zone_builder_run_status NOT NULL DEFAULT 'draft',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.zone_builder_runs IS 'Each zone generation run with config dials and status';
COMMENT ON COLUMN public.zone_builder_runs.config IS 'Generation config: resolution, seed_strategy, target_workload_days, max_spread_minutes, min_density';

ALTER TABLE public.zone_builder_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage zone builder runs"
  ON public.zone_builder_runs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Table 2: zone_cells
-- H3 cell index → zone mapping with aggregates
-- =============================================
CREATE TABLE public.zone_cells (
  h3_index TEXT NOT NULL PRIMARY KEY,
  zone_id UUID REFERENCES public.zones(id),
  run_id UUID REFERENCES public.zone_builder_runs(id),
  demand_minutes_week NUMERIC NOT NULL DEFAULT 0,
  supply_minutes_week NUMERIC NOT NULL DEFAULT 0,
  customer_count INT NOT NULL DEFAULT 0,
  provider_count INT NOT NULL DEFAULT 0,
  category_demand JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_supply JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.zone_cells IS 'Maps H3 hex cells to zones with demand/supply aggregates';

ALTER TABLE public.zone_cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read zone cells"
  ON public.zone_cells
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage zone cells"
  ON public.zone_cells
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Table 3: zone_builder_results
-- Generated zones per run before commit
-- =============================================
CREATE TABLE public.zone_builder_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.zone_builder_runs(id) ON DELETE CASCADE,
  zone_label TEXT NOT NULL,
  cell_indices TEXT[] NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  warnings TEXT[] NOT NULL DEFAULT '{}',
  neighbor_zone_labels TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.zone_builder_results IS 'Generated zones per builder run before commit to operational zones table';
COMMENT ON COLUMN public.zone_builder_results.metrics IS 'Per-zone: demand_min_week, supply_min_week, sd_ratio, density, compactness, max_spread_min, drive_burden_proxy';

ALTER TABLE public.zone_builder_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage zone builder results"
  ON public.zone_builder_results
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_zone_cells_zone_id ON public.zone_cells(zone_id);
CREATE INDEX idx_zone_cells_run_id ON public.zone_cells(run_id);
CREATE INDEX idx_zone_builder_results_run_id ON public.zone_builder_results(run_id);
CREATE INDEX idx_zone_builder_runs_region_id ON public.zone_builder_runs(region_id);
CREATE INDEX idx_zone_builder_runs_status ON public.zone_builder_runs(status);

-- Updated_at triggers
CREATE TRIGGER update_zone_builder_runs_updated_at
  BEFORE UPDATE ON public.zone_builder_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zone_cells_updated_at
  BEFORE UPDATE ON public.zone_cells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
