
-- Sprint D6: Contextual Add-ons

-- 1) Add is_addon flag and addon contextual triggers to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS is_addon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_triggers jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.service_skus.is_addon IS 'Whether this SKU is an add-on (contextually surfaced, not part of routine)';
COMMENT ON COLUMN public.service_skus.addon_triggers IS 'Array of trigger objects: [{type: "season", months: [3,4,5]}, {type: "weather", event: "heat_wave"}, {type: "days_since_last", threshold: 60}]';

-- 2) Add-on orders table for one-off purchases
CREATE TABLE IF NOT EXISTS public.addon_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),
  sku_id uuid NOT NULL REFERENCES public.service_skus(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  payment_method text NOT NULL CHECK (payment_method IN ('handles', 'cash')),
  handle_cost integer NOT NULL DEFAULT 0,
  price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'scheduled', 'completed', 'cancelled', 'refunded')),
  job_id uuid REFERENCES public.jobs(id),
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_orders ENABLE ROW LEVEL SECURITY;

-- Customer can read own orders
CREATE POLICY "Customers read own addon orders"
  ON public.addon_orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Admin can read all
CREATE POLICY "Admin read all addon orders"
  ON public.addon_orders FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Only system (RPCs) insert/update via SECURITY DEFINER

-- 3) purchase_addon RPC
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
AS $$
DECLARE
  v_sub record;
  v_sku record;
  v_customer_id uuid;
  v_order_id uuid;
  v_balance integer;
  v_completed_count integer;
BEGIN
  -- Verify caller owns subscription
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  v_customer_id := auth.uid();
  IF v_sub.customer_id != v_customer_id THEN
    RAISE EXCEPTION 'Not your subscription';
  END IF;
  
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Subscription not active';
  END IF;

  -- Gate: must have at least 1 completed visit
  SELECT count(*) INTO v_completed_count
  FROM public.jobs
  WHERE customer_id = v_customer_id
    AND status IN ('COMPLETED', 'PARTIAL_COMPLETE');
  
  IF v_completed_count < 1 THEN
    RAISE EXCEPTION 'Add-ons available after your first completed visit';
  END IF;

  -- Get SKU
  SELECT * INTO v_sku FROM public.service_skus WHERE id = p_sku_id AND is_addon = true AND status = 'active';
  IF v_sku IS NULL THEN
    RAISE EXCEPTION 'Add-on SKU not found or not active';
  END IF;

  IF p_payment_method = 'handles' THEN
    -- Check balance
    SELECT COALESCE(handles_balance, 0) INTO v_balance FROM public.subscriptions WHERE id = p_subscription_id;
    IF v_balance < v_sku.handle_cost THEN
      RAISE EXCEPTION 'Insufficient handles (need %, have %)', v_sku.handle_cost, v_balance;
    END IF;
    
    -- Spend handles
    PERFORM public.spend_handles(p_subscription_id, v_sku.handle_cost, 'addon', NULL);
  END IF;

  -- Create order
  INSERT INTO public.addon_orders (customer_id, subscription_id, sku_id, property_id, zone_id, payment_method, handle_cost, price_cents, status)
  VALUES (v_customer_id, p_subscription_id, p_sku_id, p_property_id, p_zone_id, p_payment_method,
    CASE WHEN p_payment_method = 'handles' THEN v_sku.handle_cost ELSE 0 END,
    CASE WHEN p_payment_method = 'cash' THEN v_sku.base_price_cents ELSE 0 END,
    'confirmed')
  RETURNING id INTO v_order_id;

  -- Emit notification
  PERFORM public.emit_notification(
    v_customer_id,
    'addon_purchased',
    'Add-on Confirmed',
    format('Your %s add-on has been confirmed and will be scheduled soon.', v_sku.name),
    jsonb_build_object('order_id', v_order_id, 'sku_name', v_sku.name, 'payment_method', p_payment_method)
  );

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'sku_name', v_sku.name);
END;
$$;

-- 4) refund_addon RPC (for system/provider cancellations)
CREATE OR REPLACE FUNCTION public.refund_addon(
  p_order_id uuid,
  p_reason text DEFAULT 'system_cancellation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT * INTO v_order FROM public.addon_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF v_order.status IN ('refunded', 'cancelled') THEN
    RAISE EXCEPTION 'Order already refunded/cancelled';
  END IF;

  -- Refund handles if paid with handles
  IF v_order.payment_method = 'handles' AND v_order.handle_cost > 0 THEN
    PERFORM public.refund_handles(v_order.subscription_id, v_order.handle_cost, 'addon_refund', v_order.id::text);
  END IF;

  UPDATE public.addon_orders
  SET status = 'refunded', refund_reason = p_reason, updated_at = now()
  WHERE id = p_order_id;

  -- Notify customer
  PERFORM public.emit_notification(
    v_order.customer_id,
    'addon_refunded',
    'Add-on Refunded',
    format('Your add-on has been refunded. Reason: %s', p_reason),
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'refunded_handles', v_order.handle_cost);
END;
$$;

-- 5) Index for customer lookups
CREATE INDEX IF NOT EXISTS idx_addon_orders_customer ON public.addon_orders (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_service_skus_addon ON public.service_skus (is_addon) WHERE is_addon = true;
