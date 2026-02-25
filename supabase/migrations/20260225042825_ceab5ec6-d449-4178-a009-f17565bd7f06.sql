
-- Sprint 2: Quality Enforcement tables and RPCs

-- 2B-05: Provider SLA Status table
CREATE TABLE public.provider_sla_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES provider_orgs(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  sla_level text NOT NULL DEFAULT 'GREEN', -- GREEN, YELLOW, ORANGE, RED
  on_time_pct numeric DEFAULT 100,
  completion_pct numeric DEFAULT 100,
  photo_compliance_pct numeric DEFAULT 100,
  issue_rate numeric DEFAULT 0,
  redo_rate numeric DEFAULT 0,
  jobs_evaluated int DEFAULT 0,
  level_since timestamptz NOT NULL DEFAULT now(),
  weeks_at_level int DEFAULT 0,
  last_evaluated_at timestamptz DEFAULT now(),
  explain_provider text,
  explain_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_org_id, zone_id, category)
);

ALTER TABLE public.provider_sla_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on provider_sla_status"
  ON public.provider_sla_status FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers read own SLA status"
  ON public.provider_sla_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_members pm
      WHERE pm.provider_org_id = provider_sla_status.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'ACTIVE'
    )
  );

CREATE TRIGGER update_provider_sla_status_updated_at
  BEFORE UPDATE ON public.provider_sla_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2B-07: Photo validation results table
CREATE TABLE public.photo_validation_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_photo_id uuid NOT NULL REFERENCES job_photos(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_org_id uuid NOT NULL,
  validation_status text NOT NULL DEFAULT 'pending', -- pending, passed, failed
  checks jsonb NOT NULL DEFAULT '{}', -- { file_size: pass/fail, dimensions: pass/fail, duplicate_hash: pass/fail }
  failure_reasons text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on photo_validation_results"
  ON public.photo_validation_results FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers read own photo validations"
  ON public.photo_validation_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_members pm
      WHERE pm.provider_org_id = photo_validation_results.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'ACTIVE'
    )
  );

-- RPC: evaluate_provider_sla — computes SLA metrics and updates sla_level
CREATE OR REPLACE FUNCTION public.evaluate_provider_sla(
  p_provider_org_id uuid,
  p_zone_id uuid,
  p_category text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_total_jobs int;
  v_on_time int;
  v_completed int;
  v_photos_required int;
  v_photos_submitted int;
  v_issues int;
  v_redos int;
  v_on_time_pct numeric;
  v_completion_pct numeric;
  v_photo_pct numeric;
  v_issue_rate numeric;
  v_redo_rate numeric;
  v_new_level text;
  v_old_level text;
  v_weeks int;
  v_explain_provider text;
  v_explain_admin text;
  v_notify_user_id uuid;
BEGIN
  -- Count jobs in the last 30 days for this provider/zone/category
  SELECT count(*) INTO v_total_jobs
  FROM jobs j
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.status NOT IN ('CANCELED');

  IF v_total_jobs = 0 THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'No jobs in evaluation window');
  END IF;

  -- On-time: arrived before latest_start_by
  SELECT count(*) INTO v_on_time
  FROM jobs j
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.status = 'COMPLETED'
    AND (j.arrived_at IS NULL OR j.arrived_at <= j.latest_start_by OR j.latest_start_by IS NULL);

  -- Completed successfully
  SELECT count(*) INTO v_completed
  FROM jobs j
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.status = 'COMPLETED';

  -- Photo compliance: jobs with at least 1 photo
  SELECT count(*) INTO v_photos_required
  FROM jobs j
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND j.status = 'COMPLETED';

  SELECT count(DISTINCT jp.job_id) INTO v_photos_submitted
  FROM job_photos jp
  JOIN jobs j ON j.id = jp.job_id
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND j.scheduled_date >= (current_date - interval '30 days')::date
    AND jp.upload_status = 'uploaded';

  -- Issues
  SELECT count(*) INTO v_issues
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND ji.created_at >= (current_date - interval '30 days');

  -- Redos (issues resolved with redo)
  SELECT count(*) INTO v_redos
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.zone_id = p_zone_id
    AND ss.category = p_category
    AND ji.created_at >= (current_date - interval '30 days')
    AND ji.issue_type = 'redo_requested';

  -- Compute percentages
  v_on_time_pct := CASE WHEN v_total_jobs > 0 THEN round((v_on_time::numeric / v_total_jobs) * 100, 1) ELSE 100 END;
  v_completion_pct := CASE WHEN v_total_jobs > 0 THEN round((v_completed::numeric / v_total_jobs) * 100, 1) ELSE 100 END;
  v_photo_pct := CASE WHEN v_photos_required > 0 THEN round((v_photos_submitted::numeric / v_photos_required) * 100, 1) ELSE 100 END;
  v_issue_rate := CASE WHEN v_total_jobs > 0 THEN round((v_issues::numeric / v_total_jobs) * 100, 1) ELSE 0 END;
  v_redo_rate := CASE WHEN v_total_jobs > 0 THEN round((v_redos::numeric / v_total_jobs) * 100, 1) ELSE 0 END;

  -- Determine SLA level
  IF v_on_time_pct >= 90 AND v_completion_pct >= 95 AND v_photo_pct >= 90 AND v_issue_rate <= 5 THEN
    v_new_level := 'GREEN';
  ELSIF v_on_time_pct >= 80 AND v_completion_pct >= 85 AND v_photo_pct >= 80 AND v_issue_rate <= 10 THEN
    v_new_level := 'YELLOW';
  ELSIF v_on_time_pct >= 70 AND v_completion_pct >= 75 AND v_photo_pct >= 70 AND v_issue_rate <= 15 THEN
    v_new_level := 'ORANGE';
  ELSE
    v_new_level := 'RED';
  END IF;

  -- Get current level
  SELECT sla_level, weeks_at_level INTO v_old_level, v_weeks
  FROM provider_sla_status
  WHERE provider_org_id = p_provider_org_id AND zone_id = p_zone_id AND category = p_category;

  IF v_old_level IS NULL THEN
    v_weeks := 0;
  ELSIF v_old_level = v_new_level THEN
    v_weeks := COALESCE(v_weeks, 0) + 1;
  ELSE
    v_weeks := 0;
  END IF;

  -- Build explanations
  v_explain_provider := CASE v_new_level
    WHEN 'GREEN' THEN 'Great work! Your performance meets all quality standards.'
    WHEN 'YELLOW' THEN format('Heads up: Your on-time rate is %s%% and photo compliance is %s%%. Complete 10 compliant jobs to get back to Green.', v_on_time_pct, v_photo_pct)
    WHEN 'ORANGE' THEN format('Warning: Your metrics need attention. On-time: %s%%, Photos: %s%%, Issues: %s%%. New assignments may be restricted.', v_on_time_pct, v_photo_pct, v_issue_rate)
    WHEN 'RED' THEN format('Critical: Performance is below minimum standards. On-time: %s%%, Completion: %s%%, Photos: %s%%. Assignments may be suspended.', v_on_time_pct, v_completion_pct, v_photo_pct)
  END;

  v_explain_admin := format('Provider %s in zone %s/%s: Level %s→%s. On-time: %s%%, Completion: %s%%, Photos: %s%%, Issues: %s/100, Redos: %s/100. Jobs evaluated: %s. Weeks at level: %s.',
    p_provider_org_id, p_zone_id, p_category, COALESCE(v_old_level, 'NEW'), v_new_level,
    v_on_time_pct, v_completion_pct, v_photo_pct, v_issue_rate, v_redo_rate, v_total_jobs, v_weeks);

  -- Upsert SLA status
  INSERT INTO provider_sla_status (
    provider_org_id, zone_id, category, sla_level,
    on_time_pct, completion_pct, photo_compliance_pct,
    issue_rate, redo_rate, jobs_evaluated,
    level_since, weeks_at_level, last_evaluated_at,
    explain_provider, explain_admin
  ) VALUES (
    p_provider_org_id, p_zone_id, p_category, v_new_level,
    v_on_time_pct, v_completion_pct, v_photo_pct,
    v_issue_rate, v_redo_rate, v_total_jobs,
    CASE WHEN v_old_level IS DISTINCT FROM v_new_level THEN now() ELSE COALESCE((SELECT level_since FROM provider_sla_status WHERE provider_org_id = p_provider_org_id AND zone_id = p_zone_id AND category = p_category), now()) END,
    v_weeks, now(),
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
    level_since = CASE WHEN provider_sla_status.sla_level IS DISTINCT FROM v_new_level THEN now() ELSE provider_sla_status.level_since END,
    weeks_at_level = v_weeks,
    last_evaluated_at = now(),
    explain_provider = v_explain_provider,
    explain_admin = v_explain_admin;

  -- Notify provider on level change (non-GREEN)
  IF v_old_level IS DISTINCT FROM v_new_level AND v_new_level != 'GREEN' THEN
    SELECT pm.user_id INTO v_notify_user_id
    FROM provider_members pm
    WHERE pm.provider_org_id = p_provider_org_id AND pm.status = 'ACTIVE'
    LIMIT 1;

    IF v_notify_user_id IS NOT NULL THEN
      PERFORM emit_notification(
        v_notify_user_id,
        'sla_warning',
        CASE v_new_level
          WHEN 'YELLOW' THEN 'Performance Notice'
          WHEN 'ORANGE' THEN 'Performance Warning'
          WHEN 'RED' THEN 'Critical Performance Alert'
        END,
        v_explain_provider,
        jsonb_build_object('deep_link', '/provider/performance', 'sla_level', v_new_level)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', 'evaluated',
    'sla_level', v_new_level,
    'previous_level', COALESCE(v_old_level, 'NEW'),
    'weeks_at_level', v_weeks,
    'metrics', jsonb_build_object(
      'on_time_pct', v_on_time_pct,
      'completion_pct', v_completion_pct,
      'photo_compliance_pct', v_photo_pct,
      'issue_rate', v_issue_rate,
      'redo_rate', v_redo_rate,
      'jobs_evaluated', v_total_jobs
    ),
    'explain_admin', v_explain_admin
  );
END;
$$;

-- 2B-06: RPC to auto-suspend RED providers and promote backups
CREATE OR REPLACE FUNCTION public.enforce_sla_suspensions()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_rec record;
  v_suspended int := 0;
  v_promoted int := 0;
  v_best_backup record;
  v_notify_user_id uuid;
BEGIN
  -- Find providers at RED for 2+ weeks
  FOR v_rec IN
    SELECT s.provider_org_id, s.zone_id, s.category, s.weeks_at_level, s.explain_admin
    FROM provider_sla_status s
    WHERE s.sla_level = 'RED' AND s.weeks_at_level >= 2
  LOOP
    -- Suspend in zone_category_providers
    UPDATE zone_category_providers
    SET status = 'SUSPENDED'
    WHERE provider_org_id = v_rec.provider_org_id
      AND zone_id = v_rec.zone_id
      AND category = v_rec.category
      AND status = 'ACTIVE';

    IF FOUND THEN
      v_suspended := v_suspended + 1;

      -- If they were PRIMARY, promote highest-ranked ACTIVE backup
      IF EXISTS (
        SELECT 1 FROM zone_category_providers
        WHERE provider_org_id = v_rec.provider_org_id
          AND zone_id = v_rec.zone_id
          AND category = v_rec.category
          AND role = 'PRIMARY'
      ) THEN
        SELECT * INTO v_best_backup
        FROM zone_category_providers
        WHERE zone_id = v_rec.zone_id
          AND category = v_rec.category
          AND role = 'BACKUP'
          AND status = 'ACTIVE'
        ORDER BY priority_rank ASC, performance_score DESC NULLS LAST
        LIMIT 1;

        IF v_best_backup IS NOT NULL THEN
          UPDATE zone_category_providers SET role = 'PRIMARY' WHERE id = v_best_backup.id;
          v_promoted := v_promoted + 1;

          -- Notify promoted provider
          SELECT pm.user_id INTO v_notify_user_id
          FROM provider_members pm
          WHERE pm.provider_org_id = v_best_backup.provider_org_id AND pm.status = 'ACTIVE'
          LIMIT 1;

          IF v_notify_user_id IS NOT NULL THEN
            PERFORM emit_notification(
              v_notify_user_id,
              'promotion',
              'You''re Now Primary Provider',
              'Congratulations! You''ve been promoted to Primary provider for this zone.',
              jsonb_build_object('zone_id', v_rec.zone_id, 'category', v_rec.category, 'deep_link', '/provider/coverage')
            );
          END IF;
        END IF;
      END IF;

      -- Notify suspended provider
      SELECT pm.user_id INTO v_notify_user_id
      FROM provider_members pm
      WHERE pm.provider_org_id = v_rec.provider_org_id AND pm.status = 'ACTIVE'
      LIMIT 1;

      IF v_notify_user_id IS NOT NULL THEN
        PERFORM emit_notification(
          v_notify_user_id,
          'sla_suspension',
          'Assignments Suspended',
          'Your assignments have been suspended due to sustained performance issues. Contact support to discuss a recovery plan.',
          jsonb_build_object('zone_id', v_rec.zone_id, 'category', v_rec.category, 'deep_link', '/provider/performance')
        );
      END IF;

      -- Notify admins
      FOR v_notify_user_id IN SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
      LOOP
        PERFORM emit_notification(
          v_notify_user_id,
          'sla_enforcement',
          'Provider Suspended (Auto)',
          format('Provider %s suspended in zone %s/%s after %s weeks at RED.', v_rec.provider_org_id, v_rec.zone_id, v_rec.category, v_rec.weeks_at_level),
          jsonb_build_object('provider_org_id', v_rec.provider_org_id, 'zone_id', v_rec.zone_id, 'deep_link', '/admin/providers')
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('suspended', v_suspended, 'promoted', v_promoted);
END;
$$;
