
-- Sprint 4 Review Fix Round 2: Findings 11-14

-- Drop and recreate with correct return type (jsonb) and job-based targeting
DROP FUNCTION IF EXISTS public.approve_weather_event(uuid);

CREATE OR REPLACE FUNCTION public.approve_weather_event(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event weather_events%ROWTYPE;
  v_admin_id uuid := auth.uid();
  v_affected_jobs int := 0;
  v_cust record;
  v_prov record;
BEGIN
  SELECT * INTO v_event FROM weather_events WHERE id = p_event_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'event_not_found_or_not_pending');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'admin_required');
  END IF;

  -- Activate (approval = activation, no separate 'approved' state)
  UPDATE weather_events
  SET status = 'active',
      approved_by_admin_user_id = v_admin_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_event_id;

  -- Finding 13: Count affected jobs for admin feedback
  SELECT count(*) INTO v_affected_jobs
  FROM jobs
  WHERE zone_id = v_event.zone_id
    AND scheduled_date >= v_event.affected_date_start
    AND scheduled_date <= v_event.affected_date_end
    AND status IN ('scheduled', 'assigned');

  -- Finding 12: Job-based targeting (only notify customers/providers with affected jobs)
  -- Finding 4: title as notification title, explain text as body
  -- Finding 3: Use emit_notification consistently
  FOR v_cust IN
    SELECT DISTINCT j.customer_id
    FROM jobs j
    WHERE j.zone_id = v_event.zone_id
      AND j.scheduled_date >= v_event.affected_date_start
      AND j.scheduled_date <= v_event.affected_date_end
      AND j.status IN ('scheduled', 'assigned')
  LOOP
    PERFORM emit_notification(
      v_cust.customer_id,
      'weather_event_active',
      COALESCE(v_event.title, 'Weather Alert'),
      COALESCE(v_event.explain_customer, 'A weather event may affect your upcoming service.'),
      jsonb_build_object('weather_event_id', p_event_id, 'zone_id', v_event.zone_id, 'strategy', v_event.strategy)
    );
  END LOOP;

  FOR v_prov IN
    SELECT DISTINCT pm.user_id
    FROM jobs j
    JOIN provider_members pm ON pm.provider_org_id = j.provider_org_id AND pm.status = 'ACTIVE'
    WHERE j.zone_id = v_event.zone_id
      AND j.scheduled_date >= v_event.affected_date_start
      AND j.scheduled_date <= v_event.affected_date_end
      AND j.status IN ('scheduled', 'assigned')
  LOOP
    PERFORM emit_notification(
      v_prov.user_id,
      'weather_event_active',
      COALESCE(v_event.title, 'Weather Alert'),
      COALESCE(v_event.explain_provider, 'A weather event may affect scheduled jobs.'),
      jsonb_build_object('weather_event_id', p_event_id, 'zone_id', v_event.zone_id, 'strategy', v_event.strategy)
    );
  END LOOP;

  -- Finding 11: Return jsonb with affected job count
  RETURN jsonb_build_object('status', 'approved', 'affected_jobs', v_affected_jobs);
END;
$$;
