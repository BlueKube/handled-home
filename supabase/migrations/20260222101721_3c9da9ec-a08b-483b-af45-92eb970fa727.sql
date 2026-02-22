
-- D1: Create provider_ledger_events table
CREATE TABLE public.provider_ledger_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  event_type TEXT NOT NULL,
  earning_id UUID REFERENCES public.provider_earnings(id),
  payout_id UUID REFERENCES public.provider_payouts(id),
  amount_cents INT NOT NULL DEFAULT 0,
  balance_after_cents INT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_ledger_events_org ON public.provider_ledger_events(provider_org_id);

ALTER TABLE public.provider_ledger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own ledger events"
  ON public.provider_ledger_events FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));

CREATE POLICY "Admins full access to provider ledger events"
  ON public.provider_ledger_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- D4: Add UNIQUE constraint on customer_payment_methods
ALTER TABLE public.customer_payment_methods
  ADD CONSTRAINT customer_payment_methods_customer_processor_unique
  UNIQUE (customer_id, processor_ref);

-- S1: Replace run_payout_batch to use IN_PAYOUT instead of PAID
CREATE OR REPLACE FUNCTION public.run_payout_batch(p_payout_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
  v_payout_id uuid;
  v_total_payouts int := 0;
  v_total_cents_all bigint := 0;
  v_threshold int := 5000;
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
    IF NOT EXISTS (
      SELECT 1 FROM provider_payout_accounts
      WHERE provider_org_id = v_rec.provider_org_id AND status = 'READY'
    ) THEN
      UPDATE provider_earnings SET status = 'HELD_UNTIL_READY', hold_reason = 'payout_account_not_ready'
      WHERE id = ANY(v_rec.earning_ids);
      CONTINUE;
    END IF;

    INSERT INTO provider_payouts (provider_org_id, payout_run_id, total_cents, status)
    VALUES (v_rec.provider_org_id, p_payout_run_id, v_rec.agg_cents, 'INITIATED')
    RETURNING id INTO v_payout_id;

    INSERT INTO provider_payout_line_items (payout_id, earning_id, amount_cents)
    SELECT v_payout_id, pe.id, pe.total_cents
    FROM provider_earnings pe
    WHERE pe.id = ANY(v_rec.earning_ids);

    -- S1 FIX: Use IN_PAYOUT instead of PAID
    UPDATE provider_earnings SET status = 'IN_PAYOUT', payout_id = v_payout_id
    WHERE id = ANY(v_rec.earning_ids);

    -- Write provider ledger events
    INSERT INTO provider_ledger_events (provider_org_id, event_type, payout_id, amount_cents, balance_after_cents, metadata)
    VALUES (v_rec.provider_org_id, 'PAYOUT_INITIATED', v_payout_id, v_rec.agg_cents, 0,
      jsonb_build_object('earning_count', array_length(v_rec.earning_ids, 1)));

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
$function$;

-- S2+S4: Replace generate_subscription_invoice with price parsing and credit capping
CREATE OR REPLACE FUNCTION public.generate_subscription_invoice(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub record;
  v_plan record;
  v_invoice_id uuid;
  v_total_cents int := 0;
  v_credits_cents int := 0;
  v_credit record;
  v_idemp_key text;
  v_price_match text[];
  v_applied_credit_ids uuid[] := '{}';
  v_remaining_to_cover int;
  v_credit_to_apply int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id AND status IN ('active', 'trialing');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found or not active';
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = v_sub.plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- Parse price from display_price_text (e.g. "$49/mo", "$129", "$49.99/mo")
  IF v_plan.display_price_text IS NOT NULL THEN
    v_price_match := regexp_match(v_plan.display_price_text, '(\d+\.?\d*)');
    IF v_price_match IS NOT NULL AND v_price_match[1] IS NOT NULL THEN
      v_total_cents := ROUND(v_price_match[1]::numeric * 100)::int;
    END IF;
  END IF;

  IF v_total_cents = 0 THEN
    RETURN jsonb_build_object('status', 'warning', 'message', 'Could not determine price from plan. Invoice created with $0.');
  END IF;

  v_idemp_key := 'sub_' || p_subscription_id || '_' || COALESCE(v_sub.billing_cycle_start_at::text, now()::text);

  -- S4 FIX: Accumulate credits only up to invoice total
  v_remaining_to_cover := v_total_cents;
  FOR v_credit IN
    SELECT * FROM customer_credits
    WHERE customer_id = v_sub.customer_id AND status = 'AVAILABLE'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining_to_cover <= 0;
    v_credit_to_apply := LEAST(v_credit.amount_cents, v_remaining_to_cover);
    v_credits_cents := v_credits_cents + v_credit_to_apply;
    v_remaining_to_cover := v_remaining_to_cover - v_credit_to_apply;
    v_applied_credit_ids := v_applied_credit_ids || v_credit.id;
  END LOOP;

  INSERT INTO customer_invoices (
    customer_id, subscription_id, invoice_type, subtotal_cents, credits_applied_cents, total_cents,
    status, idempotency_key, cycle_start_at, cycle_end_at, due_at
  ) VALUES (
    v_sub.customer_id, p_subscription_id, 'SUBSCRIPTION', v_total_cents, v_credits_cents,
    v_total_cents - v_credits_cents, 'DUE', v_idemp_key,
    v_sub.billing_cycle_start_at, v_sub.billing_cycle_end_at,
    COALESCE(v_sub.billing_cycle_end_at, now() + interval '7 days')
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_invoice_id;

  IF v_invoice_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_exists', 'subscription_id', p_subscription_id);
  END IF;

  INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
  VALUES (v_invoice_id, v_plan.name || ' Plan', 'PLAN', v_total_cents);

  IF v_credits_cents > 0 THEN
    INSERT INTO customer_invoice_line_items (invoice_id, label, type, amount_cents)
    VALUES (v_invoice_id, 'Credits Applied', 'CREDIT', -v_credits_cents);

    UPDATE customer_credits SET status = 'APPLIED', applied_to_invoice_id = v_invoice_id
    WHERE id = ANY(v_applied_credit_ids);
  END IF;

  INSERT INTO customer_ledger_events (customer_id, event_type, invoice_id, amount_cents, balance_after_cents)
  VALUES (v_sub.customer_id, 'INVOICE_CREATED', v_invoice_id, v_total_cents - v_credits_cents, 0);

  RETURN jsonb_build_object('status', 'created', 'invoice_id', v_invoice_id, 'total_cents', v_total_cents - v_credits_cents);
END;
$function$;

-- A1+S3: Add create_provider_earning call to complete_job and admin_override_complete_job
CREATE OR REPLACE FUNCTION public.complete_job(p_job_id uuid, p_provider_summary text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing_checklist int;
  v_missing_photos int;
  v_open_issues int;
  v_missing_details jsonb := '[]'::jsonb;
  v_earning_result jsonb;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not a member of the assigned provider org';
  END IF;

  IF v_job.status NOT IN ('IN_PROGRESS', 'ISSUE_REPORTED', 'PARTIAL_COMPLETE') THEN
    RAISE EXCEPTION 'Job cannot be completed from status %', v_job.status;
  END IF;

  SELECT count(*) INTO v_missing_checklist
    FROM job_checklist_items WHERE job_id = p_job_id AND is_required = true AND status = 'PENDING';
  SELECT count(*) INTO v_missing_photos
    FROM job_photos WHERE job_id = p_job_id AND slot_key IS NOT NULL AND upload_status != 'UPLOADED';
  SELECT count(*) INTO v_open_issues
    FROM job_issues WHERE job_id = p_job_id AND status = 'OPEN';

  IF v_missing_checklist > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'checklist', 'count', v_missing_checklist);
  END IF;
  IF v_missing_photos > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'photos', 'count', v_missing_photos);
  END IF;

  IF v_missing_checklist > 0 OR v_missing_photos > 0 THEN
    RETURN jsonb_build_object('status', 'INCOMPLETE', 'job_id', p_job_id, 'missing', v_missing_details);
  END IF;

  IF v_open_issues > 0 THEN
    UPDATE jobs SET status = 'PARTIAL_COMPLETE', provider_summary = p_provider_summary WHERE id = p_job_id;
    INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
      VALUES (p_job_id, auth.uid(), 'provider', 'JOB_PARTIAL_COMPLETE',
        jsonb_build_object('open_issues', v_open_issues, 'provider_summary', p_provider_summary));
    RETURN jsonb_build_object('status', 'PARTIAL_COMPLETE', 'job_id', p_job_id, 'open_issues', v_open_issues);
  END IF;

  UPDATE jobs SET status = 'COMPLETED', completed_at = now(), provider_summary = p_provider_summary WHERE id = p_job_id;
  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'provider', 'JOB_COMPLETED',
      jsonb_build_object('completed_at', now(), 'provider_summary', p_provider_summary));

  -- A1 FIX: Automatically create provider earning on job completion
  BEGIN
    SELECT create_provider_earning(p_job_id) INTO v_earning_result;
  EXCEPTION WHEN OTHERS THEN
    -- Don't block job completion if earning creation fails
    RAISE WARNING 'Failed to create earning for job %: %', p_job_id, SQLERRM;
  END;

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'completed_at', now(), 'earning', v_earning_result);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_override_complete_job(p_job_id uuid, p_reason text, p_note text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing_checklist int;
  v_missing_photos int;
  v_open_issues int;
  v_earning_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Job is already completed';
  END IF;

  SELECT count(*) INTO v_missing_checklist
    FROM job_checklist_items WHERE job_id = p_job_id AND is_required = true AND status = 'PENDING';
  SELECT count(*) INTO v_missing_photos
    FROM job_photos WHERE job_id = p_job_id AND slot_key IS NOT NULL AND upload_status != 'UPLOADED';
  SELECT count(*) INTO v_open_issues
    FROM job_issues WHERE job_id = p_job_id AND status = 'OPEN';

  UPDATE jobs SET status = 'COMPLETED', completed_at = now() WHERE id = p_job_id;

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'admin', 'ADMIN_OVERRIDE_COMPLETION',
      jsonb_build_object('reason', p_reason, 'note', p_note,
        'missing_checklist_count', v_missing_checklist, 'missing_photo_count', v_missing_photos, 'open_issue_count', v_open_issues));

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after, reason)
    VALUES (auth.uid(), 'job', p_job_id, 'override_complete',
      jsonb_build_object('status', 'COMPLETED', 'missing_checklist', v_missing_checklist, 'missing_photos', v_missing_photos), p_reason);

  -- A1 FIX: Automatically create provider earning on admin override completion
  BEGIN
    SELECT create_provider_earning(p_job_id) INTO v_earning_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create earning for job %: %', p_job_id, SQLERRM;
  END;

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'override', true, 'earning', v_earning_result);
END;
$function$;

-- Update admin_release_hold to write provider ledger events
CREATE OR REPLACE FUNCTION public.admin_release_hold(p_hold_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hold provider_holds%ROWTYPE;
  v_earning provider_earnings%ROWTYPE;
  v_remaining_holds int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_hold FROM provider_holds WHERE id = p_hold_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hold not found or not active';
  END IF;

  UPDATE provider_holds SET status = 'RELEASED', released_at = now(), released_by_admin_user_id = auth.uid() WHERE id = p_hold_id;

  SELECT * INTO v_earning FROM provider_earnings WHERE id = v_hold.earning_id FOR UPDATE;

  SELECT count(*) INTO v_remaining_holds FROM provider_holds WHERE earning_id = v_hold.earning_id AND status = 'ACTIVE';

  IF v_remaining_holds = 0 AND v_earning.status = 'HELD' THEN
    UPDATE provider_earnings SET status = 'ELIGIBLE', hold_reason = NULL WHERE id = v_hold.earning_id;

    INSERT INTO provider_ledger_events (provider_org_id, event_type, earning_id, amount_cents, balance_after_cents, metadata)
    VALUES (v_earning.provider_org_id, 'HOLD_RELEASED', v_earning.id, v_earning.total_cents, 0,
      jsonb_build_object('hold_id', p_hold_id, 'reason', p_reason));
  END IF;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, reason)
    VALUES (auth.uid(), 'provider_hold', p_hold_id, 'release_hold', p_reason);

  RETURN jsonb_build_object('status', 'released', 'hold_id', p_hold_id, 'earning_status',
    CASE WHEN v_remaining_holds = 0 THEN 'ELIGIBLE' ELSE 'HELD' END);
END;
$function$;
