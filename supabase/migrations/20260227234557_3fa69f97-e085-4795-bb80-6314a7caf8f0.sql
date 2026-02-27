
-- Sprint 2G-C: Governance + Explainability

-- 1. decision_traces table for glass-box machine explainability
CREATE TABLE public.decision_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type text NOT NULL,         -- e.g. 'auto_assign_job', 'dunning_step', 'sla_evaluation'
  entity_type text NOT NULL,           -- e.g. 'job', 'subscription', 'provider_org'
  entity_id uuid NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}',  -- policy versions, zone settings, date context
  candidates jsonb NOT NULL DEFAULT '[]', -- evaluated options with scores
  scoring jsonb NOT NULL DEFAULT '{}', -- weights, formula, thresholds used
  outcome jsonb NOT NULL DEFAULT '{}', -- selected result + short reason
  override_event_id uuid,             -- if an admin overrode this decision
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lookups
CREATE INDEX idx_decision_traces_entity ON public.decision_traces (entity_type, entity_id);
CREATE INDEX idx_decision_traces_type_created ON public.decision_traces (decision_type, created_at DESC);

-- RLS: admin-only read
ALTER TABLE public.decision_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read decision traces"
  ON public.decision_traces FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_memberships am WHERE am.user_id = auth.uid() AND am.is_active = true));

-- 2. log_admin_action RPC — standardized audit logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_before jsonb DEFAULT NULL,
  p_after jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id, action, entity_type, entity_id, reason, before, after
  ) VALUES (
    auth.uid(), p_action, p_entity_type, p_entity_id, p_reason, p_before, p_after
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
