
-- Sprint 1: auto_assign_job RPC
-- Primary-first → Backup fallback by priority_rank + performance_score
-- Logs to job_assignment_log with explainability
-- Emits notification to assigned provider

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
  v_max_daily int := 15; -- default max jobs per provider per day
  v_explain_customer text;
  v_explain_provider text;
  v_explain_admin text;
  v_assignment_reason text;
  v_score_breakdown jsonb;
BEGIN
  -- 1. Lock and validate job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- Skip if already assigned to a provider and not in a reassignable state
  IF v_job.status NOT IN ('NOT_STARTED', 'assigned') THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'Job not in assignable state', 'current_status', v_job.status);
  END IF;

  -- 2. Determine category from job_skus → service_skus
  SELECT ss.category INTO v_category
  FROM job_skus js
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE js.job_id = p_job_id
  LIMIT 1;

  IF v_category IS NULL THEN
    -- Fallback: use 'lawn_care' as default
    v_category := 'lawn_care';
  END IF;

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
    -- Check capacity: count jobs already assigned to this provider on this date
    SELECT count(*) INTO v_daily_count
    FROM jobs j
    WHERE j.provider_org_id = v_provider.provider_org_id
      AND j.scheduled_date = v_job.scheduled_date
      AND j.status NOT IN ('CANCELED')
      AND j.id != p_job_id;

    IF v_daily_count < v_max_daily THEN
      -- Assign to PRIMARY
      v_assignment_reason := 'primary_available';
      v_explain_customer := 'Your service has been assigned to your area''s dedicated provider.';
      v_explain_provider := 'Assigned as Primary provider for this zone and category.';
      v_explain_admin := format('Primary provider selected. Zone: %s, Category: %s. Daily load: %s/%s.',
        v_job.zone_id, v_category, v_daily_count + 1, v_max_daily);
      v_score_breakdown := jsonb_build_object(
        'role', 'PRIMARY',
        'performance_score', v_provider.performance_score,
        'daily_load', v_daily_count + 1,
        'max_daily', v_max_daily
      );

      -- Update job
      UPDATE jobs SET provider_org_id = v_provider.provider_org_id WHERE id = p_job_id;

      -- Log assignment
      INSERT INTO job_assignment_log (
        job_id, provider_org_id, assignment_reason,
        explain_customer, explain_provider, explain_admin,
        score_breakdown, assigned_by, previous_provider_org_id
      ) VALUES (
        p_job_id, v_provider.provider_org_id, v_assignment_reason,
        v_explain_customer, v_explain_provider, v_explain_admin,
        v_score_breakdown, 'system', v_job.provider_org_id
      );

      -- Notify provider (find a user in the org)
      PERFORM emit_notification(
        (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = v_provider.provider_org_id AND pm.status = 'ACTIVE' LIMIT 1),
        'job_assigned',
        'New Job Assigned',
        v_explain_provider,
        jsonb_build_object('job_id', p_job_id, 'deep_link', '/provider/jobs/' || p_job_id)
      );

      RETURN jsonb_build_object(
        'status', 'assigned',
        'provider_org_id', v_provider.provider_org_id,
        'reason', v_assignment_reason,
        'explain_admin', v_explain_admin
      );
    END IF;
    -- PRIMARY at capacity — fall through to backup
  END IF;

  -- 4. Try BACKUP providers ordered by priority_rank, then performance_score
  FOR v_provider IN
    SELECT zcp.provider_org_id, zcp.performance_score, zcp.priority_rank, zcp.role
    FROM zone_category_providers zcp
    WHERE zcp.zone_id = v_job.zone_id
      AND zcp.category = v_category
      AND zcp.role = 'BACKUP'
      AND zcp.status = 'ACTIVE'
    ORDER BY zcp.priority_rank ASC, zcp.performance_score DESC NULLS LAST
  LOOP
    SELECT count(*) INTO v_daily_count
    FROM jobs j
    WHERE j.provider_org_id = v_provider.provider_org_id
      AND j.scheduled_date = v_job.scheduled_date
      AND j.status NOT IN ('CANCELED')
      AND j.id != p_job_id;

    IF v_daily_count < v_max_daily THEN
      -- Assign to BACKUP
      v_assignment_reason := 'backup_fallback';
      v_explain_customer := 'We''ve assigned a vetted local pro to keep your Service Day on track.';
      v_explain_provider := format('Overflow assist: assigned as Backup #%s for this zone.', v_provider.priority_rank);
      v_explain_admin := format('Backup #%s selected (Primary at capacity or unavailable). Score: %s. Daily load: %s/%s.',
        v_provider.priority_rank, COALESCE(v_provider.performance_score::text, 'N/A'), v_daily_count + 1, v_max_daily);
      v_score_breakdown := jsonb_build_object(
        'role', 'BACKUP',
        'priority_rank', v_provider.priority_rank,
        'performance_score', v_provider.performance_score,
        'daily_load', v_daily_count + 1,
        'max_daily', v_max_daily
      );

      UPDATE jobs SET provider_org_id = v_provider.provider_org_id WHERE id = p_job_id;

      INSERT INTO job_assignment_log (
        job_id, provider_org_id, assignment_reason,
        explain_customer, explain_provider, explain_admin,
        score_breakdown, assigned_by, previous_provider_org_id
      ) VALUES (
        p_job_id, v_provider.provider_org_id, v_assignment_reason,
        v_explain_customer, v_explain_provider, v_explain_admin,
        v_score_breakdown, 'system', v_job.provider_org_id
      );

      PERFORM emit_notification(
        (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = v_provider.provider_org_id AND pm.status = 'ACTIVE' LIMIT 1),
        'job_assigned',
        'New Job Assigned (Overflow)',
        v_explain_provider,
        jsonb_build_object('job_id', p_job_id, 'deep_link', '/provider/jobs/' || p_job_id)
      );

      RETURN jsonb_build_object(
        'status', 'assigned',
        'provider_org_id', v_provider.provider_org_id,
        'reason', v_assignment_reason,
        'explain_admin', v_explain_admin
      );
    END IF;
  END LOOP;

  -- 5. No provider available — overflow: flag for admin
  v_explain_admin := format('No eligible provider found for zone %s, category %s, date %s. All providers at capacity or none assigned.',
    v_job.zone_id, v_category, v_job.scheduled_date);

  INSERT INTO job_assignment_log (
    job_id, provider_org_id, assignment_reason,
    explain_customer, explain_provider, explain_admin,
    score_breakdown, assigned_by
  ) VALUES (
    p_job_id, NULL, 'overflow_no_provider',
    'We''re working on scheduling your service and will update you shortly.',
    NULL,
    v_explain_admin,
    jsonb_build_object('zone_id', v_job.zone_id, 'category', v_category, 'scheduled_date', v_job.scheduled_date),
    'system'
  );

  -- Notify admins
  PERFORM emit_notification(
    ur.user_id,
    'overflow_alert',
    'Overflow: Unassigned Job',
    format('Job %s has no eligible provider. Zone: %s, Category: %s.', p_job_id, v_job.zone_id, v_category),
    jsonb_build_object('job_id', p_job_id, 'deep_link', '/admin/jobs/' || p_job_id)
  )
  FROM user_roles ur WHERE ur.role = 'admin';

  RETURN jsonb_build_object(
    'status', 'overflow',
    'reason', 'no_eligible_provider',
    'explain_admin', v_explain_admin
  );
END;
$function$;
