
-- ============================================================
-- Sprint 2H-C Review Fixes (C-F1 through C-F7)
-- ============================================================

-- C-F3: Add missing updated_at column to provider_feedback_rollups
ALTER TABLE public.provider_feedback_rollups
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- C-F1, C-F2, C-F3 (upsert), C-F5, C-F6, C-F7:
-- Rewrite compute_provider_weekly_rollups with CTE-based aggregation,
-- correct redo tracking, installed_at lifecycle step, auth guard
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_provider_weekly_rollups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start date;
  v_week_end date;
  v_upserted integer := 0;
BEGIN
  -- C-F7: Authorization guard
  IF NOT (
    EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IS NULL -- service role
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calculate previous week's Monday-Sunday
  v_week_end := (date_trunc('week', now()) - interval '1 day')::date;     -- last Sunday
  v_week_start := (v_week_end - interval '6 days')::date;                  -- last Monday

  -- C-F2 FIX: Use CTEs to avoid JOIN fan-out
  WITH job_base AS (
    SELECT j.id, j.provider_org_id, j.status, j.started_at, j.completed_at,
           j.latest_start_by, j.arrived_at
    FROM jobs j
    WHERE j.scheduled_date >= v_week_start::text
      AND j.scheduled_date <= v_week_end::text
  ),
  -- C-F1 FIX: Use customer_issues (redo = any open issue on a completed job)
  -- since job_issues.issue_type doesn't have 'redo_requested'
  issue_agg AS (
    SELECT ci.job_id,
           COUNT(*) AS issue_count
    FROM customer_issues ci
    JOIN job_base jb ON ci.job_id = jb.id
    GROUP BY ci.job_id
  ),
  rating_agg AS (
    SELECT vr.job_id,
           AVG(vr.rating) AS avg_rating,
           COUNT(*) AS rating_count
    FROM visit_ratings_private vr
    JOIN job_base jb ON vr.job_id = jb.id
    GROUP BY vr.job_id
  ),
  provider_agg AS (
    SELECT
      jb.provider_org_id,
      COUNT(*) AS total_jobs,
      COUNT(*) FILTER (WHERE jb.status = 'completed') AS completed_jobs,
      COUNT(*) FILTER (WHERE jb.status = 'completed'
        AND jb.arrived_at IS NOT NULL
        AND jb.latest_start_by IS NOT NULL
        AND jb.arrived_at <= jb.latest_start_by) AS ontime_jobs,
      COUNT(*) FILTER (WHERE jb.status = 'completed'
        AND jb.arrived_at IS NOT NULL
        AND jb.latest_start_by IS NOT NULL
        AND jb.arrived_at > jb.latest_start_by) AS late_jobs,
      COUNT(DISTINCT ia.job_id) AS redo_jobs,
      AVG(ra.avg_rating) AS avg_rating,
      AVG(EXTRACT(EPOCH FROM (jb.completed_at - jb.started_at)) / 60.0)
        FILTER (WHERE jb.completed_at IS NOT NULL AND jb.started_at IS NOT NULL) AS avg_duration_minutes
    FROM job_base jb
    LEFT JOIN issue_agg ia ON ia.job_id = jb.id
    LEFT JOIN rating_agg ra ON ra.job_id = jb.id
    GROUP BY jb.provider_org_id
  )
  INSERT INTO provider_feedback_rollups (
    provider_org_id, period_start, period_end,
    review_count, avg_rating, theme_counts, updated_at
  )
  SELECT
    pa.provider_org_id,
    v_week_start,
    (v_week_end + 1),
    COALESCE(pa.completed_jobs, 0),
    ROUND(COALESCE(pa.avg_rating, 0)::numeric, 2),
    jsonb_build_object(
      'total_jobs', pa.total_jobs,
      'completed_jobs', pa.completed_jobs,
      'ontime_jobs', pa.ontime_jobs,
      'late_jobs', pa.late_jobs,
      'redo_jobs', pa.redo_jobs,
      'completion_rate', CASE WHEN pa.total_jobs > 0
        THEN ROUND((pa.completed_jobs::numeric / pa.total_jobs) * 100, 1) ELSE 0 END,
      'ontime_rate', CASE WHEN pa.completed_jobs > 0
        THEN ROUND((pa.ontime_jobs::numeric / pa.completed_jobs) * 100, 1) ELSE 0 END,
      'redo_rate', CASE WHEN pa.completed_jobs > 0
        THEN ROUND((pa.redo_jobs::numeric / pa.completed_jobs) * 100, 1) ELSE 0 END,
      'avg_duration_minutes', ROUND(COALESCE(pa.avg_duration_minutes, 0)::numeric, 1)
    ),
    now()
  FROM provider_agg pa
  ON CONFLICT (provider_org_id, period_start)
  DO UPDATE SET
    review_count = EXCLUDED.review_count,
    avg_rating = EXCLUDED.avg_rating,
    theme_counts = EXCLUDED.theme_counts,
    updated_at = now();

  GET DIAGNOSTICS v_upserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'week_start', v_week_start,
    'week_end', v_week_end,
    'providers_rolled_up', v_upserted
  );
END;
$$;

-- ============================================================
-- C-F5 + C-F6 + C-F7: Rewrite run_byoc_lifecycle_transitions
-- Adds installed_at step, fixes activation counter, adds auth guard
-- ============================================================
CREATE OR REPLACE FUNCTION public.run_byoc_lifecycle_transitions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installed_count integer := 0;
  v_subscribed_count integer := 0;
  v_activated_count integer := 0;
  v_expired_count integer := 0;
  v_rec record;
  v_result jsonb;
BEGIN
  -- C-F7: Authorization guard
  IF NOT (
    EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IS NULL -- service role
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- C-F5: Step 1 — Advance installed_at for customers who have signed up
  -- (profile exists = they've installed/registered)
  UPDATE byoc_attributions ba
  SET installed_at = now(), updated_at = now()
  WHERE ba.status = 'PENDING'
    AND ba.installed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = ba.customer_id
    );
  GET DIAGNOSTICS v_installed_count = ROW_COUNT;

  -- Step 2 — Advance subscribed_at for customers with active subscriptions
  UPDATE byoc_attributions ba
  SET subscribed_at = now(), updated_at = now()
  WHERE ba.status = 'PENDING'
    AND ba.subscribed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.customer_id = ba.customer_id
        AND s.status = 'active'
    );
  GET DIAGNOSTICS v_subscribed_count = ROW_COUNT;

  -- Step 3 — Activate bonus window on first completed visit
  -- C-F6 FIX: Only loop PENDING attributions (not ACTIVE)
  FOR v_rec IN
    SELECT ba.id, ba.customer_id
    FROM byoc_attributions ba
    WHERE ba.status = 'PENDING'
      AND ba.subscribed_at IS NOT NULL
      AND ba.first_completed_visit_at IS NULL
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.customer_id = ba.customer_id
          AND j.status = 'completed'
      )
  LOOP
    v_result := public.activate_byoc_attribution(v_rec.customer_id);
    IF (v_result->>'activated')::boolean = true THEN
      v_activated_count := v_activated_count + 1;
    END IF;
  END LOOP;

  -- Step 4 — Expire ACTIVE → ENDED when bonus window has passed
  UPDATE byoc_attributions
  SET status = 'ENDED', updated_at = now()
  WHERE status = 'ACTIVE'
    AND bonus_end_at IS NOT NULL
    AND bonus_end_at < now();
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'installed', v_installed_count,
    'subscribed', v_subscribed_count,
    'activated', v_activated_count,
    'expired', v_expired_count
  );
END;
$$;
