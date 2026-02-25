
-- =============================================================
-- Round 2B Sprint 0: Infrastructure Tables
-- =============================================================

-- 1. NOTIFICATIONS TABLE
-- Central notification sink for all automation events
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System inserts via SECURITY DEFINER functions
CREATE POLICY "Service role inserts notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. CRON_RUN_LOG TABLE
-- Observability for all scheduled/batch edge functions
CREATE TABLE public.cron_run_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  idempotency_key text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  result_summary jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cron_run_log"
  ON public.cron_run_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts cron_run_log"
  ON public.cron_run_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates cron_run_log"
  ON public.cron_run_log FOR UPDATE
  USING (true);

CREATE UNIQUE INDEX idx_cron_run_log_idempotency ON public.cron_run_log (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_cron_run_log_function ON public.cron_run_log (function_name, started_at DESC);

-- 3. ZONE_CATEGORY_PROVIDERS TABLE
-- Primary + Backup provider assignments per zone + category
CREATE TABLE public.zone_category_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'BACKUP' CHECK (role IN ('PRIMARY', 'BACKUP')),
  priority_rank int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  performance_score numeric DEFAULT 0.5,
  formula_version text DEFAULT 'v1',
  computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_category_providers ENABLE ROW LEVEL SECURITY;

-- Only one PRIMARY per zone+category
CREATE UNIQUE INDEX idx_zcp_unique_primary
  ON public.zone_category_providers (zone_id, category)
  WHERE role = 'PRIMARY';

-- Prevent same provider as both PRIMARY and BACKUP in same zone+category
CREATE UNIQUE INDEX idx_zcp_unique_provider_zone_cat
  ON public.zone_category_providers (zone_id, category, provider_org_id);

CREATE INDEX idx_zcp_zone_category ON public.zone_category_providers (zone_id, category, role);

CREATE POLICY "Admins manage zone_category_providers"
  ON public.zone_category_providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers read own assignments"
  ON public.zone_category_providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = zone_category_providers.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_zcp_updated_at
  BEFORE UPDATE ON public.zone_category_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. JOB_ASSIGNMENT_LOG TABLE
-- Audit trail for every job assignment decision
CREATE TABLE public.job_assignment_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_org_id uuid REFERENCES public.provider_orgs(id),
  assignment_reason text NOT NULL,
  explain_customer text,
  explain_provider text,
  explain_admin text,
  score_breakdown jsonb DEFAULT '{}'::jsonb,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by text NOT NULL DEFAULT 'system' CHECK (assigned_by IN ('system', 'admin')),
  previous_provider_org_id uuid REFERENCES public.provider_orgs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_assignment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read job_assignment_log"
  ON public.job_assignment_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts job_assignment_log"
  ON public.job_assignment_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_jal_job ON public.job_assignment_log (job_id, assigned_at DESC);
CREATE INDEX idx_jal_provider ON public.job_assignment_log (provider_org_id, assigned_at DESC);

-- 5. ALTER SUBSCRIPTIONS — add dunning + service week tracking
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS service_weeks_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dunning_step int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dunning_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_dunning_at timestamptz;

-- 6. ALTER JOBS — add latest_start_by + route_order
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latest_start_by timestamptz,
  ADD COLUMN IF NOT EXISTS route_order int;

CREATE INDEX idx_jobs_route ON public.jobs (provider_org_id, scheduled_date, route_order)
  WHERE status IN ('assigned', 'NOT_STARTED');

-- 7. INCREMENT SERVICE WEEK USAGE RPC
CREATE OR REPLACE FUNCTION public.increment_service_week_usage(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_entitlements plan_entitlement_versions%ROWTYPE;
  v_max_weeks int;
BEGIN
  SELECT * INTO v_sub FROM subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Get entitlement limits
  SELECT * INTO v_entitlements FROM plan_entitlement_versions
    WHERE id = COALESCE(v_sub.entitlement_version_id,
      (SELECT current_entitlement_version_id FROM plans WHERE id = v_sub.plan_id));

  v_max_weeks := COALESCE(v_entitlements.included_service_weeks_per_billing_cycle, 4);

  IF v_sub.service_weeks_used >= v_max_weeks THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'Service week limit reached',
      'used', v_sub.service_weeks_used,
      'max', v_max_weeks
    );
  END IF;

  UPDATE subscriptions
    SET service_weeks_used = service_weeks_used + 1
    WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'used', v_sub.service_weeks_used + 1,
    'max', v_max_weeks
  );
END;
$$;

-- 8. HELPER: Insert notification (used by all automation RPCs)
CREATE OR REPLACE FUNCTION public.emit_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
