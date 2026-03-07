-- Zone health rolling 7-day metrics RPC
CREATE OR REPLACE FUNCTION public.get_zone_health_rolling(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_cutoff date := current_date - p_days;
  v_caller uuid := auth.uid();
BEGIN
  -- Admin guard
  IF v_caller IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = v_caller AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin membership required';
  END IF;

  WITH zone_jobs AS (
    SELECT
      j.zone_id,
      count(*)::int AS total_jobs,
      count(*) FILTER (WHERE j.scheduled_date = current_date::text)::int AS jobs_today,
      count(*) FILTER (WHERE j.status = 'COMPLETED')::int AS completed_jobs,
      count(*) FILTER (WHERE j.status IN ('NOT_STARTED', 'assigned') AND j.provider_org_id IS NULL AND j.scheduled_date <= (current_date + 7)::text)::int AS unassigned_today
    FROM jobs j
    WHERE j.scheduled_date >= v_cutoff::text
      AND j.scheduled_date <= (current_date + 7)::text
    GROUP BY j.zone_id
  ),
  zone_issues AS (
    SELECT
      j.zone_id,
      count(DISTINCT ji.id)::int AS issue_count,
      count(DISTINCT ji.id) FILTER (WHERE ji.issue_type = 'REDO')::int AS redo_count
    FROM job_issues ji
    JOIN jobs j ON j.id = ji.job_id
    WHERE ji.created_at >= v_cutoff::timestamptz
    GROUP BY j.zone_id
  ),
  zone_proof AS (
    SELECT
      j.zone_id,
      count(DISTINCT j.id)::int AS proof_required_jobs,
      count(DISTINCT j.id) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM job_photos jp WHERE jp.job_id = j.id
      ))::int AS proof_missing_jobs
    FROM jobs j
    JOIN job_checklist_items jci ON jci.job_id = j.id AND jci.is_required = true
    WHERE j.status = 'COMPLETED'
      AND j.completed_at >= v_cutoff::timestamptz
    GROUP BY j.zone_id
  ),
  zone_exceptions AS (
    SELECT
      oe.zone_id,
      count(*)::int AS exception_count,
      count(*) FILTER (WHERE oe.status != 'resolved')::int AS open_exceptions
    FROM ops_exceptions oe
    WHERE oe.created_at >= v_cutoff::timestamptz
    GROUP BY oe.zone_id
  ),
  zone_visits AS (
    SELECT
      v.zone_id,
      round(COALESCE(avg(v.stop_duration_minutes), 0)::numeric, 1) AS avg_stop_minutes,
      count(*) FILTER (WHERE v.schedule_state = 'rescheduled')::int AS reschedule_count,
      count(*)::int AS total_visits
    FROM visits v
    WHERE v.scheduled_date >= v_cutoff
      AND v.scheduled_date <= current_date + 7
    GROUP BY v.zone_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'zone_id', z.id,
    'zone_name', z.name,
    'jobs_today', COALESCE(zj.jobs_today, 0),
    'total_jobs_7d', COALESCE(zj.total_jobs, 0),
    'completed_jobs_7d', COALESCE(zj.completed_jobs, 0),
    'unassigned_locked', COALESCE(zj.unassigned_today, 0),
    'issue_count_7d', COALESCE(zi.issue_count, 0),
    'redo_count_7d', COALESCE(zi.redo_count, 0),
    'proof_missing_rate', CASE WHEN COALESCE(zp.proof_required_jobs, 0) > 0
      THEN round((zp.proof_missing_jobs::numeric / zp.proof_required_jobs) * 100, 1) ELSE 0 END,
    'exception_count_7d', COALESCE(ze.exception_count, 0),
    'open_exceptions', COALESCE(ze.open_exceptions, 0),
    'reschedule_count_7d', COALESCE(zv.reschedule_count, 0),
    'reschedule_rate', CASE WHEN COALESCE(zv.total_visits, 0) > 0
      THEN round((zv.reschedule_count::numeric / zv.total_visits) * 100, 1) ELSE 0 END,
    'avg_stop_minutes', COALESCE(zv.avg_stop_minutes, 0)
  ) ORDER BY COALESCE(ze.open_exceptions, 0) DESC, z.name)
  INTO v_result
  FROM zones z
  LEFT JOIN zone_jobs zj ON zj.zone_id = z.id
  LEFT JOIN zone_issues zi ON zi.zone_id = z.id
  LEFT JOIN zone_proof zp ON zp.zone_id = z.id
  LEFT JOIN zone_exceptions ze ON ze.zone_id = z.id
  LEFT JOIN zone_visits zv ON zv.zone_id = z.id
  WHERE z.status = 'active';

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_health_rolling(int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_zone_health_rolling(int) FROM anon;