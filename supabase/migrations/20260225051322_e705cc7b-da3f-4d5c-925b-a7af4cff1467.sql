
-- Sprint 3 Review Fixes

-- Finding 1 (HIGH): Add 'paused' to run_dunning_step status filter
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
BEGIN
  -- FIX: Include 'paused' so step 5 (cancel) can execute after step 4 pauses
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id AND status IN ('active', 'past_due', 'paused');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'subscription_not_eligible');
  END IF;

  v_step := COALESCE(v_sub.dunning_step, 0) + 1;

  -- Set dunning_started_at if first step
  IF v_sub.dunning_started_at IS NULL THEN
    UPDATE subscriptions SET dunning_started_at = now(), dunning_step = v_step, last_dunning_at = now() WHERE id = p_subscription_id;
  ELSE
    UPDATE subscriptions SET dunning_step = v_step, last_dunning_at = now() WHERE id = p_subscription_id;
  END IF;

  CASE v_step
    WHEN 1 THEN
      v_action := 'retry_payment';
      v_explain_customer := 'We noticed your payment didn''t go through. We''ll try again automatically.';
      v_explain_admin := 'Step 1: Auto-retry triggered for failed payment.';
    WHEN 2 THEN
      v_action := 'notify_fix_payment';
      v_explain_customer := 'Your payment still couldn''t be processed. Please update your payment method to avoid service interruption.';
      v_explain_admin := 'Step 2: Customer notified to fix payment method.';
    WHEN 3 THEN
      v_action := 'warn_pause';
      v_explain_customer := 'Your service will be paused in 3 days if payment isn''t resolved. Please update your payment method.';
      v_explain_admin := 'Step 3: Pause warning sent. Service pause in 3 days if unresolved.';
    WHEN 4 THEN
      v_action := 'pause_subscription';
      v_explain_customer := 'Your subscription has been paused due to unpaid balance. Update your payment method to resume service.';
      v_explain_admin := 'Step 4: Subscription paused due to continued payment failure.';
      UPDATE subscriptions SET status = 'paused' WHERE id = p_subscription_id;
      v_result := 'paused';
    WHEN 5 THEN
      v_action := 'cancel_subscription';
      v_explain_customer := 'Your subscription has been cancelled due to prolonged payment failure. You can resubscribe anytime.';
      v_explain_admin := 'Step 5: Subscription cancelled after 14-day dunning sequence.';
      UPDATE subscriptions SET status = 'cancelled', cancelled_at = now() WHERE id = p_subscription_id;
      v_result := 'cancelled';
    ELSE
      RETURN jsonb_build_object('status', 'skipped', 'reason', 'max_steps_reached');
  END CASE;

  -- Log dunning event
  INSERT INTO dunning_events (subscription_id, customer_id, step, action, result, explain_customer, explain_admin)
  VALUES (p_subscription_id, v_sub.customer_id, v_step, v_action, v_result, v_explain_customer, v_explain_admin);

  -- Emit notification to customer
  v_notify_user_id := v_sub.customer_id;
  IF v_notify_user_id IS NOT NULL THEN
    PERFORM emit_notification(
      v_notify_user_id,
      'dunning_' || v_action,
      'Payment Action Required',
      v_explain_customer,
      jsonb_build_object('subscription_id', p_subscription_id, 'step', v_step)
    );
  END IF;

  RETURN jsonb_build_object('status', v_result, 'step', v_step, 'action', v_action);
END;
$$;

-- Finding 3 (MEDIUM): Guard release_eligible_earning_holds against empty array
-- Finding 6 (MEDIUM): NULL guard on emit_notification
CREATE OR REPLACE FUNCTION public.release_eligible_earning_holds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released int := 0;
  v_earning record;
  v_notified_orgs uuid[] := '{}';
  v_notify_user_id uuid;
BEGIN
  FOR v_earning IN
    SELECT id, provider_org_id
    FROM provider_earnings
    WHERE status = 'EARNED'
      AND (hold_until IS NOT NULL AND hold_until <= now()
           OR hold_until IS NULL AND created_at + interval '24 hours' <= now())
  LOOP
    UPDATE provider_earnings SET status = 'ELIGIBLE', updated_at = now() WHERE id = v_earning.id;
    v_released := v_released + 1;

    IF NOT v_earning.provider_org_id = ANY(v_notified_orgs) THEN
      v_notified_orgs := array_append(v_notified_orgs, v_earning.provider_org_id);
    END IF;
  END LOOP;

  -- FIX: Guard against empty array (array_length returns NULL for empty)
  IF array_length(v_notified_orgs, 1) IS NOT NULL AND array_length(v_notified_orgs, 1) > 0 THEN
    FOR i IN 1..array_length(v_notified_orgs, 1) LOOP
      -- FIX: NULL guard on emit_notification
      SELECT pm.user_id INTO v_notify_user_id
      FROM provider_members pm
      WHERE pm.provider_org_id = v_notified_orgs[i] AND pm.status = 'ACTIVE'
      LIMIT 1;

      IF v_notify_user_id IS NOT NULL THEN
        PERFORM emit_notification(
          v_notify_user_id,
          'earnings_released',
          'Earnings Available',
          'Some of your earnings have been released and are now eligible for payout.',
          jsonb_build_object('provider_org_id', v_notified_orgs[i])
        );
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('released', v_released, 'orgs_notified', array_length(v_notified_orgs, 1));
END;
$$;

-- Finding 4 (MEDIUM): Referral reward partial application — create remainder credit
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

  v_remaining := v_invoice.total_cents - v_invoice.credits_applied_cents;
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
      -- Partial: create remainder credit
      INSERT INTO customer_credits (customer_id, amount_cents, status, reason)
      VALUES (v_invoice.customer_id, v_credit.amount_cents - v_apply_amount, 'AVAILABLE',
              'Remainder from credit partial application');
    END IF;

    UPDATE customer_credits SET status = 'APPLIED', applied_to_invoice_id = p_invoice_id,
      amount_cents = v_apply_amount, updated_at = now()
    WHERE id = v_credit.id;
  END LOOP;

  -- Apply referral_rewards (FIFO)
  FOR v_credit IN
    SELECT * FROM referral_rewards
    WHERE user_id = v_invoice.customer_id AND status = 'EARNED'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_apply_amount := LEAST(v_credit.amount_cents, v_remaining);
    v_remaining := v_remaining - v_apply_amount;
    v_total_applied := v_total_applied + v_apply_amount;

    -- FIX: Handle partial referral reward application — create remainder as customer credit
    IF v_apply_amount < v_credit.amount_cents THEN
      INSERT INTO customer_credits (customer_id, amount_cents, status, reason)
      VALUES (v_invoice.customer_id, v_credit.amount_cents - v_apply_amount, 'AVAILABLE',
              'Remainder from referral reward partial application');
    END IF;

    UPDATE referral_rewards SET status = 'applied' WHERE id = v_credit.id;
  END LOOP;

  -- Update invoice
  IF v_total_applied > 0 THEN
    UPDATE customer_invoices
    SET credits_applied_cents = credits_applied_cents + v_total_applied,
        total_cents = GREATEST(0, subtotal_cents - (credits_applied_cents + v_total_applied)),
        updated_at = now()
    WHERE id = p_invoice_id;
  END IF;

  RETURN jsonb_build_object('credits_applied_cents', v_total_applied, 'invoice_id', p_invoice_id);
END;
$$;
