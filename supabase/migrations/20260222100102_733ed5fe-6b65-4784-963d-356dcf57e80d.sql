
-- =============================================
-- Module 11: Billing & Payouts — RPC Functions
-- =============================================

-- 1. create_provider_earning: called after job completion
CREATE OR REPLACE FUNCTION public.create_provider_earning(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_org provider_orgs%ROWTYPE;
  v_base_cents int := 0;
  v_modifier_cents int := 0;
  v_hold_hours int := 24;
  v_hold_reason text;
  v_earning_id uuid;
  v_status text := 'EARNED';
  v_payout_account provider_payout_accounts%ROWTYPE;
  v_has_high_issue boolean := false;
BEGIN
  -- Get job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id AND status = 'COMPLETED';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not completed';
  END IF;

  -- Check caller is admin or provider org member
  IF NOT has_role(auth.uid(), 'admin') AND NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get provider org
  SELECT * INTO v_org FROM provider_orgs WHERE id = v_job.provider_org_id;

  -- Calculate base amount from job SKUs
  SELECT COALESCE(SUM(ss.base_price_cents), 0) INTO v_base_cents
  FROM job_skus js
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE js.job_id = p_job_id;

  -- If no SKUs found, use a default base
  IF v_base_cents = 0 THEN
    v_base_cents := 2500; -- $25 default
  END IF;

  -- Determine hold window based on policy
  IF v_org.status = 'PROBATION' THEN
    v_hold_hours := 72;
    v_hold_reason := 'probation_provider';
  END IF;

  -- Check for high severity issues on this job
  SELECT EXISTS (
    SELECT 1 FROM job_issues
    WHERE job_id = p_job_id AND severity = 'HIGH' AND status = 'OPEN'
  ) INTO v_has_high_issue;

  IF v_has_high_issue THEN
    v_status := 'HELD';
    v_hold_reason := 'high_severity_issue';
  END IF;

  -- Check payout account readiness
  SELECT * INTO v_payout_account FROM provider_payout_accounts
    WHERE provider_org_id = v_job.provider_org_id;
  IF NOT FOUND OR v_payout_account.status != 'READY' THEN
    IF v_status != 'HELD' THEN
      v_status := 'HELD_UNTIL_READY';
      v_hold_reason := COALESCE(v_hold_reason, 'payout_account_not_ready');
    END IF;
  END IF;

  -- Insert earning (idempotency via generated column)
  INSERT INTO provider_earnings (
    provider_org_id, job_id, base_amount_cents, modifier_cents, total_cents,
    hold_until, status, hold_reason
  ) VALUES (
    v_job.provider_org_id, p_job_id, v_base_cents, v_modifier_cents,
    v_base_cents + v_modifier_cents,
    CASE WHEN v_status = 'EARNED' THEN now() + (v_hold_hours || ' hours')::interval ELSE NULL END,
    v_status, v_hold_reason
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_earning_id;

  IF v_earning_id IS NULL THEN
    -- Already exists
    RETURN jsonb_build_object('status', 'already_exists', 'job_id', p_job_id);
  END IF;

  -- Create hold record if HELD
  IF v_status = 'HELD' AND v_has_high_issue THEN
    INSERT INTO provider_holds (provider_org_id, earning_id, hold_type, severity, reason_category, status)
    VALUES (v_job.provider_org_id, v_earning_id, 'AUTO', 'HIGH', v_hold_reason, 'ACTIVE');
  END IF;

  RETURN jsonb_build_object(
    'earning_id', v_earning_id,
    'status', v_status,
    'total_cents', v_base_cents + v_modifier_cents,
    'hold_reason', v_hold_reason
  );
END;
$$;

-- 2. transition_eligible_earnings: marks EARNED -> ELIGIBLE when hold window passed
CREATE OR REPLACE FUNCTION public.transition_eligible_earnings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE provider_earnings
  SET status = 'ELIGIBLE'
  WHERE status = 'EARNED'
    AND hold_until IS NOT NULL
    AND hold_until <= now()
    AND NOT EXISTS (
      SELECT 1 FROM provider_holds ph
      WHERE ph.earning_id = provider_earnings.id AND ph.status = 'ACTIVE'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('transitioned_count', v_count);
END;
$$;

-- 3. run_payout_batch: aggregates ELIGIBLE earnings per provider
CREATE OR REPLACE FUNCTION public.run_payout_batch(p_payout_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rec record;
  v_payout_id uuid;
  v_total_payouts int := 0;
  v_total_cents_all bigint := 0;
  v_threshold int := 5000; -- $50 minimum
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE payout_runs SET status = 'RUNNING', started_at = now() WHERE id = p_payout_run_id;

  FOR v_rec IN
    SELECT provider_org_id, SUM(total_cents) as agg_cents, array_agg(id) as earning_ids
    FROM provider_earnings
    WHERE status = 'ELIGIBLE'
    GROUP BY provider_org_id
    HAVING SUM(total_cents) >= v_threshold
  LOOP
    -- Check payout account is READY
    IF NOT EXISTS (
      SELECT 1 FROM provider_payout_accounts
      WHERE provider_org_id = v_rec.provider_org_id AND status = 'READY'
    ) THEN
      -- Mark as HELD_UNTIL_READY
      UPDATE provider_earnings SET status = 'HELD_UNTIL_READY', hold_reason = 'payout_account_not_ready'
      WHERE id = ANY(v_rec.earning_ids);
      CONTINUE;
    END IF;

    INSERT INTO provider_payouts (provider_org_id, payout_run_id, total_cents, status)
    VALUES (v_rec.provider_org_id, p_payout_run_id, v_rec.agg_cents, 'INITIATED')
    RETURNING id INTO v_payout_id;

    -- Create line items and mark earnings
    INSERT INTO provider_payout_line_items (payout_id, earning_id, amount_cents)
    SELECT v_payout_id, pe.id, pe.total_cents
    FROM provider_earnings pe
    WHERE pe.id = ANY(v_rec.earning_ids);

    UPDATE provider_earnings SET status = 'PAID', payout_id = v_payout_id
    WHERE id = ANY(v_rec.earning_ids);

    v_total_payouts := v_total_payouts + 1;
    v_total_cents_all := v_total_cents_all + v_rec.agg_cents;
  END LOOP;

  UPDATE payout_runs SET
    status = 'COMPLETED',
    completed_at = now(),
    earnings_count = v_total_payouts,
    total_cents = v_total_cents_all
  WHERE id = p_payout_run_id;

  RETURN jsonb_build_object('payouts_created', v_total_payouts, 'total_cents', v_total_cents_all);
END;
$$;

-- 4. admin_release_hold
CREATE OR REPLACE FUNCTION public.admin_release_hold(p_hold_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hold provider_holds%ROWTYPE;
  v_earning provider_earnings%ROWTYPE;
  v_new_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_hold FROM provider_holds WHERE id = p_hold_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hold not found or not active';
  END IF;

  UPDATE provider_holds SET status = 'RELEASED', released_by_admin_user_id = auth.uid(), released_at = now()
  WHERE id = p_hold_id;

  -- Re-evaluate earning status
  SELECT * INTO v_earning FROM provider_earnings WHERE id = v_hold.earning_id FOR UPDATE;

  -- Check if any other active holds remain
  IF NOT EXISTS (SELECT 1 FROM provider_holds WHERE earning_id = v_hold.earning_id AND status = 'ACTIVE' AND id != p_hold_id) THEN
    -- Check payout account
    IF EXISTS (SELECT 1 FROM provider_payout_accounts WHERE provider_org_id = v_earning.provider_org_id AND status = 'READY') THEN
      v_new_status := 'ELIGIBLE';
    ELSE
      v_new_status := 'HELD_UNTIL_READY';
    END IF;
    UPDATE provider_earnings SET status = v_new_status, hold_reason = NULL WHERE id = v_hold.earning_id;
  END IF;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, reason)
  VALUES (auth.uid(), 'provider_hold', p_hold_id, 'release_hold', p_reason);

  RETURN jsonb_build_object('status', 'released', 'hold_id', p_hold_id, 'earning_status', COALESCE(v_new_status, v_earning.status));
END;
$$;

-- 5. admin_apply_credit
CREATE OR REPLACE FUNCTION public.admin_apply_credit(p_customer_id uuid, p_amount_cents int, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credit_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO customer_credits (customer_id, amount_cents, reason, issued_by_admin_user_id, status)
  VALUES (p_customer_id, p_amount_cents, p_reason, auth.uid(), 'AVAILABLE')
  RETURNING id INTO v_credit_id;

  INSERT INTO customer_ledger_events (customer_id, event_type, amount_cents, balance_after_cents, metadata)
  VALUES (p_customer_id, 'CREDIT_ISSUED', p_amount_cents, 0,
    jsonb_build_object('credit_id', v_credit_id, 'reason', p_reason));

  INSERT INTO admin_adjustments (admin_user_id, entity_type, entity_id, adjustment_type, amount_cents, reason)
  VALUES (auth.uid(), 'customer', p_customer_id, 'CREDIT', p_amount_cents, p_reason);

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after, reason)
  VALUES (auth.uid(), 'customer_credit', v_credit_id, 'apply_credit',
    jsonb_build_object('amount_cents', p_amount_cents), p_reason);

  RETURN jsonb_build_object('credit_id', v_credit_id, 'amount_cents', p_amount_cents);
END;
$$;

-- 6. admin_issue_refund
CREATE OR REPLACE FUNCTION public.admin_issue_refund(p_invoice_id uuid, p_amount_cents int, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invoice customer_invoices%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_invoice FROM customer_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status != 'PAID' THEN
    RAISE EXCEPTION 'Can only refund paid invoices';
  END IF;

  INSERT INTO customer_ledger_events (customer_id, event_type, invoice_id, amount_cents, balance_after_cents, metadata)
  VALUES (v_invoice.customer_id, 'REFUND', p_invoice_id, -p_amount_cents, 0,
    jsonb_build_object('reason', p_reason));

  INSERT INTO admin_adjustments (admin_user_id, entity_type, entity_id, adjustment_type, amount_cents, reason)
  VALUES (auth.uid(), 'customer_invoice', p_invoice_id, 'REFUND', p_amount_cents, p_reason);

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after, reason)
  VALUES (auth.uid(), 'customer_invoice', p_invoice_id, 'issue_refund',
    jsonb_build_object('amount_cents', p_amount_cents), p_reason);

  RETURN jsonb_build_object('status', 'refunded', 'invoice_id', p_invoice_id, 'amount_cents', p_amount_cents);
END;
$$;

-- 7. admin_void_invoice
CREATE OR REPLACE FUNCTION public.admin_void_invoice(p_invoice_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invoice customer_invoices%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_invoice FROM customer_invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status NOT IN ('UPCOMING', 'DUE') THEN
    RAISE EXCEPTION 'Can only void UPCOMING or DUE invoices';
  END IF;

  UPDATE customer_invoices SET status = 'VOID' WHERE id = p_invoice_id;

  INSERT INTO customer_ledger_events (customer_id, event_type, invoice_id, amount_cents, balance_after_cents, metadata)
  VALUES (v_invoice.customer_id, 'INVOICE_VOIDED', p_invoice_id, 0, 0,
    jsonb_build_object('reason', p_reason));

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'customer_invoice', p_invoice_id, 'void_invoice',
    jsonb_build_object('status', v_invoice.status),
    jsonb_build_object('status', 'VOID'), p_reason);

  RETURN jsonb_build_object('status', 'VOID', 'invoice_id', p_invoice_id);
END;
$$;

-- 8. generate_subscription_invoice
CREATE OR REPLACE FUNCTION public.generate_subscription_invoice(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_plan plans%ROWTYPE;
  v_idem_key text;
  v_invoice_id uuid;
  v_total_cents int;
  v_credits_cents int := 0;
  v_credit record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active subscription not found';
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = v_sub.plan_id;

  -- Idempotency key
  v_idem_key := v_sub.customer_id || '_' || COALESCE(v_sub.billing_cycle_start_at::text, now()::text);

  -- Check if already generated
  IF EXISTS (SELECT 1 FROM customer_invoices WHERE idempotency_key = v_idem_key) THEN
    RETURN jsonb_build_object('status', 'already_exists', 'idempotency_key', v_idem_key);
  END IF;

  -- Parse price from display_price_text or default
  v_total_cents := 0; -- Will be set from Stripe price data if available

  -- Auto-apply available credits
  FOR v_credit IN
    SELECT * FROM customer_credits
    WHERE customer_id = v_sub.customer_id AND status = 'AVAILABLE'
    ORDER BY created_at ASC
  LOOP
    v_credits_cents := v_credits_cents + v_credit.amount_cents;
  END LOOP;

  INSERT INTO customer_invoices (
    customer_id, subscription_id, invoice_type, cycle_start_at, cycle_end_at,
    subtotal_cents, credits_applied_cents, total_cents, status, idempotency_key, due_at
  ) VALUES (
    v_sub.customer_id, p_subscription_id, 'SUBSCRIPTION',
    v_sub.billing_cycle_start_at, v_sub.billing_cycle_end_at,
    v_total_cents, LEAST(v_credits_cents, v_total_cents),
    GREATEST(v_total_cents - v_credits_cents, 0),
    'DUE', v_idem_key, COALESCE(v_sub.billing_cycle_end_at, now() + interval '7 days')
  )
  RETURNING id INTO v_invoice_id;

  -- Create plan line item
  INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
  VALUES (v_invoice_id, COALESCE(v_plan.name, 'Subscription'), 'PLAN', v_total_cents);

  -- Apply credits
  IF v_credits_cents > 0 THEN
    INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
    VALUES (v_invoice_id, 'Credits applied', 'CREDIT', -LEAST(v_credits_cents, v_total_cents));

    UPDATE customer_credits SET status = 'APPLIED', applied_to_invoice_id = v_invoice_id
    WHERE customer_id = v_sub.customer_id AND status = 'AVAILABLE';
  END IF;

  INSERT INTO customer_ledger_events (customer_id, event_type, invoice_id, amount_cents, balance_after_cents)
  VALUES (v_sub.customer_id, 'INVOICE_CREATED', v_invoice_id, GREATEST(v_total_cents - v_credits_cents, 0), 0);

  RETURN jsonb_build_object('invoice_id', v_invoice_id, 'total_cents', GREATEST(v_total_cents - v_credits_cents, 0));
END;
$$;
