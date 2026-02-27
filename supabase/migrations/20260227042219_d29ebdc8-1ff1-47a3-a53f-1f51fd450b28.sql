
-- D4: Plan Self-Service — RPC + pause columns + cancellation tracking

-- Add pause columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS resume_at timestamptz,
  ADD COLUMN IF NOT EXISTS pause_weeks int;

-- Add cancellation tracking columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancel_feedback text,
  ADD COLUMN IF NOT EXISTS retention_offer_accepted boolean DEFAULT false;

-- RPC: schedule_plan_change — validates and schedules a plan change for next billing cycle
CREATE OR REPLACE FUNCTION public.schedule_plan_change(
  p_subscription_id uuid,
  p_new_plan_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_new_plan record;
  v_current_plan record;
  v_direction text;
BEGIN
  -- Auth check: caller must own the subscription
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Validate subscription state
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Cannot change plan on a % subscription', v_sub.status;
  END IF;
  IF v_sub.cancel_at_period_end THEN
    RAISE EXCEPTION 'Cannot change plan on a subscription pending cancellation';
  END IF;
  IF v_sub.paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot change plan while subscription is paused';
  END IF;

  -- Validate new plan
  SELECT * INTO v_new_plan FROM public.plans WHERE id = p_new_plan_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Target plan not found or not active'; END IF;

  -- Get current plan
  SELECT * INTO v_current_plan FROM public.plans WHERE id = v_sub.plan_id;

  -- Same plan check
  IF v_sub.plan_id = p_new_plan_id THEN
    RAISE EXCEPTION 'Already on this plan';
  END IF;

  -- Determine direction based on recommended_rank (higher rank = higher tier)
  v_direction := CASE
    WHEN v_new_plan.recommended_rank > v_current_plan.recommended_rank THEN 'upgrade'
    WHEN v_new_plan.recommended_rank < v_current_plan.recommended_rank THEN 'downgrade'
    ELSE 'lateral'
  END;

  -- Schedule change for next billing cycle
  UPDATE public.subscriptions SET
    pending_plan_id = p_new_plan_id,
    pending_effective_at = billing_cycle_end_at,
    updated_at = now()
  WHERE id = p_subscription_id;

  -- Emit notification
  PERFORM public.emit_notification(
    v_sub.customer_id,
    'plan_change_scheduled',
    CASE v_direction
      WHEN 'upgrade' THEN 'Plan Upgrade Scheduled'
      WHEN 'downgrade' THEN 'Plan Downgrade Scheduled'
      ELSE 'Plan Change Scheduled'
    END,
    format('Your plan will change to %s on %s. Handles carry over.', v_new_plan.name, v_sub.billing_cycle_end_at::date),
    jsonb_build_object(
      'direction', v_direction,
      'current_plan_id', v_sub.plan_id,
      'new_plan_id', p_new_plan_id,
      'effective_at', v_sub.billing_cycle_end_at
    )
  );

  RETURN jsonb_build_object(
    'direction', v_direction,
    'effective_at', v_sub.billing_cycle_end_at,
    'new_plan_name', v_new_plan.name
  );
END;
$$;

-- RPC: cancel_subscription_with_reason — cancellation with reason survey + retention offer
CREATE OR REPLACE FUNCTION public.cancel_subscription_with_reason(
  p_subscription_id uuid,
  p_reason text,
  p_feedback text DEFAULT NULL,
  p_accept_retention_offer boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_bonus_handles int := 0;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_sub.status NOT IN ('active', 'trialing', 'past_due') THEN
    RAISE EXCEPTION 'Cannot cancel a % subscription', v_sub.status;
  END IF;

  -- Retention offer: give bonus handles if accepted
  IF p_accept_retention_offer THEN
    v_bonus_handles := 5; -- 5 bonus handles as retention offer
    UPDATE public.subscriptions SET
      cancel_reason = p_reason,
      cancel_feedback = p_feedback,
      retention_offer_accepted = true,
      handles_balance = GREATEST(0, handles_balance) + v_bonus_handles,
      updated_at = now()
    WHERE id = p_subscription_id;

    -- Log the bonus handles in ledger
    INSERT INTO public.handle_transactions (
      customer_id, subscription_id, txn_type, amount, balance_after, metadata
    ) VALUES (
      v_sub.customer_id, p_subscription_id, 'bonus',
      v_bonus_handles, v_sub.handles_balance + v_bonus_handles,
      jsonb_build_object('reason', 'retention_offer', 'cancel_reason', p_reason)
    );

    PERFORM public.emit_notification(
      v_sub.customer_id,
      'retention_offer_accepted',
      'Welcome Back!',
      format('We added %s bonus handles to your account. Thanks for staying!', v_bonus_handles),
      jsonb_build_object('bonus_handles', v_bonus_handles)
    );

    RETURN jsonb_build_object('status', 'retained', 'bonus_handles', v_bonus_handles);
  END IF;

  -- Proceed with cancellation
  UPDATE public.subscriptions SET
    cancel_at_period_end = true,
    status = 'canceling',
    cancel_reason = p_reason,
    cancel_feedback = p_feedback,
    retention_offer_accepted = false,
    updated_at = now()
  WHERE id = p_subscription_id;

  PERFORM public.emit_notification(
    v_sub.customer_id,
    'subscription_canceled',
    'Subscription Cancellation Confirmed',
    format('Your subscription will end on %s. You can resubscribe anytime.', v_sub.billing_cycle_end_at::date),
    jsonb_build_object('effective_at', v_sub.billing_cycle_end_at, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'status', 'canceling',
    'effective_at', v_sub.billing_cycle_end_at
  );
END;
$$;

-- RPC: pause_subscription — pause for 1-4 weeks
CREATE OR REPLACE FUNCTION public.pause_subscription(
  p_subscription_id uuid,
  p_weeks int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_resume_at timestamptz;
BEGIN
  IF p_weeks < 1 OR p_weeks > 4 THEN
    RAISE EXCEPTION 'Pause duration must be 1-4 weeks';
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Cannot pause a % subscription', v_sub.status;
  END IF;
  IF v_sub.paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'Subscription is already paused';
  END IF;

  v_resume_at := now() + (p_weeks || ' weeks')::interval;

  UPDATE public.subscriptions SET
    paused_at = now(),
    resume_at = v_resume_at,
    pause_weeks = p_weeks,
    status = 'paused',
    updated_at = now()
  WHERE id = p_subscription_id;

  PERFORM public.emit_notification(
    v_sub.customer_id,
    'subscription_paused',
    'Subscription Paused',
    format('Your subscription is paused for %s weeks. It will auto-resume on %s. Handles are frozen.', p_weeks, v_resume_at::date),
    jsonb_build_object('pause_weeks', p_weeks, 'resume_at', v_resume_at)
  );

  RETURN jsonb_build_object(
    'status', 'paused',
    'paused_at', now(),
    'resume_at', v_resume_at,
    'pause_weeks', p_weeks
  );
END;
$$;

-- RPC: resume_subscription — early resume from pause
CREATE OR REPLACE FUNCTION public.resume_subscription(
  p_subscription_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_sub.paused_at IS NULL THEN
    RAISE EXCEPTION 'Subscription is not paused';
  END IF;

  UPDATE public.subscriptions SET
    paused_at = NULL,
    resume_at = NULL,
    pause_weeks = NULL,
    status = 'active',
    updated_at = now()
  WHERE id = p_subscription_id;

  PERFORM public.emit_notification(
    v_sub.customer_id,
    'subscription_resumed',
    'Welcome Back!',
    'Your subscription is active again. Your handles balance is preserved.',
    jsonb_build_object('resumed_at', now())
  );

  RETURN jsonb_build_object('status', 'active', 'resumed_at', now());
END;
$$;

-- RPC: cancel_pending_plan_change — undo a scheduled plan change
CREATE OR REPLACE FUNCTION public.cancel_pending_plan_change(
  p_subscription_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_sub.pending_plan_id IS NULL THEN
    RAISE EXCEPTION 'No pending plan change to cancel';
  END IF;

  UPDATE public.subscriptions SET
    pending_plan_id = NULL,
    pending_effective_at = NULL,
    updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object('status', 'canceled', 'plan_id', v_sub.plan_id);
END;
$$;

-- Notification templates for D4
INSERT INTO public.notification_templates (template_key, event_type, audience_type, title_template, body_template, channels, priority, digest_eligible, enabled)
VALUES
  ('plan_change_scheduled', 'plan_change_scheduled', 'CUSTOMER', 'Plan Change Scheduled', 'Your plan will change to {{new_plan_name}} on {{effective_at}}.', ARRAY['in_app','push'], 'SERVICE', false, true),
  ('subscription_canceled', 'subscription_canceled', 'CUSTOMER', 'Subscription Cancellation', 'Your subscription will end on {{effective_at}}. Resubscribe anytime.', ARRAY['in_app','push'], 'SERVICE', false, true),
  ('retention_offer_accepted', 'retention_offer_accepted', 'CUSTOMER', 'Welcome Back!', 'We added {{bonus_handles}} bonus handles. Thanks for staying!', ARRAY['in_app'], 'SERVICE', false, true),
  ('subscription_paused', 'subscription_paused', 'CUSTOMER', 'Subscription Paused', 'Paused for {{pause_weeks}} weeks. Auto-resumes {{resume_at}}.', ARRAY['in_app','push'], 'SERVICE', false, true),
  ('subscription_resumed', 'subscription_resumed', 'CUSTOMER', 'Welcome Back!', 'Your subscription is active again.', ARRAY['in_app'], 'SERVICE', false, true)
ON CONFLICT DO NOTHING;
