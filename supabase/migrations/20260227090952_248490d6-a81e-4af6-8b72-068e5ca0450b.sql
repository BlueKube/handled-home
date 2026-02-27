
-- ============================================================
-- Sprint E-05: Tier System + Training Gates
-- ============================================================

-- 1. Provider tier history table
CREATE TABLE public.provider_tier_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'standard',
  previous_tier text,
  reason text NOT NULL,
  quality_score_snapshot_id uuid REFERENCES public.provider_quality_score_snapshots(id),
  hold_period_days int NOT NULL DEFAULT 5,
  assignment_priority_modifier int NOT NULL DEFAULT 0,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tier_history_org_effective ON public.provider_tier_history (provider_org_id, effective_at DESC);

-- RLS
ALTER TABLE public.provider_tier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members can view own tier history"
  ON public.provider_tier_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.provider_members pm
    WHERE pm.provider_org_id = provider_tier_history.provider_org_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'ACTIVE'
  ));

CREATE POLICY "Admin full access on tier history"
  ON public.provider_tier_history FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 2. Provider training gates table
CREATE TABLE public.provider_training_gates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  required_score_minimum int NOT NULL DEFAULT 70,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_org_id, sku_id)
);

CREATE INDEX idx_training_gates_org ON public.provider_training_gates (provider_org_id, status);

ALTER TABLE public.provider_training_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members can view own training gates"
  ON public.provider_training_gates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.provider_members pm
    WHERE pm.provider_org_id = provider_training_gates.provider_org_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'ACTIVE'
  ));

CREATE POLICY "Admin full access on training gates"
  ON public.provider_training_gates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- updated_at trigger
CREATE TRIGGER set_training_gates_updated_at
  BEFORE UPDATE ON public.provider_training_gates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Evaluate provider tier RPC
-- Tier logic: GREEN band (score >= 80) → 'gold', YELLOW (60-79) → 'silver', else → 'standard'
-- Gold: assignment_priority_modifier = 2, hold_period_days = 2
-- Silver: assignment_priority_modifier = 1, hold_period_days = 3
-- Standard: assignment_priority_modifier = 0, hold_period_days = 5
CREATE OR REPLACE FUNCTION public.evaluate_provider_tier(p_provider_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_snapshot provider_quality_score_snapshots%ROWTYPE;
  v_current_tier text;
  v_new_tier text;
  v_hold_days int;
  v_priority_mod int;
  v_reason text;
BEGIN
  -- Admin guard
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Get latest quality score
  SELECT * INTO v_snapshot
  FROM provider_quality_score_snapshots
  WHERE provider_org_id = p_provider_org_id
  ORDER BY computed_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'No quality score snapshot found');
  END IF;

  -- Get current tier
  SELECT tier INTO v_current_tier
  FROM provider_tier_history
  WHERE provider_org_id = p_provider_org_id
  ORDER BY effective_at DESC
  LIMIT 1;

  v_current_tier := COALESCE(v_current_tier, 'standard');

  -- Determine new tier from score band
  IF v_snapshot.band = 'GREEN' THEN
    v_new_tier := 'gold';
    v_hold_days := 2;
    v_priority_mod := 2;
  ELSIF v_snapshot.band = 'YELLOW' THEN
    v_new_tier := 'silver';
    v_hold_days := 3;
    v_priority_mod := 1;
  ELSE
    v_new_tier := 'standard';
    v_hold_days := 5;
    v_priority_mod := 0;
  END IF;

  -- Only insert if tier changed
  IF v_new_tier != v_current_tier THEN
    v_reason := format('Tier changed from %s to %s based on quality score %s (band: %s)',
      v_current_tier, v_new_tier, v_snapshot.score, v_snapshot.band);

    INSERT INTO provider_tier_history (
      provider_org_id, tier, previous_tier, reason,
      quality_score_snapshot_id, hold_period_days, assignment_priority_modifier
    ) VALUES (
      p_provider_org_id, v_new_tier, v_current_tier, v_reason,
      v_snapshot.id, v_hold_days, v_priority_mod
    );

    RETURN jsonb_build_object(
      'status', 'changed',
      'previous_tier', v_current_tier,
      'new_tier', v_new_tier,
      'hold_period_days', v_hold_days,
      'assignment_priority_modifier', v_priority_mod,
      'reason', v_reason
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'unchanged',
    'current_tier', v_current_tier,
    'score', v_snapshot.score,
    'band', v_snapshot.band
  );
END;
$$;

-- 4. Update auto_assign_job to factor in tier priority
-- Backup loop now orders by tier priority modifier (descending) before priority_rank
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

  -- 2. Determine category from job_skus → service_skus
  SELECT ss.category INTO v_category
  FROM job_skus js
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE js.job_id = p_job_id
  LIMIT 1;

  IF v_category IS NULL THEN
    v_category := 'lawn_care';
  END IF;

  -- Check training gate for the SKUs in this job
  -- If any SKU requires a training gate and the provider hasn't completed it, skip
  -- (This is enforced in backup loop; primary assumed trained)

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
      -- Check training gates for primary
      IF NOT EXISTS (
        SELECT 1 FROM job_skus js
        JOIN provider_training_gates ptg ON ptg.sku_id = js.sku_id
          AND ptg.provider_org_id = v_provider.provider_org_id
          AND ptg.status = 'pending'
        WHERE js.job_id = p_job_id
      ) THEN
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
        v_explain_admin := format('Primary provider %s has incomplete training gates for job SKUs. Trying backups.',
          v_provider.provider_org_id);
      END IF;
    ELSE
      v_explain_admin := format('Primary provider %s blocked (availability block) for date %s. Trying backups.',
        v_provider.provider_org_id, v_job.scheduled_date);
    END IF;
  END IF;

  -- 4. Try BACKUP providers (tier priority + availability + training gates)
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
      -- Exclude providers with pending training gates for job SKUs
      AND NOT EXISTS (
        SELECT 1 FROM job_skus js
        JOIN provider_training_gates ptg ON ptg.sku_id = js.sku_id
          AND ptg.provider_org_id = zcp.provider_org_id
          AND ptg.status = 'pending'
        WHERE js.job_id = p_job_id
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
