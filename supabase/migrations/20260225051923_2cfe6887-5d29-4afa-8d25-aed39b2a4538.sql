
-- Sprint 3 Review Fixes (Round 2)
-- Findings 10-13 from fix verification

-- Finding 10 (MEDIUM): Fix column name + status casing in apply_referral_credits_to_invoice
-- Finding 11 (MEDIUM): Use safer arithmetic for total_cents
-- Finding 12 (LOW): Step-specific notification titles
-- Finding 13 (LOW): Add updated_at = now() on status changes

CREATE OR REPLACE FUNCTION public.run_dunning_step(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_step int;
  v_action text;
  v_result text := 'ok';
  v_explain_customer text;
  v_explain_admin text;
  v_notify_user_id uuid;
  v_notify_title text;
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id AND status IN ('active', 'past_due', 'paused');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'subscription_not_eligible');
  END IF;

  v_step := COALESCE(v_sub.dunning_step, 0) + 1;

  IF v_sub.dunning_started_at IS NULL THEN
    UPDATE subscriptions SET dunning_started_at = now(), dunning_step = v_step, last_dunning_at = now(), updated_at = now() WHERE id = p_subscription_id;
  ELSE
    UPDATE subscriptions SET dunning_step = v_step, last_dunning_at = now(), updated_at = now() WHERE id = p_subscription_id;
  END IF;

  CASE v_step
    WHEN 1 THEN
      v_action := 'retry_payment';
      v_notify_title := 'Payment Retry';
      v_explain_customer := 'We noticed your payment didn''t go through. We''ll try again automatically.';
      v_explain_admin := 'Step 1: Auto-retry triggered for failed payment.';
    WHEN 2 THEN
      v_action := 'notify_fix_payment';
      v_notify_title := 'Payment Action Needed';
      v_explain_customer := 'Your payment still couldn''t be processed. Please update your payment method to avoid service interruption.';
      v_explain_admin := 'Step 2: Customer notified to fix payment method.';
    WHEN 3 THEN
      v_action := 'warn_pause';
      v_notify_title := 'Service Pause Warning';
      v_explain_customer := 'Your service will be paused in 3 days if payment isn''t resolved. Please update your payment method.';
      v_explain_admin := 'Step 3: Pause warning sent. Service pause in 3 days if unresolved.';
    WHEN 4 THEN
      v_action := 'pause_subscription';
      v_notify_title := 'Service Paused';
      v_explain_customer := 'Your subscription has been paused due to unpaid balance. Update your payment method to resume service.';
      v_explain_admin := 'Step 4: Subscription paused due to continued payment failure.';
      -- FIX Finding 13: include updated_at
      UPDATE subscriptions SET status = 'paused', updated_at = now() WHERE id = p_subscription_id;
      v_result := 'paused';
    WHEN 5 THEN
      v_action := 'cancel_subscription';
      v_notify_title := 'Subscription Cancelled';
      v_explain_customer := 'Your subscription has been cancelled due to prolonged payment failure. You can resubscribe anytime.';
      v_explain_admin := 'Step 5: Subscription cancelled after 14-day dunning sequence.';
      -- FIX Finding 13: include updated_at
      UPDATE subscriptions SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = p_subscription_id;
      v_result := 'cancelled';
    ELSE
      RETURN jsonb_build_object('status', 'skipped', 'reason', 'max_steps_reached');
  END CASE;

  INSERT INTO dunning_events (subscription_id, customer_id, step, action, result, explain_customer, explain_admin)
  VALUES (p_subscription_id, v_sub.customer_id, v_step, v_action, v_result, v_explain_customer, v_explain_admin);

  v_notify_user_id := v_sub.customer_id;
  IF v_notify_user_id IS NOT NULL THEN
    -- FIX Finding 12: step-specific notification titles
    PERFORM emit_notification(
      v_notify_user_id,
      'dunning_' || v_action,
      v_notify_title,
      v_explain_customer,
      jsonb_build_object('subscription_id', p_subscription_id, 'step', v_step)
    );
  END IF;

  RETURN jsonb_build_object('status', v_result, 'step', v_step, 'action', v_action);
END;
$$;

-- FIX Finding 10 + 11: Correct column name, status casing, and arithmetic
CREATE OR REPLACE FUNCTION public.apply_referral_credits_to_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice record;
  v_remaining int;
  v_credit record;
  v_apply_amount int;
  v_total_applied int := 0;
BEGIN
  SELECT * INTO v_invoice FROM customer_invoices WHERE id = p_invoice_id AND status = 'PENDING';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'invoice_not_pending');
  END IF;

  v_remaining := v_invoice.total_cents - COALESCE(v_invoice.credits_applied_cents, 0);
  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'already_covered');
  END IF;

  -- Apply customer_credits first (FIFO)
  FOR v_credit IN
    SELECT * FROM customer_credits
    WHERE customer_id = v_invoice.customer_id AND status = 'AVAILABLE'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_apply_amount := LEAST(v_credit.amount_cents, v_remaining);
    v_remaining := v_remaining - v_apply_amount;
    v_total_applied := v_total_applied + v_apply_amount;

    IF v_apply_amount < v_credit.amount_cents THEN
      INSERT INTO customer_credits (customer_id, amount_cents, status, reason)
      VALUES (v_invoice.customer_id, v_credit.amount_cents - v_apply_amount, 'AVAILABLE',
              'Remainder from credit partial application');
    END IF;

    UPDATE customer_credits SET status = 'APPLIED', applied_to_invoice_id = p_invoice_id,
      amount_cents = v_apply_amount, updated_at = now()
    WHERE id = v_credit.id;
  END LOOP;

  -- Apply referral_rewards (FIFO)
  -- FIX Finding 10: use recipient_user_id (not user_id) and lowercase 'earned' status
  FOR v_credit IN
    SELECT * FROM referral_rewards
    WHERE recipient_user_id = v_invoice.customer_id AND status = 'earned'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_apply_amount := LEAST(v_credit.amount_cents, v_remaining);
    v_remaining := v_remaining - v_apply_amount;
    v_total_applied := v_total_applied + v_apply_amount;

    IF v_apply_amount < v_credit.amount_cents THEN
      INSERT INTO customer_credits (customer_id, amount_cents, status, reason)
      VALUES (v_invoice.customer_id, v_credit.amount_cents - v_apply_amount, 'AVAILABLE',
              'Remainder from referral reward partial application');
    END IF;

    UPDATE referral_rewards SET status = 'applied', applied_at = now(), updated_at = now() WHERE id = v_credit.id;
  END LOOP;

  -- FIX Finding 11: Use simpler, safer arithmetic — subtract only new credits from current total
  IF v_total_applied > 0 THEN
    UPDATE customer_invoices
    SET credits_applied_cents = COALESCE(credits_applied_cents, 0) + v_total_applied,
        total_cents = GREATEST(0, COALESCE(total_cents, 0) - v_total_applied),
        updated_at = now()
    WHERE id = p_invoice_id;
  END IF;

  RETURN jsonb_build_object('credits_applied_cents', v_total_applied, 'invoice_id', p_invoice_id);
END;
$$;
