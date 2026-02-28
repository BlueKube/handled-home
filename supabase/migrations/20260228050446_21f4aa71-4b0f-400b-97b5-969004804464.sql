
-- ============================================================
-- 2H-C1: run_byoc_lifecycle_transitions() RPC
-- Advances BYOC attribution lifecycle states daily:
--   1. Advance installed_at for customers who have signed up
--   2. Advance subscribed_at for customers who have active subscriptions
--   3. Activate bonus window on first completed visit (calls activate_byoc_attribution)
--   4. Expire ACTIVE→ENDED when bonus_end_at has passed
-- ============================================================

CREATE OR REPLACE FUNCTION public.run_byoc_lifecycle_transitions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id uuid;
  v_activated_count int := 0;
  v_expired_count int := 0;
  v_subscribed_count int := 0;
  v_installed_count int := 0;
  v_rec record;
BEGIN
  -- Start cron run log
  SELECT public.start_cron_run('byoc_lifecycle_transitions') INTO v_run_id;

  BEGIN
    -- Step 1: Advance subscribed_at for attributions where customer now has an active subscription
    UPDATE byoc_attributions ba
    SET subscribed_at = now(), updated_at = now()
    FROM subscriptions s
    WHERE ba.customer_id = s.customer_id
      AND ba.subscribed_at IS NULL
      AND s.status = 'active'
      AND ba.status IN ('PENDING', 'ACTIVE');
    GET DIAGNOSTICS v_subscribed_count = ROW_COUNT;

    -- Step 2: Activate bonus window for attributions where customer has first completed visit
    -- but bonus hasn't been activated yet
    FOR v_rec IN
      SELECT DISTINCT ba.id, ba.customer_id
      FROM byoc_attributions ba
      WHERE ba.first_completed_visit_at IS NULL
        AND ba.status IN ('PENDING', 'ACTIVE')
        AND EXISTS (
          SELECT 1 FROM jobs j
          WHERE j.customer_id = ba.customer_id
            AND j.status = 'COMPLETED'
            AND j.completed_at IS NOT NULL
        )
    LOOP
      -- Use activate_byoc_attribution which sets first_completed_visit_at,
      -- bonus_start_at, bonus_end_at, and status = 'ACTIVE'
      PERFORM public.activate_byoc_attribution(v_rec.customer_id);
      v_activated_count := v_activated_count + 1;
    END LOOP;

    -- Step 3: Expire ACTIVE→ENDED when bonus window has passed
    UPDATE byoc_attributions
    SET status = 'ENDED', updated_at = now()
    WHERE status = 'ACTIVE'
      AND bonus_end_at IS NOT NULL
      AND bonus_end_at < now();
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    -- Finish cron run
    PERFORM public.finish_cron_run(
      v_run_id,
      'success',
      jsonb_build_object(
        'subscribed_advanced', v_subscribed_count,
        'activated', v_activated_count,
        'expired', v_expired_count
      ),
      NULL
    );

    RETURN jsonb_build_object(
      'success', true,
      'subscribed_advanced', v_subscribed_count,
      'activated', v_activated_count,
      'expired', v_expired_count
    );

  EXCEPTION WHEN OTHERS THEN
    PERFORM public.finish_cron_run(
      v_run_id,
      'error',
      jsonb_build_object(
        'subscribed_advanced', v_subscribed_count,
        'activated', v_activated_count,
        'expired', v_expired_count
      ),
      SQLERRM
    );
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- ============================================================
-- 2H-C2: compute_provider_weekly_rollups() RPC
-- Aggregates completion rate, on-time rate, redo rate, avg duration,
-- and customer feedback per active provider org for the given week.
-- Writes to provider_feedback_rollups table.
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_provider_weekly_rollups(
  p_week_start date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id uuid;
  v_week_start date;
  v_week_end date;
  v_rollup_count int := 0;
  v_rec record;
BEGIN
  -- Default to previous Monday-Sunday UTC window
  IF p_week_start IS NULL THEN
    -- Previous Monday = current Monday minus 7 days
    v_week_start := date_trunc('week', now())::date - 7;
  ELSE
    v_week_start := p_week_start;
  END IF;
  v_week_end := v_week_start + 6;

  SELECT public.start_cron_run(
    'provider_weekly_rollups',
    'rollup_' || v_week_start::text
  ) INTO v_run_id;

  BEGIN
    -- For each provider org with jobs in the week window
    FOR v_rec IN
      SELECT
        j.provider_org_id,
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE j.status = 'COMPLETED') AS completed_jobs,
        COUNT(*) FILTER (WHERE j.status = 'COMPLETED' AND j.arrived_at IS NOT NULL
          AND j.latest_start_by IS NOT NULL AND j.arrived_at <= j.latest_start_by) AS ontime_jobs,
        COUNT(*) FILTER (WHERE j.status = 'COMPLETED' AND j.arrived_at IS NOT NULL
          AND j.latest_start_by IS NOT NULL AND j.arrived_at > j.latest_start_by) AS late_jobs,
        -- Redo rate: jobs with issues of type 'redo_requested'
        COUNT(DISTINCT ji.job_id) FILTER (WHERE ji.issue_type = 'redo_requested') AS redo_jobs,
        -- Avg duration (minutes) for completed jobs with both arrived and departed
        AVG(EXTRACT(EPOCH FROM (j.departed_at - j.arrived_at)) / 60.0)
          FILTER (WHERE j.status = 'COMPLETED' AND j.arrived_at IS NOT NULL AND j.departed_at IS NOT NULL)
          AS avg_duration_minutes,
        -- Rating aggregates from visit_ratings_private
        AVG(vr.rating) AS avg_rating,
        COUNT(vr.id) AS rating_count
      FROM jobs j
      LEFT JOIN job_issues ji ON ji.job_id = j.id
      LEFT JOIN visit_ratings_private vr ON vr.job_id = j.id
      WHERE j.scheduled_date >= v_week_start::text
        AND j.scheduled_date <= v_week_end::text
      GROUP BY j.provider_org_id
    LOOP
      -- Upsert into provider_feedback_rollups
      INSERT INTO provider_feedback_rollups (
        provider_org_id,
        period_start,
        period_end,
        avg_rating,
        review_count,
        theme_counts,
        visibility_status
      ) VALUES (
        v_rec.provider_org_id,
        v_week_start::timestamptz,
        (v_week_end + 1)::timestamptz, -- end is exclusive
        v_rec.avg_rating,
        v_rec.rating_count,
        jsonb_build_object(
          'total_jobs', v_rec.total_jobs,
          'completed_jobs', v_rec.completed_jobs,
          'completion_rate', CASE WHEN v_rec.total_jobs > 0
            THEN ROUND((v_rec.completed_jobs::numeric / v_rec.total_jobs) * 100, 1) ELSE 0 END,
          'ontime_jobs', v_rec.ontime_jobs,
          'late_jobs', v_rec.late_jobs,
          'ontime_rate', CASE WHEN v_rec.completed_jobs > 0
            THEN ROUND((v_rec.ontime_jobs::numeric / v_rec.completed_jobs) * 100, 1) ELSE 0 END,
          'redo_jobs', v_rec.redo_jobs,
          'redo_rate', CASE WHEN v_rec.completed_jobs > 0
            THEN ROUND((v_rec.redo_jobs::numeric / v_rec.completed_jobs) * 100, 1) ELSE 0 END,
          'avg_duration_minutes', ROUND(COALESCE(v_rec.avg_duration_minutes, 0)::numeric, 1)
        ),
        'draft'
      )
      ON CONFLICT (provider_org_id, period_start) DO UPDATE
      SET avg_rating = EXCLUDED.avg_rating,
          review_count = EXCLUDED.review_count,
          theme_counts = EXCLUDED.theme_counts,
          updated_at = now();

      v_rollup_count := v_rollup_count + 1;
    END LOOP;

    PERFORM public.finish_cron_run(
      v_run_id,
      'success',
      jsonb_build_object(
        'week_start', v_week_start,
        'week_end', v_week_end,
        'providers_rolled_up', v_rollup_count
      ),
      NULL
    );

    RETURN jsonb_build_object(
      'success', true,
      'week_start', v_week_start,
      'week_end', v_week_end,
      'providers_rolled_up', v_rollup_count
    );

  EXCEPTION WHEN OTHERS THEN
    PERFORM public.finish_cron_run(
      v_run_id,
      'error',
      jsonb_build_object('week_start', v_week_start, 'providers_rolled_up', v_rollup_count),
      SQLERRM
    );
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- Add unique constraint for upsert on provider_feedback_rollups
-- (provider_org_id + period_start must be unique for idempotent weekly rollups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_feedback_rollups_org_period
  ON provider_feedback_rollups (provider_org_id, period_start);
