
CREATE OR REPLACE FUNCTION public.lock_provider_route(p_provider_org_id UUID, p_date DATE)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_stops INT;
  v_est_work_minutes INT;
  v_est_drive_minutes INT;
  v_actual_earnings INT;
  v_remaining_stops INT;
  v_avg_per_job INT;
  v_projected_earnings_cents INT;
  v_existing_lock TIMESTAMPTZ;
BEGIN
  -- Auth check
  IF NOT EXISTS (SELECT 1 FROM provider_members WHERE provider_org_id = p_provider_org_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this provider org';
  END IF;

  -- Prevent double-lock
  SELECT locked_at INTO v_existing_lock FROM provider_route_plans WHERE provider_org_id = p_provider_org_id AND plan_date = p_date;
  IF v_existing_lock IS NOT NULL THEN RAISE EXCEPTION 'Route already locked for this date'; END IF;

  -- E01-F2 fix: count ALL non-canceled jobs (including COMPLETED) for the full day picture
  SELECT COUNT(*), COALESCE(SUM(js_minutes), 0) INTO v_total_stops, v_est_work_minutes
  FROM (
    SELECT j.id, COALESCE((SELECT SUM(COALESCE(js.duration_minutes_snapshot, 0)) FROM job_skus js WHERE js.job_id = j.id), 0) AS js_minutes
    FROM jobs j WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date = p_date AND j.status != 'CANCELED'
  ) sub;

  v_est_drive_minutes := GREATEST(0, (v_total_stops - 1)) * 8;

  -- E01-F1 fix: actual completed earnings + projected remaining
  SELECT COALESCE(SUM(pe.total_cents), 0) INTO v_actual_earnings
  FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
  WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date = p_date;

  SELECT COUNT(*) INTO v_remaining_stops FROM jobs
  WHERE provider_org_id = p_provider_org_id AND scheduled_date = p_date
    AND status NOT IN ('COMPLETED', 'CANCELED');

  IF v_remaining_stops > 0 THEN
    SELECT COALESCE(AVG(pe.total_cents), 4500)::int INTO v_avg_per_job
    FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
    WHERE j.provider_org_id = p_provider_org_id
      AND j.scheduled_date >= (p_date - INTERVAL '30 days');
    v_projected_earnings_cents := v_actual_earnings + (v_avg_per_job * v_remaining_stops);
  ELSE
    v_projected_earnings_cents := v_actual_earnings;
  END IF;

  INSERT INTO provider_route_plans (provider_org_id, plan_date, total_stops, est_drive_minutes, est_work_minutes, projected_earnings_cents, locked_at, updated_at)
  VALUES (p_provider_org_id, p_date, v_total_stops, v_est_drive_minutes, v_est_work_minutes, v_projected_earnings_cents, now(), now())
  ON CONFLICT (provider_org_id, plan_date) DO UPDATE SET
    total_stops = EXCLUDED.total_stops, est_drive_minutes = EXCLUDED.est_drive_minutes,
    est_work_minutes = EXCLUDED.est_work_minutes, projected_earnings_cents = EXCLUDED.projected_earnings_cents,
    locked_at = now(), updated_at = now();

  RETURN jsonb_build_object('locked', true, 'total_stops', v_total_stops, 'est_drive_minutes', v_est_drive_minutes,
    'est_work_minutes', v_est_work_minutes, 'projected_earnings_cents', v_projected_earnings_cents);
END;
$$;
