
-- F3: Seed 18 MVP notification templates
-- F4: Add CUSTOMER_PROVIDER_REASSIGNED template
-- F6: Create claim_notification_events RPC with FOR UPDATE SKIP LOCKED

-- Seed templates (ON CONFLICT DO NOTHING for idempotency)
INSERT INTO public.notification_templates (template_key, event_type, audience_type, priority, title_template, body_template, cta_label_template, cta_route_template, channels, enabled, version)
VALUES
  -- Customer Critical
  ('customer_payment_failed', 'CUSTOMER_PAYMENT_FAILED', 'CUSTOMER', 'CRITICAL',
   'Action needed to keep your Service Day active',
   'We couldn''t process your payment. Update your card to keep everything running smoothly.',
   'Update payment', '/customer/billing', ARRAY['IN_APP','PUSH','EMAIL'], true, 1),

  ('customer_subscription_paused', 'CUSTOMER_SUBSCRIPTION_PAUSED', 'CUSTOMER', 'CRITICAL',
   'Your subscription has been paused',
   'We''ve paused your service due to a billing issue. Fix your payment to resume.',
   'Fix payment', '/customer/billing', ARRAY['IN_APP','PUSH','EMAIL'], true, 1),

  ('customer_schedule_changed_weather', 'CUSTOMER_SCHEDULE_CHANGED_WEATHER', 'CUSTOMER', 'CRITICAL',
   'Your service day has been rescheduled',
   'Due to weather conditions, your service on {{date}} has been rescheduled. We''ll keep you posted.',
   'View schedule', '/customer/service-day', ARRAY['IN_APP','PUSH'], true, 1),

  ('customer_provider_reassigned', 'CUSTOMER_PROVIDER_REASSIGNED', 'CUSTOMER', 'CRITICAL',
   'We''re sending a different pro',
   'Your original provider couldn''t make it. A new pro is on the way to keep your Service Day on track.',
   'View visit', '/customer/dashboard', ARRAY['IN_APP','PUSH'], true, 1),

  -- Customer Service
  ('customer_service_confirmed', 'CUSTOMER_SERVICE_CONFIRMED', 'CUSTOMER', 'SERVICE',
   'Your Service Day is confirmed',
   'You''re all set for {{day_of_week}}. We''ll remind you the day before.',
   'View plan', '/customer/service-day', ARRAY['IN_APP','PUSH'], true, 1),

  ('customer_reminder_24h', 'CUSTOMER_SERVICE_REMINDER_24H', 'CUSTOMER', 'SERVICE',
   'Tomorrow is your Service Day',
   'Your home gets handled tomorrow. Make sure gates are accessible and pets are secured.',
   'View details', '/customer/dashboard', ARRAY['IN_APP','PUSH'], true, 1),

  ('customer_provider_en_route', 'CUSTOMER_PROVIDER_EN_ROUTE', 'CUSTOMER', 'SERVICE',
   'Your pro is on the way',
   'Your service provider is heading to your property now.',
   'View visit', '/customer/dashboard', ARRAY['IN_APP','PUSH'], true, 1),

  ('customer_job_started', 'CUSTOMER_JOB_STARTED', 'CUSTOMER', 'SERVICE',
   'Service in progress',
   'Your pro has started working on your property.',
   'View visit', '/customer/dashboard', ARRAY['IN_APP'], true, 1),

  ('customer_receipt_ready', 'CUSTOMER_RECEIPT_READY', 'CUSTOMER', 'SERVICE',
   'Your home is handled',
   'Your visit is complete. Your receipt and photos are ready.',
   'View receipt', '/customer/history', ARRAY['IN_APP','PUSH','EMAIL'], true, 1),

  ('customer_issue_status_changed', 'CUSTOMER_ISSUE_STATUS_CHANGED', 'CUSTOMER', 'SERVICE',
   'Update on your reported issue',
   'Your issue has been updated to: {{new_status}}. We''re on it.',
   'View issue', '/customer/support/tickets/{{ticket_id}}', ARRAY['IN_APP','PUSH'], true, 1),

  -- Provider Critical
  ('provider_sla_level_changed', 'PROVIDER_SLA_LEVEL_CHANGED', 'PROVIDER', 'CRITICAL',
   'Performance alert: {{sla_level}}',
   'Your performance in {{zone_name}} ({{category}}) has changed. {{action_hint}}',
   'View performance', '/provider/performance', ARRAY['IN_APP','PUSH'], true, 1),

  -- Provider Service
  ('provider_jobs_assigned', 'PROVIDER_JOBS_ASSIGNED', 'PROVIDER', 'SERVICE',
   'New jobs added to your route',
   'You''ve got {{job_count}} new stops on {{date}}. We kept them near your existing route.',
   'View jobs', '/provider/jobs', ARRAY['IN_APP','PUSH'], true, 1),

  ('provider_no_show_ping', 'PROVIDER_NO_SHOW_PING', 'PROVIDER', 'SERVICE',
   'Missed start window',
   'A job on your route has passed its start window. This affects your reliability score.',
   'View details', '/provider/jobs', ARRAY['IN_APP','PUSH'], true, 1),

  ('provider_job_reassigned', 'PROVIDER_JOB_REASSIGNED', 'PROVIDER', 'SERVICE',
   'New job reassigned to you',
   'A job has been reassigned to your route. Check your updated schedule.',
   'View jobs', '/provider/jobs', ARRAY['IN_APP','PUSH'], true, 1),

  ('provider_payout_posted', 'PROVIDER_PAYOUT_POSTED', 'PROVIDER', 'SERVICE',
   'Payout on the way',
   'Your payout of ${{amount}} has been initiated. It should arrive in 1-2 business days.',
   'View earnings', '/provider/earnings', ARRAY['IN_APP','PUSH'], true, 1),

  -- Admin Critical
  ('admin_zone_alert_backlog', 'ADMIN_ZONE_ALERT_BACKLOG', 'ADMIN', 'CRITICAL',
   'Zone backlog alert',
   '{{unassigned_count}} unassigned jobs in {{zone_name}}. Immediate attention required.',
   'Open scheduling', '/admin/scheduling', ARRAY['IN_APP'], true, 1),

  -- Admin Service
  ('admin_weather_pending', 'ADMIN_WEATHER_PENDING', 'ADMIN', 'SERVICE',
   'Weather event needs review',
   'A weather event has been detected in {{zone_name}}. Review and approve reschedules.',
   'Review weather', '/admin/scheduling', ARRAY['IN_APP'], true, 1),

  ('admin_dunning_spike', 'ADMIN_DUNNING_SPIKE', 'ADMIN', 'SERVICE',
   'Payment failure spike detected',
   '{{failure_count}} payment failures today. This may indicate a processor issue.',
   'Open billing', '/admin/billing', ARRAY['IN_APP'], true, 1)

ON CONFLICT (template_key) DO NOTHING;

-- F6: Create claim_notification_events RPC with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_notification_events(batch_limit integer DEFAULT 50)
RETURNS SETOF public.notification_events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT ne.id
    FROM public.notification_events ne
    WHERE ne.status = 'PENDING'
      AND ne.scheduled_for <= now()
      AND ne.attempt_count < 3
    ORDER BY
      CASE ne.priority
        WHEN 'CRITICAL' THEN 0
        WHEN 'SERVICE' THEN 1
        WHEN 'MARKETING' THEN 2
        ELSE 3
      END,
      ne.created_at ASC
    LIMIT batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_events
  SET status = 'PROCESSING'
  FROM claimed
  WHERE public.notification_events.id = claimed.id
  RETURNING public.notification_events.*;
END;
$$;
