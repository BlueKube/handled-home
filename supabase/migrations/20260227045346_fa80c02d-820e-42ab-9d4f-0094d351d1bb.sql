
-- D6-F1/F2/F3: Fix purchase_addon and refund_addon RPCs

-- Fix purchase_addon: correct spend_handles call signature + correct refund_addon auth gate
CREATE OR REPLACE FUNCTION public.purchase_addon(
  p_subscription_id uuid,
  p_sku_id uuid,
  p_property_id uuid,
  p_zone_id uuid,
  p_payment_method text DEFAULT 'handles'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_sku record;
  v_customer_id uuid;
  v_order_id uuid;
  v_balance integer;
  v_completed_count integer;
BEGIN
  v_customer_id := auth.uid();

  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id FOR UPDATE;
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  IF v_sub.customer_id != v_customer_id THEN
    RAISE EXCEPTION 'Not your subscription';
  END IF;
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Subscription not active';
  END IF;

  -- Gate: at least 1 completed visit
  SELECT count(*) INTO v_completed_count
  FROM jobs
  WHERE customer_id = v_customer_id
    AND status IN ('COMPLETED', 'PARTIAL_COMPLETE');
  IF v_completed_count < 1 THEN
    RAISE EXCEPTION 'Add-ons available after your first completed visit';
  END IF;

  SELECT * INTO v_sku FROM service_skus WHERE id = p_sku_id AND is_addon = true AND status = 'active';
  IF v_sku IS NULL THEN
    RAISE EXCEPTION 'Add-on SKU not found or not active';
  END IF;

  -- Create order first to get the ID for reference
  INSERT INTO addon_orders (customer_id, subscription_id, sku_id, property_id, zone_id, payment_method, handle_cost, price_cents, status)
  VALUES (v_customer_id, p_subscription_id, p_sku_id, p_property_id, p_zone_id, p_payment_method,
    CASE WHEN p_payment_method = 'handles' THEN v_sku.handle_cost ELSE 0 END,
    CASE WHEN p_payment_method = 'cash' THEN v_sku.base_price_cents ELSE 0 END,
    'confirmed')
  RETURNING id INTO v_order_id;

  IF p_payment_method = 'handles' THEN
    SELECT COALESCE(handles_balance, 0) INTO v_balance FROM subscriptions WHERE id = p_subscription_id;
    IF v_balance < v_sku.handle_cost THEN
      RAISE EXCEPTION 'Insufficient handles (need %, have %)', v_sku.handle_cost, v_balance;
    END IF;

    -- D6-F1 FIX: correct signature (subscription_id, customer_id, amount, reference_id)
    PERFORM spend_handles(p_subscription_id, v_customer_id, v_sku.handle_cost, v_order_id);
  END IF;

  PERFORM emit_notification(
    v_customer_id,
    'addon_purchased',
    'Add-on Confirmed',
    format('Your %s add-on has been confirmed and will be scheduled soon.', v_sku.name),
    jsonb_build_object('order_id', v_order_id, 'sku_name', v_sku.name, 'payment_method', p_payment_method)
  );

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'sku_name', v_sku.name);
END;
$$;

-- D6-F2 + D6-F3: Fix refund_addon signature + add admin-only gate
CREATE OR REPLACE FUNCTION public.refund_addon(
  p_order_id uuid,
  p_reason text DEFAULT 'system_cancellation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
BEGIN
  -- D6-F3 FIX: admin-only gate
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_order FROM addon_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.status IN ('refunded', 'cancelled') THEN
    RAISE EXCEPTION 'Order already refunded/cancelled';
  END IF;

  -- D6-F2 FIX: correct signature (subscription_id, customer_id, amount, reference_id, original_expires_at)
  IF v_order.payment_method = 'handles' AND v_order.handle_cost > 0 THEN
    PERFORM refund_handles(v_order.subscription_id, v_order.customer_id, v_order.handle_cost, v_order.id, NULL);
  END IF;

  UPDATE addon_orders
  SET status = 'refunded', refund_reason = p_reason, updated_at = now()
  WHERE id = p_order_id;

  PERFORM emit_notification(
    v_order.customer_id,
    'addon_refunded',
    'Add-on Refunded',
    format('Your add-on has been refunded. Reason: %s', p_reason),
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'refunded_handles', v_order.handle_cost);
END;
$$;
