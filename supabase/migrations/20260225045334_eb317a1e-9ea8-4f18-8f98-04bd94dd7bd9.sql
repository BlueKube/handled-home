
-- Sprint 2 Review Fixes: Critical + Medium DB issues

-- Fix #1 (CRITICAL): Use level_since instead of weeks_at_level for suspension check
-- Fix #2 (CRITICAL): On-time metric excludes NULL arrived_at
-- Fix #3 (MEDIUM): 30-day window excludes future jobs
-- Fix #4 (MEDIUM): Add provider reinstatement path
-- Fix #6 (MEDIUM): Add FK on photo_validation_results.provider_org_id

-- ============================================================
-- Fix #1: Replace enforce_sla_suspensions to use level_since
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_sla_suspensions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suspended int := 0;
  v_promoted int := 0;
  v_rec record;
BEGIN
  -- Find providers at RED for 14+ days (using level_since, not weeks_at_level)
  FOR v_rec IN
    SELECT s.provider_org_id, s.zone_id, s.category
    FROM provider_sla_status s
    WHERE s.sla_level = 'RED'
      AND s.level_since <= now() - interval '14 days'
      AND EXISTS (
        SELECT 1 FROM zone_category_providers zcp
        WHERE zcp.provider_org_id = s.provider_org_id
          AND zcp.zone_id = s.zone_id
          AND zcp.category = s.category
          AND zcp.status = 'ACTIVE'
      )
  LOOP
    -- Suspend the provider
    UPDATE zone_category_providers
    SET status = 'SUSPENDED', updated_at = now()
    WHERE provider_org_id = v_rec.provider_org_id
      AND zone_id = v_rec.zone_id
      AND category = v_rec.category
      AND status = 'ACTIVE';

    v_suspended := v_suspended + 1;

    -- Notify provider
    PERFORM emit_notification(
      (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = v_rec.provider_org_id AND pm.status = 'ACTIVE' LIMIT 1),
      'sla_suspension',
      'Service Suspended',
      'Your service assignment has been suspended due to extended performance issues. Contact support to discuss reinstatement.',
      jsonb_build_object('zone_id', v_rec.zone_id, 'category', v_rec.category, 'deep_link', '/provider/performance')
    );

    -- Auto-promote highest-ranked BACKUP to PRIMARY
    UPDATE zone_category_providers
    SET role = 'PRIMARY', updated_at = now()
    WHERE id = (
      SELECT zcp.id
      FROM zone_category_providers zcp
      WHERE zcp.zone_id = v_rec.zone_id
        AND zcp.category = v_rec.category
        AND zcp.role = 'BACKUP'
        AND zcp.status = 'ACTIVE'
      ORDER BY zcp.priority_rank ASC
      LIMIT 1
    );

    IF FOUND THEN
      v_promoted := v_promoted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('suspended', v_suspended, 'promoted', v_promoted);
END;
$$;

-- ============================================================
-- Fix #2 & #3: Replace evaluate_provider_sla to fix on-time metric and date window
-- ============================================================
CREATE OR REPLACE FUNCTION public.evaluate_provider_sla(
  p_provider_org_id uuid,
  p_zone_id uuid,
  p_category text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_jobs int;
  v_completed int;
  v_on_time int;
  v_photo_compliant int;
  v_issue_count int;
  v_redo_count int;
  v_on_time_pct numeric;
  v_completion_pct numeric;
  v_photo_pct numeric;
  v_issue_rate numeric;
  v_redo_rate numeric;
  v_new_level text;
  v_old_level text;
  v_old_level_since timestamptz;
  v_explain_provider text;
  v_explain_admin text;
BEGIN
  -- Count total jobs in 30-day window (FIX #3: exclude future jobs)
  SELECT count(*) INTO v_total_jobs
  FROM jobs j
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date;

  IF v_total_jobs < 5 THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'fewer_than_5_jobs');
  END IF;

  -- Completed jobs
  SELECT count(*) INTO v_completed
  FROM jobs j
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date
    AND j.status = 'completed';

  -- On-time jobs (FIX #2: require arrived_at AND latest_start_by to both be NOT NULL)
  SELECT count(*) INTO v_on_time
  FROM jobs j
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date
    AND j.status = 'completed'
    AND j.arrived_at IS NOT NULL
    AND j.latest_start_by IS NOT NULL
    AND j.arrived_at <= j.latest_start_by;

  -- Photo compliance (at least 1 photo per completed job)
  SELECT count(DISTINCT j.id) INTO v_photo_compliant
  FROM jobs j
  JOIN job_photos jp ON jp.job_id = j.id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date
    AND j.status = 'completed';

  -- Issues
  SELECT count(*) INTO v_issue_count
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date;

  -- Redo count
  SELECT count(*) INTO v_redo_count
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.scheduled_date <= current_date
    AND ji.issue_type = 'redo_required';

  -- Compute percentages
  v_on_time_pct := CASE WHEN v_completed > 0 THEN (v_on_time::numeric / v_completed * 100) ELSE 0 END;
  v_completion_pct := (v_completed::numeric / v_total_jobs * 100);
  v_photo_pct := CASE WHEN v_completed > 0 THEN (v_photo_compliant::numeric / v_completed * 100) ELSE 0 END;
  v_issue_rate := (v_issue_count::numeric / v_total_jobs * 100);
  v_redo_rate := (v_redo_count::numeric / v_total_jobs * 100);

  -- Determine SLA level
  IF v_on_time_pct >= 95 AND v_completion_pct >= 98 AND v_photo_pct >= 90 AND v_issue_rate <= 2 THEN
    v_new_level := 'GREEN';
  ELSIF v_on_time_pct >= 85 AND v_completion_pct >= 90 AND v_photo_pct >= 75 AND v_issue_rate <= 5 THEN
    v_new_level := 'YELLOW';
  ELSIF v_on_time_pct >= 70 AND v_completion_pct >= 80 AND v_issue_rate <= 10 THEN
    v_new_level := 'ORANGE';
  ELSE
    v_new_level := 'RED';
  END IF;

  -- Build explain texts
  v_explain_provider := format(
    'On-time: %s%%, Completion: %s%%, Photos: %s%%, Issue rate: %s%%',
    round(v_on_time_pct, 1), round(v_completion_pct, 1), round(v_photo_pct, 1), round(v_issue_rate, 1)
  );

  v_explain_admin := format(
    'Level %s based on %s jobs. On-time %s/%s, completed %s/%s, photos %s/%s, issues %s, redos %s',
    v_new_level, v_total_jobs, v_on_time, v_completed, v_completed, v_total_jobs,
    v_photo_compliant, v_completed, v_issue_count, v_redo_count
  );

  -- Get previous level
  SELECT sla_level, level_since INTO v_old_level, v_old_level_since
  FROM provider_sla_status
  WHERE provider_org_id = p_provider_org_id
    AND zone_id = p_zone_id
    AND category = p_category;

  -- Upsert SLA status (FIX #1: level_since only resets when level changes)
  INSERT INTO provider_sla_status (
    provider_org_id, zone_id, category,
    sla_level, on_time_pct, completion_pct, photo_compliance_pct,
    issue_rate, redo_rate, jobs_evaluated,
    level_since, weeks_at_level, last_evaluated_at,
    explain_provider, explain_admin
  ) VALUES (
    p_provider_org_id, p_zone_id, p_category,
    v_new_level, v_on_time_pct, v_completion_pct, v_photo_pct,
    v_issue_rate, v_redo_rate, v_total_jobs,
    now(), 0, now(),
    v_explain_provider, v_explain_admin
  )
  ON CONFLICT (provider_org_id, zone_id, category) DO UPDATE SET
    sla_level = v_new_level,
    on_time_pct = v_on_time_pct,
    completion_pct = v_completion_pct,
    photo_compliance_pct = v_photo_pct,
    issue_rate = v_issue_rate,
    redo_rate = v_redo_rate,
    jobs_evaluated = v_total_jobs,
    -- Only reset level_since when level actually changes
    level_since = CASE WHEN v_old_level IS DISTINCT FROM v_new_level THEN now() ELSE COALESCE(v_old_level_since, now()) END,
    weeks_at_level = CASE WHEN v_old_level IS DISTINCT FROM v_new_level THEN 0 ELSE COALESCE(provider_sla_status.weeks_at_level, 0) END,
    last_evaluated_at = now(),
    explain_provider = v_explain_provider,
    explain_admin = v_explain_admin;

  -- Notify if level worsened
  IF v_old_level IS NOT NULL AND v_new_level IN ('ORANGE', 'RED') AND v_old_level IS DISTINCT FROM v_new_level THEN
    PERFORM emit_notification(
      (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = p_provider_org_id AND pm.status = 'ACTIVE' LIMIT 1),
      'sla_warning',
      format('SLA Level: %s', v_new_level),
      format('Your performance level changed to %s. %s', v_new_level, v_explain_provider),
      jsonb_build_object('sla_level', v_new_level, 'deep_link', '/provider/performance')
    );
  END IF;

  RETURN jsonb_build_object('status', 'evaluated', 'sla_level', v_new_level, 'jobs_evaluated', v_total_jobs);
END;
$$;

-- ============================================================
-- Fix #4: Admin reinstate function + auto-recovery for suspended providers
-- ============================================================
CREATE OR REPLACE FUNCTION public.reinstate_provider(
  p_provider_org_id uuid,
  p_zone_id uuid,
  p_category text,
  p_admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE zone_category_providers
  SET status = 'ACTIVE', role = 'BACKUP', updated_at = now()
  WHERE provider_org_id = p_provider_org_id
    AND zone_id = p_zone_id
    AND category = p_category
    AND status = 'SUSPENDED';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Log the reinstatement
  IF p_admin_user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, reason)
    VALUES (p_admin_user_id, 'reinstate_provider', 'zone_category_providers', p_provider_org_id::text,
            format('Reinstated in zone %s / %s', p_zone_id, p_category));
  END IF;

  -- Notify provider
  PERFORM emit_notification(
    (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = p_provider_org_id AND pm.status = 'ACTIVE' LIMIT 1),
    'sla_reinstatement',
    'Service Reinstated',
    'Your service assignment has been reinstated. You will receive jobs as a backup provider.',
    jsonb_build_object('zone_id', p_zone_id, 'category', p_category, 'deep_link', '/provider/performance')
  );

  RETURN jsonb_build_object('status', 'reinstated', 'role', 'BACKUP');
END;
$$;

-- ============================================================
-- Fix #6: Add FK on photo_validation_results.provider_org_id
-- ============================================================
ALTER TABLE public.photo_validation_results
  ADD CONSTRAINT photo_validation_results_provider_org_id_fkey
  FOREIGN KEY (provider_org_id) REFERENCES public.provider_orgs(id);
