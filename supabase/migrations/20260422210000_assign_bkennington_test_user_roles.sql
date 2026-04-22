-- Assign roles to the three new bkennington+ test users
--
-- Created 2026-04-22 after the user provisioned three auth.users accounts
-- for Tier 3 E2E testing per docs/testing-strategy.md Appendix C item 3:
--   bkennington+customer@bluekube.com → 'customer'
--   bkennington+provider@bluekube.com → 'provider'
--   bkennington+admin@bluekube.com    → 'admin'
--
-- The `bootstrap_new_user` trigger (see 20260221235955_*) may have already
-- created 'customer' rows for these users on first sign-in. Uses ON CONFLICT
-- on (user_id, role) to stay idempotent in that case. Admin and provider
-- rows are additive — a user may legitimately hold multiple roles.
--
-- Also ensures each user has a profiles row (the Auth flow relies on it).

DO $$
DECLARE
  v_customer_id uuid;
  v_provider_id uuid;
  v_admin_id    uuid;
BEGIN
  SELECT id INTO v_customer_id FROM auth.users
    WHERE email = 'bkennington+customer@bluekube.com' LIMIT 1;
  SELECT id INTO v_provider_id FROM auth.users
    WHERE email = 'bkennington+provider@bluekube.com' LIMIT 1;
  SELECT id INTO v_admin_id FROM auth.users
    WHERE email = 'bkennington+admin@bluekube.com' LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'bkennington+customer@bluekube.com not found in auth.users — skipping role assignment for this user';
  ELSE
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (v_customer_id, 'Test Customer')
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_customer_id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Assigned customer role to bkennington+customer@bluekube.com (id=%)', v_customer_id;
  END IF;

  IF v_provider_id IS NULL THEN
    RAISE NOTICE 'bkennington+provider@bluekube.com not found in auth.users — skipping role assignment for this user';
  ELSE
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (v_provider_id, 'Test Provider')
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_provider_id, 'provider')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Assigned provider role to bkennington+provider@bluekube.com (id=%)', v_provider_id;
  END IF;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'bkennington+admin@bluekube.com not found in auth.users — skipping role assignment for this user';
  ELSE
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (v_admin_id, 'Test Admin')
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Assigned admin role to bkennington+admin@bluekube.com (id=%)', v_admin_id;
  END IF;
END $$;
