-- ============================================================
-- Round 64 · Batch 3.3 — grant_topup_credits RPC
-- ============================================================
-- Adds a SECURITY DEFINER RPC that grants top-up credits purchased via
-- `purchase-credit-pack` edge function. Mirrors the structural shape of
-- grant_cycle_handles (handle_transactions insert + subscriptions.handles_balance
-- update) but:
--   * no rollover cap check — top-up credits are additive and don't displace
--     existing balance
--   * no expires_at — top-up credits persist while the subscription is active,
--     per the customer-facing explainer ("Top-up credits don't count against
--     your rollover cap")
--   * idempotent on p_idempotency_key (Stripe webhook event.id) via a
--     jsonb containment check, matching grant_cycle_handles's pattern.
--
-- Only the service role executes this — the edge-function webhook is the
-- only caller. RLS on handle_transactions stays intact.
-- ============================================================

CREATE OR REPLACE FUNCTION public.grant_topup_credits(
  p_subscription_id uuid,
  p_customer_id uuid,
  p_credits integer,
  p_pack_id text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  IF p_credits IS NULL OR p_credits <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_credits');
  END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_idempotency_key');
  END IF;

  -- Idempotency: if a transaction with this key already exists for the sub,
  -- return a no-op success so Stripe webhook retries stay safe.
  IF EXISTS (
    SELECT 1 FROM handle_transactions
    WHERE subscription_id = p_subscription_id
      AND metadata->>'idempotency_key' = p_idempotency_key
  ) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'idempotent_duplicate');
  END IF;

  -- Lock the subscription row to serialize against spend/grant/refund paths.
  SELECT handles_balance INTO v_current_balance
  FROM subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;

  v_new_balance := v_current_balance + p_credits;

  INSERT INTO handle_transactions (
    subscription_id,
    customer_id,
    txn_type,
    amount,
    balance_after,
    reference_type,
    expires_at,
    metadata
  ) VALUES (
    p_subscription_id,
    p_customer_id,
    'grant',
    p_credits,
    v_new_balance,
    'topup',
    NULL,
    jsonb_build_object(
      'origin', 'topup',
      'pack_id', p_pack_id,
      'idempotency_key', p_idempotency_key
    )
  );

  UPDATE subscriptions
  SET handles_balance = v_new_balance, updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'granted', p_credits,
    'balance_after', v_new_balance,
    'pack_id', p_pack_id
  );
END;
$$;

COMMENT ON FUNCTION public.grant_topup_credits(uuid, uuid, integer, text, text) IS
  'Grants top-up credits from a completed purchase-credit-pack checkout. Idempotent on the Stripe event id.';

REVOKE ALL ON FUNCTION public.grant_topup_credits(uuid, uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_topup_credits(uuid, uuid, integer, text, text) TO service_role;
