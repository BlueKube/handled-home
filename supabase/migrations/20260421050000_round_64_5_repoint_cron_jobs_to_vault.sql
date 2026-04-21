-- Round 64.5 Phase C-6 — repoint pg_cron jobs to use Vault for service_role_key.
--
-- Background:
--   The previous project (Lovable-managed) had `app.settings.supabase_url` and
--   `app.settings.service_role_key` set on the database via `ALTER DATABASE ...`.
--   Supabase Cloud has since locked down the `postgres` role: even from the SQL
--   editor, `ALTER DATABASE postgres SET ...` returns `42501: permission denied`.
--   So we cannot reproduce the old wiring on the new project.
--
-- Solution:
--   1. Store the service_role_key in vault.secrets (done out-of-band before this
--      migration runs — Vault is writable via the Management API and avoids
--      committing the key to git).
--   2. Create a SECURITY DEFINER helper that reads the key from Vault and POSTs
--      to an Edge Function. The supabase URL is hardcoded (it's not a secret).
--   3. Reschedule all 7 cron jobs to call the helper instead of inlining the
--      old `current_setting('app.settings.*')` calls.
--
-- Idempotency:
--   `cron.unschedule(name)` raises if the job doesn't exist — wrapped in DO blocks
--   that swallow the missing-job exception so reruns are safe. `cron.schedule`
--   overwrites by name. Helper function uses `OR REPLACE`.

-- Helper schema — keep cron-internal helpers off of public so they don't show up
-- in PostgREST's exposed API surface.
CREATE SCHEMA IF NOT EXISTS cron_private;

-- The helper. SECURITY DEFINER so callers (including pg_cron's `postgres` role)
-- don't need direct read access on vault.decrypted_secrets — only the function
-- owner does. search_path is locked to '' to prevent search_path-shadowing
-- attacks; every reference is fully qualified.
CREATE OR REPLACE FUNCTION cron_private.invoke_edge_function(
  function_name text,
  body jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  service_key text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret
    INTO service_key
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF service_key IS NULL THEN
    RAISE EXCEPTION 'cron_private.invoke_edge_function: service_role_key missing from vault.secrets';
  END IF;

  SELECT net.http_post(
    url := 'https://gwbwnetatpgnqgarkvht.supabase.co/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := body
  ) INTO request_id;

  RETURN request_id;
END;
$$;

-- Lock the function down: only the owner (postgres / supabase_admin) can call it.
-- pg_cron's worker runs as the job's owner, which on Supabase is `postgres`.
REVOKE ALL ON FUNCTION cron_private.invoke_edge_function(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cron_private.invoke_edge_function(text, jsonb) TO postgres;

-- Reschedule each of the 7 cron jobs. Each block: best-effort unschedule old
-- entry, then schedule with the new command. Schedules and job names match the
-- existing entries so downstream observability (cron.job_run_details) is
-- continuous.

DO $$ BEGIN
  PERFORM cron.unschedule('run-billing-automation-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'run-billing-automation-daily', '0 7 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('run-billing-automation'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('run-dunning-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'run-dunning-daily', '0 6 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('run-dunning'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('assign-visits-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'assign-visits-daily', '0 5 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('assign-visits'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('check-no-shows-hourly');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'check-no-shows-hourly', '0 8-18 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('check-no-shows'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('evaluate-provider-sla-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'evaluate-provider-sla-daily', '0 4 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('evaluate-provider-sla'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('check-weather-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'check-weather-daily', '0 3 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('check-weather'); $cmd$
);

DO $$ BEGIN
  PERFORM cron.unschedule('weekly-payout-friday');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'weekly-payout-friday', '0 8 * * 5',
  $cmd$ SELECT cron_private.invoke_edge_function('process-payout', '{"batch": true}'::jsonb); $cmd$
);
