
-- Sprint 2H-A: Cron RPCs + admin_system_config

-- 1. start_cron_run() — returns the run ID for later finish call
CREATE OR REPLACE FUNCTION public.start_cron_run(
  p_function_name text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
BEGIN
  INSERT INTO cron_run_log (function_name, started_at, status, idempotency_key)
  VALUES (p_function_name, now(), 'running', p_idempotency_key)
  RETURNING id INTO v_run_id;
  RETURN v_run_id;
END;
$$;

-- 2. finish_cron_run() — mark run as success or failed
CREATE OR REPLACE FUNCTION public.finish_cron_run(
  p_run_id uuid,
  p_status text DEFAULT 'success',
  p_result_summary jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cron_run_log
  SET completed_at = now(),
      status = p_status,
      result_summary = p_result_summary,
      error_message = p_error_message
  WHERE id = p_run_id;
END;
$$;

-- 3. admin_system_config table
CREATE TABLE IF NOT EXISTS public.admin_system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_system_config ENABLE ROW LEVEL SECURITY;

-- Everyone with admin role can read
CREATE POLICY "admin_system_config_select" ON public.admin_system_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only superusers can modify
CREATE POLICY "admin_system_config_all" ON public.admin_system_config
  FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_admin_system_config_updated_at
  BEFORE UPDATE ON public.admin_system_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default config values
INSERT INTO public.admin_system_config (config_key, config_value, description) VALUES
  ('daily_capacity_cap', '{"default": 15}'::jsonb, 'Max jobs per provider per day'),
  ('tier_weights', '{"gold": 2, "silver": 1, "standard": 0}'::jsonb, 'Priority modifiers per provider tier'),
  ('backup_selection', '{"strategy": "performance_score_desc"}'::jsonb, 'How backup providers are ranked'),
  ('max_byoc_bonus_per_week', '{"amount_cents": 5000}'::jsonb, 'Max BYOC bonus payout per provider per week'),
  ('max_pricing_change_per_week', '{"percent": 10}'::jsonb, 'Max pricing change allowed per week without superuser override'),
  ('emergency_override_ttl_hours', '{"hours": 72}'::jsonb, 'How long emergency pricing overrides last before auto-reverting'),
  ('quality_score_weights', '{"rating": 0.35, "issues": 0.25, "photos": 0.20, "on_time": 0.20}'::jsonb, 'Weights for quality score computation')
ON CONFLICT (config_key) DO NOTHING;

-- Index for cron_run_log queries
CREATE INDEX IF NOT EXISTS idx_cron_run_log_function_status ON public.cron_run_log (function_name, status, started_at DESC);
