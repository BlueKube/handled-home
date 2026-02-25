
-- Sprint 4 Review Fixes (Findings 1-5, 9-10)

-- Finding 1: Consolidate duplicate weather_events SELECT policies
DROP POLICY IF EXISTS "Customers can view active weather events" ON public.weather_events;
DROP POLICY IF EXISTS "Providers can view active weather events" ON public.weather_events;

CREATE POLICY "Authenticated users can view non-pending weather events"
  ON public.weather_events FOR SELECT
  USING (status IN ('active', 'resolved'));

-- Findings 2-4: Drop and recreate approve_weather_event
DROP FUNCTION IF EXISTS public.approve_weather_event(uuid);

CREATE OR REPLACE FUNCTION public.approve_weather_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_event weather_events%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM weather_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Weather event not found';
  END IF;
  IF v_event.status != 'pending' THEN
    RAISE EXCEPTION 'Event is not pending (current status: %)', v_event.status;
  END IF;

  -- Activate immediately (approval = activation, no separate 'approved' state)
  UPDATE weather_events
  SET status = 'active',
      approved_by_admin_user_id = v_admin_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_event_id;

  -- Finding 4: title as notification title, explain_customer as body
  -- Finding 3: Use emit_notification consistently
  PERFORM emit_notification(
    p.user_id,
    'weather_event_active',
    COALESCE(v_event.title, 'Weather Alert'),
    COALESCE(v_event.explain_customer, 'A weather event may affect your upcoming service.'),
    jsonb_build_object('weather_event_id', p_event_id, 'zone_id', v_event.zone_id)
  )
  FROM properties p
  JOIN zones z ON z.id = v_event.zone_id
  WHERE p.zip_code = ANY(z.zip_codes);

  PERFORM emit_notification(
    pm.user_id,
    'weather_event_active',
    COALESCE(v_event.title, 'Weather Alert'),
    COALESCE(v_event.explain_provider, 'A weather event may affect scheduled jobs.'),
    jsonb_build_object('weather_event_id', p_event_id, 'zone_id', v_event.zone_id)
  )
  FROM zone_category_providers zcp
  JOIN provider_orgs po ON po.id = zcp.provider_org_id
  JOIN provider_members pm ON pm.provider_org_id = po.id
  WHERE zcp.zone_id = v_event.zone_id;
END;
$$;

-- Finding 5: Add missing 2027 holidays
INSERT INTO public.holiday_calendar (name, holiday_date, year, is_federal, skip_jobs, notify_customers, notify_providers, explain_customer, explain_provider)
VALUES
  ('Columbus Day', '2027-10-11', 2027, true, true, true, true,
   'No service on Columbus Day. Your next visit will be the following week.',
   'No jobs scheduled for Columbus Day. Enjoy the day off.'),
  ('Veterans Day', '2027-11-11', 2027, true, true, true, true,
   'No service on Veterans Day. Your next visit will be the following week.',
   'No jobs scheduled for Veterans Day. Thank you for your service.')
ON CONFLICT DO NOTHING;

-- Finding 9: Composite index for is_weather_affected performance
CREATE INDEX IF NOT EXISTS idx_weather_events_zone_status_dates
  ON public.weather_events (zone_id, status, affected_date_start, affected_date_end);

-- Finding 10: Scope admin holiday policy (keep public SELECT, admin for writes)
DROP POLICY IF EXISTS "Admins can manage holiday calendar" ON public.holiday_calendar;

CREATE POLICY "Admins can manage holiday calendar"
  ON public.holiday_calendar FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
