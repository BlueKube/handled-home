-- F15: Fix template placeholder mismatches (durable migration)
UPDATE notification_templates
SET body_template = '{{count}} payment failures today. This may indicate a processor issue or a card-expiry wave.'
WHERE template_key = 'admin_dunning_spike';

UPDATE notification_templates
SET body_template = 'You''ve got {{count}} new stops on {{date}}. We kept them near your existing route.'
WHERE template_key = 'provider_jobs_assigned';

UPDATE notification_templates
SET body_template = 'Due to weather conditions in {{zone_name}}, your upcoming service has been rescheduled. We''ll keep you posted on your new time.'
WHERE template_key = 'customer_schedule_changed_weather';