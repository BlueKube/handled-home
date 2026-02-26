
-- C4-F1: Add missing PROVIDER_ROUTE_UPDATED template
INSERT INTO notification_templates (template_key, event_type, audience_type, priority, title_template, body_template, cta_label_template, cta_route_template, channels, enabled, version)
VALUES ('provider_route_updated', 'PROVIDER_ROUTE_UPDATED', 'PROVIDER', 'SERVICE',
  'Your route has been optimized',
  'Your route for {{date}} has been updated with {{job_count}} stops.',
  'View route', '/provider/jobs',
  ARRAY['IN_APP','PUSH'], true, 1)
ON CONFLICT (template_key) DO NOTHING;

-- C4-F3: Fix issue CTA route template — ticket_id → issue_id
UPDATE notification_templates
SET cta_route_template = '/customer/support/tickets/{{issue_id}}'
WHERE template_key = 'customer_issue_status_changed';

-- C4-F7: Optimize en_route trigger with WHEN clause
DROP TRIGGER IF EXISTS trg_notify_en_route ON jobs;
CREATE TRIGGER trg_notify_en_route
  AFTER UPDATE OF arrived_at ON jobs
  FOR EACH ROW
  WHEN (OLD.arrived_at IS NULL AND NEW.arrived_at IS NOT NULL)
  EXECUTE FUNCTION notify_customer_provider_en_route();
