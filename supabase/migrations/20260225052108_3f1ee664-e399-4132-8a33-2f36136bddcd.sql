
-- Sprint 4: Weather & Scheduling (2B-11, 2B-12, 2B-13)

-- ==========================================
-- 2B-11 & 2B-12: Weather Events
-- ==========================================

CREATE TABLE public.weather_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  category text NOT NULL DEFAULT 'all',
  event_type text NOT NULL DEFAULT 'delay', -- delay | cancel | reschedule
  severity text NOT NULL DEFAULT 'advisory', -- advisory | severe
  strategy text NOT NULL DEFAULT 'delay_same_week', -- delay_same_week | skip_week | reschedule_next | cancel_notify
  status text NOT NULL DEFAULT 'pending', -- pending | approved | active | resolved | rejected
  title text NOT NULL,
  description text,
  affected_date_start date NOT NULL,
  affected_date_end date NOT NULL,
  source text NOT NULL DEFAULT 'manual', -- manual | auto_detected
  auto_detection_data jsonb DEFAULT '{}',
  approved_by_admin_user_id uuid,
  approved_at timestamptz,
  resolved_at timestamptz,
  resolved_by_admin_user_id uuid,
  explain_customer text,
  explain_provider text,
  explain_admin text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_events ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage weather events"
  ON public.weather_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Customers can see active/approved events for their zone
CREATE POLICY "Customers can view active weather events"
  ON public.weather_events FOR SELECT
  USING (status IN ('approved', 'active', 'resolved'));

-- Providers can see active/approved events
CREATE POLICY "Providers can view active weather events"
  ON public.weather_events FOR SELECT
  USING (status IN ('approved', 'active', 'resolved'));

-- ==========================================
-- 2B-13: Holiday Calendar
-- ==========================================

CREATE TABLE public.holiday_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  holiday_date date NOT NULL,
  year int NOT NULL,
  is_federal boolean NOT NULL DEFAULT true,
  skip_jobs boolean NOT NULL DEFAULT true,
  notify_customers boolean NOT NULL DEFAULT true,
  notify_providers boolean NOT NULL DEFAULT true,
  explain_customer text,
  explain_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, year)
);

ALTER TABLE public.holiday_calendar ENABLE ROW LEVEL SECURITY;

-- Everyone can read holidays
CREATE POLICY "Anyone can view holidays"
  ON public.holiday_calendar FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage holidays"
  ON public.holiday_calendar FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Pre-seed US Federal Holidays for 2026
INSERT INTO public.holiday_calendar (name, holiday_date, year, is_federal, explain_customer, explain_provider) VALUES
  ('New Year''s Day', '2026-01-01', 2026, true, 'No service on New Year''s Day. Your next visit will be rescheduled.', 'No jobs scheduled on New Year''s Day.'),
  ('Martin Luther King Jr. Day', '2026-01-19', 2026, true, 'No service on MLK Day. Your next visit will be rescheduled.', 'No jobs scheduled on MLK Day.'),
  ('Presidents'' Day', '2026-02-16', 2026, true, 'No service on Presidents'' Day. Your next visit will be rescheduled.', 'No jobs scheduled on Presidents'' Day.'),
  ('Memorial Day', '2026-05-25', 2026, true, 'No service on Memorial Day. Your next visit will be rescheduled.', 'No jobs scheduled on Memorial Day.'),
  ('Independence Day', '2026-07-04', 2026, true, 'No service on Independence Day. Your next visit will be rescheduled.', 'No jobs scheduled on Independence Day.'),
  ('Labor Day', '2026-09-07', 2026, true, 'No service on Labor Day. Your next visit will be rescheduled.', 'No jobs scheduled on Labor Day.'),
  ('Columbus Day', '2026-10-12', 2026, false, 'No service on Columbus Day. Your next visit will be rescheduled.', 'No jobs scheduled on Columbus Day.'),
  ('Veterans Day', '2026-11-11', 2026, true, 'No service on Veterans Day. Your next visit will be rescheduled.', 'No jobs scheduled on Veterans Day.'),
  ('Thanksgiving Day', '2026-11-26', 2026, true, 'No service on Thanksgiving. Your next visit will be rescheduled.', 'No jobs scheduled on Thanksgiving.'),
  ('Christmas Day', '2026-12-25', 2026, true, 'No service on Christmas Day. Your next visit will be rescheduled.', 'No jobs scheduled on Christmas Day.');

-- Pre-seed 2027
INSERT INTO public.holiday_calendar (name, holiday_date, year, is_federal, explain_customer, explain_provider) VALUES
  ('New Year''s Day', '2027-01-01', 2027, true, 'No service on New Year''s Day. Your next visit will be rescheduled.', 'No jobs scheduled on New Year''s Day.'),
  ('Martin Luther King Jr. Day', '2027-01-18', 2027, true, 'No service on MLK Day. Your next visit will be rescheduled.', 'No jobs scheduled on MLK Day.'),
  ('Presidents'' Day', '2027-02-15', 2027, true, 'No service on Presidents'' Day. Your next visit will be rescheduled.', 'No jobs scheduled on Presidents'' Day.'),
  ('Memorial Day', '2027-05-31', 2027, true, 'No service on Memorial Day. Your next visit will be rescheduled.', 'No jobs scheduled on Memorial Day.'),
  ('Independence Day', '2027-07-04', 2027, true, 'No service on Independence Day. Your next visit will be rescheduled.', 'No jobs scheduled on Independence Day.'),
  ('Labor Day', '2027-09-06', 2027, true, 'No service on Labor Day. Your next visit will be rescheduled.', 'No jobs scheduled on Labor Day.'),
  ('Thanksgiving Day', '2027-11-25', 2027, true, 'No service on Thanksgiving. Your next visit will be rescheduled.', 'No jobs scheduled on Thanksgiving.'),
  ('Christmas Day', '2027-12-25', 2027, true, 'No service on Christmas Day. Your next visit will be rescheduled.', 'No jobs scheduled on Christmas Day.');

-- ==========================================
-- RPCs for Weather Event Management
-- ==========================================

-- Admin: Approve a pending weather event
CREATE OR REPLACE FUNCTION public.approve_weather_event(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event record;
  v_admin_id uuid := auth.uid();
  v_affected_jobs int := 0;
BEGIN
  SELECT * INTO v_event FROM weather_events WHERE id = p_event_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'event_not_found_or_not_pending');
  END IF;

  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'admin_required');
  END IF;

  -- Approve
  UPDATE weather_events
  SET status = 'active', approved_by_admin_user_id = v_admin_id, approved_at = now(), updated_at = now()
  WHERE id = p_event_id;

  -- Count affected jobs
  SELECT count(*) INTO v_affected_jobs
  FROM jobs
  WHERE zone_id = v_event.zone_id
    AND scheduled_date >= v_event.affected_date_start
    AND scheduled_date <= v_event.affected_date_end
    AND status IN ('scheduled', 'assigned');

  -- Notify affected customers
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT DISTINCT j.customer_id,
    'weather_event',
    COALESCE(v_event.explain_customer, 'Weather delay for your upcoming service'),
    v_event.description,
    jsonb_build_object('weather_event_id', p_event_id, 'strategy', v_event.strategy)
  FROM jobs j
  WHERE j.zone_id = v_event.zone_id
    AND j.scheduled_date >= v_event.affected_date_start
    AND j.scheduled_date <= v_event.affected_date_end
    AND j.status IN ('scheduled', 'assigned');

  -- Notify affected providers
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT DISTINCT pm.user_id,
    'weather_event',
    COALESCE(v_event.explain_provider, 'Weather delay affecting scheduled jobs'),
    v_event.description,
    jsonb_build_object('weather_event_id', p_event_id, 'strategy', v_event.strategy)
  FROM jobs j
  JOIN provider_members pm ON pm.provider_org_id = j.provider_org_id AND pm.status = 'ACTIVE'
  WHERE j.zone_id = v_event.zone_id
    AND j.scheduled_date >= v_event.affected_date_start
    AND j.scheduled_date <= v_event.affected_date_end
    AND j.status IN ('scheduled', 'assigned');

  RETURN jsonb_build_object('status', 'approved', 'affected_jobs', v_affected_jobs);
END;
$$;

-- Admin: Resolve a weather event
CREATE OR REPLACE FUNCTION public.resolve_weather_event(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'admin_required');
  END IF;

  UPDATE weather_events
  SET status = 'resolved', resolved_at = now(), resolved_by_admin_user_id = v_admin_id, updated_at = now()
  WHERE id = p_event_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'event_not_active');
  END IF;

  RETURN jsonb_build_object('status', 'resolved');
END;
$$;

-- Check if a date is a holiday (used by job generation)
CREATE OR REPLACE FUNCTION public.is_holiday(p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM holiday_calendar
    WHERE holiday_date = p_date AND skip_jobs = true
  );
$$;

-- Check if a date is affected by weather in a zone
CREATE OR REPLACE FUNCTION public.is_weather_affected(p_zone_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM weather_events
    WHERE zone_id = p_zone_id
      AND status = 'active'
      AND p_date >= affected_date_start
      AND p_date <= affected_date_end
  );
$$;
