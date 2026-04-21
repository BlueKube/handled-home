-- ============================================================
-- Seed Data Gap Fixes: Second property, offered assignment,
-- service day offers, and share cards
--
-- Relocated from `20260223034117_143063d8-fef7-404e-85e1-2a86e629fdc0.sql`
-- on 2026-04-22 to run AFTER `20260322000000_fix_test_users_and_seed_metro.sql`,
-- which creates the auth user, zone, primary property, and jobs that
-- the rows below depend on. Content is unchanged from the original
-- Feb 23 seed-gap-fix migration.
-- ============================================================

-- 1. Second property for test user (still in Austin Central zone via ZIP 78702)
INSERT INTO properties (id, user_id, street_address, city, state, zip_code)
VALUES (
  'edfedf3d-0000-0000-0000-000000000002',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  '456 Elm Street',
  'Austin',
  'TX',
  '78702'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Offered assignment on second property (short 2-hour TTL)
INSERT INTO service_day_assignments (id, customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until, reason_code)
VALUES (
  'f1000000-0000-0000-0000-000000000012',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  'edfedf3d-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  'tuesday',
  'any',
  'offered',
  now() + interval '2 hours',
  'default_day_available'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Three service day offers (1 primary + 2 alternatives)
INSERT INTO service_day_offers (id, assignment_id, offered_day_of_week, offered_window, offer_type, rank)
VALUES
  ('f1000000-0000-0000-0000-000000000013', 'f1000000-0000-0000-0000-000000000012', 'tuesday',  'any', 'primary',     1),
  ('f1000000-0000-0000-0000-000000000014', 'f1000000-0000-0000-0000-000000000012', 'thursday', 'any', 'alternative', 2),
  ('f1000000-0000-0000-0000-000000000015', 'f1000000-0000-0000-0000-000000000012', 'friday',   'any', 'alternative', 3)
ON CONFLICT (id) DO NOTHING;

-- 4. Three share cards for Growth scenarios G-02, G-04, G-05
-- Active card (G-02): valid for 30 days
INSERT INTO share_cards (id, job_id, customer_id, zone_id, category, share_code, expires_at, is_revoked, show_first_name, show_neighborhood, asset_mode, brand_mode, expiry_mode, checklist_bullets)
VALUES (
  'f1000000-0000-0000-0000-000000000060',
  'f1000000-0000-0000-0000-000000000020',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  'b1000000-0000-0000-0000-000000000001',
  'mowing',
  'SEEDSHARE1',
  now() + interval '30 days',
  false,
  true,
  true,
  'photo',
  'handled',
  'rolling',
  '["Mowed lawn", "Edged walkways", "Blew off debris"]'::jsonb
)
ON CONFLICT (share_code) DO NOTHING;

-- Expired card (G-04): expired 1 day ago
INSERT INTO share_cards (id, job_id, customer_id, zone_id, category, share_code, expires_at, is_revoked, show_first_name, show_neighborhood, asset_mode, brand_mode, expiry_mode, checklist_bullets)
VALUES (
  'f1000000-0000-0000-0000-000000000061',
  'f1000000-0000-0000-0000-000000000020',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  'b1000000-0000-0000-0000-000000000001',
  'mowing',
  'SEEDEXPIRED',
  now() - interval '1 day',
  false,
  true,
  true,
  'photo',
  'handled',
  'rolling',
  '["Mowed lawn", "Edged walkways"]'::jsonb
)
ON CONFLICT (share_code) DO NOTHING;

-- Revoked card (G-05): revoked now
INSERT INTO share_cards (id, job_id, customer_id, zone_id, category, share_code, expires_at, is_revoked, revoked_at, show_first_name, show_neighborhood, asset_mode, brand_mode, expiry_mode, checklist_bullets)
VALUES (
  'f1000000-0000-0000-0000-000000000062',
  'f1000000-0000-0000-0000-000000000020',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  'b1000000-0000-0000-0000-000000000001',
  'mowing',
  'SEEDREVOKED',
  now() + interval '30 days',
  true,
  now(),
  true,
  true,
  'photo',
  'handled',
  'rolling',
  '["Mowed lawn"]'::jsonb
)
ON CONFLICT (share_code) DO NOTHING;
