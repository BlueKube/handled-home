
-- Sprint D7: Home Assistant schema columns + booking windows + RPC

-- 1) Add provider_category and customer_prep to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS provider_category text NOT NULL DEFAULT 'outdoor',
  ADD COLUMN IF NOT EXISTS customer_prep text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proof_rules jsonb NOT NULL DEFAULT '{"photo_required": true, "privacy_safe": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS members_only boolean NOT NULL DEFAULT false;

-- 2) Home Assistant booking windows table
CREATE TABLE IF NOT EXISTS public.home_assistant_windows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  window_date date NOT NULL,
  window_slot text NOT NULL CHECK (window_slot IN ('morning', 'afternoon')),
  capacity integer NOT NULL DEFAULT 2,
  booked integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_assistant_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read windows"
  ON public.home_assistant_windows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin manage windows"
  ON public.home_assistant_windows FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ha_windows_unique
  ON public.home_assistant_windows (zone_id, window_date, window_slot);

-- 3) book_home_assistant RPC
CREATE OR REPLACE FUNCTION public.book_home_assistant(
  p_subscription_id uuid,
  p_sku_id uuid,
  p_property_id uuid,
  p_zone_id uuid,
  p_window_id uuid,
  p_payment_method text DEFAULT 'handles'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_sub record;
  v_sku record;
  v_window record;
  v_order_id uuid;
BEGIN
  v_customer_id := auth.uid();

  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
  IF v_sub IS NULL OR v_sub.customer_id != v_customer_id THEN
    RAISE EXCEPTION 'Invalid subscription';
  END IF;
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Active membership required for Home Assistant';
  END IF;

  SELECT * INTO v_sku FROM service_skus
  WHERE id = p_sku_id AND provider_category = 'home_assistant' AND status = 'active';
  IF v_sku IS NULL THEN
    RAISE EXCEPTION 'Home Assistant SKU not found';
  END IF;

  SELECT * INTO v_window FROM home_assistant_windows
  WHERE id = p_window_id AND zone_id = p_zone_id FOR UPDATE;
  IF v_window IS NULL THEN
    RAISE EXCEPTION 'Window not available';
  END IF;
  IF v_window.booked >= v_window.capacity THEN
    RAISE EXCEPTION 'Window fully booked';
  END IF;
  IF v_window.window_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Window date has passed';
  END IF;

  INSERT INTO addon_orders (customer_id, subscription_id, sku_id, property_id, zone_id, payment_method, handle_cost, price_cents, status)
  VALUES (v_customer_id, p_subscription_id, p_sku_id, p_property_id, p_zone_id, p_payment_method,
    CASE WHEN p_payment_method = 'handles' THEN v_sku.handle_cost ELSE 0 END,
    CASE WHEN p_payment_method = 'cash' THEN v_sku.base_price_cents ELSE 0 END,
    'scheduled')
  RETURNING id INTO v_order_id;

  IF p_payment_method = 'handles' THEN
    PERFORM spend_handles(p_subscription_id, v_customer_id, v_sku.handle_cost, v_order_id);
  END IF;

  UPDATE home_assistant_windows SET booked = booked + 1 WHERE id = p_window_id;

  PERFORM emit_notification(
    v_customer_id,
    'home_assistant_booked',
    'Home Assistant Booked',
    format('%s booked for %s %s.', v_sku.name, v_window.window_date::text, v_window.window_slot),
    jsonb_build_object('order_id', v_order_id, 'window_date', v_window.window_date, 'window_slot', v_window.window_slot)
  );

  RETURN jsonb_build_object(
    'success', true, 'order_id', v_order_id,
    'window_date', v_window.window_date, 'window_slot', v_window.window_slot
  );
END;
$$;

-- 4) Seed Home Assistant SKUs
INSERT INTO public.service_skus (
  name, description, category, provider_category, duration_minutes, handle_cost, base_price_cents,
  is_addon, members_only, customer_prep, proof_rules,
  inclusions, exclusions, checklist, required_photos, status, display_order
) VALUES
(
  'Kitchen Reset',
  'Dishes done, counters wiped, floor swept, trash taken out. Your kitchen, handled.',
  'home_assistant', 'home_assistant', 60, 4, 5900, true, true,
  ARRAY['Clear personal items from counters', 'Ensure dishwasher is empty or running', 'Leave cleaning supplies accessible'],
  '{"photo_required": true, "privacy_safe": true, "allowed_areas": ["kitchen"]}'::jsonb,
  ARRAY['Dish washing & drying', 'Counter & stovetop wipe-down', 'Floor sweep & spot mop', 'Trash & recycling takeout', 'Appliance exterior wipe'],
  ARRAY['Deep cleaning behind appliances', 'Oven interior cleaning', 'Grocery shopping', 'Organizing pantry contents'],
  '[{"label":"Dishes washed & put away","required":true},{"label":"Counters wiped","required":true},{"label":"Floor swept","required":true},{"label":"Trash taken out","required":true}]'::jsonb,
  '[{"label":"Kitchen overview (after)","when":"after","count":1}]'::jsonb,
  'active', 200
),
(
  'Laundry Folding Sprint',
  '30 minutes of focused laundry folding. Bring the basket, we handle the rest.',
  'home_assistant', 'home_assistant', 30, 2, 3500, true, true,
  ARRAY['Have clean laundry ready in baskets', 'Indicate where folded items should go'],
  '{"photo_required": true, "privacy_safe": true, "allowed_areas": ["laundry_area"]}'::jsonb,
  ARRAY['Folding clean laundry', 'Sorting by person/type', 'Placing in designated areas'],
  ARRAY['Ironing or steaming', 'Washing or drying loads', 'Dry cleaning or delicates handling'],
  '[{"label":"Laundry folded","required":true},{"label":"Items sorted & placed","required":true}]'::jsonb,
  '[{"label":"Folded laundry (after)","when":"after","count":1}]'::jsonb,
  'active', 201
),
(
  'Quick Tidy Sprint',
  '30 minutes of focused tidying — living areas picked up, surfaces cleared, cushions fluffed.',
  'home_assistant', 'home_assistant', 30, 2, 3500, true, true,
  ARRAY['Secure valuables and personal documents', 'Indicate which rooms to prioritize'],
  '{"photo_required": true, "privacy_safe": true, "allowed_areas": ["living_room", "common_areas"]}'::jsonb,
  ARRAY['Surface clearing & organizing', 'Cushion & pillow fluffing', 'General tidying of common areas', 'Light dusting of visible surfaces'],
  ARRAY['Deep cleaning', 'Moving heavy furniture', 'Organizing closets or drawers'],
  '[{"label":"Surfaces cleared","required":true},{"label":"Cushions arranged","required":true},{"label":"Visible areas tidied","required":true}]'::jsonb,
  '[{"label":"Room overview (after)","when":"after","count":1}]'::jsonb,
  'active', 202
),
(
  'Post-Party Reset',
  '90 minutes to get your home back to normal after hosting. Dishes, trash, surfaces, floors.',
  'home_assistant', 'home_assistant', 90, 6, 8900, true, true,
  ARRAY['Bag any broken items for safety', 'Clear personal items from common areas', 'Ensure access to cleaning supplies'],
  '{"photo_required": true, "privacy_safe": true, "allowed_areas": ["kitchen", "living_room", "dining_room"]}'::jsonb,
  ARRAY['All dishes washed & put away', 'Trash & recycling collected', 'Counters & tables wiped', 'Floors swept & spot mopped', 'Furniture returned to position'],
  ARRAY['Stain removal from upholstery', 'Carpet shampooing', 'Outdoor cleanup'],
  '[{"label":"Dishes done","required":true},{"label":"Trash collected","required":true},{"label":"Surfaces wiped","required":true},{"label":"Floors swept","required":true}]'::jsonb,
  '[{"label":"Kitchen (after)","when":"after","count":1},{"label":"Living area (after)","when":"after","count":1}]'::jsonb,
  'active', 203
),
(
  'Bed + Bath Reset',
  '60 minutes — beds made, bathroom surfaces wiped, towels swapped, floors swept.',
  'home_assistant', 'home_assistant', 60, 4, 5900, true, true,
  ARRAY['Have fresh linens/towels accessible', 'Clear personal toiletries you want kept private', 'Secure medications'],
  '{"photo_required": true, "privacy_safe": true, "allowed_areas": ["bedroom", "bathroom"]}'::jsonb,
  ARRAY['Bed making with fresh linens', 'Bathroom counter & mirror wipe', 'Toilet exterior clean', 'Towel swap', 'Floor sweep in both rooms'],
  ARRAY['Shower/tub deep scrub', 'Window washing', 'Closet organization'],
  '[{"label":"Bed made with fresh linens","required":true},{"label":"Bathroom surfaces wiped","required":true},{"label":"Towels swapped","required":true},{"label":"Floors swept","required":true}]'::jsonb,
  '[{"label":"Bedroom (after)","when":"after","count":1},{"label":"Bathroom (after)","when":"after","count":1}]'::jsonb,
  'active', 204
);
