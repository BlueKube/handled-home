
-- Sprint 3: Billing Automation (2B-08, 2B-09, 2B-10)

-- ============================================================
-- 2B-08: Dunning Events Table + RPC
-- ============================================================

CREATE TABLE public.dunning_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),
  customer_id uuid NOT NULL,
  step int NOT NULL,
  action text NOT NULL,
  result text NOT NULL DEFAULT 'pending',
  explain_customer text,
  explain_admin text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dunning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dunning events"
  ON public.dunning_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Customers can view own dunning events"
  ON public.dunning_events FOR SELECT
  USING (customer_id = auth.uid());

CREATE INDEX idx_dunning_events_sub ON public.dunning_events(subscription_id, step);

-- ============================================================
-- 2B-08: run_dunning_step RPC — 5-step ladder
-- ============================================================

CREATE OR REPLACE FUNCTION public.run_dunning_step(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_current_step int;
  v_action text;
  v_explain_customer text;
  v_explain_admin text;
  v_result text := 'executed';
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id AND status IN ('active', 'past_due');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'subscription_not_eligible');
  END IF;

  v_current_step := COALESCE(v_sub.dunning_step, 0) + 1;

  CASE v_current_step
    WHEN 1 THEN
      -- Day 1: Retry payment + notify
      v_action := 'retry_notify';
      v_explain_customer := 'We couldn''t process your payment. We''ll retry automatically — no action needed yet.';
      v_explain_admin := format('Dunning step 1: first retry for subscription %s', p_subscription_id);

    WHEN 2 THEN
      -- Day 3: Retry + "Fix payment" CTA
      v_action := 'retry_fix_cta';
      v_explain_customer := 'Payment still unsuccessful. Please update your payment method to avoid service interruption.';
      v_explain_admin := format('Dunning step 2: retry + fix CTA for subscription %s', p_subscription_id);

    WHEN 3 THEN
      -- Day 7: Retry + service pause warning
      v_action := 'retry_pause_warning';
      v_explain_customer := 'Your payment is still pending. Service will be paused in 3 days if not resolved. Update your payment method now.';
      v_explain_admin := format('Dunning step 3: pause warning for subscription %s', p_subscription_id);

      -- Mark subscription as past_due
      UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE id = p_subscription_id AND status = 'active';

    WHEN 4 THEN
      -- Day 10: Pause subscription
      v_action := 'pause_service';
      v_explain_customer := 'Your service has been paused due to unpaid balance. Update your payment method to resume.';
      v_explain_admin := format('Dunning step 4: service paused for subscription %s', p_subscription_id);

      UPDATE subscriptions SET status = 'paused', updated_at = now() WHERE id = p_subscription_id;

    WHEN 5 THEN
      -- Day 14: Cancel subscription
      v_action := 'cancel';
      v_explain_customer := 'Your subscription has been canceled due to extended non-payment. You can resubscribe anytime.';
      v_explain_admin := format('Dunning step 5: subscription canceled for %s', p_subscription_id);

      UPDATE subscriptions SET status = 'canceled', updated_at = now() WHERE id = p_subscription_id;

    ELSE
      RETURN jsonb_build_object('status', 'skipped', 'reason', 'max_steps_reached');
  END CASE;

  -- Update subscription dunning state
  UPDATE subscriptions
  SET dunning_step = v_current_step,
      last_dunning_at = now(),
      dunning_started_at = CASE WHEN v_current_step = 1 THEN now() ELSE dunning_started_at END,
      updated_at = now()
  WHERE id = p_subscription_id;

  -- Log the dunning event
  INSERT INTO dunning_events (subscription_id, customer_id, step, action, result, explain_customer, explain_admin)
  VALUES (p_subscription_id, v_sub.customer_id, v_current_step, v_action, v_result, v_explain_customer, v_explain_admin);

  -- Notify customer
  PERFORM emit_notification(
    v_sub.customer_id,
    'dunning_' || v_current_step,
    CASE v_current_step
      WHEN 1 THEN 'Payment Retry'
      WHEN 2 THEN 'Payment Action Needed'
      WHEN 3 THEN 'Service Pause Warning'
      WHEN 4 THEN 'Service Paused'
      WHEN 5 THEN 'Subscription Canceled'
    END,
    v_explain_customer,
    jsonb_build_object('subscription_id', p_subscription_id, 'step', v_current_step, 'deep_link', '/customer/billing')
  );

  RETURN jsonb_build_object('status', 'executed', 'step', v_current_step, 'action', v_action);
END;
$$;

-- ============================================================
-- 2B-09: Auto-apply referral credits to invoice
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_referral_credits_to_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice record;
  v_credit record;
  v_remaining_cents int;
  v_applied_total int := 0;
BEGIN
  SELECT * INTO v_invoice FROM customer_invoices WHERE id = p_invoice_id AND status = 'PENDING';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'invoice_not_pending');
  END IF;

  v_remaining_cents := v_invoice.total_cents - COALESCE(v_invoice.credits_applied_cents, 0);
  IF v_remaining_cents <= 0 THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'nothing_owed');
  END IF;

  -- Find available credits (AVAILABLE status, not yet applied)
  FOR v_credit IN
    SELECT * FROM customer_credits
    WHERE customer_id = v_invoice.customer_id
      AND status = 'AVAILABLE'
      AND amount_cents > 0
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining_cents <= 0;

    DECLARE
      v_apply_amount int;
    BEGIN
      v_apply_amount := LEAST(v_credit.amount_cents, v_remaining_cents);

      -- Mark credit as applied
      UPDATE customer_credits
      SET status = 'APPLIED',
          applied_to_invoice_id = p_invoice_id,
          updated_at = now()
      WHERE id = v_credit.id;

      -- If partial application, create a remainder credit
      IF v_apply_amount < v_credit.amount_cents THEN
        INSERT INTO customer_credits (customer_id, amount_cents, status, reason, issued_by_admin_user_id)
        VALUES (v_invoice.customer_id, v_credit.amount_cents - v_apply_amount, 'AVAILABLE',
                'Remainder from partial credit application', v_credit.issued_by_admin_user_id);

        -- Update the applied credit to reflect actual amount
        UPDATE customer_credits SET amount_cents = v_apply_amount WHERE id = v_credit.id;
      END IF;

      v_applied_total := v_applied_total + v_apply_amount;
      v_remaining_cents := v_remaining_cents - v_apply_amount;

      -- Add credit line item to invoice
      INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
      VALUES (p_invoice_id, 'Credit applied', 'credit', -v_apply_amount);
    END;
  END LOOP;

  -- Also apply earned referral rewards as credits
  FOR v_credit IN
    SELECT rr.* FROM referral_rewards rr
    WHERE rr.recipient_user_id = v_invoice.customer_id
      AND rr.status = 'earned'
      AND rr.reward_type = 'credit'
      AND rr.applied_at IS NULL
    ORDER BY rr.created_at ASC
  LOOP
    EXIT WHEN v_remaining_cents <= 0;

    DECLARE
      v_apply_amount int;
    BEGIN
      v_apply_amount := LEAST(v_credit.amount_cents, v_remaining_cents);

      -- Mark referral reward as applied
      UPDATE referral_rewards
      SET status = 'applied', applied_at = now(), updated_at = now()
      WHERE id = v_credit.id;

      v_applied_total := v_applied_total + v_apply_amount;
      v_remaining_cents := v_remaining_cents - v_apply_amount;

      -- Add referral credit line item
      INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
      VALUES (p_invoice_id, 'Referral reward credit', 'referral_credit', -v_apply_amount);
    END;
  END LOOP;

  -- Update invoice totals
  IF v_applied_total > 0 THEN
    UPDATE customer_invoices
    SET credits_applied_cents = COALESCE(credits_applied_cents, 0) + v_applied_total,
        total_cents = GREATEST(0, total_cents - v_applied_total),
        updated_at = now()
    WHERE id = p_invoice_id;

    -- Notify customer
    PERFORM emit_notification(
      v_invoice.customer_id,
      'credits_applied',
      'Credits Applied',
      format('$%s in credits applied to your upcoming bill.', round(v_applied_total / 100.0, 2)),
      jsonb_build_object('invoice_id', p_invoice_id, 'amount_cents', v_applied_total, 'deep_link', '/customer/billing')
    );
  END IF;

  RETURN jsonb_build_object('status', 'applied', 'credits_applied_cents', v_applied_total, 'remaining_cents', v_remaining_cents);
END;
$$;

-- ============================================================
-- 2B-10: Auto-release earning holds RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.release_eligible_earning_holds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released int := 0;
  v_notified_orgs uuid[] := '{}';
  v_earning record;
BEGIN
  -- Release EARNED earnings whose hold_until has passed
  FOR v_earning IN
    SELECT id, provider_org_id, total_cents
    FROM provider_earnings
    WHERE status = 'EARNED'
      AND hold_until IS NOT NULL
      AND hold_until <= now()
  LOOP
    UPDATE provider_earnings
    SET status = 'ELIGIBLE', hold_reason = NULL, updated_at = now()
    WHERE id = v_earning.id;

    v_released := v_released + 1;

    -- Track orgs to notify (deduplicate)
    IF NOT (v_earning.provider_org_id = ANY(v_notified_orgs)) THEN
      v_notified_orgs := array_append(v_notified_orgs, v_earning.provider_org_id);
    END IF;
  END LOOP;

  -- Also release earnings with NULL hold_until that are EARNED for 24+ hours (default hold)
  FOR v_earning IN
    SELECT id, provider_org_id, total_cents
    FROM provider_earnings
    WHERE status = 'EARNED'
      AND hold_until IS NULL
      AND created_at <= now() - interval '24 hours'
  LOOP
    UPDATE provider_earnings
    SET status = 'ELIGIBLE', updated_at = now()
    WHERE id = v_earning.id;

    v_released := v_released + 1;

    IF NOT (v_earning.provider_org_id = ANY(v_notified_orgs)) THEN
      v_notified_orgs := array_append(v_notified_orgs, v_earning.provider_org_id);
    END IF;
  END LOOP;

  -- Notify each affected provider org
  FOR i IN 1..array_length(v_notified_orgs, 1) LOOP
    PERFORM emit_notification(
      (SELECT pm.user_id FROM provider_members pm WHERE pm.provider_org_id = v_notified_orgs[i] AND pm.status = 'ACTIVE' LIMIT 1),
      'earnings_released',
      'Earnings Now Available',
      'Some of your held earnings are now eligible for payout.',
      jsonb_build_object('deep_link', '/provider/earnings')
    );
  END LOOP;

  RETURN jsonb_build_object('released', v_released, 'orgs_notified', array_length(v_notified_orgs, 1));
END;
$$;
