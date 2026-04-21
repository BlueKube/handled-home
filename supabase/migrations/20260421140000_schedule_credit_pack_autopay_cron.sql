-- ============================================================
-- Round 64 · Batch 3.4 — Schedule process-credit-pack-autopay daily cron
-- ============================================================
-- Registers a 07:00 UTC cron that invokes the process-credit-pack-autopay
-- edge function via the Vault-backed cron_private.invoke_edge_function
-- helper introduced in 20260421050000.
--
-- The edge function itself validates CRON_SECRET (or service role key)
-- and scans subscriptions with autopay enabled + balance below threshold.
-- Safe to run daily — idempotent per Stripe PaymentIntent id.
-- ============================================================

DO $$
BEGIN
  PERFORM cron.unschedule('process-credit-pack-autopay');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'process-credit-pack-autopay',
  '0 7 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('process-credit-pack-autopay'); $cmd$
);
