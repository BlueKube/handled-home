
-- ============================================================
-- PRD-300 Sprint 4 Phase 1: Rolling Horizon Planner Schema
-- ============================================================

-- 1) plan_window enum for visits (locked vs draft)
DO $$ BEGIN
  CREATE TYPE public.plan_window AS ENUM ('locked', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) plan_runs table — tracks each nightly planner execution
CREATE TABLE IF NOT EXISTS public.plan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  triggered_by text NOT NULL DEFAULT 'system'
    CHECK (triggered_by IN ('system', 'admin_manual', 'admin_draft_only')),
  started_at timestamptz,
  completed_at timestamptz,
  run_date date NOT NULL DEFAULT CURRENT_DATE,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin only
ALTER TABLE public.plan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all plan runs"
  ON public.plan_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index on status for querying active/recent runs
CREATE INDEX IF NOT EXISTS idx_plan_runs_status ON public.plan_runs (status);
CREATE INDEX IF NOT EXISTS idx_plan_runs_run_date ON public.plan_runs (run_date DESC);

-- 3) Add plan_window + plan_run_id to visits
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS plan_window public.plan_window,
  ADD COLUMN IF NOT EXISTS plan_run_id uuid REFERENCES public.plan_runs(id);

-- Index for planner queries: property + date range
CREATE INDEX IF NOT EXISTS idx_visits_property_date ON public.visits (property_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visits_plan_window ON public.visits (plan_window) WHERE plan_window IS NOT NULL;

-- 4) Add cadence_anchor_date to routines (stable offset for cadence math)
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS cadence_anchor_date date;

-- 5) Add effective_date to routine_versions (when changes take effect in the plan)
ALTER TABLE public.routine_versions
  ADD COLUMN IF NOT EXISTS effective_date date;

-- 6) updated_at trigger for plan_runs
CREATE OR REPLACE FUNCTION public.set_plan_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completed_at = CASE
    WHEN NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed')
    THEN now()
    ELSE NEW.completed_at
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plan_runs_auto_complete
  BEFORE UPDATE ON public.plan_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_plan_runs_updated_at();
