
-- Sprint 2H-B: compute_provider_quality_scores + fix evaluate_training_gates

-- ============================================================
-- 2H-B1: compute_provider_quality_scores() RPC
-- Rolling 28-day weighted score: rating 35%, issues 25%, photos 20%, on-time 20%
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_provider_quality_scores()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_provider RECORD;
  v_rating_score numeric;
  v_issue_score numeric;
  v_photo_score numeric;
  v_ontime_score numeric;
  v_composite numeric;
  v_band text;
  v_old_band text;
  v_old_score numeric;
  v_components jsonb;
  v_snapshot_id uuid;
  v_count int := 0;
  v_downgrades int := 0;
  v_cutoff timestamptz := now() - interval '28 days';
  v_admin_users uuid[];
BEGIN
  -- Guard: only admin or service role
  IF NOT (
    EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IS NULL -- service role (edge function)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Start cron run log
  SELECT start_cron_run('compute_provider_quality_scores', 'quality_' || to_char(now(), 'YYYY-MM-DD')) INTO v_run_id;

  -- Process each active provider org
  FOR v_provider IN
    SELECT DISTINCT po.id AS provider_org_id
    FROM provider_orgs po
    WHERE po.status = 'active'
  LOOP
    -- 1. Rating score (0-100): avg rating from visit_ratings_private, scaled to 100
    SELECT COALESCE(AVG(rating) * 20, 50)
    INTO v_rating_score
    FROM visit_ratings_private
    WHERE provider_org_id = v_provider.provider_org_id
      AND created_at >= v_cutoff
      AND submitted_at IS NOT NULL;

    -- 2. Issue score (0-100): inverse of issue rate from visit_feedback_quick
    DECLARE
      v_total_feedback int;
      v_issue_count int;
    BEGIN
      SELECT COUNT(*), COUNT(*) FILTER (WHERE outcome = 'ISSUE')
      INTO v_total_feedback, v_issue_count
      FROM visit_feedback_quick
      WHERE provider_org_id = v_provider.provider_org_id
        AND created_at >= v_cutoff;

      IF v_total_feedback > 0 THEN
        v_issue_score := GREATEST(0, 100 - (v_issue_count::numeric / v_total_feedback * 100));
      ELSE
        v_issue_score := 75; -- neutral default
      END IF;
    END;

    -- 3. Photo score (0-100): % of completed jobs that have at least one photo
    DECLARE
      v_completed_jobs int;
      v_jobs_with_photos int;
    BEGIN
      SELECT COUNT(DISTINCT j.id),
             COUNT(DISTINCT jp.job_id)
      INTO v_completed_jobs, v_jobs_with_photos
      FROM jobs j
      LEFT JOIN job_photos jp ON jp.job_id = j.id AND jp.upload_status = 'confirmed'
      WHERE j.provider_org_id = v_provider.provider_org_id
        AND j.status = 'completed'
        AND j.completed_at >= v_cutoff;

      IF v_completed_jobs > 0 THEN
        v_photo_score := (v_jobs_with_photos::numeric / v_completed_jobs) * 100;
      ELSE
        v_photo_score := 50; -- neutral default
      END IF;
    END;

    -- 4. On-time score (0-100): % of jobs where arrived_at <= latest_start_by
    DECLARE
      v_timed_jobs int;
      v_ontime_jobs int;
    BEGIN
      SELECT COUNT(*),
             COUNT(*) FILTER (WHERE arrived_at IS NOT NULL AND latest_start_by IS NOT NULL AND arrived_at <= latest_start_by)
      INTO v_timed_jobs, v_ontime_jobs
      FROM jobs
      WHERE provider_org_id = v_provider.provider_org_id
        AND status = 'completed'
        AND completed_at >= v_cutoff
        AND arrived_at IS NOT NULL;

      IF v_timed_jobs > 0 THEN
        v_ontime_score := (v_ontime_jobs::numeric / v_timed_jobs) * 100;
      ELSE
        v_ontime_score := 75; -- neutral default
      END IF;
    END;

    -- Weighted composite: rating 35%, issues 25%, photos 20%, on-time 20%
    v_composite := ROUND(
      (v_rating_score * 0.35) +
      (v_issue_score * 0.25) +
      (v_photo_score * 0.20) +
      (v_ontime_score * 0.20)
    , 1);

    -- Determine band
    v_band := CASE
      WHEN v_composite >= 85 THEN 'GREEN'
      WHEN v_composite >= 70 THEN 'YELLOW'
      WHEN v_composite >= 55 THEN 'ORANGE'
      ELSE 'RED'
    END;

    v_components := jsonb_build_object(
      'rating', ROUND(v_rating_score, 1),
      'issues', ROUND(v_issue_score, 1),
      'photos', ROUND(v_photo_score, 1),
      'on_time', ROUND(v_ontime_score, 1),
      'weights', jsonb_build_object('rating', 0.35, 'issues', 0.25, 'photos', 0.20, 'on_time', 0.20)
    );

    -- Get previous score for change detection
    SELECT score, band INTO v_old_score, v_old_band
    FROM provider_quality_score_snapshots
    WHERE provider_org_id = v_provider.provider_org_id
    ORDER BY computed_at DESC
    LIMIT 1;

    -- Insert new snapshot
    INSERT INTO provider_quality_score_snapshots (provider_org_id, score, band, components, score_window_days, computed_at)
    VALUES (v_provider.provider_org_id, v_composite, v_band, v_components, 28, now())
    RETURNING id INTO v_snapshot_id;

    -- Record score event if band changed
    IF v_old_band IS NOT NULL AND v_old_band IS DISTINCT FROM v_band THEN
      INSERT INTO provider_quality_score_events (provider_org_id, old_score, new_score, old_band, new_band, change_reasons)
      VALUES (v_provider.provider_org_id, v_old_score, v_composite, v_old_band, v_band,
        jsonb_build_object('components', v_components));

      -- If downgraded, emit admin risk alert
      IF (v_band = 'RED' AND v_old_band IN ('GREEN','YELLOW','ORANGE'))
         OR (v_band = 'ORANGE' AND v_old_band IN ('GREEN','YELLOW'))
         OR (v_band = 'YELLOW' AND v_old_band = 'GREEN')
      THEN
        v_downgrades := v_downgrades + 1;
        -- Notify all superuser admins
        FOR v_admin_users IN
          SELECT ARRAY_AGG(user_id) FROM admin_memberships WHERE admin_role = 'superuser' AND is_active = true
        LOOP
          IF v_admin_users IS NOT NULL THEN
            PERFORM emit_notification(
              am_uid,
              'admin_provider_risk_alert',
              'Provider Quality Downgrade',
              'Provider ' || v_provider.provider_org_id || ' moved from ' || v_old_band || ' to ' || v_band,
              jsonb_build_object('provider_org_id', v_provider.provider_org_id, 'old_band', v_old_band, 'new_band', v_band)
            )
            FROM unnest(v_admin_users) AS am_uid;
          END IF;
        END LOOP;
      END IF;
    END IF;

    -- Call evaluate_provider_tier for this provider
    PERFORM evaluate_provider_tier(v_provider.provider_org_id);

    v_count := v_count + 1;
  END LOOP;

  -- Finish cron run
  PERFORM finish_cron_run(v_run_id, 'success',
    jsonb_build_object('providers_scored', v_count, 'band_downgrades', v_downgrades));

  RETURN jsonb_build_object('providers_scored', v_count, 'band_downgrades', v_downgrades);

EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'failed', NULL, SQLERRM);
  END IF;
  RAISE;
END;
$$;

-- ============================================================
-- 2H-B2: Fix evaluate_training_gates() — correct column references
-- Drop and recreate with correct column names: score (not composite_score), computed_at (not snapshot_at)
-- ============================================================
CREATE OR REPLACE FUNCTION public.evaluate_training_gates()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_gate RECORD;
  v_latest_score numeric;
  v_completed int := 0;
BEGIN
  -- Guard: only admin or service role
  IF NOT (
    EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IS NULL -- service role
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT start_cron_run('evaluate_training_gates', 'gates_' || to_char(now(), 'YYYY-MM-DD')) INTO v_run_id;

  -- Find all pending gates where the provider now meets the score minimum
  FOR v_gate IN
    SELECT ptg.id AS gate_id,
           ptg.provider_org_id,
           ptg.sku_id,
           ptg.required_score_minimum
    FROM provider_training_gates ptg
    WHERE ptg.status = 'pending'
  LOOP
    -- Get latest quality score using correct column names: score, computed_at
    SELECT pqs.score INTO v_latest_score
    FROM provider_quality_score_snapshots pqs
    WHERE pqs.provider_org_id = v_gate.provider_org_id
    ORDER BY pqs.computed_at DESC
    LIMIT 1;

    -- Auto-complete gate if score meets minimum
    IF v_latest_score IS NOT NULL AND v_latest_score >= v_gate.required_score_minimum THEN
      UPDATE provider_training_gates
      SET status = 'completed',
          completed_at = now(),
          updated_at = now()
      WHERE id = v_gate.gate_id;

      v_completed := v_completed + 1;
    END IF;
  END LOOP;

  PERFORM finish_cron_run(v_run_id, 'success',
    jsonb_build_object('gates_completed', v_completed));

  RETURN jsonb_build_object('gates_completed', v_completed);

EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'failed', NULL, SQLERRM);
  END IF;
  RAISE;
END;
$$;
