
CREATE TABLE public.provider_route_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  total_stops INT NOT NULL DEFAULT 0,
  est_drive_minutes INT NOT NULL DEFAULT 0,
  est_work_minutes INT NOT NULL DEFAULT 0,
  projected_earnings_cents INT NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_org_id, plan_date)
);

CREATE INDEX idx_provider_route_plans_org_date ON public.provider_route_plans(provider_org_id, plan_date);
ALTER TABLE public.provider_route_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members can view own route plans"
  ON public.provider_route_plans FOR SELECT
  USING (provider_org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access to route plans"
  ON public.provider_route_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.lock_provider_route(p_provider_org_id UUID, p_date DATE)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_stops INT; v_est_work_minutes INT; v_est_drive_minutes INT;
  v_projected_earnings_cents INT; v_result jsonb; v_existing_lock TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM provider_members WHERE provider_org_id = p_provider_org_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this provider org';
  END IF;

  SELECT locked_at INTO v_existing_lock FROM provider_route_plans WHERE provider_org_id = p_provider_org_id AND plan_date = p_date;
  IF v_existing_lock IS NOT NULL THEN RAISE EXCEPTION 'Route already locked for this date'; END IF;

  SELECT COUNT(*), COALESCE(SUM(js_minutes), 0) INTO v_total_stops, v_est_work_minutes
  FROM (
    SELECT j.id, COALESCE((SELECT SUM(COALESCE(js.duration_minutes_snapshot, 0)) FROM job_skus js WHERE js.job_id = j.id), 0) AS js_minutes
    FROM jobs j WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date = p_date AND j.status NOT IN ('COMPLETED', 'CANCELED')
  ) sub;

  v_est_drive_minutes := GREATEST(0, (v_total_stops - 1)) * 8;

  SELECT COALESCE(SUM(pe.total_cents), 0) INTO v_projected_earnings_cents
  FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
  WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date = p_date;

  IF v_projected_earnings_cents = 0 AND v_total_stops > 0 THEN
    SELECT COALESCE(AVG(pe.total_cents), 4500) * v_total_stops INTO v_projected_earnings_cents
    FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
    WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date >= (p_date - INTERVAL '30 days');
  END IF;

  INSERT INTO provider_route_plans (provider_org_id, plan_date, total_stops, est_drive_minutes, est_work_minutes, projected_earnings_cents, locked_at, updated_at)
  VALUES (p_provider_org_id, p_date, v_total_stops, v_est_drive_minutes, v_est_work_minutes, v_projected_earnings_cents::int, now(), now())
  ON CONFLICT (provider_org_id, plan_date) DO UPDATE SET
    total_stops = EXCLUDED.total_stops, est_drive_minutes = EXCLUDED.est_drive_minutes,
    est_work_minutes = EXCLUDED.est_work_minutes, projected_earnings_cents = EXCLUDED.projected_earnings_cents,
    locked_at = now(), updated_at = now();

  RETURN jsonb_build_object('locked', true, 'total_stops', v_total_stops, 'est_drive_minutes', v_est_drive_minutes,
    'est_work_minutes', v_est_work_minutes, 'projected_earnings_cents', v_projected_earnings_cents::int);
END;
$$;
