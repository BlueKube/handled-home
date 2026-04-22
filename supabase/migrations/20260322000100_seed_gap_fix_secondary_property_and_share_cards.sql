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

-- 3b. Seed completed job for share_cards FK (originally created by
--     20260223032019, emptied in c3ba864). The share_cards below FK-reference
--     job f1000000-...-020, which wasn't re-seeded when that Feb 23 migration
--     was emptied. Primary property, provider_org, zone, and SKUs all exist
--     via Mar 22 at this point.
INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at)
VALUES (
  'f1000000-0000-0000-0000-000000000020',
  '7cfa1714-bf93-441f-99c0-4bc3e24a284c',
  'edfedf3d-251d-4de7-89a8-1ce5f439e12e',
  'f1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'COMPLETED',
  (now() - interval '3 days')::date,
  now() - interval '3 days' + interval '9 hours',
  now() - interval '3 days' + interval '10 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
  ('f1000000-0000-0000-0000-000000000021', 'f1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 30),
  ('f1000000-0000-0000-0000-000000000022', 'f1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000002', 'Edge & Trim', 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_checklist_items (id, job_id, label, status, is_required) VALUES
  ('f1000000-0000-0000-0000-000000000023', 'f1000000-0000-0000-0000-000000000020', 'Mow front yard', 'DONE', true),
  ('f1000000-0000-0000-0000-000000000024', 'f1000000-0000-0000-0000-000000000020', 'Mow back yard', 'DONE', true),
  ('f1000000-0000-0000-0000-000000000025', 'f1000000-0000-0000-0000-000000000020', 'Edge walkways and driveway', 'DONE', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_photos (id, job_id, storage_path, slot_key, upload_status, captured_at) VALUES
  ('f1000000-0000-0000-0000-000000000026', 'f1000000-0000-0000-0000-000000000020', 'job-photos/seed/before-mow.jpg', 'before', 'UPLOADED', now() - interval '3 days' + interval '9 hours'),
  ('f1000000-0000-0000-0000-000000000027', 'f1000000-0000-0000-0000-000000000020', 'job-photos/seed/after-mow.jpg',  'after',  'UPLOADED', now() - interval '3 days' + interval '10 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_events (id, job_id, event_type, actor_user_id, actor_role, metadata) VALUES
  ('f1000000-0000-0000-0000-000000000028', 'f1000000-0000-0000-0000-000000000020', 'ASSIGNED',    '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'system',   '{}'::jsonb),
  ('f1000000-0000-0000-0000-000000000029', 'f1000000-0000-0000-0000-000000000020', 'CONFIRMED',   '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb),
  ('f1000000-0000-0000-0000-00000000002a', 'f1000000-0000-0000-0000-000000000020', 'IN_PROGRESS', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb),
  ('f1000000-0000-0000-0000-00000000002b', 'f1000000-0000-0000-0000-000000000020', 'COMPLETED',   '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb)
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
