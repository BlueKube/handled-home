
-- Sprint 2H-B Fix Pack: B-F1, B-F2, B-F3

-- B-F2: Seed quality_band_thresholds config
INSERT INTO admin_system_config (config_key, config_value, description)
VALUES ('quality_band_thresholds', '{"green": 85, "yellow": 70, "orange": 55}'::jsonb, 'Quality score band thresholds (score >= threshold)')
ON CONFLICT (config_key) DO NOTHING;

-- Recreate compute_provider_quality_scores with all 3 fixes:
-- B-F1: 'confirmed' → 'UPLOADED'
-- B-F2: Read weights + thresholds from admin_system_config
-- B-F3: Simplify notification loop
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
  -- B-F2: configurable weights and thresholds
  v_weights jsonb;
  v_thresholds jsonb;
  v_w_rating numeric;
  v_w_issues numeric;
  v_w_photos numeric;
  v_w_ontime numeric;
  v_t_green numeric;
  v_t_yellow numeric;
  v_t_orange numeric;
  v_uid uuid;
BEGIN
  -- Guard: only admin or service role
  IF NOT (
    EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IS NULL -- service role (edge function)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- B-F2: Load configurable weights from admin_system_config
  SELECT config_value INTO v_weights
  FROM admin_system_config WHERE config_key = 'quality_score_weights';
  v_w_rating := COALESCE((v_weights->>'rating')::numeric, 0.35);
  v_w_issues := COALESCE((v_weights->>'issues')::numeric, 0.25);
  v_w_photos := COALESCE((v_weights->>'photos')::numeric, 0.20);
  v_w_ontime := COALESCE((v_weights->>'on_time')::numeric, 0.20);

  -- B-F2: Load configurable band thresholds
  SELECT config_value INTO v_thresholds
  FROM admin_system_config WHERE config_key = 'quality_band_thresholds';
  v_t_green  := COALESCE((v_thresholds->>'green')::numeric, 85);
  v_t_yellow := COALESCE((v_thresholds->>'yellow')::numeric, 70);
  v_t_orange := COALESCE((v_thresholds->>'orange')::numeric, 55);

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
        v_issue_score := 75;
      END IF;
    END;

    -- 3. Photo score (0-100): % of completed jobs that have at least one photo
    -- B-F1 FIX: Changed 'confirmed' to 'UPLOADED' to match job_photos CHECK constraint
    DECLARE
      v_completed_jobs int;
      v_jobs_with_photos int;
    BEGIN
      SELECT COUNT(DISTINCT j.id),
             COUNT(DISTINCT jp.job_id)
      INTO v_completed_jobs, v_jobs_with_photos
      FROM jobs j
      LEFT JOIN job_photos jp ON jp.job_id = j.id AND jp.upload_status = 'UPLOADED'
      WHERE j.provider_org_id = v_provider.provider_org_id
        AND j.status = 'completed'
        AND j.completed_at >= v_cutoff;

      IF v_completed_jobs > 0 THEN
        v_photo_score := (v_jobs_with_photos::numeric / v_completed_jobs) * 100;
      ELSE
        v_photo_score := 50;
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
        v_ontime_score := 75;
      END IF;
    END;

    -- B-F2: Use configurable weights
    v_composite := ROUND(
      (v_rating_score * v_w_rating) +
      (v_issue_score * v_w_issues) +
      (v_photo_score * v_w_photos) +
      (v_ontime_score * v_w_ontime)
    , 1);

    -- B-F2: Use configurable band thresholds
    v_band := CASE
      WHEN v_composite >= v_t_green THEN 'GREEN'
      WHEN v_composite >= v_t_yellow THEN 'YELLOW'
      WHEN v_composite >= v_t_orange THEN 'ORANGE'
      ELSE 'RED'
    END;

    v_components := jsonb_build_object(
      'rating', ROUND(v_rating_score, 1),
      'issues', ROUND(v_issue_score, 1),
      'photos', ROUND(v_photo_score, 1),
      'on_time', ROUND(v_ontime_score, 1),
      'weights', jsonb_build_object('rating', v_w_rating, 'issues', v_w_issues, 'photos', v_w_photos, 'on_time', v_w_ontime),
      'thresholds', jsonb_build_object('green', v_t_green, 'yellow', v_t_yellow, 'orange', v_t_orange)
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
        -- B-F3 FIX: Simplified notification loop — direct iteration instead of ARRAY_AGG + unnest
        FOR v_uid IN
          SELECT user_id FROM admin_memberships WHERE admin_role = 'superuser' AND is_active = true
        LOOP
          PERFORM emit_notification(
            v_uid,
            'admin_provider_risk_alert',
            'Provider Quality Downgrade',
            'Provider ' || v_provider.provider_org_id || ' moved from ' || v_old_band || ' to ' || v_band,
            jsonb_build_object('provider_org_id', v_provider.provider_org_id, 'old_band', v_old_band, 'new_band', v_band)
          );
        END LOOP;
      END IF;
    END IF;

    -- Evaluate tier after scoring
    PERFORM evaluate_provider_tier(v_provider.provider_org_id);
    v_count := v_count + 1;
  END LOOP;

  -- Finish cron run
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'success', jsonb_build_object('providers_scored', v_count, 'band_downgrades', v_downgrades));
  END IF;

  RETURN jsonb_build_object('providers_scored', v_count, 'band_downgrades', v_downgrades);

EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'failed', NULL, SQLERRM);
  END IF;
  RAISE;
END;
$$;
