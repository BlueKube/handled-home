
-- Sprint 2G-C3: Wire auto_assign_job to emit decision traces
-- We add a helper that the RPC calls after making its decision

CREATE OR REPLACE FUNCTION public.auto_assign_job(p_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_job jobs%ROWTYPE;
  v_category text;
  v_provider record;
  v_daily_count int;
  v_max_daily int := 15;
  v_explain_customer text;
  v_explain_provider text;
  v_explain_admin text;
  v_assignment_reason text;
  v_score_breakdown jsonb;
  v_notify_user_id uuid;
  v_is_blocked boolean;
  v_has_gate_issue boolean;
  v_tier_mod int;
  v_candidates jsonb := '[]'::jsonb;
  v_inputs jsonb;
  v_result jsonb;
BEGIN
  -- 1. Lock and validate job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF v_job.status NOT IN ('NOT_STARTED', 'assigned') THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'Job not in assignable state', 'current_status', v_job.status);
  END IF;

  -- 2. Determine category from job_skus -> service_skus
  SELECT ss.category INTO v_category
  FROM job_skus js
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE js.job_id = p_job_id
  LIMIT 1;

  IF v_category IS NULL THEN
    v_category := 'lawn_care';
  END IF;

  -- Build inputs snapshot for decision trace
  v_inputs := jsonb_build_object(
    'job_id', p_job_id,
    'zone_id', v_job.zone_id,
    'category', v_category,
    'scheduled_date', v_job.scheduled_date,
    'max_daily', v_max_daily
  );

  -- 3. Try PRIMARY provider first
  SELECT zcp.provider_org_id, zcp.performance_score, zcp.priority_rank, zcp.role
  INTO v_provider
  FROM zone_category_providers zcp
  WHERE zcp.zone_id = v_job.zone_id
    AND zcp.category = v_category
    AND zcp.role = 'PRIMARY'
    AND zcp.status = 'ACTIVE'
  LIMIT 1;

  IF v_provider IS NOT NULL THEN
    -- Check availability block
    SELECT EXISTS (
      SELECT 1 FROM provider_availability_blocks pab
      WHERE pab.provider_org_id = v_provider.provider_org_id
        AND pab.status = 'active'
        AND pab.block_type IN ('DAY_OFF', 'VACATION')
        AND v_job.scheduled_date BETWEEN pab.start_date AND pab.end_date
    ) INTO v_is_blocked;

    IF NOT v_is_blocked THEN
      -- E05-F1: Deny-by-default training gate check
      SELECT EXISTS (
        SELECT 1 FROM job_skus js
        JOIN service_skus ss ON ss.id = js.sku_id
        WHERE js.job_id = p_job_id
          AND ss.requires_training_gate = true
          AND NOT EXISTS (
            SELECT 1 FROM provider_training_gates ptg
            WHERE ptg.provider_org_id = v_provider.provider_org_id
              AND ptg.sku_id = js.sku_id
              AND ptg.status = 'completed'
          )
      ) INTO v_has_gate_issue;

      IF NOT v_has_gate_issue THEN
        SELECT count(*) INTO v_daily_count
        FROM jobs j
        WHERE j.provider_org_id = v_provider.provider_org_id
          AND j.scheduled_date = v_job.scheduled_date
          AND j.status NOT IN ('CANCELED')
          AND j.id != p_job_id;

        IF v_daily_count < v_max_daily THEN
          -- Get tier modifier
          SELECT COALESCE(pth.assignment_priority_modifier, 0) INTO v_tier_mod
          FROM provider_tier_history pth
          WHERE pth.provider_org_id = v_provider.provider_org_id
          ORDER BY pth.effective_at DESC LIMIT 1;
          v_tier_mod := COALESCE(v_tier_mod, 0);

          v_assignment_reason := 'primary_available';
          v_explain_customer := 'Your service has been assigned to your area''s dedicated provider.';
          v_explain_provider := 'Assigned as Primary provider for this zone and category.';
          v_explain_admin := format('Primary provider selected. Zone: %s, Category: %s. Daily load: %s/%s. Tier modifier: %s.',
            v_job.zone_id, v_category, v_daily_count + 1, v_max_daily, v_tier_mod);
          v_score_breakdown := jsonb_build_object(
            'role', 'PRIMARY',
            'performance_score', v_provider.performance_score,
            'daily_load', v_daily_count + 1,
            'max_daily', v_max_daily,
            'tier_priority_modifier', v_tier_mod
          );

          -- Add to candidates
          v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
            'provider_org_id', v_provider.provider_org_id,
            'role', 'PRIMARY',
            'performance_score', v_provider.performance_score,
            'daily_load', v_daily_count,
            'tier_mod', v_tier_mod,
            'selected', true
          ));

          UPDATE jobs SET
            provider_org_id = v_provider.provider_org_id,
            latest_start_by = CASE
              WHEN scheduled_date IS NOT NULL THEN scheduled_date::timestamp + interval '10 hours'
              ELSE NULL
            END
          WHERE id = p_job_id;

          INSERT INTO job_assignment_log (
            job_id, provider_org_id, assignment_reason,
            explain_customer, explain_provider, explain_admin,
            score_breakdown, assigned_by, previous_provider_org_id
          ) VALUES (
            p_job_id, v_provider.provider_org_id, v_assignment_reason,
            v_explain_customer, v_explain_provider, v_explain_admin,
            v_score_breakdown, 'system', v_job.provider_org_id
          );

          SELECT pm.user_id INTO v_notify_user_id
          FROM provider_members pm
          WHERE pm.provider_org_id = v_provider.provider_org_id AND pm.status = 'ACTIVE'
          LIMIT 1;

          IF v_notify_user_id IS NOT NULL THEN
            PERFORM emit_notification(
              v_notify_user_id,
              'job_assigned',
              'New Job Assigned',
              v_explain_provider,
              jsonb_build_object('job_id', p_job_id, 'deep_link', '/provider/jobs/' || p_job_id)
            );
          END IF;

          v_result := jsonb_build_object(
            'status', 'assigned',
            'provider_org_id', v_provider.provider_org_id,
            'reason', v_assignment_reason,
            'explain_admin', v_explain_admin
          );

          -- Emit decision trace
          INSERT INTO decision_traces (decision_type, entity_type, entity_id, inputs, candidates, scoring, outcome)
          VALUES ('auto_assign_job', 'job', p_job_id, v_inputs, v_candidates, v_score_breakdown, v_result);

          RETURN v_result;
        END IF;
      ELSE
        v_explain_admin := format('Primary provider %s failed training gate check (deny-by-default) for job SKUs. Trying backups.',
          v_provider.provider_org_id);
        -- Record rejected primary as candidate
        v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
          'provider_org_id', v_provider.provider_org_id, 'role', 'PRIMARY', 'rejected_reason', 'training_gate_failed', 'selected', false
        ));
      END IF;
    ELSE
      v_explain_admin := format('Primary provider %s blocked (availability block) for date %s. Trying backups.',
        v_provider.provider_org_id, v_job.scheduled_date);
      v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
        'provider_org_id', v_provider.provider_org_id, 'role', 'PRIMARY', 'rejected_reason', 'availability_blocked', 'selected', false
      ));
    END IF;
  END IF;

  -- 4. Try BACKUP providers (tier priority + availability + deny-by-default training gates)
  FOR v_provider IN
    SELECT zcp.provider_org_id, zcp.performance_score, zcp.priority_rank, zcp.role,
           COALESCE((
             SELECT pth.assignment_priority_modifier
             FROM provider_tier_history pth
             WHERE pth.provider_org_id = zcp.provider_org_id
             ORDER BY pth.effective_at DESC LIMIT 1
           ), 0) AS tier_mod
    FROM zone_category_providers zcp
    WHERE zcp.zone_id = v_job.zone_id
      AND zcp.category = v_category
      AND zcp.role = 'BACKUP'
      AND zcp.status = 'ACTIVE'
      -- Exclude blocked providers
      AND NOT EXISTS (
        SELECT 1 FROM provider_availability_blocks pab
        WHERE pab.provider_org_id = zcp.provider_org_id
          AND pab.status = 'active'
          AND pab.block_type IN ('DAY_OFF', 'VACATION')
          AND v_job.scheduled_date BETWEEN pab.start_date AND pab.end_date
      )
      -- E05-F1: Deny-by-default — exclude providers missing completed gates for gated SKUs
      AND NOT EXISTS (
        SELECT 1 FROM job_skus js
        JOIN service_skus ss ON ss.id = js.sku_id
        WHERE js.job_id = p_job_id
          AND ss.requires_training_gate = true
          AND NOT EXISTS (
            SELECT 1 FROM provider_training_gates ptg
            WHERE ptg.provider_org_id = zcp.provider_org_id
              AND ptg.sku_id = js.sku_id
              AND ptg.status = 'completed'
          )
      )
    ORDER BY tier_mod DESC, zcp.priority_rank ASC, zcp.performance_score DESC NULLS LAST
  LOOP
    SELECT count(*) INTO v_daily_count
    FROM jobs j
    WHERE j.provider_org_id = v_provider.provider_org_id
      AND j.scheduled_date = v_job.scheduled_date
      AND j.status NOT IN ('CANCELED')
      AND j.id != p_job_id;

    IF v_daily_count < v_max_daily THEN
      v_assignment_reason := 'backup_fallback';
      v_explain_customer := 'We''ve assigned a vetted local pro to keep your Service Day on track.';
      v_explain_provider := format('Overflow assist: assigned as Backup #%s for this zone.', v_provider.priority_rank);
      v_explain_admin := format('Backup #%s selected (tier_mod: %s). Score: %s. Daily load: %s/%s.',
        v_provider.priority_rank, v_provider.tier_mod, COALESCE(v_provider.performance_score::text, 'N/A'), v_daily_count + 1, v_max_daily);
      v_score_breakdown := jsonb_build_object(
        'role', 'BACKUP',
        'priority_rank', v_provider.priority_rank,
        'performance_score', v_provider.performance_score,
        'daily_load', v_daily_count + 1,
        'max_daily', v_max_daily,
        'tier_priority_modifier', v_provider.tier_mod
      );

      -- Add selected backup to candidates
      v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
        'provider_org_id', v_provider.provider_org_id, 'role', 'BACKUP', 'priority_rank', v_provider.priority_rank,
        'performance_score', v_provider.performance_score, 'daily_load', v_daily_count, 'tier_mod', v_provider.tier_mod, 'selected', true
      ));

      UPDATE jobs SET
        provider_org_id = v_provider.provider_org_id,
        latest_start_by = CASE
          WHEN scheduled_date IS NOT NULL THEN scheduled_date::timestamp + interval '10 hours'
          ELSE NULL
        END
      WHERE id = p_job_id;

      INSERT INTO job_assignment_log (
        job_id, provider_org_id, assignment_reason,
        explain_customer, explain_provider, explain_admin,
        score_breakdown, assigned_by, previous_provider_org_id
      ) VALUES (
        p_job_id, v_provider.provider_org_id, v_assignment_reason,
        v_explain_customer, v_explain_provider, v_explain_admin,
        v_score_breakdown, 'system', v_job.provider_org_id
      );

      SELECT pm.user_id INTO v_notify_user_id
      FROM provider_members pm
      WHERE pm.provider_org_id = v_provider.provider_org_id AND pm.status = 'ACTIVE'
      LIMIT 1;

      IF v_notify_user_id IS NOT NULL THEN
        PERFORM emit_notification(
          v_notify_user_id,
          'job_assigned',
          'New Job Assigned',
          v_explain_provider,
          jsonb_build_object('job_id', p_job_id, 'deep_link', '/provider/jobs/' || p_job_id)
        );
      END IF;

      v_result := jsonb_build_object(
        'status', 'assigned',
        'provider_org_id', v_provider.provider_org_id,
        'reason', v_assignment_reason,
        'explain_admin', v_explain_admin
      );

      -- Emit decision trace
      INSERT INTO decision_traces (decision_type, entity_type, entity_id, inputs, candidates, scoring, outcome)
      VALUES ('auto_assign_job', 'job', p_job_id, v_inputs, v_candidates, v_score_breakdown, v_result);

      RETURN v_result;
    ELSE
      -- At capacity — record as rejected candidate
      v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
        'provider_org_id', v_provider.provider_org_id, 'role', 'BACKUP', 'priority_rank', v_provider.priority_rank,
        'rejected_reason', 'at_capacity', 'daily_load', v_daily_count, 'selected', false
      ));
    END IF;
  END LOOP;

  -- 5. Overflow — no provider available
  v_explain_admin := format('No available provider for zone %s category %s on %s (all at capacity, blocked, or untrained). Manual action required.',
    v_job.zone_id, v_category, v_job.scheduled_date);

  INSERT INTO job_assignment_log (
    job_id, provider_org_id, assignment_reason,
    explain_customer, explain_provider, explain_admin,
    score_breakdown, assigned_by
  ) VALUES (
    p_job_id, NULL, 'overflow_no_provider',
    'We''re working on assigning a provider for your visit. You''ll be notified once confirmed.',
    NULL,
    v_explain_admin,
    jsonb_build_object('zone_id', v_job.zone_id, 'category', v_category, 'date', v_job.scheduled_date),
    'system'
  );

  -- Notify admins
  PERFORM emit_notification(
    ur.user_id,
    'assignment_overflow',
    'Assignment Overflow',
    v_explain_admin,
    jsonb_build_object('job_id', p_job_id, 'zone_id', v_job.zone_id, 'category', v_category)
  )
  FROM user_roles ur WHERE ur.role = 'admin';

  v_result := jsonb_build_object(
    'status', 'overflow',
    'reason', 'no_provider_available',
    'explain_admin', v_explain_admin
  );

  -- Emit decision trace for overflow
  INSERT INTO decision_traces (decision_type, entity_type, entity_id, inputs, candidates, scoring, outcome)
  VALUES ('auto_assign_job', 'job', p_job_id, v_inputs, v_candidates,
    jsonb_build_object('zone_id', v_job.zone_id, 'category', v_category), v_result);

  RETURN v_result;
END;
$function$;
