-- D4-F1: Fix retention offer txn_type from 'bonus' to 'grant'
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
  v_balance int;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF v_sub.customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Subscription is not active';
  END IF;

  IF p_accept_retention_offer THEN
    v_bonus_handles := 5;
    v_balance := GREATEST(0, COALESCE(v_sub.handles_balance, 0)) + v_bonus_handles;

    INSERT INTO public.handle_transactions (customer_id, subscription_id, txn_type, amount, balance_after, metadata)
    VALUES (v_sub.customer_id, p_subscription_id, 'grant', v_bonus_handles, v_balance,
      jsonb_build_object('source', 'retention_offer', 'reason', p_reason));

    UPDATE public.subscriptions
    SET handles_balance = v_balance,
        retention_offer_accepted = true,
        cancel_reason = p_reason,
        cancel_feedback = p_feedback,
        updated_at = now()
    WHERE id = p_subscription_id;

    PERFORM public.emit_notification(
      v_sub.customer_id, 'retention_offer_accepted',
      'Retention offer accepted', format('You received %s bonus handles!', v_bonus_handles),
      jsonb_build_object('bonus_handles', v_bonus_handles)
    );

    RETURN jsonb_build_object('status', 'retained', 'bonus_handles', v_bonus_handles);
  END IF;

  UPDATE public.subscriptions
  SET cancel_at_period_end = true,
      status = 'canceling',
      cancel_reason = p_reason,
      cancel_feedback = p_feedback,
      updated_at = now()
  WHERE id = p_subscription_id;

  PERFORM public.emit_notification(
    v_sub.customer_id, 'subscription_canceled',
    'Subscription canceling', 'Your subscription will end at the current billing period.',
    jsonb_build_object('reason', p_reason, 'effective_at', v_sub.billing_cycle_end_at)
  );

  RETURN jsonb_build_object('status', 'canceling', 'effective_at', v_sub.billing_cycle_end_at);
END;
$$;