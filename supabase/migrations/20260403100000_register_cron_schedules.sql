-- Register all automation engine functions in pg_cron
-- These were deployed as edge functions but never scheduled.
-- Uses pg_net to call edge functions via HTTP POST.

-- Daily: run-billing-automation (07:00 UTC)
SELECT cron.schedule(
  'run-billing-automation-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/run-billing-automation',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Daily: run-dunning (06:00 UTC)
SELECT cron.schedule(
  'run-dunning-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/run-dunning',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Daily: assign-visits (05:00 UTC — before billing and dunning)
SELECT cron.schedule(
  'assign-visits-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/assign-visits',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Hourly: check-no-shows (every hour from 8am-6pm UTC)
SELECT cron.schedule(
  'check-no-shows-hourly',
  '0 8-18 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-no-shows',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Daily: evaluate-provider-sla (04:00 UTC — before assignment)
SELECT cron.schedule(
  'evaluate-provider-sla-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/evaluate-provider-sla',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Daily: check-weather (03:00 UTC — earliest, before SLA evaluation)
SELECT cron.schedule(
  'check-weather-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-weather',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Weekly: payout run (Friday 08:00 UTC)
SELECT cron.schedule(
  'weekly-payout-friday',
  '0 8 * * 5',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-payout',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"batch": true}'
  );
  $$
);
