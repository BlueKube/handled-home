
-- ============================================================
-- Sprint C0: Notification Event Bus — Schema Foundation
-- ============================================================

-- 1) notification_events (the event bus / queue)
CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idempotency_key text NOT NULL,
  event_type text NOT NULL,
  audience_type text NOT NULL DEFAULT 'CUSTOMER',
  audience_user_id uuid,
  audience_org_id uuid,
  audience_zone_id uuid,
  priority text NOT NULL DEFAULT 'SERVICE',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING',
  attempt_count int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT notification_events_idempotency_key_unique UNIQUE (idempotency_key),
  CONSTRAINT notification_events_status_check CHECK (status IN ('PENDING','PROCESSING','PROCESSED','FAILED','DEADLETTER')),
  CONSTRAINT notification_events_priority_check CHECK (priority IN ('CRITICAL','SERVICE','MARKETING')),
  CONSTRAINT notification_events_audience_type_check CHECK (audience_type IN ('CUSTOMER','PROVIDER','ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_notification_events_status_scheduled ON public.notification_events (status, scheduled_for) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_notification_events_event_type ON public.notification_events (event_type);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all notification events"
  ON public.notification_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notification events"
  ON public.notification_events FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 2) Enhance existing notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_route text,
  ADD COLUMN IF NOT EXISTS context_type text,
  ADD COLUMN IF NOT EXISTS context_id uuid,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_event_id uuid;

-- Add FK separately to handle IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_source_event_id_fkey'
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_source_event_id_fkey
      FOREIGN KEY (source_event_id) REFERENCES public.notification_events(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_source_event ON public.notifications (source_event_id) WHERE source_event_id IS NOT NULL;

-- Enable realtime for notifications (safe to re-run)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 3) notification_delivery (per-channel attempt tracking)
CREATE TABLE IF NOT EXISTS public.notification_delivery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES public.notifications(id),
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  provider_message_id text,
  error_code text,
  error_message text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_delivery_channel_check CHECK (channel IN ('PUSH','EMAIL','SMS')),
  CONSTRAINT notification_delivery_status_check CHECK (status IN ('QUEUED','SENT','FAILED','SUPPRESSED'))
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_notification ON public.notification_delivery (notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status ON public.notification_delivery (status) WHERE status = 'FAILED';

ALTER TABLE public.notification_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own delivery records"
  ON public.notification_delivery FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.notifications n WHERE n.id = notification_id AND n.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage delivery records"
  ON public.notification_delivery FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 4) user_notification_preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid NOT NULL PRIMARY KEY,
  critical_enabled boolean NOT NULL DEFAULT true,
  service_updates_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time NOT NULL DEFAULT '21:00',
  quiet_hours_end time NOT NULL DEFAULT '08:00',
  timezone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own preferences"
  ON public.user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences"
  ON public.user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all preferences"
  ON public.user_notification_preferences FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 5) user_device_tokens
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  push_provider text NOT NULL DEFAULT 'FCM',
  token text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_device_tokens_platform_check CHECK (platform IN ('IOS','ANDROID','WEB')),
  CONSTRAINT user_device_tokens_push_provider_check CHECK (push_provider IN ('FCM','APNS')),
  CONSTRAINT user_device_tokens_status_check CHECK (status IN ('ACTIVE','DISABLED')),
  CONSTRAINT user_device_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active ON public.user_device_tokens (user_id) WHERE status = 'ACTIVE';

ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens"
  ON public.user_device_tokens FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all device tokens"
  ON public.user_device_tokens FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 6) notification_rate_limits (admin config table)
CREATE TABLE IF NOT EXISTS public.notification_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  priority text NOT NULL,
  audience_type text NOT NULL DEFAULT 'CUSTOMER',
  max_per_day int NOT NULL DEFAULT 10,
  max_per_hour int NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_rate_limits_priority_check CHECK (priority IN ('CRITICAL','SERVICE','MARKETING')),
  CONSTRAINT notification_rate_limits_audience_type_check CHECK (audience_type IN ('CUSTOMER','PROVIDER','ADMIN')),
  CONSTRAINT notification_rate_limits_unique UNIQUE (priority, audience_type)
);

ALTER TABLE public.notification_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rate limits"
  ON public.notification_rate_limits FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users read rate limits"
  ON public.notification_rate_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 7) notification_templates (versioned templates, seeded in C3)
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  priority text NOT NULL DEFAULT 'SERVICE',
  audience_type text NOT NULL DEFAULT 'CUSTOMER',
  title_template text NOT NULL,
  body_template text NOT NULL,
  cta_label_template text,
  cta_route_template text,
  channels text[] NOT NULL DEFAULT '{PUSH}',
  enabled boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_priority_check CHECK (priority IN ('CRITICAL','SERVICE','MARKETING')),
  CONSTRAINT notification_templates_audience_type_check CHECK (audience_type IN ('CUSTOMER','PROVIDER','ADMIN'))
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates"
  ON public.notification_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users read templates"
  ON public.notification_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 8) emit_notification_event RPC — the standard emitter for the bus
CREATE OR REPLACE FUNCTION public.emit_notification_event(
  p_event_type text,
  p_idempotency_key text,
  p_audience_type text DEFAULT 'CUSTOMER',
  p_audience_user_id uuid DEFAULT NULL,
  p_audience_org_id uuid DEFAULT NULL,
  p_audience_zone_id uuid DEFAULT NULL,
  p_priority text DEFAULT 'SERVICE',
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_scheduled_for timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notification_events (
    event_type, idempotency_key, audience_type,
    audience_user_id, audience_org_id, audience_zone_id,
    priority, payload, scheduled_for
  ) VALUES (
    p_event_type, p_idempotency_key, p_audience_type,
    p_audience_user_id, p_audience_org_id, p_audience_zone_id,
    p_priority, p_payload, p_scheduled_for
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 9) Seed default rate limits
INSERT INTO public.notification_rate_limits (priority, audience_type, max_per_day, max_per_hour) VALUES
  ('CRITICAL', 'CUSTOMER', 100, 20),
  ('SERVICE', 'CUSTOMER', 10, 3),
  ('MARKETING', 'CUSTOMER', 1, 1),
  ('CRITICAL', 'PROVIDER', 100, 20),
  ('SERVICE', 'PROVIDER', 20, 10),
  ('MARKETING', 'PROVIDER', 2, 1),
  ('CRITICAL', 'ADMIN', 50, 20),
  ('SERVICE', 'ADMIN', 30, 10),
  ('MARKETING', 'ADMIN', 5, 2)
ON CONFLICT (priority, audience_type) DO NOTHING;

-- 10) Clean up duplicate INSERT policies on notifications
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
