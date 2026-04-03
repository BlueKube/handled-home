-- ============================================
-- Phase 5 B1: SOP Run Tracking
-- ============================================
-- Tracks interactive SOP execution with per-step checkoff,
-- timing, and completion status.
-- ============================================

CREATE TABLE IF NOT EXISTS public.sop_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id TEXT NOT NULL,
  started_by_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  steps_completed JSONB NOT NULL DEFAULT '[]',
  step_notes JSONB NOT NULL DEFAULT '{}',
  total_steps INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sop_runs_sop_id ON public.sop_runs(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_status ON public.sop_runs(status);
CREATE INDEX IF NOT EXISTS idx_sop_runs_started_by ON public.sop_runs(started_by_user_id);

COMMENT ON TABLE public.sop_runs IS 'Tracks interactive SOP execution. steps_completed is an array of step indices. step_notes maps step index to note text.';

-- RLS
ALTER TABLE public.sop_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_sop_runs_all ON public.sop_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );
