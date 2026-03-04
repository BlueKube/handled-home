
-- Sprint 8 Phase 3: Seed notification templates for reactive exceptions
INSERT INTO notification_templates (template_key, event_type, audience_type, title_template, body_template, channels, priority, version)
VALUES
  ('ADMIN_EXCEPTION_CREATED', 'ADMIN_EXCEPTION_CREATED', 'ADMIN', '{{exception_type}} reported', 'A {{exception_type}} exception was created for visit on {{scheduled_date}}.', ARRAY['PUSH','INBOX'], 'CRITICAL', 1),
  ('CUSTOMER_ACCESS_FAILURE_HOLD', 'CUSTOMER_ACCESS_FAILURE_HOLD', 'CUSTOMER', 'We reserved a new time for you', 'We couldn''t access your home today. We''ve reserved the next available time — confirm or choose another.', ARRAY['PUSH','INBOX'], 'CRITICAL', 1)
ON CONFLICT (template_key) DO NOTHING;
