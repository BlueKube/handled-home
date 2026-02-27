
-- Sprint E-03: Provider Availability Blocks + Assignment Integration

-- 1. provider_availability_blocks table
CREATE TABLE public.provider_availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'DAY_OFF', -- DAY_OFF, VACATION, LIMITED_CAPACITY
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger: end_date >= start_date
CREATE OR REPLACE FUNCTION public.validate_availability_block()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be >= start_date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_availability_block
  BEFORE INSERT OR UPDATE ON public.provider_availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.validate_availability_block();

-- Indexes
CREATE INDEX idx_avail_blocks_org_dates ON public.provider_availability_blocks(provider_org_id, start_date, end_date);
CREATE INDEX idx_avail_blocks_status ON public.provider_availability_blocks(status);

-- RLS
ALTER TABLE public.provider_availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members can view own availability blocks"
  ON public.provider_availability_blocks FOR SELECT
  USING (provider_org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()));

CREATE POLICY "Provider members can insert own availability blocks"
  ON public.provider_availability_blocks FOR INSERT
  WITH CHECK (
    provider_org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid())
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "Provider members can update own availability blocks"
  ON public.provider_availability_blocks FOR UPDATE
  USING (provider_org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access to availability blocks"
  ON public.provider_availability_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 2. Update auto_assign_job to respect availability blocks
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
      SELECT count(*) INTO v_daily_count
      FROM jobs j
      WHERE j.provider_org_id = v_provider.provider_org_id
        AND j.scheduled_date = v_job.scheduled_date
        AND j.status NOT IN ('CANCELED')
        AND j.id != p_job_id;

      IF v_daily_count < v_max_daily THEN
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
      -- Log that primary was skipped due to availability block
      v_explain_admin := format('Primary provider %s blocked (availability block) for date %s. Trying backups.',
        v_provider.provider_org_id, v_job.scheduled_date);
    END IF;
  END IF;

  -- 4. Try BACKUP providers (also respecting availability blocks)
  FOR v_provider IN
    SELECT zcp.provider_org_id, zcp.performance_score, zcp.priority_rank, zcp.role
    FROM zone_category_providers zcp
    WHERE zcp.zone_id = v_job.zone_id
      AND zcp.category = v_category
      AND zcp.role = 'BACKUP'
      AND zcp.status = 'ACTIVE'
      -- Exclude providers with active availability blocks for this date
      AND NOT EXISTS (
        SELECT 1 FROM provider_availability_blocks pab
        WHERE pab.provider_org_id = zcp.provider_org_id
          AND pab.status = 'active'
          AND pab.block_type IN ('DAY_OFF', 'VACATION')
          AND v_job.scheduled_date BETWEEN pab.start_date AND pab.end_date
      )
    ORDER BY zcp.priority_rank ASC, zcp.performance_score DESC NULLS LAST
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
      v_explain_admin := format('Backup #%s selected (Primary at capacity or unavailable). Score: %s. Daily load: %s/%s.',
        v_provider.priority_rank, COALESCE(v_provider.performance_score::text, 'N/A'), v_daily_count + 1, v_max_daily);
      v_score_breakdown := jsonb_build_object(
        'role', 'BACKUP',
        'priority_rank', v_provider.priority_rank,
        'performance_score', v_provider.performance_score,
        'daily_load', v_daily_count + 1,
        'max_daily', v_max_daily
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
          'New Job Assigned (Overflow)',
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

  -- 5. Overflow
  v_explain_admin := format('No eligible provider found for zone %s, category %s, date %s. All providers at capacity, blocked, or none assigned.',
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

  FOR v_notify_user_id IN SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
  LOOP
    PERFORM emit_notification(
      v_notify_user_id,
      'overflow_alert',
      'Overflow: Unassigned Job',
      format('Job %s has no eligible provider. Zone: %s, Category: %s.', p_job_id, v_job.zone_id, v_category),
      jsonb_build_object('job_id', p_job_id, 'deep_link', '/admin/jobs/' || p_job_id)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'overflow',
    'reason', 'no_eligible_provider',
    'explain_admin', v_explain_admin
  );
END;
$function$;
