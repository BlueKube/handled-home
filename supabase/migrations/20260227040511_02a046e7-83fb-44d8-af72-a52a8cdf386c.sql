
INSERT INTO public.notification_templates (
  template_key, event_type, audience_type, title_template, body_template,
  channels, priority, digest_eligible, enabled
) VALUES (
  'customer_health_score_drop', 'health_score_drop', 'CUSTOMER',
  'Your Home Health Score dropped',
  'Your score went from {{previous_score}} to {{new_score}}. Adding services or resolving issues can help improve it.',
  ARRAY['in_app', 'push'], 'SERVICE', false, true
) ON CONFLICT DO NOTHING;
