-- Fix 1: apply_referral_credits_to_invoice should accept DUE invoices (not just PENDING)
-- The generate_subscription_invoice RPC creates invoices with status 'DUE',
-- but apply_referral_credits_to_invoice only processes 'PENDING'. This means
-- credits are never auto-applied at invoice generation time.

CREATE OR REPLACE FUNCTION apply_referral_credits_to_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice record;
  v_total_applied_cents int := 0;
  v_credit record;
  v_remaining int;
  v_apply int;
BEGIN
  -- Accept DUE or PENDING invoices (was: only PENDING)
  SELECT * INTO v_invoice FROM customer_invoices WHERE id = p_invoice_id AND status IN ('DUE', 'PENDING');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'invoice_not_due_or_pending');
  END IF;

  -- Apply customer_credits (FIFO by created_at)
  FOR v_credit IN
    SELECT * FROM customer_credits
    WHERE customer_id = v_invoice.customer_id AND status = 'AVAILABLE'
    ORDER BY created_at ASC
  LOOP
    v_remaining := v_credit.amount_cents - COALESCE(v_credit.applied_cents, 0);
    IF v_remaining <= 0 THEN CONTINUE; END IF;

    v_apply := LEAST(v_remaining, v_invoice.total_cents - v_total_applied_cents);
    IF v_apply <= 0 THEN EXIT; END IF;

    UPDATE customer_credits
    SET applied_cents = COALESCE(applied_cents, 0) + v_apply,
        status = CASE WHEN COALESCE(applied_cents, 0) + v_apply >= amount_cents THEN 'APPLIED' ELSE 'AVAILABLE' END,
        updated_at = now()
    WHERE id = v_credit.id;

    v_total_applied_cents := v_total_applied_cents + v_apply;
    IF v_total_applied_cents >= v_invoice.total_cents THEN EXIT; END IF;
  END LOOP;

  -- Apply referral_rewards (FIFO by created_at)
  FOR v_credit IN
    SELECT * FROM referral_rewards
    WHERE user_id = v_invoice.customer_id AND status = 'earned' AND reward_type = 'customer_credit'
    ORDER BY created_at ASC
  LOOP
    v_remaining := v_credit.amount_cents - COALESCE(v_credit.applied_cents, 0);
    IF v_remaining <= 0 THEN CONTINUE; END IF;

    v_apply := LEAST(v_remaining, v_invoice.total_cents - v_total_applied_cents);
    IF v_apply <= 0 THEN EXIT; END IF;

    UPDATE referral_rewards
    SET applied_cents = COALESCE(applied_cents, 0) + v_apply,
        status = CASE WHEN COALESCE(applied_cents, 0) + v_apply >= amount_cents THEN 'applied' ELSE 'earned' END,
        updated_at = now()
    WHERE id = v_credit.id;

    v_total_applied_cents := v_total_applied_cents + v_apply;
    IF v_total_applied_cents >= v_invoice.total_cents THEN EXIT; END IF;
  END LOOP;

  -- Update invoice with credit deductions
  IF v_total_applied_cents > 0 THEN
    UPDATE customer_invoices
    SET credits_applied_cents = COALESCE(credits_applied_cents, 0) + v_total_applied_cents,
        total_cents = GREATEST(0, total_cents - v_total_applied_cents),
        updated_at = now()
    WHERE id = p_invoice_id;

    INSERT INTO customer_ledger_events (customer_id, event_type, amount_cents, metadata)
    VALUES (
      v_invoice.customer_id,
      'credit_applied',
      v_total_applied_cents,
      jsonb_build_object('invoice_id', p_invoice_id, 'credits_applied_cents', v_total_applied_cents)
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'applied',
    'credits_applied_cents', v_total_applied_cents,
    'invoice_id', p_invoice_id
  );
END;
$$;

-- Fix 2: Add advance_billing_cycle function
-- After a successful invoice generation, the billing cycle dates need to roll forward
-- so the next daily run picks up the next cycle, not the same one forever.

CREATE OR REPLACE FUNCTION advance_billing_cycle(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_new_start timestamptz;
  v_new_end timestamptz;
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'subscription_not_found');
  END IF;

  v_new_start := v_sub.billing_cycle_end_at;
  v_new_end := v_sub.billing_cycle_end_at + (COALESCE(v_sub.billing_cycle_length_days, 28) * interval '1 day');

  UPDATE subscriptions
  SET billing_cycle_start_at = v_new_start,
      billing_cycle_end_at = v_new_end,
      updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'status', 'advanced',
    'new_start', v_new_start,
    'new_end', v_new_end
  );
END;
$$;
