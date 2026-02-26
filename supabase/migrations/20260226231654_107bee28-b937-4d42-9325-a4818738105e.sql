
-- C5a: Add digest_eligible to notification_templates
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS digest_eligible boolean NOT NULL DEFAULT false;

-- C5b: Create notification_digests table for daily digest tracking
CREATE TABLE IF NOT EXISTS public.notification_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  digest_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  event_ids uuid[] NOT NULL DEFAULT '{}',
  notification_id uuid REFERENCES notifications(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(user_id, digest_date)
);

ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own digests" ON notification_digests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Mark SERVICE-tier templates as digest eligible by default
UPDATE notification_templates
SET digest_eligible = true
WHERE priority = 'SERVICE';

-- C5c: Create view for admin notification health metrics
CREATE OR REPLACE VIEW public.notification_health_summary AS
SELECT
  -- Delivery stats (last 24h)
  (SELECT count(*) FROM notification_delivery WHERE attempted_at > now() - interval '24 hours' AND status = 'SENT') AS sent_24h,
  (SELECT count(*) FROM notification_delivery WHERE attempted_at > now() - interval '24 hours' AND status = 'FAILED') AS failed_24h,
  (SELECT count(*) FROM notification_delivery WHERE attempted_at > now() - interval '24 hours' AND status = 'SUPPRESSED') AS suppressed_24h,
  (SELECT count(*) FROM notification_delivery WHERE attempted_at > now() - interval '24 hours' AND status = 'QUEUED') AS queued_24h,
  -- Event processing stats
  (SELECT count(*) FROM notification_events WHERE status = 'DEADLETTER') AS deadletter_total,
  (SELECT count(*) FROM notification_events WHERE status = 'PENDING') AS pending_total,
  (SELECT count(*) FROM notification_events WHERE status = 'PROCESSING') AS processing_total,
  -- Processing latency (avg minutes for last 100 processed events)
  (SELECT COALESCE(
    EXTRACT(EPOCH FROM avg(processed_at - created_at)) / 60, 0
  ) FROM (
    SELECT processed_at, created_at FROM notification_events
    WHERE status = 'PROCESSED' AND processed_at IS NOT NULL
    ORDER BY processed_at DESC LIMIT 100
  ) sub) AS avg_latency_minutes,
  -- Last run info
  (SELECT started_at FROM cron_run_log WHERE function_name = 'process-notification-events' ORDER BY started_at DESC LIMIT 1) AS last_run_at,
  (SELECT status FROM cron_run_log WHERE function_name = 'process-notification-events' ORDER BY started_at DESC LIMIT 1) AS last_run_status;

-- Grant admin access to the view (RLS doesn't apply to views, but we gate in the app)
GRANT SELECT ON notification_health_summary TO authenticated;

-- Daily delivery breakdown for chart (last 7 days)
CREATE OR REPLACE VIEW public.notification_delivery_daily AS
SELECT
  date_trunc('day', attempted_at)::date AS delivery_date,
  channel,
  status,
  count(*) AS count
FROM notification_delivery
WHERE attempted_at > now() - interval '7 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;

GRANT SELECT ON notification_delivery_daily TO authenticated;

-- Deadletter detail view for admin investigation
CREATE OR REPLACE VIEW public.notification_deadletters AS
SELECT
  ne.id,
  ne.event_type,
  ne.audience_type,
  ne.audience_user_id,
  ne.audience_zone_id,
  ne.priority,
  ne.attempt_count,
  ne.last_error,
  ne.created_at,
  ne.payload
FROM notification_events ne
WHERE ne.status = 'DEADLETTER'
ORDER BY ne.created_at DESC;

GRANT SELECT ON notification_deadletters TO authenticated;
