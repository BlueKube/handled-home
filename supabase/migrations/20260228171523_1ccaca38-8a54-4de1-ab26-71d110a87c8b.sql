-- E2-F1 (CRITICAL): Fix compute_provider_quality_scores to use correct columns (band + components jsonb)
-- E2-F3 (MEDIUM): Seed missing config keys for ControlConfig UI

-- Fix the RPC: revert to using band + components jsonb (matching actual schema)
CREATE OR REPLACE FUNCTION public.compute_provider_quality_scores()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weights jsonb;
  v_thresholds jsonb;
  v_count int := 0;
  v_downgrades int := 0;
  v_org record;
  v_rating_score numeric;
  v_issue_score numeric;
  v_photo_score numeric;
  v_ontime_score numeric;
  v_composite numeric;
  v_band text;
  v_prev_band text;
  v_components jsonb;
  v_run_id uuid;
  v_w_rating numeric;
  v_w_issues numeric;
  v_w_photos numeric;
  v_w_ontime numeric;
  v_band_green numeric;
  v_band_yellow numeric;
  v_band_orange numeric;
BEGIN
  -- Start cron run log
  SELECT start_cron_run('compute_provider_quality_scores', 'quality_' || to_char(now(), 'YYYY-MM-DD')) INTO v_run_id;

  SELECT config_value INTO v_weights
    FROM admin_system_config WHERE config_key = 'quality_score_weights';
  SELECT config_value INTO v_thresholds
    FROM admin_system_config WHERE config_key = 'quality_band_thresholds';

  v_w_rating := COALESCE((v_weights->>'rating')::numeric, 35);
  v_w_issues := COALESCE((v_weights->>'issues')::numeric, 25);
  v_w_photos := COALESCE((v_weights->>'photos')::numeric, 20);
  v_w_ontime := COALESCE((v_weights->>'ontime')::numeric, 20);

  v_band_green := COALESCE((v_thresholds->>'green')::numeric, 80);
  v_band_yellow := COALESCE((v_thresholds->>'yellow')::numeric, 60);
  v_band_orange := COALESCE((v_thresholds->>'orange')::numeric, 40);

  FOR v_org IN
    SELECT po.id AS org_id
    FROM provider_orgs po
    WHERE po.status IN ('ACTIVE', 'PROBATION')
  LOOP
    SELECT COALESCE(AVG(vr.rating) * 20, 80)
      INTO v_rating_score
    FROM visit_ratings vr
    JOIN jobs j ON j.id = vr.job_id
    WHERE j.provider_org_id = v_org.org_id
      AND vr.created_at >= now() - interval '28 days';

    SELECT GREATEST(0, 100 - COUNT(*) * 10)
      INTO v_issue_score
    FROM job_issues ji
    JOIN jobs j ON j.id = ji.job_id
    WHERE j.provider_org_id = v_org.org_id
      AND ji.created_at >= now() - interval '28 days';

    SELECT CASE
      WHEN COUNT(*) = 0 THEN 80
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE jp.id IS NOT NULL) / COUNT(*))
    END INTO v_photo_score
    FROM jobs j
    LEFT JOIN job_photos jp ON jp.job_id = j.id
    WHERE j.provider_org_id = v_org.org_id
      AND j.status = 'COMPLETED'
      AND j.completed_at >= now() - interval '28 days';

    SELECT CASE
      WHEN COUNT(*) = 0 THEN 80
      ELSE ROUND(100.0 * COUNT(*) FILTER (
        WHERE j.arrived_at IS NOT NULL
          AND j.latest_start_by IS NOT NULL
          AND j.arrived_at <= j.latest_start_by
      ) / COUNT(*))
    END INTO v_ontime_score
    FROM jobs j
    WHERE j.provider_org_id = v_org.org_id
      AND j.status = 'COMPLETED'
      AND j.completed_at >= now() - interval '28 days';

    v_composite := ROUND(
      (v_rating_score * v_w_rating +
       v_issue_score * v_w_issues +
       v_photo_score * v_w_photos +
       v_ontime_score * v_w_ontime) / (v_w_rating + v_w_issues + v_w_photos + v_w_ontime)
    );

    IF v_composite >= v_band_green THEN v_band := 'green';
    ELSIF v_composite >= v_band_yellow THEN v_band := 'yellow';
    ELSIF v_composite >= v_band_orange THEN v_band := 'orange';
    ELSE v_band := 'red';
    END IF;

    v_components := jsonb_build_object(
      'rating', v_rating_score,
      'issues', v_issue_score,
      'photos', v_photo_score,
      'ontime', v_ontime_score
    );

    -- Get previous band for change detection (exclude today)
    SELECT band INTO v_prev_band
      FROM provider_quality_score_snapshots
      WHERE provider_org_id = v_org.org_id
        AND to_date_immutable(computed_at) < CURRENT_DATE
      ORDER BY computed_at DESC
      LIMIT 1;

    -- UPSERT: idempotent daily snapshot using correct columns
    INSERT INTO provider_quality_score_snapshots (
      provider_org_id, score, band, components, score_window_days, computed_at
    ) VALUES (
      v_org.org_id, v_composite, v_band, v_components, 28, now()
    )
    ON CONFLICT (provider_org_id, to_date_immutable(computed_at))
    DO UPDATE SET
      score = EXCLUDED.score,
      band = EXCLUDED.band,
      components = EXCLUDED.components,
      score_window_days = EXCLUDED.score_window_days,
      computed_at = EXCLUDED.computed_at;

    v_count := v_count + 1;

    IF v_prev_band IS NOT NULL AND v_prev_band != v_band THEN
      DECLARE
        v_band_order jsonb := '{"green":4,"yellow":3,"orange":2,"red":1}'::jsonb;
        v_prev_order int;
        v_curr_order int;
      BEGIN
        v_prev_order := COALESCE((v_band_order->>v_prev_band)::int, 0);
        v_curr_order := COALESCE((v_band_order->>v_band)::int, 0);
        IF v_curr_order < v_prev_order THEN
          v_downgrades := v_downgrades + 1;
          PERFORM emit_notification_event(
            p_event_type := 'admin_provider_risk_alert',
            p_priority := 'critical',
            p_audience_type := 'ADMIN',
            p_audience_user_id := NULL,
            p_audience_org_id := NULL,
            p_audience_zone_id := NULL,
            p_payload := jsonb_build_object(
              'provider_org_id', v_org.org_id,
              'previous_band', v_prev_band,
              'new_band', v_band,
              'score', v_composite
            ),
            p_idempotency_key := 'quality_downgrade_' || v_org.org_id || '_' || CURRENT_DATE::text
          );
        END IF;
      END;
    END IF;

    PERFORM evaluate_provider_tier(v_org.org_id);
  END LOOP;

  -- Finish cron run
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'success', jsonb_build_object('providers_scored', v_count, 'band_downgrades', v_downgrades));
  END IF;

  RETURN jsonb_build_object('providers_scored', v_count, 'downgrades', v_downgrades);

EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    PERFORM finish_cron_run(v_run_id, 'failed', NULL, SQLERRM);
  END IF;
  RAISE;
END;
$$;

-- E2-F3: Seed missing config keys for ControlConfig UI
INSERT INTO admin_system_config (config_key, config_value, description) VALUES
  ('byoc_bonus_weekly_cap_cents', '5000'::jsonb, 'Maximum BYOC bonus payout per provider per week in cents'),
  ('referral_reward_cap_cents', '10000'::jsonb, 'Maximum referral reward amount in cents'),
  ('max_credits_per_customer_cents', '50000'::jsonb, 'Maximum total credits that can be issued to a single customer in cents'),
  ('founding_partner_bonus_weeks', '26'::jsonb, 'Number of weeks founding partner bonus is active'),
  ('assignment_competition_slider', '50'::jsonb, 'Competition slider value (0=monopoly, 100=full competition) for provider assignment'),
  ('dunning_max_steps', '5'::jsonb, 'Maximum number of dunning steps before subscription cancellation'),
  ('no_show_penalty_points', '15'::jsonb, 'Quality score penalty points per no-show incident'),
  ('probation_score_threshold', '40'::jsonb, 'Quality score threshold below which provider enters probation'),
  ('suspension_score_threshold', '25'::jsonb, 'Quality score threshold below which provider is suspended'),
  ('max_buffer_percent', '20'::jsonb, 'Maximum buffer percentage for zone capacity overflow')
ON CONFLICT (config_key) DO NOTHING;