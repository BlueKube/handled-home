
-- ==========================================
-- OBS-2: Add requires_training_gate column to service_skus
-- E05-F1 fix: deny-by-default for gated SKUs
-- ==========================================
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS requires_training_gate boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.service_skus.requires_training_gate IS
  'When true, providers must have a completed training gate for this SKU to be assigned jobs containing it.';

-- ==========================================
-- E04-F1: Fix compute_byoc_bonuses over-count
-- Uses GET DIAGNOSTICS to only count actual inserts (ON CONFLICT DO NOTHING skips dupes)
-- ==========================================
CREATE OR REPLACE FUNCTION public.compute_byoc_bonuses(p_week_start date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_end date := p_week_start + 6;
  v_count int := 0;
  v_inserted int;
  v_attr record;
  v_has_visit boolean;
  v_has_active_sub boolean;
  v_config record;
BEGIN
  -- Admin guard
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_attr IN
    SELECT ba.*
    FROM public.byoc_attributions ba
    WHERE ba.status = 'ACTIVE'
      AND ba.bonus_start_at IS NOT NULL
      AND ba.bonus_end_at IS NOT NULL
      AND p_week_start >= ba.bonus_start_at::date
      AND p_week_start <= ba.bonus_end_at::date
  LOOP
    -- Check active subscription
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.customer_id = v_attr.customer_id
        AND s.status = 'active'
    ) INTO v_has_active_sub;

    IF NOT v_has_active_sub THEN CONTINUE; END IF;

    -- Check completed visit this week
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.customer_id = v_attr.customer_id
        AND j.status = 'completed'
        AND j.scheduled_date BETWEEN p_week_start AND v_week_end
    ) INTO v_has_visit;

    IF NOT v_has_visit THEN CONTINUE; END IF;

    -- Get incentive config (GLOBAL fallback)
    SELECT * INTO v_config
    FROM public.provider_incentive_config
    WHERE scope = 'GLOBAL'
    ORDER BY updated_at DESC
    LIMIT 1;

    -- Insert bonus (idempotent via unique index)
    INSERT INTO public.byoc_bonus_ledger (
      attribution_id, provider_org_id, customer_id,
      week_start, week_end, amount_cents, status
    )
    VALUES (
      v_attr.id, v_attr.provider_org_id, v_attr.customer_id,
      p_week_start, v_week_end,
      COALESCE(v_config.byoc_weekly_amount_cents, 1000),
      'EARNED'
    )
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_count := v_count + v_inserted;
  END LOOP;

  RETURN jsonb_build_object('bonuses_created', v_count, 'week_start', p_week_start);
END;
$$;

-- ==========================================
-- E04-F2: Add auth guard to activate_byoc_attribution
-- Only admin or provider member of the attribution's org can call
-- ==========================================
CREATE OR REPLACE FUNCTION public.activate_byoc_attribution(p_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attr record;
  v_config record;
  v_caller_is_admin boolean;
  v_caller_is_member boolean;
BEGIN
  -- Find pending attribution
  SELECT * INTO v_attr
  FROM public.byoc_attributions
  WHERE customer_id = p_customer_id
    AND status = 'PENDING'
  LIMIT 1;

  IF v_attr IS NULL THEN
    RETURN jsonb_build_object('activated', false, 'reason', 'no_pending_attribution');
  END IF;

  -- Auth guard: must be admin OR member of the provider org
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  SELECT EXISTS (
    SELECT 1 FROM public.provider_members pm
    WHERE pm.provider_org_id = v_attr.provider_org_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'ACTIVE'
  ) INTO v_caller_is_member;

  IF NOT v_caller_is_admin AND NOT v_caller_is_member THEN
    RAISE EXCEPTION 'Unauthorized: must be admin or provider org member';
  END IF;

  -- Get config
  SELECT * INTO v_config
  FROM public.provider_incentive_config
  WHERE scope = 'GLOBAL'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Activate
  UPDATE public.byoc_attributions SET
    status = 'ACTIVE',
    first_completed_visit_at = now(),
    bonus_start_at = now(),
    bonus_end_at = now() + (COALESCE(v_config.byoc_duration_days, 90) || ' days')::interval,
    updated_at = now()
  WHERE id = v_attr.id;

  RETURN jsonb_build_object('activated', true, 'attribution_id', v_attr.id);
END;
$$;

-- ==========================================
-- E04-F3: Rename trigger to follow naming convention
-- ==========================================
DO $$
BEGIN
  -- Drop old trigger if it exists (handles both possible names)
  DROP TRIGGER IF EXISTS set_updated_at ON public.byoc_attributions;
  DROP TRIGGER IF EXISTS trg_byoc_attributions_set_updated_at ON public.byoc_attributions;
  
  -- Create with correct name
  CREATE TRIGGER trg_byoc_attributions_set_updated_at
    BEFORE UPDATE ON public.byoc_attributions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
END;
$$;

-- ==========================================
-- E05-F1: Update auto_assign_job for deny-by-default training gates
-- When service_skus.requires_training_gate = true, provider MUST have
-- a completed gate. No gate row = denied.
-- ==========================================
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
      -- If any job SKU has requires_training_gate=true AND provider does NOT have a completed gate, deny
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

          RETURN jsonb_build_object(
            'status', 'assigned',
            'provider_org_id', v_provider.provider_org_id,
            'reason', v_assignment_reason,
            'explain_admin', v_explain_admin
          );
        END IF;
      ELSE
        v_explain_admin := format('Primary provider %s failed training gate check (deny-by-default) for job SKUs. Trying backups.',
          v_provider.provider_org_id);
      END IF;
    ELSE
      v_explain_admin := format('Primary provider %s blocked (availability block) for date %s. Trying backups.',
        v_provider.provider_org_id, v_job.scheduled_date);
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

      RETURN jsonb_build_object(
        'status', 'assigned',
        'provider_org_id', v_provider.provider_org_id,
        'reason', v_assignment_reason,
        'explain_admin', v_explain_admin
      );
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

  RETURN jsonb_build_object(
    'status', 'overflow',
    'reason', 'no_provider_available',
    'explain_admin', v_explain_admin
  );
END;
$function$;

-- ==========================================
-- E05-F2: Wire up evaluate_training_gates RPC
-- Auto-completes pending gates when provider quality score meets required_score_minimum
-- ==========================================
CREATE OR REPLACE FUNCTION public.evaluate_training_gates()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gate record;
  v_latest_score numeric;
  v_completed_count int := 0;
BEGIN
  -- Admin guard
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_gate IN
    SELECT ptg.*
    FROM public.provider_training_gates ptg
    WHERE ptg.status = 'pending'
      AND ptg.required_score_minimum IS NOT NULL
      AND ptg.required_score_minimum > 0
  LOOP
    -- Get latest quality score for this provider
    SELECT pqs.composite_score INTO v_latest_score
    FROM public.provider_quality_score_snapshots pqs
    WHERE pqs.provider_org_id = v_gate.provider_org_id
    ORDER BY pqs.snapshot_at DESC
    LIMIT 1;

    IF v_latest_score IS NOT NULL AND v_latest_score >= v_gate.required_score_minimum THEN
      UPDATE public.provider_training_gates SET
        status = 'completed',
        completed_at = now(),
        updated_at = now()
      WHERE id = v_gate.id;

      v_completed_count := v_completed_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('gates_completed', v_completed_count);
END;
$$;
