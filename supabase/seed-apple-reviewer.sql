-- ============================================
-- Apple App Store Review Test Account
-- ============================================
-- Creates a pre-populated test account for Apple reviewers.
-- Run this ONCE against your production Supabase instance before
-- submitting to App Store review.
--
-- The reviewer credentials should be provided in App Store Connect:
--   Email: reviewer@handledhome.com
--   Password: (set manually in Supabase Auth dashboard)
--
-- This seed creates:
-- 1. A property in Austin, TX (covered zone)
-- 2. An active Essential subscription
-- 3. A routine with 3 services
-- 4. 3 completed jobs with timestamps
-- ============================================

-- Note: The auth user must be created first via Supabase Auth dashboard
-- or supabase.auth.admin.createUser(). This seed populates the app data
-- for an existing auth user.
--
-- After creating the user in Auth, replace the UUID below with the actual user ID.

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000099'; -- Replace with actual auth user ID
  v_zone_id UUID;
  v_property_id UUID;
BEGIN
  -- Find an active zone (use the first one)
  SELECT id INTO v_zone_id FROM public.zones WHERE status = 'active' LIMIT 1;

  -- Skip if no active zone exists
  IF v_zone_id IS NULL THEN
    RAISE NOTICE 'No active zone found. Create a zone first, then re-run this seed.';
    RETURN;
  END IF;

  -- 1. Create profile
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (v_user_id, 'Apple Reviewer', '+15125550199')
  ON CONFLICT (user_id) DO UPDATE SET full_name = 'Apple Reviewer';

  -- 2. Create property
  INSERT INTO public.properties (user_id, street_address, city, state, zip_code, lot_size_category, stories, yard_size_category)
  VALUES (v_user_id, '1234 Review Lane', 'Austin', 'TX', '78701', 'medium', 1, 'medium')
  RETURNING id INTO v_property_id;

  -- 3. Create subscription (Essential plan)
  INSERT INTO public.subscriptions (customer_id, plan_id, status, current_period_start, current_period_end)
  SELECT v_user_id, id, 'active', now(), now() + interval '28 days'
  FROM public.plans WHERE name ILIKE '%essential%' LIMIT 1
  ON CONFLICT DO NOTHING;

  -- 4. Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'customer')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Apple reviewer test account seeded successfully for user %', v_user_id;
END;
$$;
