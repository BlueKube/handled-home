-- ============================================================
-- Rich Metro Seed — "Day 90 Austin Metro" scenario
-- Populates 5 zones, 25 customers, 8 providers, 120+ jobs
-- for realistic screenshots across all 110 app screens.
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING on all inserts.
-- REQUIRES: bootstrap migration (SKUs, auth.users)
--
-- Usage:
--   Via Supabase SQL Editor: paste and run
--   Via CLI: supabase db execute --file supabase/seed-rich-metro.sql
-- ============================================================

-- Pre-seed: create auth.users for test accounts and provider org owners
-- (Each org needs a unique accountable_owner_user_id)
INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud, email_confirmed_at) VALUES
  -- Core test users
  ('7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'customer@test.com', '{"full_name":"Test Customer"}'::jsonb, 'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000001', 'provider@test.com', '{"full_name":"Test Provider"}'::jsonb, 'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000009', 'admin@test.com',    '{"full_name":"Test Admin"}'::jsonb,    'authenticated', 'authenticated', now()),
  -- Provider org owners
  ('f4000000-0000-0000-0000-000000000002', 'provider-org2@seed.local', '{"full_name":"Maria G."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000003', 'provider-org3@seed.local', '{"full_name":"James W."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000004', 'provider-org4@seed.local', '{"full_name":"David K."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000005', 'provider-org5@seed.local', '{"full_name":"Sarah L."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000006', 'provider-org6@seed.local', '{"full_name":"Rachel B."}'::jsonb,  'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000007', 'provider-org7@seed.local', '{"full_name":"Kevin P."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-000000000008', 'provider-org8@seed.local', '{"full_name":"Amanda S."}'::jsonb,  'authenticated', 'authenticated', now()),
  -- Provider org operators (crew members for multi-person orgs)
  ('f4000000-0000-0000-0000-00000000000a', 'operator-org2a@seed.local', '{"full_name":"Carlos R."}'::jsonb,  'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-00000000000b', 'operator-org3a@seed.local', '{"full_name":"Tyler M."}'::jsonb,  'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-00000000000c', 'operator-org4a@seed.local', '{"full_name":"Ryan T."}'::jsonb,   'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-00000000000d', 'operator-org4b@seed.local', '{"full_name":"Miguel F."}'::jsonb, 'authenticated', 'authenticated', now()),
  ('f4000000-0000-0000-0000-00000000000e', 'operator-org5a@seed.local', '{"full_name":"Jake H."}'::jsonb,   'authenticated', 'authenticated', now())
ON CONFLICT (id) DO NOTHING;

-- Pre-seed: create profiles for test users
INSERT INTO profiles (id, user_id, full_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'Test Customer'),
  ('a0000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000001', 'Test Provider'),
  ('a0000000-0000-0000-0000-000000000003', 'f4000000-0000-0000-0000-000000000009', 'Test Admin')
ON CONFLICT (id) DO NOTHING;

-- Pre-seed: assign roles to test users
INSERT INTO user_roles (id, user_id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'customer'),
  ('a1000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000001', 'provider'),
  ('a1000000-0000-0000-0000-000000000003', 'f4000000-0000-0000-0000-000000000009', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Pre-seed: create service SKUs with research-calibrated data
-- Handle cost anchor: 7 handles = 1 standard lawn mow (~45 min, ~$55 payout)
INSERT INTO service_skus (id, name, description, category, duration_minutes, base_price_cents, handle_cost, status, weather_sensitive) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Standard Mow',      'Full-service lawn mowing with edging and blowoff',            'mowing',     45,  7500,  7, 'active', true),
  ('c1000000-0000-0000-0000-000000000002', 'Edge & Trim',       'Precision edge trimming along all borders and hardscapes',    'trimming',   25,  3500,  4, 'active', false),
  ('c1000000-0000-0000-0000-000000000003', 'Leaf Cleanup',      'Seasonal leaf removal from lawn, beds, and hardscapes',       'cleanup',   120, 25000, 15, 'active', true),
  ('c1000000-0000-0000-0000-000000000004', 'Hedge Trimming',    'Shape and maintain hedges and shrubs',                        'trimming',   90, 15000, 13, 'active', false),
  ('c1000000-0000-0000-0000-000000000005', 'Weed Treatment',    'Targeted or broadcast herbicide for lawn weed control',       'treatment',  35,  8500,  8, 'active', true),
  ('c1000000-0000-0000-0000-000000000006', 'Fertilization',     'Seasonal lawn fertilizer application',                        'treatment',  30,  7500,  8, 'active', true),
  ('c1000000-0000-0000-0000-000000000007', 'Mulch Application', 'Spread mulch in garden beds with edging and weed barrier',    'cleanup',   180, 35000, 22, 'active', false),
  ('c1000000-0000-0000-0000-000000000008', 'Spring Prep',       'Comprehensive spring yard preparation',                       'cleanup',   240, 35000, 25, 'active', true),
  ('c1000000-0000-0000-0000-00000000000e', 'Gutter Cleaning',   'Clear debris from gutters and flush downspouts',              'cleanup',    90, 17500, 15, 'active', true),
  ('c1000000-0000-0000-0000-00000000000f', 'Fall Prep',         'Comprehensive fall yard preparation and winterization',       'cleanup',   300, 40000, 25, 'active', true),
  ('c1000000-0000-0000-0000-000000000010', 'Trash Can Cleaning','Sanitize and deodorize residential trash and recycling cans', 'cleanup',    10,  3500,  3, 'active', false),
  ('c1000000-0000-0000-0000-000000000011', 'Grill Cleaning',    'Professional grill deep clean with disassembly and degreasing','cleanup',   75, 17500, 13, 'active', false),
  ('c1000000-0000-0000-0000-000000000012', 'Dryer Vent Cleaning','Professional dryer vent cleaning for fire prevention',       'home_assistant', 45, 14000, 11, 'active', false)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  -- Resolve test user IDs from auth.users
  v_customer_id uuid := '7cfa1714-bf93-441f-99c0-4bc3e24a284c';
  v_provider_id uuid;
  v_admin_id    uuid;

  -- Provider org owner user IDs (unique per org for accountable_owner_user_id constraint)
  v_owner2 uuid := 'f4000000-0000-0000-0000-000000000002';
  v_owner3 uuid := 'f4000000-0000-0000-0000-000000000003';
  v_owner4 uuid := 'f4000000-0000-0000-0000-000000000004';
  v_owner5 uuid := 'f4000000-0000-0000-0000-000000000005';
  v_owner6 uuid := 'f4000000-0000-0000-0000-000000000006';
  v_owner7 uuid := 'f4000000-0000-0000-0000-000000000007';
  v_owner8 uuid := 'f4000000-0000-0000-0000-000000000008';

  -- Operator (crew member) user IDs
  v_op2a uuid := 'f4000000-0000-0000-0000-00000000000a'; -- Green Thumb crew
  v_op3a uuid := 'f4000000-0000-0000-0000-00000000000b'; -- Lone Star crew
  v_op4a uuid := 'f4000000-0000-0000-0000-00000000000c'; -- Capital City crew 1
  v_op4b uuid := 'f4000000-0000-0000-0000-00000000000d'; -- Capital City crew 2
  v_op5a uuid := 'f4000000-0000-0000-0000-00000000000e'; -- Hill Country crew

  -- ── Known fixture IDs ──
  v_zone1 uuid := 'b1000000-0000-0000-0000-000000000001'; -- Austin Central (existing)
  v_zone2 uuid := 'b1000000-0000-0000-0000-000000000002'; -- Austin South
  v_zone3 uuid := 'b1000000-0000-0000-0000-000000000003'; -- Austin East
  v_zone4 uuid := 'b1000000-0000-0000-0000-000000000004'; -- Round Rock
  v_zone5 uuid := 'b1000000-0000-0000-0000-000000000005'; -- Cedar Park

  v_region1 uuid := 'b2000000-0000-0000-0000-000000000001'; -- Austin Metro

  -- Plans
  v_plan1 uuid := 'd1000000-0000-0000-0000-000000000001'; -- Basic (existing)
  v_plan2 uuid := 'd1000000-0000-0000-0000-000000000002'; -- Standard
  v_plan3 uuid := 'd1000000-0000-0000-0000-000000000003'; -- Premium

  -- Entitlement versions
  v_ent1 uuid := 'e1000000-0000-0000-0000-000000000001'; -- Basic (existing)
  v_ent2 uuid := 'e1000000-0000-0000-0000-000000000002'; -- Standard
  v_ent3 uuid := 'e1000000-0000-0000-0000-000000000003'; -- Premium

  -- Provider orgs (org 1 is existing)
  v_org1 uuid := 'f1000000-0000-0000-0000-000000000001'; -- Austin Pro Services (existing)
  v_org2 uuid := 'f2000000-0000-0000-0000-000000000001'; -- Green Thumb Landscaping
  v_org3 uuid := 'f2000000-0000-0000-0000-000000000002'; -- Lone Star Lawn Care
  v_org4 uuid := 'f2000000-0000-0000-0000-000000000003'; -- Capital City Maintenance
  v_org5 uuid := 'f2000000-0000-0000-0000-000000000004'; -- Hill Country Services
  v_org6 uuid := 'f2000000-0000-0000-0000-000000000005'; -- ATX Clean Team
  v_org7 uuid := 'f2000000-0000-0000-0000-000000000006'; -- Sunrise Property Care
  v_org8 uuid := 'f2000000-0000-0000-0000-000000000007'; -- Premier Pest Solutions

  -- SKU IDs
  v_sku_mow     uuid := 'c1000000-0000-0000-0000-000000000001';
  v_sku_edge    uuid := 'c1000000-0000-0000-0000-000000000002';
  v_sku_leaf    uuid := 'c1000000-0000-0000-0000-000000000003';
  v_sku_hedge   uuid := 'c1000000-0000-0000-0000-000000000004';
  v_sku_weed    uuid := 'c1000000-0000-0000-0000-000000000005';
  v_sku_fert    uuid := 'c1000000-0000-0000-0000-000000000006';
  v_sku_mulch   uuid := 'c1000000-0000-0000-0000-000000000007';
  v_sku_spring  uuid := 'c1000000-0000-0000-0000-000000000008';
  v_sku_window  uuid := 'c1000000-0000-0000-0000-000000000009';
  v_sku_power   uuid := 'c1000000-0000-0000-0000-00000000000a';
  v_sku_pool    uuid := 'c1000000-0000-0000-0000-00000000000b';
  v_sku_pest    uuid := 'c1000000-0000-0000-0000-00000000000c';
  v_sku_poop    uuid := 'c1000000-0000-0000-0000-00000000000d';
  v_sku_gutter  uuid := 'c1000000-0000-0000-0000-00000000000e';
  v_sku_fall    uuid := 'c1000000-0000-0000-0000-00000000000f';
  v_sku_trash   uuid := 'c1000000-0000-0000-0000-000000000010';
  v_sku_grill   uuid := 'c1000000-0000-0000-0000-000000000011';
  v_sku_dryer   uuid := 'c1000000-0000-0000-0000-000000000012';

  -- Existing property
  v_prop1 uuid := 'edfedf3d-251d-4de7-89a8-1ce5f439e12e';

BEGIN
  -- ── Resolve provider/admin user IDs ──
  SELECT id INTO v_provider_id FROM auth.users
    WHERE email = current_setting('app.provider_email', true) LIMIT 1;
  IF v_provider_id IS NULL THEN v_provider_id := v_customer_id; END IF;

  SELECT id INTO v_admin_id FROM auth.users
    WHERE email = current_setting('app.admin_email', true) LIMIT 1;
  IF v_admin_id IS NULL THEN v_admin_id := v_customer_id; END IF;

  -- ════════════════════════════════════════════════════════════
  -- PHASE A: GEOGRAPHY
  -- ════════════════════════════════════════════════════════════

  -- A1. Region
  INSERT INTO regions (id, name, state, status)
  VALUES (v_region1, 'Austin Metro', 'TX', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- A2. Zones (zone 1 already exists, but upsert-safe)
  INSERT INTO zones (id, name, region_id, zip_codes, status, max_stops_per_day, max_minutes_per_day, buffer_percent, offer_ttl_hours, alternative_strategy, default_service_day) VALUES
    (v_zone1, 'Austin Central', v_region1, ARRAY['78701','78702','78703','78704','78705'], 'active', 12, 480, 10, 24, 'expand_window', 'tuesday'),
    (v_zone2, 'Austin South',   v_region1, ARRAY['78745','78748','78749','78744','78747'], 'active', 10, 420, 15, 24, 'expand_window', 'wednesday'),
    (v_zone3, 'Austin East',    v_region1, ARRAY['78721','78722','78723','78724','78741'], 'active', 10, 420, 15, 24, 'expand_window', 'thursday'),
    (v_zone4, 'Round Rock',     v_region1, ARRAY['78664','78665','78681','78717'],         'active', 8,  360, 20, 48, 'waitlist',       'monday'),
    (v_zone5, 'Cedar Park',     v_region1, ARRAY['78613','78641','78726'],                 'active', 8,  360, 20, 48, 'waitlist',       'friday')
  ON CONFLICT (id) DO NOTHING;

  -- A3. Zone category state (mowing and windows open in all zones; pest in 3)
  INSERT INTO market_zone_category_state (id, zone_id, category, status, config) VALUES
    -- Zone 1 already has mowing + windows
    ('d3000000-0000-0000-0000-000000000001', v_zone1, 'pest',    'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000002', v_zone2, 'mowing',  'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000003', v_zone2, 'windows', 'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000004', v_zone2, 'pest',    'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000005', v_zone3, 'mowing',  'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000006', v_zone3, 'windows', 'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000007', v_zone3, 'pest',    'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000008', v_zone4, 'mowing',  'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-000000000009', v_zone4, 'windows', 'WAITLIST_ONLY', '{}'::jsonb),
    ('d3000000-0000-0000-0000-00000000000a', v_zone5, 'mowing',  'OPEN', '{}'::jsonb),
    ('d3000000-0000-0000-0000-00000000000b', v_zone5, 'windows', 'WAITLIST_ONLY', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- A4. Appointment window templates
  INSERT INTO appointment_window_templates (id, zone_id, category_key, window_label, window_start, window_end, day_of_week, is_active) VALUES
    ('d3000000-0000-0000-0000-000000000010', v_zone1, 'mowing', 'Morning',   '08:00', '11:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000011', v_zone1, 'mowing', 'Midday',    '11:00', '14:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000012', v_zone1, 'mowing', 'Afternoon', '14:00', '17:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000013', v_zone2, 'mowing', 'Morning',   '08:00', '11:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000014', v_zone2, 'mowing', 'Afternoon', '13:00', '17:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000015', v_zone3, 'mowing', 'Morning',   '08:00', '11:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000016', v_zone3, 'mowing', 'Afternoon', '13:00', '17:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000017', v_zone4, 'mowing', 'Full Day',  '08:00', '17:00', NULL, true),
    ('d3000000-0000-0000-0000-000000000018', v_zone5, 'mowing', 'Full Day',  '08:00', '17:00', NULL, true)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE B: PLANS & PRICING
  -- ════════════════════════════════════════════════════════════

  -- B1. Plans (plan 1 exists as Basic)
  INSERT INTO plans (id, name, status, display_price_text, tagline, recommended_rank) VALUES
    (v_plan1, 'Basic',    'active', '$49/mo', 'Essential lawn care',                    3),
    (v_plan2, 'Standard', 'active', '$85/mo', 'Our most popular — full yard coverage',  1),
    (v_plan3, 'Premium',  'active', '$149/mo','White-glove service with priority scheduling', 2)
  ON CONFLICT (id) DO NOTHING;

  -- B2. Plan entitlement versions
  INSERT INTO plan_entitlement_versions (id, plan_id, version, status, model_type, included_service_weeks_per_billing_cycle, included_minutes, extra_allowed) VALUES
    (v_ent1, v_plan1, 1, 'active', 'minutes_per_cycle', 4,  60,  false),
    (v_ent2, v_plan2, 1, 'active', 'minutes_per_cycle', 4,  120, true),
    (v_ent3, v_plan3, 1, 'active', 'minutes_per_cycle', 4,  240, true)
  ON CONFLICT (id) DO NOTHING;

  -- Link plans to current entitlement version
  UPDATE plans SET current_entitlement_version_id = v_ent1 WHERE id = v_plan1 AND current_entitlement_version_id IS NULL;
  UPDATE plans SET current_entitlement_version_id = v_ent2 WHERE id = v_plan2 AND current_entitlement_version_id IS NULL;
  UPDATE plans SET current_entitlement_version_id = v_ent3 WHERE id = v_plan3 AND current_entitlement_version_id IS NULL;

  -- B3. Assignment config
  INSERT INTO assignment_config (id, config_key, config_value, description) VALUES
    ('d3000000-0000-0000-0000-000000000020', 'max_daily_capacity',      '12'::jsonb,    'Maximum stops per provider per day'),
    ('d3000000-0000-0000-0000-000000000021', 'proximity_weight',        '0.4'::jsonb,   'Weight for proximity scoring in assignment'),
    ('d3000000-0000-0000-0000-000000000022', 'quality_weight',          '0.3'::jsonb,   'Weight for quality score in assignment'),
    ('d3000000-0000-0000-0000-000000000023', 'availability_weight',     '0.2'::jsonb,   'Weight for availability in assignment'),
    ('d3000000-0000-0000-0000-000000000024', 'cost_weight',             '0.1'::jsonb,   'Weight for cost optimization in assignment'),
    ('d3000000-0000-0000-0000-000000000025', 'auto_assign_enabled',     'true'::jsonb,  'Whether auto-assignment is active'),
    ('d3000000-0000-0000-0000-000000000026', 'fallback_expand_radius',  '5'::jsonb,     'Miles to expand search when no provider found')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE C: PROVIDERS
  -- ════════════════════════════════════════════════════════════

  -- C1. Provider orgs (org 1 exists)
  INSERT INTO provider_orgs (id, name, status, contact_phone, home_base_zip, created_by_user_id, accountable_owner_user_id, needs_review) VALUES
    (v_org2, 'Green Thumb Landscaping',    'ACTIVE',    '512-555-0201', '78745', v_owner2, v_owner2, false),
    (v_org3, 'Lone Star Lawn Care',        'ACTIVE',    '512-555-0301', '78721', v_owner3, v_owner3, false),
    (v_org4, 'Capital City Maintenance',   'ACTIVE',    '512-555-0401', '78664', v_owner4, v_owner4, false),
    (v_org5, 'Hill Country Services',      'ACTIVE',    '512-555-0501', '78613', v_owner5, v_owner5, false),
    (v_org6, 'ATX Clean Team',             'ACTIVE',    '512-555-0601', '78703', v_owner6, v_owner6, false),
    (v_org7, 'Sunrise Property Care',      'PROBATION', '512-555-0701', '78748', v_owner7, v_owner7, true),
    (v_org8, 'Premier Pest Solutions',     'PENDING',   '512-555-0801', '78701', v_owner8, v_owner8, true)
  ON CONFLICT (id) DO NOTHING;

  -- C2. Provider members
  INSERT INTO provider_members (id, provider_org_id, user_id, role_in_org, display_name, status) VALUES
    ('f3000000-0000-0000-0000-000000000001', v_org2, v_owner2, 'OWNER',    'Maria G.',   'ACTIVE'),
    ('f3000000-0000-0000-0000-000000000003', v_org3, v_owner3, 'OWNER',    'James W.',   'ACTIVE'),
    ('f3000000-0000-0000-0000-000000000005', v_org4, v_owner4, 'OWNER',    'David K.',   'ACTIVE'),
    ('f3000000-0000-0000-0000-000000000006', v_org5, v_owner5, 'OWNER',    'Sarah L.',   'ACTIVE'),
    ('f3000000-0000-0000-0000-000000000008', v_org6, v_owner6, 'OWNER',    'Rachel B.',  'ACTIVE'),
    ('f3000000-0000-0000-0000-000000000009', v_org7, v_owner7, 'OWNER',    'Kevin P.',   'ACTIVE'),
    ('f3000000-0000-0000-0000-00000000000a', v_org8, v_owner8, 'OWNER',    'Amanda S.',  'ACTIVE')
  ON CONFLICT (id) DO NOTHING;

  -- C2b. Operator (crew) members for multi-person orgs
  INSERT INTO provider_members (id, provider_org_id, user_id, role_in_org, display_name, status) VALUES
    ('f3000000-0000-0000-0000-00000000000b', v_org2, v_op2a, 'OPERATOR', 'Carlos R.',  'ACTIVE'),  -- Green Thumb crew
    ('f3000000-0000-0000-0000-00000000000c', v_org3, v_op3a, 'OPERATOR', 'Tyler M.',   'ACTIVE'),  -- Lone Star crew
    ('f3000000-0000-0000-0000-00000000000d', v_org4, v_op4a, 'OPERATOR', 'Ryan T.',    'ACTIVE'),  -- Capital City crew 1
    ('f3000000-0000-0000-0000-00000000000e', v_org4, v_op4b, 'OPERATOR', 'Miguel F.',  'ACTIVE'),  -- Capital City crew 2
    ('f3000000-0000-0000-0000-00000000000f', v_org5, v_op5a, 'OPERATOR', 'Jake H.',    'ACTIVE')   -- Hill Country crew
  ON CONFLICT (id) DO NOTHING;

  -- C3. Provider coverage (zone assignments)
  INSERT INTO provider_coverage (id, provider_org_id, zone_id, coverage_type, request_status) VALUES
    -- Org 1: Central (existing row), + South
    ('d3000000-0000-0000-0000-000000000030', v_org1, v_zone2, 'SECONDARY', 'APPROVED'),
    -- Org 2: South (primary), Central (secondary)
    ('d3000000-0000-0000-0000-000000000031', v_org2, v_zone2, 'PRIMARY',   'APPROVED'),
    ('d3000000-0000-0000-0000-000000000032', v_org2, v_zone1, 'SECONDARY', 'APPROVED'),
    -- Org 3: East (primary)
    ('d3000000-0000-0000-0000-000000000033', v_org3, v_zone3, 'PRIMARY',   'APPROVED'),
    -- Org 4: Round Rock (primary)
    ('d3000000-0000-0000-0000-000000000034', v_org4, v_zone4, 'PRIMARY',   'APPROVED'),
    -- Org 5: Cedar Park (primary), Round Rock (secondary)
    ('d3000000-0000-0000-0000-000000000035', v_org5, v_zone5, 'PRIMARY',   'APPROVED'),
    ('d3000000-0000-0000-0000-000000000036', v_org5, v_zone4, 'SECONDARY', 'APPROVED'),
    -- Org 6: Central (primary)
    ('d3000000-0000-0000-0000-000000000037', v_org6, v_zone1, 'PRIMARY',   'APPROVED'),
    -- Org 7: South (primary, probation)
    ('d3000000-0000-0000-0000-000000000038', v_org7, v_zone2, 'PRIMARY',   'APPROVED'),
    -- Org 8: Central (pending)
    ('d3000000-0000-0000-0000-000000000039', v_org8, v_zone1, 'PRIMARY',   'REQUESTED')
  ON CONFLICT (id) DO NOTHING;

  -- C4. Provider capabilities
  INSERT INTO provider_capabilities (id, provider_org_id, capability_key, capability_type, sku_id, is_enabled) VALUES
    -- Org 2: mowing + pest
    ('d3000000-0000-0000-0000-000000000040', v_org2, 'mowing', 'sku', v_sku_mow,  true),
    ('d3000000-0000-0000-0000-000000000041', v_org2, 'mowing', 'sku', v_sku_edge, true),
    ('d3000000-0000-0000-0000-000000000042', v_org2, 'pest',   'sku', v_sku_pest, true),
    -- Org 3: mowing + windows
    ('d3000000-0000-0000-0000-000000000043', v_org3, 'mowing',  'sku', v_sku_mow,    true),
    ('d3000000-0000-0000-0000-000000000044', v_org3, 'mowing',  'sku', v_sku_edge,   true),
    ('d3000000-0000-0000-0000-000000000045', v_org3, 'windows', 'sku', v_sku_window, true),
    -- Org 4: mowing + leaf
    ('d3000000-0000-0000-0000-000000000046', v_org4, 'mowing', 'sku', v_sku_mow,  true),
    ('d3000000-0000-0000-0000-000000000047', v_org4, 'mowing', 'sku', v_sku_edge, true),
    ('d3000000-0000-0000-0000-000000000048', v_org4, 'mowing', 'sku', v_sku_leaf, true),
    -- Org 5: mowing + hedge
    ('d3000000-0000-0000-0000-000000000049', v_org5, 'mowing', 'sku', v_sku_mow,   true),
    ('d3000000-0000-0000-0000-00000000004a', v_org5, 'mowing', 'sku', v_sku_hedge, true),
    -- Org 6: windows + power wash
    ('d3000000-0000-0000-0000-00000000004b', v_org6, 'windows',    'sku', v_sku_window, true),
    ('d3000000-0000-0000-0000-00000000004c', v_org6, 'power_wash', 'sku', v_sku_power,  true),
    -- Org 7: mowing (probation)
    ('d3000000-0000-0000-0000-00000000004d', v_org7, 'mowing', 'sku', v_sku_mow,  true),
    ('d3000000-0000-0000-0000-00000000004e', v_org7, 'mowing', 'sku', v_sku_edge, true),
    -- Org 8: pest (pending)
    ('d3000000-0000-0000-0000-00000000004f', v_org8, 'pest', 'sku', v_sku_pest, true)
  ON CONFLICT (id) DO NOTHING;

  -- C5. Provider payout accounts
  INSERT INTO provider_payout_accounts (id, provider_org_id, status, processor_account_id) VALUES
    ('d3000000-0000-0000-0000-000000000050', v_org1, 'READY',   'acct_seed_org1'),
    ('d3000000-0000-0000-0000-000000000051', v_org2, 'READY',   'acct_seed_org2'),
    ('d3000000-0000-0000-0000-000000000052', v_org3, 'READY',   'acct_seed_org3'),
    ('d3000000-0000-0000-0000-000000000053', v_org4, 'READY',   'acct_seed_org4'),
    ('d3000000-0000-0000-0000-000000000054', v_org5, 'READY',   'acct_seed_org5'),
    ('d3000000-0000-0000-0000-000000000055', v_org6, 'READY',   'acct_seed_org6'),
    ('d3000000-0000-0000-0000-000000000056', v_org7, 'READY',   'acct_seed_org7'),
    ('d3000000-0000-0000-0000-000000000057', v_org8, 'PENDING', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- C6. Zone category providers (assignment matrix)
  INSERT INTO zone_category_providers (id, zone_id, category, provider_org_id, role, priority_rank, status, assigned_at, performance_score) VALUES
    -- Central zone
    ('d3000000-0000-0000-0000-000000000060', v_zone1, 'mowing',     v_org1, 'PRIMARY',   1, 'ACTIVE', now() - interval '80 days', 92),
    ('d3000000-0000-0000-0000-000000000061', v_zone1, 'windows',    v_org6, 'PRIMARY',   1, 'ACTIVE', now() - interval '60 days', 88),
    ('d3000000-0000-0000-0000-000000000062', v_zone1, 'mowing',     v_org6, 'BACKUP', 2, 'ACTIVE', now() - interval '45 days', 85),
    -- South zone
    ('d3000000-0000-0000-0000-000000000063', v_zone2, 'mowing',     v_org2, 'PRIMARY',   1, 'ACTIVE', now() - interval '70 days', 90),
    ('d3000000-0000-0000-0000-000000000064', v_zone2, 'pest',       v_org2, 'PRIMARY',   1, 'ACTIVE', now() - interval '70 days', 87),
    ('d3000000-0000-0000-0000-000000000065', v_zone2, 'mowing',     v_org7, 'BACKUP', 2, 'ACTIVE', now() - interval '20 days', 65),
    -- East zone
    ('d3000000-0000-0000-0000-000000000066', v_zone3, 'mowing',     v_org3, 'PRIMARY',   1, 'ACTIVE', now() - interval '55 days', 91),
    ('d3000000-0000-0000-0000-000000000067', v_zone3, 'windows',    v_org3, 'PRIMARY',   1, 'ACTIVE', now() - interval '55 days', 89),
    -- Round Rock
    ('d3000000-0000-0000-0000-000000000068', v_zone4, 'mowing',     v_org4, 'PRIMARY',   1, 'ACTIVE', now() - interval '40 days', 86),
    -- Cedar Park
    ('d3000000-0000-0000-0000-000000000069', v_zone5, 'mowing',     v_org5, 'PRIMARY',   1, 'ACTIVE', now() - interval '35 days', 84)
  ON CONFLICT (id) DO NOTHING;

  -- C7. Quality score snapshots
  INSERT INTO provider_quality_score_snapshots (id, provider_org_id, score, band, score_window_days, computed_at, components) VALUES
    ('d3000000-0000-0000-0000-000000000070', v_org1, 92, 'GREEN',  30, now() - interval '1 day', '{"on_time": 95, "quality": 90, "communication": 91}'::jsonb),
    ('d3000000-0000-0000-0000-000000000071', v_org2, 88, 'YELLOW', 30, now() - interval '1 day', '{"on_time": 90, "quality": 86, "communication": 88}'::jsonb),
    ('d3000000-0000-0000-0000-000000000072', v_org3, 91, 'GREEN',  30, now() - interval '1 day', '{"on_time": 93, "quality": 89, "communication": 91}'::jsonb),
    ('d3000000-0000-0000-0000-000000000073', v_org4, 85, 'YELLOW', 30, now() - interval '1 day', '{"on_time": 87, "quality": 83, "communication": 85}'::jsonb),
    ('d3000000-0000-0000-0000-000000000074', v_org5, 83, 'YELLOW', 30, now() - interval '1 day', '{"on_time": 85, "quality": 80, "communication": 84}'::jsonb),
    ('d3000000-0000-0000-0000-000000000075', v_org6, 90, 'GREEN',  30, now() - interval '1 day', '{"on_time": 92, "quality": 88, "communication": 90}'::jsonb),
    ('d3000000-0000-0000-0000-000000000076', v_org7, 62, 'ORANGE', 30, now() - interval '1 day', '{"on_time": 60, "quality": 55, "communication": 71}'::jsonb),
    ('d3000000-0000-0000-0000-000000000077', v_org8, 0,  'RED',    30, now() - interval '1 day', '{"on_time": 0, "quality": 0, "communication": 0}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE D: CUSTOMERS (Properties, Subscriptions, Routines)
  -- ════════════════════════════════════════════════════════════

  -- D1. Properties (create prop1 + 24 more across 5 zones)
  INSERT INTO properties (id, user_id, street_address, city, state, zip_code, lot_size) VALUES
    -- Prop1: primary test customer property
    (v_prop1, v_customer_id, '123 Main St', 'Austin', 'TX', '78701', 'medium'),
    -- Zone 1: Austin Central (4 more)
    ('d3000000-0000-0000-0000-000000000101', v_customer_id, '1401 Lavaca St',         'Austin', 'TX', '78701', 'medium'),
    ('d3000000-0000-0000-0000-000000000102', v_customer_id, '900 W 5th St',           'Austin', 'TX', '78703', 'large'),
    ('d3000000-0000-0000-0000-000000000103', v_customer_id, '2505 Enfield Rd',        'Austin', 'TX', '78703', 'small'),
    ('d3000000-0000-0000-0000-000000000104', v_customer_id, '3100 Speedway',          'Austin', 'TX', '78705', 'medium'),
    -- Zone 2: Austin South (5 properties)
    ('d3000000-0000-0000-0000-000000000105', v_customer_id, '5001 W Slaughter Ln',    'Austin', 'TX', '78749', 'large'),
    ('d3000000-0000-0000-0000-000000000106', v_customer_id, '8800 S 1st St',          'Austin', 'TX', '78748', 'medium'),
    ('d3000000-0000-0000-0000-000000000107', v_customer_id, '4700 Menchaca Rd',       'Austin', 'TX', '78745', 'medium'),
    ('d3000000-0000-0000-0000-000000000108', v_customer_id, '2901 S Lamar Blvd',      'Austin', 'TX', '78704', 'small'),
    ('d3000000-0000-0000-0000-000000000109', v_customer_id, '7500 Manchaca Rd',       'Austin', 'TX', '78745', 'large'),
    -- Zone 3: Austin East (5 properties)
    ('d3000000-0000-0000-0000-00000000010a', v_customer_id, '2100 E MLK Blvd',        'Austin', 'TX', '78722', 'medium'),
    ('d3000000-0000-0000-0000-00000000010b', v_customer_id, '5300 E Riverside Dr',    'Austin', 'TX', '78741', 'small'),
    ('d3000000-0000-0000-0000-00000000010c', v_customer_id, '1100 Shady Ln',          'Austin', 'TX', '78721', 'medium'),
    ('d3000000-0000-0000-0000-00000000010d', v_customer_id, '4200 Airport Blvd',      'Austin', 'TX', '78722', 'large'),
    ('d3000000-0000-0000-0000-00000000010e', v_customer_id, '6800 E Riverside Dr',    'Austin', 'TX', '78741', 'medium'),
    -- Zone 4: Round Rock (5 properties)
    ('d3000000-0000-0000-0000-00000000010f', v_customer_id, '1401 S AW Grimes Blvd',  'Round Rock', 'TX', '78664', 'large'),
    ('d3000000-0000-0000-0000-000000000110', v_customer_id, '2701 Parker Rd',         'Round Rock', 'TX', '78665', 'medium'),
    ('d3000000-0000-0000-0000-000000000111', v_customer_id, '901 Round Rock Ave',     'Round Rock', 'TX', '78681', 'small'),
    ('d3000000-0000-0000-0000-000000000112', v_customer_id, '3400 Sunrise Rd',        'Round Rock', 'TX', '78665', 'medium'),
    ('d3000000-0000-0000-0000-000000000113', v_customer_id, '1200 E Palm Valley Blvd','Round Rock', 'TX', '78664', 'large'),
    -- Zone 5: Cedar Park (5 properties)
    ('d3000000-0000-0000-0000-000000000114', v_customer_id, '401 Cypress Creek Rd',   'Cedar Park', 'TX', '78613', 'medium'),
    ('d3000000-0000-0000-0000-000000000115', v_customer_id, '1890 Ranch Blvd',        'Cedar Park', 'TX', '78613', 'large'),
    ('d3000000-0000-0000-0000-000000000116', v_customer_id, '200 S Bell Blvd',        'Cedar Park', 'TX', '78613', 'small'),
    ('d3000000-0000-0000-0000-000000000117', v_customer_id, '1150 Discovery Blvd',    'Cedar Park', 'TX', '78613', 'medium'),
    ('d3000000-0000-0000-0000-000000000118', v_customer_id, '3000 Lakeline Blvd',     'Cedar Park', 'TX', '78613', 'large')
  ON CONFLICT (id) DO NOTHING;

  -- D2. Subscriptions (sub for prop1 exists; add 24 more)
  --     Mix: 20 active, 2 trialing, 2 past_due, 1 paused
  INSERT INTO subscriptions (id, customer_id, property_id, zone_id, plan_id, entitlement_version_id, status,
    current_period_start, current_period_end, billing_cycle_start_at, billing_cycle_end_at, billing_cycle_length_days) VALUES
    -- Central zone (4 new — prop1 already has a sub)
    ('d3000000-0000-0000-0000-000000000201', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_zone1, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000202', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_zone1, v_plan3, v_ent3, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000203', v_customer_id, 'd3000000-0000-0000-0000-000000000103', v_zone1, v_plan1, v_ent1, 'trialing',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000204', v_customer_id, 'd3000000-0000-0000-0000-000000000104', v_zone1, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    -- South zone (5)
    ('d3000000-0000-0000-0000-000000000205', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_zone2, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000206', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_zone2, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000207', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_zone2, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000208', v_customer_id, 'd3000000-0000-0000-0000-000000000108', v_zone2, v_plan3, v_ent3, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000209', v_customer_id, 'd3000000-0000-0000-0000-000000000109', v_zone2, v_plan2, v_ent2, 'past_due',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    -- East zone (5)
    ('d3000000-0000-0000-0000-00000000020a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_zone3, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-00000000020b', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_zone3, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-00000000020c', v_customer_id, 'd3000000-0000-0000-0000-00000000010c', v_zone3, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-00000000020d', v_customer_id, 'd3000000-0000-0000-0000-00000000010d', v_zone3, v_plan3, v_ent3, 'trialing',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-00000000020e', v_customer_id, 'd3000000-0000-0000-0000-00000000010e', v_zone3, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    -- Round Rock (5)
    ('d3000000-0000-0000-0000-00000000020f', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_zone4, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000210', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_zone4, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000211', v_customer_id, 'd3000000-0000-0000-0000-000000000111', v_zone4, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000212', v_customer_id, 'd3000000-0000-0000-0000-000000000112', v_zone4, v_plan1, v_ent1, 'past_due',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000213', v_customer_id, 'd3000000-0000-0000-0000-000000000113', v_zone4, v_plan3, v_ent3, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    -- Cedar Park (5)
    ('d3000000-0000-0000-0000-000000000214', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_zone5, v_plan2, v_ent2, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000215', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_zone5, v_plan3, v_ent3, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000216', v_customer_id, 'd3000000-0000-0000-0000-000000000116', v_zone5, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000217', v_customer_id, 'd3000000-0000-0000-0000-000000000117', v_zone5, v_plan2, v_ent2, 'paused',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30),
    ('d3000000-0000-0000-0000-000000000218', v_customer_id, 'd3000000-0000-0000-0000-000000000118', v_zone5, v_plan1, v_ent1, 'active',
      date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30)
  ON CONFLICT (id) DO NOTHING;

  -- D3. Routines (1 per active subscription, prop1 routine already exists)
  INSERT INTO routines (id, customer_id, property_id, plan_id, zone_id, status, cadence_anchor_date, effective_at) VALUES
    ('d3000000-0000-0000-0000-000000000301', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_plan2, v_zone1, 'active', (now() - interval '60 days')::date, now() - interval '60 days'),
    ('d3000000-0000-0000-0000-000000000302', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_plan3, v_zone1, 'active', (now() - interval '45 days')::date, now() - interval '45 days'),
    ('d3000000-0000-0000-0000-000000000305', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_plan2, v_zone2, 'active', (now() - interval '70 days')::date, now() - interval '70 days'),
    ('d3000000-0000-0000-0000-000000000306', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_plan1, v_zone2, 'active', (now() - interval '50 days')::date, now() - interval '50 days'),
    ('d3000000-0000-0000-0000-000000000307', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_plan2, v_zone2, 'active', (now() - interval '55 days')::date, now() - interval '55 days'),
    ('d3000000-0000-0000-0000-00000000030a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_plan2, v_zone3, 'active', (now() - interval '50 days')::date, now() - interval '50 days'),
    ('d3000000-0000-0000-0000-00000000030b', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_plan1, v_zone3, 'active', (now() - interval '40 days')::date, now() - interval '40 days'),
    ('d3000000-0000-0000-0000-00000000030f', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_plan2, v_zone4, 'active', (now() - interval '35 days')::date, now() - interval '35 days'),
    ('d3000000-0000-0000-0000-000000000310', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_plan1, v_zone4, 'active', (now() - interval '30 days')::date, now() - interval '30 days'),
    ('d3000000-0000-0000-0000-000000000314', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_plan2, v_zone5, 'active', (now() - interval '30 days')::date, now() - interval '30 days'),
    ('d3000000-0000-0000-0000-000000000315', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_plan3, v_zone5, 'active', (now() - interval '25 days')::date, now() - interval '25 days')
  ON CONFLICT (id) DO NOTHING;

  -- D4. Routine versions
  INSERT INTO routine_versions (id, routine_id, version_number, status, effective_date, locked_at) VALUES
    ('d3000000-0000-0000-0000-000000000401', 'd3000000-0000-0000-0000-000000000301', 1, 'locked', (now() - interval '60 days')::date, now() - interval '60 days'),
    ('d3000000-0000-0000-0000-000000000402', 'd3000000-0000-0000-0000-000000000302', 1, 'locked', (now() - interval '45 days')::date, now() - interval '45 days'),
    ('d3000000-0000-0000-0000-000000000405', 'd3000000-0000-0000-0000-000000000305', 1, 'locked', (now() - interval '70 days')::date, now() - interval '70 days'),
    ('d3000000-0000-0000-0000-000000000406', 'd3000000-0000-0000-0000-000000000306', 1, 'locked', (now() - interval '50 days')::date, now() - interval '50 days'),
    ('d3000000-0000-0000-0000-000000000407', 'd3000000-0000-0000-0000-000000000307', 1, 'locked', (now() - interval '55 days')::date, now() - interval '55 days'),
    ('d3000000-0000-0000-0000-00000000040a', 'd3000000-0000-0000-0000-00000000030a', 1, 'locked', (now() - interval '50 days')::date, now() - interval '50 days'),
    ('d3000000-0000-0000-0000-00000000040b', 'd3000000-0000-0000-0000-00000000030b', 1, 'locked', (now() - interval '40 days')::date, now() - interval '40 days'),
    ('d3000000-0000-0000-0000-00000000040f', 'd3000000-0000-0000-0000-00000000030f', 1, 'locked', (now() - interval '35 days')::date, now() - interval '35 days'),
    ('d3000000-0000-0000-0000-000000000410', 'd3000000-0000-0000-0000-000000000310', 1, 'locked', (now() - interval '30 days')::date, now() - interval '30 days'),
    ('d3000000-0000-0000-0000-000000000414', 'd3000000-0000-0000-0000-000000000314', 1, 'locked', (now() - interval '30 days')::date, now() - interval '30 days'),
    ('d3000000-0000-0000-0000-000000000415', 'd3000000-0000-0000-0000-000000000315', 1, 'locked', (now() - interval '25 days')::date, now() - interval '25 days')
  ON CONFLICT (id) DO NOTHING;

  -- D5. Routine items (varying service mixes)
  INSERT INTO routine_items (id, routine_version_id, sku_id, sku_name, cadence_type, cadence_detail, duration_minutes) VALUES
    -- Routine 301: Standard plan — mow + edge
    ('d3000000-0000-0000-0000-000000000501', 'd3000000-0000-0000-0000-000000000401', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "tuesday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000502', 'd3000000-0000-0000-0000-000000000401', v_sku_edge, 'Edge & Trim',  'biweekly', '{"day_of_week": "tuesday", "week_parity": "even"}'::jsonb, 15),
    -- Routine 302: Premium — mow + edge + window + hedge
    ('d3000000-0000-0000-0000-000000000503', 'd3000000-0000-0000-0000-000000000402', v_sku_mow,    'Standard Mow',    'weekly',   '{"day_of_week": "wednesday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000504', 'd3000000-0000-0000-0000-000000000402', v_sku_edge,   'Edge & Trim',     'weekly',   '{"day_of_week": "wednesday"}'::jsonb, 15),
    ('d3000000-0000-0000-0000-000000000505', 'd3000000-0000-0000-0000-000000000402', v_sku_window, 'Window Cleaning', 'monthly',  '{"week_of_month": 2}'::jsonb, 45),
    ('d3000000-0000-0000-0000-000000000506', 'd3000000-0000-0000-0000-000000000402', v_sku_hedge,  'Hedge Trimming',  'monthly',  '{"week_of_month": 4}'::jsonb, 30),
    -- Routine 305: Standard — mow + pest
    ('d3000000-0000-0000-0000-000000000507', 'd3000000-0000-0000-0000-000000000405', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "thursday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000508', 'd3000000-0000-0000-0000-000000000405', v_sku_pest, 'Pest Control', 'monthly',  '{"week_of_month": 1}'::jsonb, 20),
    -- Routine 306: Basic — mow only
    ('d3000000-0000-0000-0000-000000000509', 'd3000000-0000-0000-0000-000000000406', v_sku_mow, 'Standard Mow', 'weekly', '{"day_of_week": "wednesday"}'::jsonb, 30),
    -- Routine 307: Standard — mow + edge + leaf
    ('d3000000-0000-0000-0000-00000000050a', 'd3000000-0000-0000-0000-000000000407', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "thursday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-00000000050b', 'd3000000-0000-0000-0000-000000000407', v_sku_edge, 'Edge & Trim',  'biweekly', '{"day_of_week": "thursday", "week_parity": "odd"}'::jsonb, 15),
    ('d3000000-0000-0000-0000-00000000050c', 'd3000000-0000-0000-0000-000000000407', v_sku_leaf, 'Leaf Blowoff', 'biweekly', '{"day_of_week": "thursday", "week_parity": "even"}'::jsonb, 20),
    -- Routine 30a: Standard — mow + edge
    ('d3000000-0000-0000-0000-00000000050d', 'd3000000-0000-0000-0000-00000000040a', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "friday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-00000000050e', 'd3000000-0000-0000-0000-00000000040a', v_sku_edge, 'Edge & Trim',  'biweekly', '{"day_of_week": "friday", "week_parity": "odd"}'::jsonb, 15),
    -- Routine 30b: Basic — mow
    ('d3000000-0000-0000-0000-00000000050f', 'd3000000-0000-0000-0000-00000000040b', v_sku_mow, 'Standard Mow', 'weekly', '{"day_of_week": "friday"}'::jsonb, 30),
    -- Routine 30f: Standard — mow + edge
    ('d3000000-0000-0000-0000-000000000510', 'd3000000-0000-0000-0000-00000000040f', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "monday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000511', 'd3000000-0000-0000-0000-00000000040f', v_sku_edge, 'Edge & Trim',  'biweekly', '{"day_of_week": "monday", "week_parity": "even"}'::jsonb, 15),
    -- Routine 310: Basic — mow
    ('d3000000-0000-0000-0000-000000000512', 'd3000000-0000-0000-0000-000000000410', v_sku_mow, 'Standard Mow', 'weekly', '{"day_of_week": "monday"}'::jsonb, 30),
    -- Routine 314: Standard — mow + edge
    ('d3000000-0000-0000-0000-000000000513', 'd3000000-0000-0000-0000-000000000414', v_sku_mow,  'Standard Mow', 'weekly',   '{"day_of_week": "friday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000514', 'd3000000-0000-0000-0000-000000000414', v_sku_edge, 'Edge & Trim',  'biweekly', '{"day_of_week": "friday", "week_parity": "odd"}'::jsonb, 15),
    -- Routine 315: Premium — mow + edge + window + power wash
    ('d3000000-0000-0000-0000-000000000515', 'd3000000-0000-0000-0000-000000000415', v_sku_mow,    'Standard Mow',    'weekly',  '{"day_of_week": "friday"}'::jsonb, 30),
    ('d3000000-0000-0000-0000-000000000516', 'd3000000-0000-0000-0000-000000000415', v_sku_edge,   'Edge & Trim',     'weekly',  '{"day_of_week": "friday"}'::jsonb, 15),
    ('d3000000-0000-0000-0000-000000000517', 'd3000000-0000-0000-0000-000000000415', v_sku_window, 'Window Cleaning', 'monthly', '{"week_of_month": 1}'::jsonb, 45),
    ('d3000000-0000-0000-0000-000000000518', 'd3000000-0000-0000-0000-000000000415', v_sku_power,  'Power Wash',      'monthly', '{"week_of_month": 3}'::jsonb, 60)
  ON CONFLICT (id) DO NOTHING;

  -- D6. Service day assignments
  INSERT INTO service_day_assignments (id, customer_id, property_id, zone_id, day_of_week, service_window, status) VALUES
    ('d3000000-0000-0000-0000-000000000601', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_zone1, 'tuesday',   'morning',   'confirmed'),
    ('d3000000-0000-0000-0000-000000000602', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_zone1, 'wednesday', 'morning',   'confirmed'),
    ('d3000000-0000-0000-0000-000000000605', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_zone2, 'thursday',  'morning',   'confirmed'),
    ('d3000000-0000-0000-0000-000000000606', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_zone2, 'wednesday', 'afternoon', 'confirmed'),
    ('d3000000-0000-0000-0000-000000000607', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_zone2, 'thursday',  'any',       'confirmed'),
    ('d3000000-0000-0000-0000-00000000060a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_zone3, 'friday',    'morning',   'confirmed'),
    ('d3000000-0000-0000-0000-00000000060b', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_zone3, 'friday',    'afternoon', 'confirmed'),
    ('d3000000-0000-0000-0000-00000000060f', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_zone4, 'monday',    'any',       'confirmed'),
    ('d3000000-0000-0000-0000-000000000610', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_zone4, 'monday',    'morning',   'confirmed'),
    ('d3000000-0000-0000-0000-000000000614', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_zone5, 'friday',    'any',       'confirmed'),
    ('d3000000-0000-0000-0000-000000000615', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_zone5, 'friday',    'morning',   'confirmed')
  ON CONFLICT (id) DO NOTHING;

  -- D7. Property health scores
  INSERT INTO property_health_scores (id, customer_id, property_id, overall_score, previous_overall_score, coverage_score, regularity_score, issue_score, seasonal_score, computed_at) VALUES
    ('d3000000-0000-0000-0000-000000000701', v_customer_id, 'd3000000-0000-0000-0000-000000000101', 88, 82, 92, 90, 80, 90, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000702', v_customer_id, 'd3000000-0000-0000-0000-000000000102', 94, 91, 98, 95, 88, 95, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000705', v_customer_id, 'd3000000-0000-0000-0000-000000000105', 85, 80, 88, 85, 78, 89, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000706', v_customer_id, 'd3000000-0000-0000-0000-000000000106', 72, 70, 75, 70, 68, 75, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000707', v_customer_id, 'd3000000-0000-0000-0000-000000000107', 79, 75, 82, 78, 74, 82, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-00000000070a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', 81, 78, 84, 80, 76, 84, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-00000000070b', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', 68, 65, 70, 66, 64, 72, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-00000000070f', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', 77, 73, 80, 76, 72, 80, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000710', v_customer_id, 'd3000000-0000-0000-0000-000000000110', 74, 70, 76, 72, 70, 78, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000714', v_customer_id, 'd3000000-0000-0000-0000-000000000114', 83, 80, 86, 82, 78, 86, now() - interval '2 hours'),
    ('d3000000-0000-0000-0000-000000000715', v_customer_id, 'd3000000-0000-0000-0000-000000000115', 91, 87, 95, 92, 85, 92, now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  -- D8. Customer payment methods
  INSERT INTO customer_payment_methods (id, customer_id, brand, last4, exp_month, exp_year, is_default, status, processor_ref) VALUES
    ('d3000000-0000-0000-0000-000000000801', v_customer_id, 'visa',       '4242', 12, 2027, true,  'active', 'pm_seed_visa_4242'),
    ('d3000000-0000-0000-0000-000000000802', v_customer_id, 'mastercard', '5555', 6,  2028, false, 'active', 'pm_seed_mc_5555')
  ON CONFLICT (id) DO NOTHING;

  -- D9. Customer credits
  INSERT INTO customer_credits (id, customer_id, amount_cents, reason, status) VALUES
    ('d3000000-0000-0000-0000-000000000810', v_customer_id, 2500, 'Referral bonus — friend signed up',       'available'),
    ('d3000000-0000-0000-0000-000000000811', v_customer_id, 1500, 'Service quality credit — missed edge',     'available'),
    ('d3000000-0000-0000-0000-000000000812', v_customer_id, 500,  'Welcome credit — first month',             'applied'),
    ('d3000000-0000-0000-0000-000000000813', v_customer_id, 1000, 'Promotional — summer launch',              'available'),
    ('d3000000-0000-0000-0000-000000000814', v_customer_id, 2000, 'Referral bonus — neighbor joined',         'available'),
    ('d3000000-0000-0000-0000-000000000815', v_customer_id, 750,  'Quality credit — late arrival',             'available'),
    ('d3000000-0000-0000-0000-000000000816', v_customer_id, 1000, 'Loyalty reward — 3 month streak',          'available'),
    ('d3000000-0000-0000-0000-000000000817', v_customer_id, 500,  'Feedback credit — completed survey',       'applied')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Phase A-D complete: Geography, Plans, Providers, Customers';
END $$;

-- ════════════════════════════════════════════════════════════
-- PHASE E: JOBS & WORK HISTORY
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_customer_id uuid := '7cfa1714-bf93-441f-99c0-4bc3e24a284c';
  v_provider_id uuid;
  v_admin_id    uuid;

  -- Zones
  v_zone1 uuid := 'b1000000-0000-0000-0000-000000000001';
  v_zone2 uuid := 'b1000000-0000-0000-0000-000000000002';
  v_zone3 uuid := 'b1000000-0000-0000-0000-000000000003';
  v_zone4 uuid := 'b1000000-0000-0000-0000-000000000004';
  v_zone5 uuid := 'b1000000-0000-0000-0000-000000000005';

  -- Provider orgs
  v_org1 uuid := 'f1000000-0000-0000-0000-000000000001';
  v_org2 uuid := 'f2000000-0000-0000-0000-000000000001';
  v_org3 uuid := 'f2000000-0000-0000-0000-000000000002';
  v_org4 uuid := 'f2000000-0000-0000-0000-000000000003';
  v_org5 uuid := 'f2000000-0000-0000-0000-000000000004';
  v_org6 uuid := 'f2000000-0000-0000-0000-000000000005';
  v_org7 uuid := 'f2000000-0000-0000-0000-000000000006';

  -- Properties (existing + new)
  v_prop1 uuid := 'edfedf3d-251d-4de7-89a8-1ce5f439e12e';

  -- SKUs
  v_sku_mow    uuid := 'c1000000-0000-0000-0000-000000000001';
  v_sku_edge   uuid := 'c1000000-0000-0000-0000-000000000002';
  v_sku_leaf   uuid := 'c1000000-0000-0000-0000-000000000003';
  v_sku_hedge  uuid := 'c1000000-0000-0000-0000-000000000004';
  v_sku_window uuid := 'c1000000-0000-0000-0000-000000000009';
  v_sku_pest   uuid := 'c1000000-0000-0000-0000-00000000000c';
  v_sku_poop   uuid := 'c1000000-0000-0000-0000-00000000000d';

BEGIN
  SELECT id INTO v_provider_id FROM auth.users
    WHERE email = current_setting('app.provider_email', true) LIMIT 1;
  IF v_provider_id IS NULL THEN v_provider_id := v_customer_id; END IF;
  SELECT id INTO v_admin_id FROM auth.users
    WHERE email = current_setting('app.admin_email', true) LIMIT 1;
  IF v_admin_id IS NULL THEN v_admin_id := v_customer_id; END IF;

  -- ── E1. HISTORICAL COMPLETED JOBS (past 30 days — ~90 jobs) ──
  -- Day 1-10 (60-90 days ago): ramp-up — 2-3 jobs/day
  -- Using d3001xxx for job IDs

  -- 90 days ago: 2 jobs
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at, provider_summary) VALUES
    ('d3001000-0000-0000-0000-000000000001', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '90 days')::date, now() - interval '90 days' + interval '8 hours',  now() - interval '90 days' + interval '9 hours',   'Standard mow completed. Lawn in good condition.'),
    ('d3001000-0000-0000-0000-000000000002', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '90 days')::date, now() - interval '90 days' + interval '10 hours', now() - interval '90 days' + interval '11 hours',  'Full edge and trim along all walkways.'),
    -- 83 days ago: 2 jobs
    ('d3001000-0000-0000-0000-000000000003', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '83 days')::date, now() - interval '83 days' + interval '8 hours',  now() - interval '83 days' + interval '9 hours 30 minutes', 'Mow and edge on south property. Clean cut.'),
    ('d3001000-0000-0000-0000-000000000004', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'COMPLETED', (now() - interval '83 days')::date, now() - interval '83 days' + interval '10 hours', now() - interval '83 days' + interval '11 hours',  'Basic mow completed.'),
    -- 76 days ago: 3 jobs
    ('d3001000-0000-0000-0000-000000000005', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '76 days')::date, now() - interval '76 days' + interval '8 hours',  now() - interval '76 days' + interval '9 hours 15 minutes', 'Weekly mow — yard looking great.'),
    ('d3001000-0000-0000-0000-000000000006', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '76 days')::date, now() - interval '76 days' + interval '9 hours',  now() - interval '76 days' + interval '10 hours 30 minutes','East side mow. Cleaned up nicely.'),
    ('d3001000-0000-0000-0000-000000000007', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '76 days')::date, now() - interval '76 days' + interval '13 hours', now() - interval '76 days' + interval '14 hours 15 minutes','Afternoon mow with leaf cleanup.'),
    -- 69 days ago: 3 jobs
    ('d3001000-0000-0000-0000-000000000008', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '69 days')::date, now() - interval '69 days' + interval '8 hours',  now() - interval '69 days' + interval '9 hours',   'Mow and edge. Applied weed treatment to front beds.'),
    ('d3001000-0000-0000-0000-000000000009', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '69 days')::date, now() - interval '69 days' + interval '10 hours', now() - interval '69 days' + interval '11 hours',  'Standard mow — south zone route complete.'),
    ('d3001000-0000-0000-0000-00000000000a', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_org3, v_zone3, 'COMPLETED', (now() - interval '69 days')::date, now() - interval '69 days' + interval '14 hours', now() - interval '69 days' + interval '15 hours',  'Quick mow on small lot.'),
    -- 62 days ago: 3 jobs
    ('d3001000-0000-0000-0000-00000000000b', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '62 days')::date, now() - interval '62 days' + interval '8 hours',  now() - interval '62 days' + interval '9 hours',   'Weekly service. Everything looks good.'),
    ('d3001000-0000-0000-0000-00000000000c', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'COMPLETED', (now() - interval '62 days')::date, now() - interval '62 days' + interval '10 hours', now() - interval '62 days' + interval '10 hours 45 minutes','Basic mow complete.'),
    ('d3001000-0000-0000-0000-00000000000d', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '62 days')::date, now() - interval '62 days' + interval '13 hours', now() - interval '62 days' + interval '14 hours',  'Mow and edge along drive.'),
    -- 55 days ago: 4 jobs (growth phase)
    ('d3001000-0000-0000-0000-00000000000e', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '55 days')::date, now() - interval '55 days' + interval '8 hours',  now() - interval '55 days' + interval '9 hours',   'Standard mow service.'),
    ('d3001000-0000-0000-0000-00000000000f', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '55 days')::date, now() - interval '55 days' + interval '10 hours', now() - interval '55 days' + interval '11 hours 15 minutes','Mow with pest inspection.'),
    ('d3001000-0000-0000-0000-000000000010', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'COMPLETED', (now() - interval '55 days')::date, now() - interval '55 days' + interval '9 hours',  now() - interval '55 days' + interval '10 hours',  'First service in Round Rock. Great start.'),
    ('d3001000-0000-0000-0000-000000000011', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'COMPLETED', (now() - interval '55 days')::date, now() - interval '55 days' + interval '14 hours', now() - interval '55 days' + interval '15 hours',  'Cedar Park service complete.'),
    -- 48 days ago: 5 jobs
    ('d3001000-0000-0000-0000-000000000012', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '48 days')::date, now() - interval '48 days' + interval '8 hours',  now() - interval '48 days' + interval '9 hours',   'Weekly mow.'),
    ('d3001000-0000-0000-0000-000000000013', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '48 days')::date, now() - interval '48 days' + interval '10 hours', now() - interval '48 days' + interval '11 hours',  'Mow and edge with leaf blowoff.'),
    ('d3001000-0000-0000-0000-000000000014', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '48 days')::date, now() - interval '48 days' + interval '9 hours',  now() - interval '48 days' + interval '10 hours',  'East zone mow.'),
    ('d3001000-0000-0000-0000-000000000015', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'COMPLETED', (now() - interval '48 days')::date, now() - interval '48 days' + interval '13 hours', now() - interval '48 days' + interval '14 hours',  'Round Rock mow service.'),
    ('d3001000-0000-0000-0000-000000000016', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'COMPLETED', (now() - interval '48 days')::date, now() - interval '48 days' + interval '14 hours', now() - interval '48 days' + interval '15 hours 30 minutes','Premium service — mow, edge, hedge trim.'),
    -- 41 days ago: 5 jobs
    ('d3001000-0000-0000-0000-000000000017', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org6, v_zone1, 'COMPLETED', (now() - interval '41 days')::date, now() - interval '41 days' + interval '8 hours',  now() - interval '41 days' + interval '9 hours 30 minutes', 'Window cleaning — all exterior glass sparkling.'),
    ('d3001000-0000-0000-0000-000000000018', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '41 days')::date, now() - interval '41 days' + interval '10 hours', now() - interval '41 days' + interval '11 hours',  'Regular mow service.'),
    ('d3001000-0000-0000-0000-000000000019', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '41 days')::date, now() - interval '41 days' + interval '9 hours',  now() - interval '41 days' + interval '10 hours',  'Mow with full edge trim.'),
    ('d3001000-0000-0000-0000-00000000001a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '41 days')::date, now() - interval '41 days' + interval '13 hours', now() - interval '41 days' + interval '14 hours',  'Weekly service — East zone.'),
    ('d3001000-0000-0000-0000-00000000001b', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'COMPLETED', (now() - interval '41 days')::date, now() - interval '41 days' + interval '14 hours', now() - interval '41 days' + interval '15 hours',  'Mow and leaf cleanup.'),
    -- 34 days ago: 6 jobs (steady state)
    ('d3001000-0000-0000-0000-00000000001c', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '8 hours',  now() - interval '34 days' + interval '9 hours',   'Perfect cut this week.'),
    ('d3001000-0000-0000-0000-00000000001d', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org1, v_zone1, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '10 hours', now() - interval '34 days' + interval '11 hours 30 minutes','Premium service — mow, edge, hedge.'),
    ('d3001000-0000-0000-0000-00000000001e', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '9 hours',  now() - interval '34 days' + interval '10 hours',  'Clean mow on south property.'),
    ('d3001000-0000-0000-0000-00000000001f', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '8 hours',  now() - interval '34 days' + interval '9 hours',   'East zone routine complete.'),
    ('d3001000-0000-0000-0000-000000000020', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '14 hours', now() - interval '34 days' + interval '15 hours',  'Round Rock service.'),
    ('d3001000-0000-0000-0000-000000000021', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'COMPLETED', (now() - interval '34 days')::date, now() - interval '34 days' + interval '13 hours', now() - interval '34 days' + interval '14 hours',  'Cedar Park mow and edge.'),
    -- 27 days ago: 6 jobs
    ('d3001000-0000-0000-0000-000000000022', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '8 hours',  now() - interval '27 days' + interval '9 hours',   'Standard service.'),
    ('d3001000-0000-0000-0000-000000000023', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '10 hours', now() - interval '27 days' + interval '10 hours 45 minutes','Quick mow.'),
    ('d3001000-0000-0000-0000-000000000024', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '13 hours', now() - interval '27 days' + interval '14 hours',  'Mow with pest treatment.'),
    ('d3001000-0000-0000-0000-000000000025', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_org3, v_zone3, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '9 hours',  now() - interval '27 days' + interval '9 hours 45 minutes', 'Small lot mow.'),
    ('d3001000-0000-0000-0000-000000000026', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '8 hours',  now() - interval '27 days' + interval '9 hours',   'Mow and edge — Round Rock.'),
    ('d3001000-0000-0000-0000-000000000027', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'COMPLETED', (now() - interval '27 days')::date, now() - interval '27 days' + interval '14 hours', now() - interval '27 days' + interval '15 hours 30 minutes','Premium service with power wash.'),
    -- 20 days ago: 7 jobs
    ('d3001000-0000-0000-0000-000000000028', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '8 hours',  now() - interval '20 days' + interval '9 hours',   'Great cut this week.'),
    ('d3001000-0000-0000-0000-000000000029', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org6, v_zone1, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '10 hours', now() - interval '20 days' + interval '11 hours',  'Power wash — driveway and patio gleaming.'),
    ('d3001000-0000-0000-0000-00000000002a', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '9 hours',  now() - interval '20 days' + interval '10 hours',  'South zone mow.'),
    ('d3001000-0000-0000-0000-00000000002b', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '13 hours', now() - interval '20 days' + interval '13 hours 45 minutes','Quick service.'),
    ('d3001000-0000-0000-0000-00000000002c', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '8 hours',  now() - interval '20 days' + interval '9 hours',   'Mow with edge.'),
    ('d3001000-0000-0000-0000-00000000002d', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '14 hours', now() - interval '20 days' + interval '15 hours',  'Round Rock weekly.'),
    ('d3001000-0000-0000-0000-00000000002e', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'COMPLETED', (now() - interval '20 days')::date, now() - interval '20 days' + interval '9 hours',  now() - interval '20 days' + interval '10 hours',  'Cedar Park mow.'),
    -- 13 days ago: 7 jobs
    ('d3001000-0000-0000-0000-00000000002f', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '8 hours',  now() - interval '13 days' + interval '9 hours',   'Clean service.'),
    ('d3001000-0000-0000-0000-000000000030', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org1, v_zone1, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '10 hours', now() - interval '13 days' + interval '11 hours 30 minutes','Premium — full treatment.'),
    ('d3001000-0000-0000-0000-000000000031', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '9 hours',  now() - interval '13 days' + interval '10 hours',  'South mow service.'),
    ('d3001000-0000-0000-0000-000000000032', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '13 hours', now() - interval '13 days' + interval '14 hours',  'Mow with edge and leaf blowoff.'),
    ('d3001000-0000-0000-0000-000000000033', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '8 hours',  now() - interval '13 days' + interval '9 hours',   'East zone weekly.'),
    ('d3001000-0000-0000-0000-000000000034', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '14 hours', now() - interval '13 days' + interval '15 hours',  'Round Rock service.'),
    ('d3001000-0000-0000-0000-000000000035', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'COMPLETED', (now() - interval '13 days')::date, now() - interval '13 days' + interval '9 hours',  now() - interval '13 days' + interval '10 hours 30 minutes','Premium with window cleaning.'),
    -- 6 days ago: 8 jobs
    ('d3001000-0000-0000-0000-000000000036', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '8 hours',  now() - interval '6 days' + interval '9 hours',   'Perfect service.'),
    ('d3001000-0000-0000-0000-000000000037', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '10 hours', now() - interval '6 days' + interval '11 hours',  'Mow and edge.'),
    ('d3001000-0000-0000-0000-000000000038', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '8 hours',  now() - interval '6 days' + interval '9 hours',   'South zone clean.'),
    ('d3001000-0000-0000-0000-000000000039', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '10 hours', now() - interval '6 days' + interval '10 hours 45 minutes','Quick mow.'),
    ('d3001000-0000-0000-0000-00000000003a', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '9 hours',  now() - interval '6 days' + interval '10 hours',  'East zone.'),
    ('d3001000-0000-0000-0000-00000000003b', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_org3, v_zone3, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '13 hours', now() - interval '6 days' + interval '13 hours 45 minutes','Small lot mow.'),
    ('d3001000-0000-0000-0000-00000000003c', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '14 hours', now() - interval '6 days' + interval '15 hours',  'Round Rock weekly.'),
    ('d3001000-0000-0000-0000-00000000003d', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'COMPLETED', (now() - interval '6 days')::date, now() - interval '6 days' + interval '9 hours',  now() - interval '6 days' + interval '10 hours',  'Cedar Park.'),
    -- 3 days ago: 8 jobs
    ('d3001000-0000-0000-0000-00000000003e', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org1, v_zone1, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '8 hours',  now() - interval '3 days' + interval '9 hours 30 minutes', 'Premium service complete.'),
    ('d3001000-0000-0000-0000-00000000003f', v_customer_id, 'd3000000-0000-0000-0000-000000000104', v_org1, v_zone1, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '10 hours', now() - interval '3 days' + interval '11 hours',  'Standard mow.'),
    ('d3001000-0000-0000-0000-000000000040', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '9 hours',  now() - interval '3 days' + interval '10 hours',  'Mow with edge.'),
    ('d3001000-0000-0000-0000-000000000041', v_customer_id, 'd3000000-0000-0000-0000-000000000108', v_org2, v_zone2, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '13 hours', now() - interval '3 days' + interval '14 hours',  'Premium property service.'),
    ('d3001000-0000-0000-0000-000000000042', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '8 hours',  now() - interval '3 days' + interval '9 hours',   'East zone mow.'),
    ('d3001000-0000-0000-0000-000000000043', v_customer_id, 'd3000000-0000-0000-0000-00000000010d', v_org3, v_zone3, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '10 hours', now() - interval '3 days' + interval '11 hours',  'Window and mow combo.'),
    ('d3001000-0000-0000-0000-000000000044', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '14 hours', now() - interval '3 days' + interval '15 hours',  'Round Rock service.'),
    ('d3001000-0000-0000-0000-000000000045', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '9 hours',  now() - interval '3 days' + interval '10 hours 30 minutes','Cedar Park premium.')
  ON CONFLICT (id) DO NOTHING;

  -- ── E2. TODAY'S JOBS (8 total: 3 completed, 3 in-progress, 2 confirmed) ──
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at, arrived_at, provider_summary) VALUES
    -- Completed today
    ('d3001000-0000-0000-0000-000000000050', v_customer_id, v_prop1,                                v_org1, v_zone1, 'COMPLETED', now()::date, now() - interval '4 hours', now() - interval '3 hours', now() - interval '4 hours 5 minutes', 'Morning service done. Lawn looks fantastic.'),
    ('d3001000-0000-0000-0000-000000000051', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'COMPLETED', now()::date, now() - interval '3 hours', now() - interval '2 hours', now() - interval '3 hours 2 minutes', 'South zone — clean mow and edge.'),
    ('d3001000-0000-0000-0000-000000000052', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'COMPLETED', now()::date, now() - interval '5 hours', now() - interval '4 hours', now() - interval '5 hours 3 minutes', 'Early morning east zone service.'),
    -- In-progress today
    ('d3001000-0000-0000-0000-000000000053', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'IN_PROGRESS', now()::date, now() - interval '30 minutes', NULL, now() - interval '32 minutes', NULL),
    ('d3001000-0000-0000-0000-000000000054', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'IN_PROGRESS', now()::date, now() - interval '15 minutes', NULL, now() - interval '18 minutes', NULL),
    ('d3001000-0000-0000-0000-000000000055', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'IN_PROGRESS', now()::date, now() - interval '45 minutes', NULL, now() - interval '48 minutes', NULL),
    -- Confirmed (upcoming today)
    ('d3001000-0000-0000-0000-000000000056', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'NOT_STARTED', now()::date, NULL, NULL, NULL, NULL),
    ('d3001000-0000-0000-0000-000000000057', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'NOT_STARTED', now()::date, NULL, NULL, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── E3. UPCOMING JOBS (next 7 days — 20 jobs) ──
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date) VALUES
    -- Tomorrow
    ('d3001000-0000-0000-0000-000000000060', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org1, v_zone1, 'NOT_STARTED', (now() + interval '1 day')::date),
    ('d3001000-0000-0000-0000-000000000061', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_org3, v_zone3, 'NOT_STARTED', (now() + interval '1 day')::date),
    ('d3001000-0000-0000-0000-000000000062', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'NOT_STARTED', (now() + interval '1 day')::date),
    -- Day +2
    ('d3001000-0000-0000-0000-000000000063', v_customer_id, v_prop1,                                v_org1, v_zone1, 'NOT_STARTED', (now() + interval '2 days')::date),
    ('d3001000-0000-0000-0000-000000000064', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'NOT_STARTED', (now() + interval '2 days')::date),
    ('d3001000-0000-0000-0000-000000000065', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'NOT_STARTED', (now() + interval '2 days')::date),
    -- Day +3
    ('d3001000-0000-0000-0000-000000000066', v_customer_id, 'd3000000-0000-0000-0000-000000000101', v_org1, v_zone1, 'NOT_STARTED', (now() + interval '3 days')::date),
    ('d3001000-0000-0000-0000-000000000067', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'NOT_STARTED', (now() + interval '3 days')::date),
    ('d3001000-0000-0000-0000-000000000068', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'NOT_STARTED', (now() + interval '3 days')::date),
    ('d3001000-0000-0000-0000-000000000069', v_customer_id, 'd3000000-0000-0000-0000-000000000114', v_org5, v_zone5, 'NOT_STARTED', (now() + interval '3 days')::date),
    -- Day +4
    ('d3001000-0000-0000-0000-00000000006a', v_customer_id, 'd3000000-0000-0000-0000-000000000106', v_org2, v_zone2, 'NOT_STARTED', (now() + interval '4 days')::date),
    ('d3001000-0000-0000-0000-00000000006b', v_customer_id, 'd3000000-0000-0000-0000-00000000010f', v_org4, v_zone4, 'NOT_STARTED', (now() + interval '4 days')::date),
    -- Day +5
    ('d3001000-0000-0000-0000-00000000006c', v_customer_id, 'd3000000-0000-0000-0000-000000000102', v_org6, v_zone1, 'NOT_STARTED', (now() + interval '5 days')::date),
    ('d3001000-0000-0000-0000-00000000006d', v_customer_id, 'd3000000-0000-0000-0000-000000000105', v_org2, v_zone2, 'NOT_STARTED', (now() + interval '5 days')::date),
    ('d3001000-0000-0000-0000-00000000006e', v_customer_id, 'd3000000-0000-0000-0000-00000000010a', v_org3, v_zone3, 'NOT_STARTED', (now() + interval '5 days')::date),
    ('d3001000-0000-0000-0000-00000000006f', v_customer_id, 'd3000000-0000-0000-0000-000000000110', v_org4, v_zone4, 'NOT_STARTED', (now() + interval '5 days')::date),
    -- Day +6
    ('d3001000-0000-0000-0000-000000000070', v_customer_id, v_prop1,                                v_org1, v_zone1, 'NOT_STARTED', (now() + interval '6 days')::date),
    ('d3001000-0000-0000-0000-000000000071', v_customer_id, 'd3000000-0000-0000-0000-000000000107', v_org2, v_zone2, 'NOT_STARTED', (now() + interval '6 days')::date),
    ('d3001000-0000-0000-0000-000000000072', v_customer_id, 'd3000000-0000-0000-0000-000000000115', v_org5, v_zone5, 'NOT_STARTED', (now() + interval '6 days')::date),
    ('d3001000-0000-0000-0000-000000000073', v_customer_id, 'd3000000-0000-0000-0000-00000000010b', v_org3, v_zone3, 'NOT_STARTED', (now() + interval '6 days')::date)
  ON CONFLICT (id) DO NOTHING;

  -- ── E4. JOB SKUs (1-2 services per job — apply to a subset of jobs) ──
  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    -- Historical jobs: each gets mow + sometimes edge
    ('d3002000-0000-0000-0000-000000000001', 'd3001000-0000-0000-0000-000000000001', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000002', 'd3001000-0000-0000-0000-000000000002', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000003', 'd3001000-0000-0000-0000-000000000002', v_sku_edge, 'Edge & Trim',  15),
    ('d3002000-0000-0000-0000-000000000004', 'd3001000-0000-0000-0000-000000000003', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000005', 'd3001000-0000-0000-0000-000000000003', v_sku_edge, 'Edge & Trim',  15),
    ('d3002000-0000-0000-0000-000000000006', 'd3001000-0000-0000-0000-000000000004', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000007', 'd3001000-0000-0000-0000-000000000005', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000008', 'd3001000-0000-0000-0000-000000000006', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000009', 'd3001000-0000-0000-0000-000000000007', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-00000000000a', 'd3001000-0000-0000-0000-000000000007', v_sku_leaf, 'Leaf Blowoff', 20),
    ('d3002000-0000-0000-0000-00000000000b', 'd3001000-0000-0000-0000-000000000010', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-00000000000c', 'd3001000-0000-0000-0000-000000000011', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-00000000000d', 'd3001000-0000-0000-0000-000000000017', v_sku_window, 'Window Cleaning', 45),
    ('d3002000-0000-0000-0000-00000000000e', 'd3001000-0000-0000-0000-000000000016', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-00000000000f', 'd3001000-0000-0000-0000-000000000016', v_sku_edge, 'Edge & Trim',  15),
    ('d3002000-0000-0000-0000-000000000010', 'd3001000-0000-0000-0000-000000000016', v_sku_hedge,'Hedge Trimming',30),
    ('d3002000-0000-0000-0000-000000000011', 'd3001000-0000-0000-0000-000000000029', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000012', 'd3001000-0000-0000-0000-000000000035', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000013', 'd3001000-0000-0000-0000-000000000035', v_sku_window,'Window Cleaning',45),
    -- Today's completed jobs
    ('d3002000-0000-0000-0000-000000000020', 'd3001000-0000-0000-0000-000000000050', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000021', 'd3001000-0000-0000-0000-000000000050', v_sku_edge, 'Edge & Trim',  15),
    ('d3002000-0000-0000-0000-000000000022', 'd3001000-0000-0000-0000-000000000051', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000023', 'd3001000-0000-0000-0000-000000000052', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000024', 'd3001000-0000-0000-0000-000000000052', v_sku_edge, 'Edge & Trim',  15),
    -- Today's in-progress jobs
    ('d3002000-0000-0000-0000-000000000025', 'd3001000-0000-0000-0000-000000000053', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000026', 'd3001000-0000-0000-0000-000000000054', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000027', 'd3001000-0000-0000-0000-000000000054', v_sku_pest, 'Pest Control', 20),
    ('d3002000-0000-0000-0000-000000000028', 'd3001000-0000-0000-0000-000000000055', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000029', 'd3001000-0000-0000-0000-000000000055', v_sku_edge, 'Edge & Trim',  15),
    -- Upcoming jobs (select few)
    ('d3002000-0000-0000-0000-000000000030', 'd3001000-0000-0000-0000-000000000060', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000031', 'd3001000-0000-0000-0000-000000000060', v_sku_hedge,'Hedge Trimming',30),
    ('d3002000-0000-0000-0000-000000000032', 'd3001000-0000-0000-0000-000000000063', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000033', 'd3001000-0000-0000-0000-000000000063', v_sku_edge, 'Edge & Trim',  15),
    ('d3002000-0000-0000-0000-000000000034', 'd3001000-0000-0000-0000-000000000065', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000035', 'd3001000-0000-0000-0000-000000000065', v_sku_window,'Window Cleaning',45),
    ('d3002000-0000-0000-0000-000000000036', 'd3001000-0000-0000-0000-000000000070', v_sku_mow,  'Standard Mow', 30),
    ('d3002000-0000-0000-0000-000000000037', 'd3001000-0000-0000-0000-000000000070', v_sku_poop, 'Dog Poop Cleanup', 15)
  ON CONFLICT (id) DO NOTHING;

  -- ── E5. JOB CHECKLIST ITEMS (on today's in-progress jobs) ──
  INSERT INTO job_checklist_items (id, job_id, label, status, is_required) VALUES
    -- Job 053 (in-progress, central)
    ('d3002000-0000-0000-0000-000000000040', 'd3001000-0000-0000-0000-000000000053', 'Mow front yard',           'DONE',        true),
    ('d3002000-0000-0000-0000-000000000041', 'd3001000-0000-0000-0000-000000000053', 'Mow back yard',            'PENDING', true),
    ('d3002000-0000-0000-0000-000000000042', 'd3001000-0000-0000-0000-000000000053', 'Edge walkways',            'PENDING', true),
    ('d3002000-0000-0000-0000-000000000043', 'd3001000-0000-0000-0000-000000000053', 'Blow off clippings',       'PENDING', false),
    -- Job 054 (in-progress, south)
    ('d3002000-0000-0000-0000-000000000044', 'd3001000-0000-0000-0000-000000000054', 'Mow front yard',           'DONE',        true),
    ('d3002000-0000-0000-0000-000000000045', 'd3001000-0000-0000-0000-000000000054', 'Mow back yard',            'DONE',        true),
    ('d3002000-0000-0000-0000-000000000046', 'd3001000-0000-0000-0000-000000000054', 'Perimeter pest spray',     'PENDING', true),
    ('d3002000-0000-0000-0000-000000000047', 'd3001000-0000-0000-0000-000000000054', 'Inspect entry points',     'PENDING', true),
    -- Job 055 (in-progress, Round Rock)
    ('d3002000-0000-0000-0000-000000000048', 'd3001000-0000-0000-0000-000000000055', 'Mow front yard',           'DONE',        true),
    ('d3002000-0000-0000-0000-000000000049', 'd3001000-0000-0000-0000-000000000055', 'Mow side yard',            'DONE',        true),
    ('d3002000-0000-0000-0000-00000000004a', 'd3001000-0000-0000-0000-000000000055', 'Mow back yard',            'PENDING', true),
    ('d3002000-0000-0000-0000-00000000004b', 'd3001000-0000-0000-0000-000000000055', 'Edge walkways and drive',  'PENDING', true)
  ON CONFLICT (id) DO NOTHING;

  -- ── E6. JOB PHOTOS (30+ on completed jobs) ──
  INSERT INTO job_photos (id, job_id, storage_path, slot_key, upload_status, captured_at) VALUES
    -- Recent completed jobs with before/after pairs
    ('d3002000-0000-0000-0000-000000000050', 'd3001000-0000-0000-0000-000000000036', 'job-photos/seed/before-mow-1.jpg', 'before', 'UPLOADED', now() - interval '6 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-000000000051', 'd3001000-0000-0000-0000-000000000036', 'job-photos/seed/after-mow-1.jpg',  'after',  'UPLOADED', now() - interval '6 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-000000000052', 'd3001000-0000-0000-0000-000000000037', 'job-photos/seed/before-mow-2.jpg', 'before', 'UPLOADED', now() - interval '6 days' + interval '10 hours'),
    ('d3002000-0000-0000-0000-000000000053', 'd3001000-0000-0000-0000-000000000037', 'job-photos/seed/after-mow-2.jpg',  'after',  'UPLOADED', now() - interval '6 days' + interval '11 hours'),
    ('d3002000-0000-0000-0000-000000000054', 'd3001000-0000-0000-0000-000000000038', 'job-photos/seed/before-mow-3.jpg', 'before', 'UPLOADED', now() - interval '6 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-000000000055', 'd3001000-0000-0000-0000-000000000038', 'job-photos/seed/after-mow-3.jpg',  'after',  'UPLOADED', now() - interval '6 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-000000000056', 'd3001000-0000-0000-0000-00000000003a', 'job-photos/seed/before-mow-4.jpg', 'before', 'UPLOADED', now() - interval '6 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-000000000057', 'd3001000-0000-0000-0000-00000000003a', 'job-photos/seed/after-mow-4.jpg',  'after',  'UPLOADED', now() - interval '6 days' + interval '10 hours'),
    ('d3002000-0000-0000-0000-000000000058', 'd3001000-0000-0000-0000-00000000003c', 'job-photos/seed/before-mow-5.jpg', 'before', 'UPLOADED', now() - interval '6 days' + interval '14 hours'),
    ('d3002000-0000-0000-0000-000000000059', 'd3001000-0000-0000-0000-00000000003c', 'job-photos/seed/after-mow-5.jpg',  'after',  'UPLOADED', now() - interval '6 days' + interval '15 hours'),
    -- 3 days ago
    ('d3002000-0000-0000-0000-00000000005a', 'd3001000-0000-0000-0000-00000000003e', 'job-photos/seed/before-prem-1.jpg','before', 'UPLOADED', now() - interval '3 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-00000000005b', 'd3001000-0000-0000-0000-00000000003e', 'job-photos/seed/after-prem-1.jpg', 'after',  'UPLOADED', now() - interval '3 days' + interval '9 hours 30 minutes'),
    ('d3002000-0000-0000-0000-00000000005c', 'd3001000-0000-0000-0000-000000000042', 'job-photos/seed/before-east-1.jpg','before', 'UPLOADED', now() - interval '3 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-00000000005d', 'd3001000-0000-0000-0000-000000000042', 'job-photos/seed/after-east-1.jpg', 'after',  'UPLOADED', now() - interval '3 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-00000000005e', 'd3001000-0000-0000-0000-000000000044', 'job-photos/seed/before-rr-1.jpg',  'before', 'UPLOADED', now() - interval '3 days' + interval '14 hours'),
    ('d3002000-0000-0000-0000-00000000005f', 'd3001000-0000-0000-0000-000000000044', 'job-photos/seed/after-rr-1.jpg',   'after',  'UPLOADED', now() - interval '3 days' + interval '15 hours'),
    ('d3002000-0000-0000-0000-000000000060', 'd3001000-0000-0000-0000-000000000045', 'job-photos/seed/before-cp-1.jpg',  'before', 'UPLOADED', now() - interval '3 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-000000000061', 'd3001000-0000-0000-0000-000000000045', 'job-photos/seed/after-cp-1.jpg',   'after',  'UPLOADED', now() - interval '3 days' + interval '10 hours 30 minutes'),
    -- Today completed
    ('d3002000-0000-0000-0000-000000000062', 'd3001000-0000-0000-0000-000000000050', 'job-photos/seed/before-today-1.jpg','before','UPLOADED', now() - interval '4 hours'),
    ('d3002000-0000-0000-0000-000000000063', 'd3001000-0000-0000-0000-000000000050', 'job-photos/seed/after-today-1.jpg', 'after', 'UPLOADED', now() - interval '3 hours'),
    ('d3002000-0000-0000-0000-000000000064', 'd3001000-0000-0000-0000-000000000051', 'job-photos/seed/before-today-2.jpg','before','UPLOADED', now() - interval '3 hours'),
    ('d3002000-0000-0000-0000-000000000065', 'd3001000-0000-0000-0000-000000000051', 'job-photos/seed/after-today-2.jpg', 'after', 'UPLOADED', now() - interval '2 hours'),
    ('d3002000-0000-0000-0000-000000000066', 'd3001000-0000-0000-0000-000000000052', 'job-photos/seed/before-today-3.jpg','before','UPLOADED', now() - interval '5 hours'),
    ('d3002000-0000-0000-0000-000000000067', 'd3001000-0000-0000-0000-000000000052', 'job-photos/seed/after-today-3.jpg', 'after', 'UPLOADED', now() - interval '4 hours'),
    -- Older historical (13 days ago)
    ('d3002000-0000-0000-0000-000000000068', 'd3001000-0000-0000-0000-00000000002f', 'job-photos/seed/before-old-1.jpg', 'before', 'UPLOADED', now() - interval '13 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-000000000069', 'd3001000-0000-0000-0000-00000000002f', 'job-photos/seed/after-old-1.jpg',  'after',  'UPLOADED', now() - interval '13 days' + interval '9 hours'),
    ('d3002000-0000-0000-0000-00000000006a', 'd3001000-0000-0000-0000-000000000030', 'job-photos/seed/before-old-2.jpg', 'before', 'UPLOADED', now() - interval '13 days' + interval '10 hours'),
    ('d3002000-0000-0000-0000-00000000006b', 'd3001000-0000-0000-0000-000000000030', 'job-photos/seed/after-old-2.jpg',  'after',  'UPLOADED', now() - interval '13 days' + interval '11 hours 30 minutes'),
    -- 20 days ago
    ('d3002000-0000-0000-0000-00000000006c', 'd3001000-0000-0000-0000-000000000028', 'job-photos/seed/before-old-3.jpg', 'before', 'UPLOADED', now() - interval '20 days' + interval '8 hours'),
    ('d3002000-0000-0000-0000-00000000006d', 'd3001000-0000-0000-0000-000000000028', 'job-photos/seed/after-old-3.jpg',  'after',  'UPLOADED', now() - interval '20 days' + interval '9 hours')
  ON CONFLICT (id) DO NOTHING;

  -- ── E7. JOB ISSUES (5 total: 2 open, 3 resolved) ──
  INSERT INTO job_issues (id, job_id, issue_type, severity, status, description, created_by_user_id, created_by_role) VALUES
    ('d3002000-0000-0000-0000-000000000070', 'd3001000-0000-0000-0000-000000000032', 'OTHER', 'MED', 'OPEN',
      'Customer reports missed section near back fence. Requesting re-service.',
      v_customer_id, 'customer'),
    ('d3002000-0000-0000-0000-000000000071', 'd3001000-0000-0000-0000-000000000040', 'OTHER', 'LOW', 'OPEN',
      'Edge trimming not completed along south side of property.',
      v_customer_id, 'customer'),
    ('d3002000-0000-0000-0000-000000000072', 'd3001000-0000-0000-0000-000000000022', 'CUSTOMER_REQUESTED_CHANGE', 'LOW', 'RESOLVED',
      'Provider arrived 45 minutes late due to traffic.',
      v_admin_id, 'admin'),
    ('d3002000-0000-0000-0000-000000000073', 'd3001000-0000-0000-0000-000000000013', 'OTHER', 'HIGH', 'RESOLVED',
      'Sprinkler head damaged during mowing. Provider replaced at no cost.',
      v_customer_id, 'customer'),
    ('d3002000-0000-0000-0000-000000000074', 'd3001000-0000-0000-0000-00000000001c', 'SAFETY_CONCERN', 'MED', 'RESOLVED',
      'Gate left open after service. Customer reported dog got out briefly.',
      v_customer_id, 'customer')
  ON CONFLICT (id) DO NOTHING;

  -- Update resolved issues
  UPDATE job_issues SET resolved_at = created_at + interval '2 days', resolution_note = 'Provider coached on punctuality. Scheduling buffer added.' WHERE id = 'd3002000-0000-0000-0000-000000000072' AND resolved_at IS NULL;
  UPDATE job_issues SET resolved_at = created_at + interval '1 day', resolution_note = 'Sprinkler head replaced by provider. No charge. Credit issued to customer.' WHERE id = 'd3002000-0000-0000-0000-000000000073' AND resolved_at IS NULL;
  UPDATE job_issues SET resolved_at = created_at + interval '1 day', resolution_note = 'Gate protocol added to checklist. Provider reminded of pet safety procedures.' WHERE id = 'd3002000-0000-0000-0000-000000000074' AND resolved_at IS NULL;

  -- ── E8. VISIT RATINGS (feed provider_rating_summary view) ──
  INSERT INTO visit_ratings (id, job_id, customer_id, provider_org_id, rating, comment) VALUES
    ('d3002000-0000-0000-0000-000000000080', 'd3001000-0000-0000-0000-000000000036', v_customer_id, v_org1, 5, 'Excellent service as always!'),
    ('d3002000-0000-0000-0000-000000000081', 'd3001000-0000-0000-0000-000000000037', v_customer_id, v_org1, 5, 'Great job on the edge work.'),
    ('d3002000-0000-0000-0000-000000000082', 'd3001000-0000-0000-0000-000000000038', v_customer_id, v_org2, 4, 'Good service.'),
    ('d3002000-0000-0000-0000-000000000083', 'd3001000-0000-0000-0000-000000000039', v_customer_id, v_org2, 5, NULL),
    ('d3002000-0000-0000-0000-000000000084', 'd3001000-0000-0000-0000-00000000003a', v_customer_id, v_org3, 5, 'Love the attention to detail.'),
    ('d3002000-0000-0000-0000-000000000085', 'd3001000-0000-0000-0000-00000000003c', v_customer_id, v_org4, 4, 'Good but arrived a bit late.'),
    ('d3002000-0000-0000-0000-000000000086', 'd3001000-0000-0000-0000-00000000003d', v_customer_id, v_org5, 5, 'Beautiful work!'),
    ('d3002000-0000-0000-0000-000000000087', 'd3001000-0000-0000-0000-00000000003e', v_customer_id, v_org1, 5, 'Premium service is worth every penny.'),
    ('d3002000-0000-0000-0000-000000000088', 'd3001000-0000-0000-0000-000000000040', v_customer_id, v_org2, 4, 'Solid job.'),
    ('d3002000-0000-0000-0000-000000000089', 'd3001000-0000-0000-0000-000000000042', v_customer_id, v_org3, 5, 'Quick and thorough.'),
    ('d3002000-0000-0000-0000-00000000008a', 'd3001000-0000-0000-0000-000000000044', v_customer_id, v_org4, 4, NULL),
    ('d3002000-0000-0000-0000-00000000008b', 'd3001000-0000-0000-0000-000000000045', v_customer_id, v_org5, 5, 'Premium treatment is fantastic.'),
    ('d3002000-0000-0000-0000-00000000008c', 'd3001000-0000-0000-0000-000000000050', v_customer_id, v_org1, 5, 'Perfect as always.'),
    ('d3002000-0000-0000-0000-00000000008d', 'd3001000-0000-0000-0000-000000000051', v_customer_id, v_org2, 4, 'Good service today.'),
    ('d3002000-0000-0000-0000-00000000008e', 'd3001000-0000-0000-0000-000000000052', v_customer_id, v_org3, 5, NULL),
    -- Historical ratings
    ('d3002000-0000-0000-0000-00000000008f', 'd3001000-0000-0000-0000-000000000001', v_customer_id, v_org1, 4, NULL),
    ('d3002000-0000-0000-0000-000000000090', 'd3001000-0000-0000-0000-000000000005', v_customer_id, v_org1, 5, 'Great work.'),
    ('d3002000-0000-0000-0000-000000000091', 'd3001000-0000-0000-0000-00000000000b', v_customer_id, v_org1, 5, NULL),
    ('d3002000-0000-0000-0000-000000000092', 'd3001000-0000-0000-0000-000000000003', v_customer_id, v_org2, 4, NULL),
    ('d3002000-0000-0000-0000-000000000093', 'd3001000-0000-0000-0000-000000000006', v_customer_id, v_org3, 5, 'Excellent.'),
    ('d3002000-0000-0000-0000-000000000094', 'd3001000-0000-0000-0000-000000000010', v_customer_id, v_org4, 4, NULL),
    ('d3002000-0000-0000-0000-000000000095', 'd3001000-0000-0000-0000-000000000011', v_customer_id, v_org5, 5, NULL)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Phase E complete: Jobs, Photos, Ratings, Issues';
END $$;

-- ════════════════════════════════════════════════════════════
-- PHASE F: FINANCIAL
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_customer_id uuid := '7cfa1714-bf93-441f-99c0-4bc3e24a284c';

  -- Provider orgs
  v_org1 uuid := 'f1000000-0000-0000-0000-000000000001';
  v_org2 uuid := 'f2000000-0000-0000-0000-000000000001';
  v_org3 uuid := 'f2000000-0000-0000-0000-000000000002';
  v_org4 uuid := 'f2000000-0000-0000-0000-000000000003';
  v_org5 uuid := 'f2000000-0000-0000-0000-000000000004';
  v_org6 uuid := 'f2000000-0000-0000-0000-000000000005';
  v_org7 uuid := 'f2000000-0000-0000-0000-000000000006';

  v_sub1 uuid := 'f1000000-0000-0000-0000-000000000010'; -- existing sub

BEGIN
  -- ── F1. PAYOUT RUNS (8 weekly batches) ──
  INSERT INTO payout_runs (id, status, total_cents, earnings_count, started_at, completed_at) VALUES
    ('d3003000-0000-0000-0000-000000000001', 'completed', 875000,  18, now() - interval '56 days', now() - interval '56 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000002', 'completed', 1125000, 24, now() - interval '49 days', now() - interval '49 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000003', 'completed', 1350000, 28, now() - interval '42 days', now() - interval '42 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000004', 'completed', 1580000, 32, now() - interval '35 days', now() - interval '35 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000005', 'completed', 1720000, 35, now() - interval '28 days', now() - interval '28 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000006', 'completed', 1850000, 38, now() - interval '21 days', now() - interval '21 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000007', 'completed', 1950000, 40, now() - interval '14 days', now() - interval '14 days' + interval '5 minutes'),
    ('d3003000-0000-0000-0000-000000000008', 'completed', 2100000, 42, now() - interval '7 days',  now() - interval '7 days' + interval '5 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- ── F2. PROVIDER PAYOUTS (per provider per week — 2 recent weeks for 7 active providers) ──
  INSERT INTO provider_payouts (id, provider_org_id, status, total_cents, payout_run_id, paid_at, processor_payout_id) VALUES
    -- Week -14 days
    ('d3003000-0000-0000-0000-000000000010', v_org1, 'PAID', 42500, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org1_w7'),
    ('d3003000-0000-0000-0000-000000000011', v_org2, 'PAID', 55000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org2_w7'),
    ('d3003000-0000-0000-0000-000000000012', v_org3, 'PAID', 38000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org3_w7'),
    ('d3003000-0000-0000-0000-000000000013', v_org4, 'PAID', 32000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org4_w7'),
    ('d3003000-0000-0000-0000-000000000014', v_org5, 'PAID', 28000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org5_w7'),
    ('d3003000-0000-0000-0000-000000000015', v_org6, 'PAID', 35000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org6_w7'),
    ('d3003000-0000-0000-0000-000000000016', v_org7, 'PAID', 18000, 'd3003000-0000-0000-0000-000000000007', now() - interval '12 days', 'po_seed_org7_w7'),
    -- Week -7 days
    ('d3003000-0000-0000-0000-000000000020', v_org1, 'PAID', 48000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org1_w8'),
    ('d3003000-0000-0000-0000-000000000021', v_org2, 'PAID', 62000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org2_w8'),
    ('d3003000-0000-0000-0000-000000000022', v_org3, 'PAID', 42000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org3_w8'),
    ('d3003000-0000-0000-0000-000000000023', v_org4, 'PAID', 35000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org4_w8'),
    ('d3003000-0000-0000-0000-000000000024', v_org5, 'PAID', 30000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org5_w8'),
    ('d3003000-0000-0000-0000-000000000025', v_org6, 'PAID', 38000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org6_w8'),
    ('d3003000-0000-0000-0000-000000000026', v_org7, 'PAID', 15000, 'd3003000-0000-0000-0000-000000000008', now() - interval '5 days',  'po_seed_org7_w8'),
    -- Earlier weeks (select highlights)
    ('d3003000-0000-0000-0000-000000000030', v_org1, 'PAID', 38000, 'd3003000-0000-0000-0000-000000000005', now() - interval '26 days', 'po_seed_org1_w5'),
    ('d3003000-0000-0000-0000-000000000031', v_org2, 'PAID', 45000, 'd3003000-0000-0000-0000-000000000005', now() - interval '26 days', 'po_seed_org2_w5'),
    ('d3003000-0000-0000-0000-000000000032', v_org3, 'PAID', 32000, 'd3003000-0000-0000-0000-000000000005', now() - interval '26 days', 'po_seed_org3_w5')
  ON CONFLICT (id) DO NOTHING;

  -- ── F3. PROVIDER EARNINGS (100+ rows matching completed jobs) ──
  -- PAID earnings (tied to older completed jobs)
  INSERT INTO provider_earnings (id, job_id, provider_org_id, base_amount_cents, modifier_cents, total_cents, status, payout_id) VALUES
    -- Org 1 earnings (Central zone)
    ('d3003000-0000-0000-0000-000000000100', 'd3001000-0000-0000-0000-000000000001', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000030'),
    ('d3003000-0000-0000-0000-000000000101', 'd3001000-0000-0000-0000-000000000002', v_org1, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000030'),
    ('d3003000-0000-0000-0000-000000000102', 'd3001000-0000-0000-0000-000000000005', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000030'),
    ('d3003000-0000-0000-0000-000000000103', 'd3001000-0000-0000-0000-000000000008', v_org1, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000030'),
    ('d3003000-0000-0000-0000-000000000104', 'd3001000-0000-0000-0000-00000000000b', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000030'),
    ('d3003000-0000-0000-0000-000000000105', 'd3001000-0000-0000-0000-00000000000e', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000010'),
    ('d3003000-0000-0000-0000-000000000106', 'd3001000-0000-0000-0000-000000000012', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000010'),
    ('d3003000-0000-0000-0000-000000000107', 'd3001000-0000-0000-0000-000000000018', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000010'),
    ('d3003000-0000-0000-0000-000000000108', 'd3001000-0000-0000-0000-00000000001c', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000010'),
    ('d3003000-0000-0000-0000-000000000109', 'd3001000-0000-0000-0000-00000000001d', v_org1, 8500, 1000, 9500, 'PAID', 'd3003000-0000-0000-0000-000000000010'),
    ('d3003000-0000-0000-0000-00000000010a', 'd3001000-0000-0000-0000-000000000022', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    ('d3003000-0000-0000-0000-00000000010b', 'd3001000-0000-0000-0000-000000000028', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    ('d3003000-0000-0000-0000-00000000010c', 'd3001000-0000-0000-0000-00000000002f', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    ('d3003000-0000-0000-0000-00000000010d', 'd3001000-0000-0000-0000-000000000030', v_org1, 8500, 1000, 9500, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    ('d3003000-0000-0000-0000-00000000010e', 'd3001000-0000-0000-0000-000000000036', v_org1, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    ('d3003000-0000-0000-0000-00000000010f', 'd3001000-0000-0000-0000-000000000037', v_org1, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000020'),
    -- Org 2 earnings (South zone)
    ('d3003000-0000-0000-0000-000000000110', 'd3001000-0000-0000-0000-000000000003', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000031'),
    ('d3003000-0000-0000-0000-000000000111', 'd3001000-0000-0000-0000-000000000004', v_org2, 4000, 0,    4000, 'PAID', 'd3003000-0000-0000-0000-000000000031'),
    ('d3003000-0000-0000-0000-000000000112', 'd3001000-0000-0000-0000-000000000007', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000031'),
    ('d3003000-0000-0000-0000-000000000113', 'd3001000-0000-0000-0000-000000000009', v_org2, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000031'),
    ('d3003000-0000-0000-0000-000000000114', 'd3001000-0000-0000-0000-00000000000c', v_org2, 4000, 0,    4000, 'PAID', 'd3003000-0000-0000-0000-000000000011'),
    ('d3003000-0000-0000-0000-000000000115', 'd3001000-0000-0000-0000-00000000000f', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000011'),
    ('d3003000-0000-0000-0000-000000000116', 'd3001000-0000-0000-0000-000000000013', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000011'),
    ('d3003000-0000-0000-0000-000000000117', 'd3001000-0000-0000-0000-000000000019', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000011'),
    ('d3003000-0000-0000-0000-000000000118', 'd3001000-0000-0000-0000-00000000001e', v_org2, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-000000000119', 'd3001000-0000-0000-0000-000000000023', v_org2, 4000, 0,    4000, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011a', 'd3001000-0000-0000-0000-000000000024', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011b', 'd3001000-0000-0000-0000-00000000002a', v_org2, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011c', 'd3001000-0000-0000-0000-00000000002b', v_org2, 4000, 0,    4000, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011d', 'd3001000-0000-0000-0000-000000000031', v_org2, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011e', 'd3001000-0000-0000-0000-000000000032', v_org2, 5500, 500,  6000, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-00000000011f', 'd3001000-0000-0000-0000-000000000038', v_org2, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    ('d3003000-0000-0000-0000-000000000120', 'd3001000-0000-0000-0000-000000000039', v_org2, 4000, 0,    4000, 'PAID', 'd3003000-0000-0000-0000-000000000021'),
    -- Org 3 earnings (East zone)
    ('d3003000-0000-0000-0000-000000000130', 'd3001000-0000-0000-0000-000000000006', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000032'),
    ('d3003000-0000-0000-0000-000000000131', 'd3001000-0000-0000-0000-00000000000a', v_org3, 3500, 0,    3500, 'PAID', 'd3003000-0000-0000-0000-000000000032'),
    ('d3003000-0000-0000-0000-000000000132', 'd3001000-0000-0000-0000-00000000000d', v_org3, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000032'),
    ('d3003000-0000-0000-0000-000000000133', 'd3001000-0000-0000-0000-000000000014', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000012'),
    ('d3003000-0000-0000-0000-000000000134', 'd3001000-0000-0000-0000-00000000001a', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000012'),
    ('d3003000-0000-0000-0000-000000000135', 'd3001000-0000-0000-0000-00000000001f', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    ('d3003000-0000-0000-0000-000000000136', 'd3001000-0000-0000-0000-000000000025', v_org3, 3500, 0,    3500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    ('d3003000-0000-0000-0000-000000000137', 'd3001000-0000-0000-0000-00000000002c', v_org3, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    ('d3003000-0000-0000-0000-000000000138', 'd3001000-0000-0000-0000-000000000033', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    ('d3003000-0000-0000-0000-000000000139', 'd3001000-0000-0000-0000-00000000003a', v_org3, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    ('d3003000-0000-0000-0000-00000000013a', 'd3001000-0000-0000-0000-00000000003b', v_org3, 3500, 0,    3500, 'PAID', 'd3003000-0000-0000-0000-000000000022'),
    -- Org 4 earnings (Round Rock)
    ('d3003000-0000-0000-0000-000000000140', 'd3001000-0000-0000-0000-000000000010', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000013'),
    ('d3003000-0000-0000-0000-000000000141', 'd3001000-0000-0000-0000-000000000015', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000013'),
    ('d3003000-0000-0000-0000-000000000142', 'd3001000-0000-0000-0000-00000000001b', v_org4, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000013'),
    ('d3003000-0000-0000-0000-000000000143', 'd3001000-0000-0000-0000-000000000020', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000023'),
    ('d3003000-0000-0000-0000-000000000144', 'd3001000-0000-0000-0000-000000000026', v_org4, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000023'),
    ('d3003000-0000-0000-0000-000000000145', 'd3001000-0000-0000-0000-00000000002d', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000023'),
    ('d3003000-0000-0000-0000-000000000146', 'd3001000-0000-0000-0000-000000000034', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000023'),
    ('d3003000-0000-0000-0000-000000000147', 'd3001000-0000-0000-0000-00000000003c', v_org4, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000023'),
    -- Org 5 earnings (Cedar Park)
    ('d3003000-0000-0000-0000-000000000150', 'd3001000-0000-0000-0000-000000000011', v_org5, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000014'),
    ('d3003000-0000-0000-0000-000000000151', 'd3001000-0000-0000-0000-000000000016', v_org5, 8000, 1000, 9000, 'PAID', 'd3003000-0000-0000-0000-000000000014'),
    ('d3003000-0000-0000-0000-000000000152', 'd3001000-0000-0000-0000-000000000021', v_org5, 5000, 500,  5500, 'PAID', 'd3003000-0000-0000-0000-000000000024'),
    ('d3003000-0000-0000-0000-000000000153', 'd3001000-0000-0000-0000-000000000027', v_org5, 8500, 1500,10000, 'PAID', 'd3003000-0000-0000-0000-000000000024'),
    ('d3003000-0000-0000-0000-000000000154', 'd3001000-0000-0000-0000-00000000002e', v_org5, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000024'),
    ('d3003000-0000-0000-0000-000000000155', 'd3001000-0000-0000-0000-000000000035', v_org5, 8500, 1000, 9500, 'PAID', 'd3003000-0000-0000-0000-000000000024'),
    ('d3003000-0000-0000-0000-000000000156', 'd3001000-0000-0000-0000-00000000003d', v_org5, 4500, 0,    4500, 'PAID', 'd3003000-0000-0000-0000-000000000024'),
    -- Org 6 earnings (Central — windows/power wash)
    ('d3003000-0000-0000-0000-000000000160', 'd3001000-0000-0000-0000-000000000017', v_org6, 6500, 0,    6500, 'PAID', 'd3003000-0000-0000-0000-000000000015'),
    ('d3003000-0000-0000-0000-000000000161', 'd3001000-0000-0000-0000-000000000029', v_org6, 8500, 0,    8500, 'PAID', 'd3003000-0000-0000-0000-000000000025'),

    -- ELIGIBLE earnings (recent completed, not yet paid)
    ('d3003000-0000-0000-0000-000000000170', 'd3001000-0000-0000-0000-00000000003e', v_org1, 8500, 1000, 9500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000171', 'd3001000-0000-0000-0000-00000000003f', v_org1, 4500, 0,    4500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000172', 'd3001000-0000-0000-0000-000000000040', v_org2, 5500, 500,  6000, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000173', 'd3001000-0000-0000-0000-000000000041', v_org2, 7500, 1000, 8500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000174', 'd3001000-0000-0000-0000-000000000042', v_org3, 4500, 0,    4500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000175', 'd3001000-0000-0000-0000-000000000043', v_org3, 5500, 500,  6000, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000176', 'd3001000-0000-0000-0000-000000000044', v_org4, 4500, 0,    4500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000177', 'd3001000-0000-0000-0000-000000000045', v_org5, 8500, 1500,10000, 'ELIGIBLE', NULL),
    -- Today completed
    ('d3003000-0000-0000-0000-000000000178', 'd3001000-0000-0000-0000-000000000050', v_org1, 5500, 500,  6000, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-000000000179', 'd3001000-0000-0000-0000-000000000051', v_org2, 4500, 0,    4500, 'ELIGIBLE', NULL),
    ('d3003000-0000-0000-0000-00000000017a', 'd3001000-0000-0000-0000-000000000052', v_org3, 5000, 500,  5500, 'ELIGIBLE', NULL),

    -- HELD earnings (use in-progress/upcoming jobs not yet in earnings)
    ('d3003000-0000-0000-0000-000000000180', 'd3001000-0000-0000-0000-000000000053', v_org1, 5500, 500,  6000, 'HELD', NULL),
    ('d3003000-0000-0000-0000-000000000181', 'd3001000-0000-0000-0000-000000000054', v_org2, 4500, 0,    4500, 'HELD', NULL),
    ('d3003000-0000-0000-0000-000000000182', 'd3001000-0000-0000-0000-000000000055', v_org4, 5500, 500,  6000, 'HELD', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Set hold reasons on held earnings
  UPDATE provider_earnings SET hold_reason = 'quality_issue', hold_until = now() + interval '14 days' WHERE id = 'd3003000-0000-0000-0000-000000000180' AND hold_reason IS NULL;
  UPDATE provider_earnings SET hold_reason = 'customer_complaint', hold_until = now() + interval '7 days' WHERE id = 'd3003000-0000-0000-0000-000000000181' AND hold_reason IS NULL;
  UPDATE provider_earnings SET hold_reason = 'damage_claim', hold_until = now() + interval '21 days' WHERE id = 'd3003000-0000-0000-0000-000000000182' AND hold_reason IS NULL;

  -- ── F4. CUSTOMER INVOICES (50+ across 2 months) ──
  INSERT INTO customer_invoices (id, customer_id, subscription_id, invoice_type, status, subtotal_cents, total_cents, credits_applied_cents,
    cycle_start_at, cycle_end_at, due_at, paid_at) VALUES
    -- Month 1 (2 months ago) — 12 invoices across various properties
    ('d3003000-0000-0000-0000-000000000200', v_customer_id, 'd3000000-0000-0000-0000-000000000201', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '3 days'),
    ('d3003000-0000-0000-0000-000000000201', v_customer_id, 'd3000000-0000-0000-0000-000000000202', 'recurring', 'paid', 14900, 14900, 0,  date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '2 days'),
    ('d3003000-0000-0000-0000-000000000202', v_customer_id, 'd3000000-0000-0000-0000-000000000205', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '4 days'),
    ('d3003000-0000-0000-0000-000000000203', v_customer_id, 'd3000000-0000-0000-0000-000000000206', 'recurring', 'paid', 4900, 4900, 0,    date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '3 days'),
    ('d3003000-0000-0000-0000-000000000204', v_customer_id, 'd3000000-0000-0000-0000-000000000207', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '3 days'),
    ('d3003000-0000-0000-0000-000000000205', v_customer_id, 'd3000000-0000-0000-0000-000000000208', 'recurring', 'paid', 14900, 14900, 0,  date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '5 days'),
    ('d3003000-0000-0000-0000-000000000206', v_customer_id, 'd3000000-0000-0000-0000-00000000020a', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '2 days'),
    ('d3003000-0000-0000-0000-000000000207', v_customer_id, 'd3000000-0000-0000-0000-00000000020b', 'recurring', 'paid', 4900, 4400, 500,  date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '3 days'),
    ('d3003000-0000-0000-0000-000000000208', v_customer_id, 'd3000000-0000-0000-0000-00000000020f', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '4 days'),
    ('d3003000-0000-0000-0000-000000000209', v_customer_id, 'd3000000-0000-0000-0000-000000000210', 'recurring', 'paid', 4900, 4900, 0,    date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '3 days'),
    ('d3003000-0000-0000-0000-00000000020a', v_customer_id, 'd3000000-0000-0000-0000-000000000214', 'recurring', 'paid', 8500, 8500, 0,   date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '2 days'),
    ('d3003000-0000-0000-0000-00000000020b', v_customer_id, 'd3000000-0000-0000-0000-000000000215', 'recurring', 'paid', 14900, 14900, 0,  date_trunc('month', now() - interval '2 months'), date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '7 days', date_trunc('month', now() - interval '1 month') + interval '4 days'),

    -- Month 2 (current month) — 12 invoices (10 open, 2 past_due matching past_due subscriptions)
    ('d3003000-0000-0000-0000-000000000210', v_customer_id, 'd3000000-0000-0000-0000-000000000201', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000211', v_customer_id, 'd3000000-0000-0000-0000-000000000202', 'recurring', 'open', 14900, 14900, 0,  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000212', v_customer_id, 'd3000000-0000-0000-0000-000000000205', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000213', v_customer_id, 'd3000000-0000-0000-0000-000000000206', 'recurring', 'open', 4900, 4900, 0,    date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000214', v_customer_id, 'd3000000-0000-0000-0000-000000000207', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000215', v_customer_id, 'd3000000-0000-0000-0000-000000000208', 'recurring', 'open', 14900, 14900, 0,  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000216', v_customer_id, 'd3000000-0000-0000-0000-00000000020a', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000217', v_customer_id, 'd3000000-0000-0000-0000-00000000020f', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000218', v_customer_id, 'd3000000-0000-0000-0000-000000000214', 'recurring', 'open', 8500, 8500, 0,   date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-000000000219', v_customer_id, 'd3000000-0000-0000-0000-000000000215', 'recurring', 'open', 14900, 14900, 0,  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '1 month' + interval '7 days', NULL),
    -- Past due invoices
    ('d3003000-0000-0000-0000-00000000021a', v_customer_id, 'd3000000-0000-0000-0000-000000000209', 'recurring', 'past_due', 8500, 8500, 0, date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '7 days', NULL),
    ('d3003000-0000-0000-0000-00000000021b', v_customer_id, 'd3000000-0000-0000-0000-000000000212', 'recurring', 'past_due', 4900, 4900, 0,  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()) + interval '7 days', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── F5. BILLING RUNS ──
  INSERT INTO billing_runs (id, run_type, status, started_at, completed_at, metadata) VALUES
    ('d3003000-0000-0000-0000-000000000250', 'monthly_cycle', 'completed', date_trunc('month', now() - interval '1 month'), date_trunc('month', now() - interval '1 month') + interval '10 minutes', '{"invoices_generated": 12, "total_amount_cents": 114900}'::jsonb),
    ('d3003000-0000-0000-0000-000000000251', 'monthly_cycle', 'completed', date_trunc('month', now()), date_trunc('month', now()) + interval '12 minutes', '{"invoices_generated": 12, "total_amount_cents": 117600, "past_due_count": 2}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Phase F complete: Financial — Earnings, Payouts, Invoices, Billing Runs';
END $$;

-- ════════════════════════════════════════════════════════════
-- PHASES G-J: SUPPORT, GROWTH, GOVERNANCE, NOTIFICATIONS
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_customer_id uuid := '7cfa1714-bf93-441f-99c0-4bc3e24a284c';
  v_provider_id uuid;
  v_admin_id    uuid;

  v_zone1 uuid := 'b1000000-0000-0000-0000-000000000001';
  v_zone2 uuid := 'b1000000-0000-0000-0000-000000000002';
  v_zone3 uuid := 'b1000000-0000-0000-0000-000000000003';
  v_zone4 uuid := 'b1000000-0000-0000-0000-000000000004';
  v_zone5 uuid := 'b1000000-0000-0000-0000-000000000005';

  v_org1 uuid := 'f1000000-0000-0000-0000-000000000001';
  v_org2 uuid := 'f2000000-0000-0000-0000-000000000001';
  v_org3 uuid := 'f2000000-0000-0000-0000-000000000002';
  v_org4 uuid := 'f2000000-0000-0000-0000-000000000003';
  v_org5 uuid := 'f2000000-0000-0000-0000-000000000004';
  v_org7 uuid := 'f2000000-0000-0000-0000-000000000006';
  v_org8 uuid := 'f2000000-0000-0000-0000-000000000007';

  v_sku_mow    uuid := 'c1000000-0000-0000-0000-000000000001';
  v_sku_window uuid := 'c1000000-0000-0000-0000-000000000009';

BEGIN
  SELECT id INTO v_provider_id FROM auth.users
    WHERE email = current_setting('app.provider_email', true) LIMIT 1;
  IF v_provider_id IS NULL THEN v_provider_id := v_customer_id; END IF;
  SELECT id INTO v_admin_id FROM auth.users
    WHERE email = current_setting('app.admin_email', true) LIMIT 1;
  IF v_admin_id IS NULL THEN v_admin_id := v_customer_id; END IF;

  -- ════════════════════════════════════════════════════════════
  -- PHASE G: SUPPORT & OPERATIONS
  -- ════════════════════════════════════════════════════════════

  -- G1. Support tickets (8 total: 3 open, 5 resolved)
  INSERT INTO support_tickets (id, customer_id, ticket_type, category, severity, status, customer_note, zone_id, provider_org_id) VALUES
    ('d3004000-0000-0000-0000-000000000001', v_customer_id, 'quality',  'quality',    'medium', 'open',
      'Provider missed the edging along my driveway during last visit. Would like a re-service.', v_zone1, v_org1),
    ('d3004000-0000-0000-0000-000000000002', v_customer_id, 'billing',  'billing',    'low',    'open',
      'I was charged $85 but my plan is Basic at $49. Can you check?', v_zone2, NULL),
    ('d3004000-0000-0000-0000-000000000003', v_customer_id, 'missed_item', 'scheduling', 'high',   'open',
      'Provider was a no-show for my appointment yesterday. No notification received.', v_zone3, v_org3),
    ('d3004000-0000-0000-0000-000000000004', v_customer_id, 'general',  'general',    'low',    'resolved',
      'How do I add pool service to my existing routine?', v_zone1, NULL),
    ('d3004000-0000-0000-0000-000000000005', v_customer_id, 'quality',  'quality',    'medium', 'resolved',
      'Gate was left open after service. Please add gate protocol.', v_zone2, v_org2),
    ('d3004000-0000-0000-0000-000000000006', v_customer_id, 'billing',  'billing',    'low',    'resolved',
      'Can I get a refund for the week my service was delayed by weather?', v_zone4, NULL),
    ('d3004000-0000-0000-0000-000000000007', v_customer_id, 'damage',   'quality',    'high',   'resolved',
      'Sprinkler head damaged during mowing. Need repair or reimbursement.', v_zone1, v_org1),
    ('d3004000-0000-0000-0000-000000000008', v_customer_id, 'general',  'general',    'low',    'resolved',
      'What pest control products do you use? I have a dog.', v_zone5, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Temporarily disable admin-only trigger for seed updates
  ALTER TABLE support_tickets DISABLE TRIGGER protect_support_ticket_admin_fields_trigger;

  -- Set resolution details on resolved tickets
  UPDATE support_tickets SET
    resolved_at = created_at + interval '1 day',
    resolution_summary = 'Explained how to add services via the routine page. Customer successfully added pool service.'
  WHERE id = 'd3004000-0000-0000-0000-000000000004' AND resolved_at IS NULL;

  UPDATE support_tickets SET
    resolved_at = created_at + interval '2 days',
    resolution_summary = 'Gate check added to provider checklist. Provider retrained on access protocol. $10 credit issued.'
  WHERE id = 'd3004000-0000-0000-0000-000000000005' AND resolved_at IS NULL;

  UPDATE support_tickets SET
    resolved_at = created_at + interval '3 days',
    resolution_summary = 'Weather delay credit of $12.50 applied to next billing cycle.'
  WHERE id = 'd3004000-0000-0000-0000-000000000006' AND resolved_at IS NULL;

  UPDATE support_tickets SET
    resolved_at = created_at + interval '1 day',
    resolution_summary = 'Provider replaced sprinkler head at no cost. $25 credit issued to customer. Provider flagged for equipment caution.'
  WHERE id = 'd3004000-0000-0000-0000-000000000007' AND resolved_at IS NULL;

  UPDATE support_tickets SET
    resolved_at = created_at + interval '4 hours',
    resolution_summary = 'All products are EPA-approved and pet-safe after drying (typically 30 min). Sent product data sheet.'
  WHERE id = 'd3004000-0000-0000-0000-000000000008' AND resolved_at IS NULL;

  -- Re-enable admin-only trigger
  ALTER TABLE support_tickets ENABLE TRIGGER protect_support_ticket_admin_fields_trigger;

  -- G2. Additional ops exceptions (beyond existing 3 in seed-demo-data)
  INSERT INTO ops_exceptions (id, exception_type, severity, status, source, reason_summary, reason_details, customer_id, provider_org_id, zone_id, scheduled_date, sla_target_at) VALUES
    ('d3004000-0000-0000-0000-000000000010', 'coverage_break', 'soon', 'open', 'system_detection',
      'Round Rock zone at 95% capacity — only 1 provider available Monday',
      '{"available_stops": 1, "needed_stops": 5, "zone": "Round Rock"}'::jsonb,
      NULL, NULL, v_zone4, (now() + interval '3 days')::date, now() + interval '48 hours'),
    ('d3004000-0000-0000-0000-000000000011', 'service_week_at_risk', 'watch', 'open', 'system_detection',
      'Payment failed for 2 past_due subscriptions — retry scheduled',
      '{"failed_count": 2, "total_cents": 13400, "retry_at": "tomorrow"}'::jsonb,
      v_customer_id, NULL, NULL, now()::date, now() + interval '24 hours'),
    ('d3004000-0000-0000-0000-000000000012', 'quality_block', 'urgent', 'resolved', 'system_detection',
      'Provider Sunrise Property Care quality score dropped below 65 — probation triggered',
      '{"provider_name": "Sunrise Property Care", "score": 62, "threshold": 65}'::jsonb,
      NULL, v_org7, v_zone2, (now() - interval '5 days')::date, now() - interval '4 days'),
    ('d3004000-0000-0000-0000-000000000013', 'weather_safety', 'watch', 'resolved', 'system_detection',
      'Heat advisory — 4 afternoon jobs rescheduled to morning across Austin South',
      '{"affected_jobs": 4, "weather_type": "heat_advisory", "max_temp": 105}'::jsonb,
      NULL, NULL, v_zone2, (now() - interval '10 days')::date, now() - interval '9 days'),
    ('d3004000-0000-0000-0000-000000000014', 'provider_unavailable', 'urgent', 'resolved', 'system_detection',
      'Provider missed 2 consecutive appointments in East zone — customer notified',
      '{"missed_count": 2, "provider_name": "Lone Star Lawn Care"}'::jsonb,
      v_customer_id, v_org3, v_zone3, (now() - interval '15 days')::date, now() - interval '14 days')
  ON CONFLICT (id) DO NOTHING;

  UPDATE ops_exceptions SET resolved_at = created_at + interval '1 day', resolution_note = 'Provider placed on probation. Backup provider assigned to zone.' WHERE id = 'd3004000-0000-0000-0000-000000000012' AND resolved_at IS NULL;
  UPDATE ops_exceptions SET resolved_at = created_at + interval '4 hours', resolution_note = 'Jobs rescheduled to 7-10am window. Customers notified via push.' WHERE id = 'd3004000-0000-0000-0000-000000000013' AND resolved_at IS NULL;
  UPDATE ops_exceptions SET resolved_at = created_at + interval '6 hours', resolution_note = 'Backup provider completed jobs same day. Provider coached.' WHERE id = 'd3004000-0000-0000-0000-000000000014' AND resolved_at IS NULL;

  -- G3. Provider applications (6 total: various statuses)
  INSERT INTO provider_applications (id, user_id, category, status, zip_codes, founding_partner, submitted_at, requested_categories) VALUES
    ('d3004000-0000-0000-0000-000000000020', v_customer_id, 'mowing',  'submitted',  ARRAY['78749','78748'], false, now() - interval '3 days',  ARRAY['mowing','hedge_trimming']),
    ('d3004000-0000-0000-0000-000000000021', v_customer_id, 'windows', 'under_review',  ARRAY['78664','78665'], false, now() - interval '7 days',  ARRAY['windows']),
    ('d3004000-0000-0000-0000-000000000022', v_customer_id, 'mowing',  'approved',   ARRAY['78613'],         true,  now() - interval '30 days', ARRAY['mowing']),
    ('d3004000-0000-0000-0000-000000000023', v_customer_id, 'pest',    'approved',   ARRAY['78701','78702'], false, now() - interval '45 days', ARRAY['pest']),
    ('d3004000-0000-0000-0000-000000000024', v_customer_id, 'mowing',  'rejected',   ARRAY['78721'],         false, now() - interval '60 days', ARRAY['mowing','power_wash']),
    ('d3004000-0000-0000-0000-000000000025', v_customer_id, 'mowing',  'waitlisted', ARRAY['78741','78722'], false, now() - interval '14 days', ARRAY['mowing'])
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE H: GROWTH & VIRAL
  -- ════════════════════════════════════════════════════════════

  -- H1. BYOC invite links (6 from 3 providers)
  INSERT INTO byoc_invite_links (id, org_id, zone_id, category_key, token, default_cadence, is_active) VALUES
    ('d3004000-0000-0000-0000-000000000030', v_org1, v_zone1, 'mowing',  'BYOC-AUSTIN-PRO-1', 'weekly',   true),
    ('d3004000-0000-0000-0000-000000000031', v_org1, v_zone1, 'windows', 'BYOC-AUSTIN-PRO-2', 'monthly',  true),
    ('d3004000-0000-0000-0000-000000000032', v_org2, v_zone2, 'mowing',  'BYOC-GREEN-THUMB',  'weekly',   true),
    ('d3004000-0000-0000-0000-000000000033', v_org2, v_zone2, 'pest',    'BYOC-GT-PEST',      'monthly',  true),
    ('d3004000-0000-0000-0000-000000000034', v_org3, v_zone3, 'mowing',  'BYOC-LONE-STAR',    'weekly',   true),
    ('d3004000-0000-0000-0000-000000000035', v_org5, v_zone5, 'mowing',  'BYOC-HILL-COUNTRY', 'biweekly', true)
  ON CONFLICT (id) DO NOTHING;

  -- H2. BYOC activations (4 of 6 invites activated)
  INSERT INTO byoc_activations (id, invite_id, customer_user_id, provider_org_id, cadence, status, activated_at) VALUES
    ('d3004000-0000-0000-0000-000000000040', 'd3004000-0000-0000-0000-000000000030', v_customer_id, v_org1, 'weekly',   'ACTIVE',  now() - interval '60 days'),
    ('d3004000-0000-0000-0000-000000000041', 'd3004000-0000-0000-0000-000000000032', v_customer_id, v_org2, 'weekly',   'ACTIVE',  now() - interval '45 days'),
    ('d3004000-0000-0000-0000-000000000042', 'd3004000-0000-0000-0000-000000000034', v_customer_id, v_org3, 'weekly',   'ACTIVE',  now() - interval '30 days'),
    ('d3004000-0000-0000-0000-000000000043', 'd3004000-0000-0000-0000-000000000035', v_customer_id, v_org5, 'biweekly', 'ACTIVE',  now() - interval '20 days')
  ON CONFLICT (id) DO NOTHING;

  -- H3. Referral programs (2: customer + provider)
  -- Provider program already exists (f1000000-...-000000000030), add customer program
  INSERT INTO referral_programs (id, name, description, referrer_type, milestone_triggers, referrer_reward_amount_cents, referred_reward_amount_cents, referrer_reward_type, referred_reward_type, hold_days, status) VALUES
    ('d3004000-0000-0000-0000-000000000050', 'Customer Referral', 'Earn credits for every neighbor you refer', 'customer', ARRAY['installed', 'subscribed']::referral_milestone_type[], 2500, 1500, 'customer_credit', 'customer_credit', 7, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- H4. Referral codes (10 customer codes)
  INSERT INTO referral_codes (id, program_id, user_id, code) VALUES
    ('d3004000-0000-0000-0000-000000000060', 'd3004000-0000-0000-0000-000000000050', v_customer_id, 'NEIGHBOR25'),
    ('d3004000-0000-0000-0000-000000000061', 'd3004000-0000-0000-0000-000000000050', v_customer_id, 'FRIEND2024'),
    ('d3004000-0000-0000-0000-000000000062', 'd3004000-0000-0000-0000-000000000050', v_customer_id, 'LAWNLOVE'),
    ('d3004000-0000-0000-0000-000000000063', 'd3004000-0000-0000-0000-000000000050', v_customer_id, 'YARDBUDDY'),
    ('d3004000-0000-0000-0000-000000000064', 'd3004000-0000-0000-0000-000000000050', v_customer_id, 'GREENLIFE'),
    ('d3004000-0000-0000-0000-000000000065', 'f1000000-0000-0000-0000-000000000030', v_customer_id, 'PRO-MARIA'),
    ('d3004000-0000-0000-0000-000000000066', 'f1000000-0000-0000-0000-000000000030', v_customer_id, 'PRO-JAMES'),
    ('d3004000-0000-0000-0000-000000000067', 'f1000000-0000-0000-0000-000000000030', v_customer_id, 'PRO-DAVID'),
    ('d3004000-0000-0000-0000-000000000068', 'f1000000-0000-0000-0000-000000000030', v_customer_id, 'PRO-SARAH'),
    ('d3004000-0000-0000-0000-000000000069', 'f1000000-0000-0000-0000-000000000030', v_customer_id, 'PRO-RACHEL')
  ON CONFLICT (id) DO NOTHING;

  -- H5. Growth surface configs (per zone)
  INSERT INTO growth_surface_config (id, zone_id, category, surface_weights, prompt_frequency_caps, incentive_visibility, share_brand_default, share_link_expiry_days) VALUES
    ('d3004000-0000-0000-0000-000000000070', v_zone2, 'mowing', '{"receipt_share": 1, "cross_pollination": 1, "provider_share": 1}'::jsonb, '{"share_per_job": 2, "reminder_per_week": 3}'::jsonb, true, 'handled', 30),
    ('d3004000-0000-0000-0000-000000000071', v_zone3, 'mowing', '{"receipt_share": 1, "cross_pollination": 1, "provider_share": 1}'::jsonb, '{"share_per_job": 2, "reminder_per_week": 3}'::jsonb, true, 'handled', 30),
    ('d3004000-0000-0000-0000-000000000072', v_zone4, 'mowing', '{"receipt_share": 1, "cross_pollination": 0, "provider_share": 1}'::jsonb, '{"share_per_job": 1, "reminder_per_week": 2}'::jsonb, true, 'handled', 14),
    ('d3004000-0000-0000-0000-000000000073', v_zone5, 'mowing', '{"receipt_share": 1, "cross_pollination": 0, "provider_share": 1}'::jsonb, '{"share_per_job": 1, "reminder_per_week": 2}'::jsonb, true, 'handled', 14)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE I: ADMIN & GOVERNANCE
  -- ════════════════════════════════════════════════════════════

  -- I1. Admin audit log (15 entries)
  INSERT INTO admin_audit_log (id, admin_user_id, action, entity_type, entity_id, reason, before, after) VALUES
    ('d3005000-0000-0000-0000-000000000001', v_admin_id, 'update', 'zone',           v_zone4, 'Expanded Round Rock zip codes',           '{"zip_codes": ["78664","78665"]}'::jsonb, '{"zip_codes": ["78664","78665","78681","78717"]}'::jsonb),
    ('d3005000-0000-0000-0000-000000000002', v_admin_id, 'create', 'zone',           v_zone5, 'Launched Cedar Park zone',                NULL, '{"name": "Cedar Park", "status": "active"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000003', v_admin_id, 'update', 'provider_org',   v_org7,  'Placed on probation due to low quality score', '{"status": "ACTIVE"}'::jsonb, '{"status": "PROBATION"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000004', v_admin_id, 'update', 'plan',           'd1000000-0000-0000-0000-000000000002', 'Updated Standard plan pricing',     '{"display_price_text": "$79/mo"}'::jsonb, '{"display_price_text": "$85/mo"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000005', v_admin_id, 'create', 'plan',           'd1000000-0000-0000-0000-000000000003', 'Created Premium plan',               NULL, '{"name": "Premium", "display_price_text": "$149/mo"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000006', v_admin_id, 'update', 'assignment_config','d3000000-0000-0000-0000-000000000020', 'Increased daily capacity limit', '{"config_value": 10}'::jsonb, '{"config_value": 12}'::jsonb),
    ('d3005000-0000-0000-0000-000000000007', v_admin_id, 'approve','provider_application','d3004000-0000-0000-0000-000000000022', 'Approved founding partner application', '{"status": "submitted"}'::jsonb, '{"status": "approved"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000008', v_admin_id, 'reject', 'provider_application','d3004000-0000-0000-0000-000000000024', 'Insufficient coverage area',       '{"status": "submitted"}'::jsonb, '{"status": "rejected"}'::jsonb),
    ('d3005000-0000-0000-0000-000000000009', v_admin_id, 'update', 'support_ticket', 'd3004000-0000-0000-0000-000000000007', 'Resolved damage claim ticket',     '{"status": "open"}'::jsonb, '{"status": "resolved"}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000a', v_admin_id, 'create', 'customer_credit','d3000000-0000-0000-0000-000000000811', 'Issued quality credit for missed edge', NULL, '{"amount_cents": 1500}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000b', v_admin_id, 'update', 'zone',           v_zone1, 'Updated default service window for Central', '{"default_service_window": null}'::jsonb, '{"default_service_window": "morning"}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000c', v_admin_id, 'update', 'ops_exception',  'd3004000-0000-0000-0000-000000000012', 'Resolved quality alert exception', '{"status": "open"}'::jsonb, '{"status": "resolved"}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000d', v_admin_id, 'create', 'billing_run',    'd3003000-0000-0000-0000-000000000251', 'Triggered monthly billing cycle',  NULL, '{"run_type": "monthly_cycle"}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000e', v_admin_id, 'create', 'payout_run',     'd3003000-0000-0000-0000-000000000008', 'Triggered weekly payout batch',    NULL, '{"total_cents": 2100000}'::jsonb),
    ('d3005000-0000-0000-0000-00000000000f', v_admin_id, 'update', 'market_zone_category_state','d3000000-0000-0000-0000-000000000009', 'Round Rock windows set to WAITLIST_ONLY', '{"status": "OPEN"}'::jsonb, '{"status": "WAITLIST_ONLY"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- I2. Admin change requests (4: 1 pending, 2 approved, 1 rejected)
  INSERT INTO admin_change_requests (id, requester_user_id, requester_role, change_type, target_table, target_entity_id, proposed_changes, reason, status, reviewed_at, reviewer_user_id, reviewer_note) VALUES
    ('d3005000-0000-0000-0000-000000000010', v_admin_id, 'admin', 'pricing_update', 'plans', 'd1000000-0000-0000-0000-000000000001',
      '{"display_price_text": "$55/mo", "tagline": "Essential lawn care — now with edge trimming"}'::jsonb,
      'Raise Basic plan price by $6 to include edge trimming in base tier',
      'pending', NULL, NULL, NULL),
    ('d3005000-0000-0000-0000-000000000011', v_admin_id, 'admin', 'zone_config', 'zones', v_zone4::text,
      '{"max_stops_per_day": 10, "buffer_percent": 15}'::jsonb,
      'Increase Round Rock capacity as 2nd provider added',
      'approved', now() - interval '10 days', v_admin_id, 'Approved — provider David K. confirmed available.'),
    ('d3005000-0000-0000-0000-000000000012', v_admin_id, 'admin', 'payout_config', 'assignment_config', NULL,
      '{"proximity_weight": 0.5, "quality_weight": 0.25}'::jsonb,
      'Increase proximity weight for denser route optimization',
      'approved', now() - interval '20 days', v_admin_id, 'Approved — testing in Central zone first.'),
    ('d3005000-0000-0000-0000-000000000013', v_admin_id, 'admin', 'pricing_update', 'plans', 'd1000000-0000-0000-0000-000000000003',
      '{"display_price_text": "$199/mo"}'::jsonb,
      'Raise Premium to $199 to increase margins',
      'rejected', now() - interval '5 days', v_admin_id, 'Rejected — $149 is competitive. Revisit after 6 months.')
  ON CONFLICT (id) DO NOTHING;

  -- I3. Admin system config (10 key-value pairs)
  INSERT INTO admin_system_config (id, config_key, config_value, description) VALUES
    ('d3005000-0000-0000-0000-000000000020', 'billing.auto_retry_days',     '3'::jsonb,      'Days to wait before retrying failed payment'),
    ('d3005000-0000-0000-0000-000000000021', 'billing.dunning_max_steps',   '4'::jsonb,      'Maximum dunning steps before cancellation'),
    ('d3005000-0000-0000-0000-000000000022', 'payout.weekly_day',           '"friday"'::jsonb,'Day of week for payout batch processing'),
    ('d3005000-0000-0000-0000-000000000023', 'payout.min_threshold_cents',  '1000'::jsonb,   'Minimum earnings before payout is triggered'),
    ('d3005000-0000-0000-0000-000000000024', 'quality.probation_threshold', '65'::jsonb,     'Quality score below which provider enters probation'),
    ('d3005000-0000-0000-0000-000000000025', 'quality.excellent_threshold', '90'::jsonb,     'Quality score above which provider earns Excellent tier'),
    ('d3005000-0000-0000-0000-000000000026', 'growth.byoc_bonus_cents',     '1000'::jsonb,   'Weekly BYOC bonus per active customer (cents)'),
    ('d3005000-0000-0000-0000-000000000027', 'growth.byoc_bonus_duration',  '90'::jsonb,     'BYOC bonus duration in days'),
    ('d3005000-0000-0000-0000-000000000028', 'scheduling.auto_assign',      'true'::jsonb,   'Whether automatic job assignment is enabled'),
    ('d3005000-0000-0000-0000-000000000029', 'notifications.digest_hour',   '8'::jsonb,      'Hour (24h) to send daily digest notifications')
  ON CONFLICT (id) DO NOTHING;

  -- I4. Cron run log (10 recent runs)
  INSERT INTO cron_run_log (id, function_name, status, started_at, completed_at, result_summary) VALUES
    ('d3005000-0000-0000-0000-000000000030', 'process_billing_cycle',    'completed', now() - interval '1 day' + interval '2 hours',  now() - interval '1 day' + interval '2 hours 5 minutes',  '{"invoices_generated": 12, "amount_cents": 117600}'::jsonb),
    ('d3005000-0000-0000-0000-000000000031', 'process_weekly_payouts',   'completed', now() - interval '2 days' + interval '6 hours', now() - interval '2 days' + interval '6 hours 3 minutes', '{"payouts_created": 7, "total_cents": 270000}'::jsonb),
    ('d3005000-0000-0000-0000-000000000032', 'compute_quality_scores',   'completed', now() - interval '1 day' + interval '3 hours',  now() - interval '1 day' + interval '3 hours 2 minutes',  '{"providers_scored": 7, "probation_count": 1}'::jsonb),
    ('d3005000-0000-0000-0000-000000000033', 'send_daily_notifications', 'completed', now() - interval '1 day' + interval '8 hours',  now() - interval '1 day' + interval '8 hours 1 minute',   '{"notifications_sent": 15, "channels": ["push","email"]}'::jsonb),
    ('d3005000-0000-0000-0000-000000000034', 'compute_health_scores',    'completed', now() - interval '2 hours',                      now() - interval '2 hours' + interval '3 minutes',        '{"properties_scored": 25, "avg_score": 80}'::jsonb),
    ('d3005000-0000-0000-0000-000000000035', 'process_billing_cycle',    'completed', now() - interval '31 days' + interval '2 hours', now() - interval '31 days' + interval '2 hours 4 minutes','{"invoices_generated": 12, "amount_cents": 114900}'::jsonb),
    ('d3005000-0000-0000-0000-000000000036', 'process_weekly_payouts',   'completed', now() - interval '9 days' + interval '6 hours',  now() - interval '9 days' + interval '6 hours 3 minutes', '{"payouts_created": 7, "total_cents": 248500}'::jsonb),
    ('d3005000-0000-0000-0000-000000000037', 'auto_assign_jobs',         'completed', now() - interval '1 day' + interval '1 hour',    now() - interval '1 day' + interval '1 hour 1 minute',    '{"jobs_assigned": 8, "unassigned": 0}'::jsonb),
    ('d3005000-0000-0000-0000-000000000038', 'process_dunning',          'completed', now() - interval '1 day' + interval '4 hours',   now() - interval '1 day' + interval '4 hours 1 minute',   '{"accounts_dunned": 2, "step_advanced": 1}'::jsonb),
    ('d3005000-0000-0000-0000-000000000039', 'send_daily_notifications', 'failed',    now() - interval '8 hours',                      now() - interval '8 hours' + interval '30 seconds',       '{"error": "push_provider_timeout", "partial_sent": 5}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- PHASE J: NOTIFICATIONS (40+ across all roles)
  -- ════════════════════════════════════════════════════════════

  -- Customer notifications
  INSERT INTO notifications (id, user_id, type, title, body, priority, cta_label, cta_route, context_type, context_id, created_at) VALUES
    ('d3006000-0000-0000-0000-000000000001', v_customer_id, 'job_completed',         'Service Complete!',           'Your lawn at 1401 Lavaca St was serviced today. Check out the before/after photos!',                   'SERVICE', 'View Photos',    '/customer/photos',    'job', 'd3001000-0000-0000-0000-000000000050', now() - interval '3 hours'),
    ('d3006000-0000-0000-0000-000000000002', v_customer_id, 'job_scheduled',          'Upcoming Visit Tomorrow',     'Your lawn service at 900 W 5th St is scheduled for tomorrow morning.',                                'SERVICE', 'View Schedule',  '/customer/upcoming',  'job', 'd3001000-0000-0000-0000-000000000060', now() - interval '1 hour'),
    ('d3006000-0000-0000-0000-000000000003', v_customer_id, 'health_score_improved',  'Property Health Up!',         'Your property health score improved from 82 to 88 at 1401 Lavaca St. Keep it up!',                     'MARKETING',    'View Score',     '/customer',           NULL,  NULL, now() - interval '2 hours'),
    ('d3006000-0000-0000-0000-000000000004', v_customer_id, 'invoice_ready',          'Invoice Ready',               'Your monthly invoice for $85.00 at 1401 Lavaca St is ready. Due in 30 days.',                          'SERVICE', 'View Invoice',   '/customer/billing',   'invoice', 'd3003000-0000-0000-0000-000000000210', now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000005', v_customer_id, 'referral_activated',     'Referral Reward!',            'Your neighbor signed up using your referral code! $25 credit has been added to your account.',          'SERVICE', 'View Credits',   '/customer/billing',   NULL,  NULL, now() - interval '10 days'),
    ('d3006000-0000-0000-0000-000000000006', v_customer_id, 'job_completed',          'Window Cleaning Done!',       'Your windows at 900 W 5th St are sparkling clean. View the results!',                                 'SERVICE', 'View Details',   '/customer/history',   'job', 'd3001000-0000-0000-0000-000000000017', now() - interval '41 days'),
    ('d3006000-0000-0000-0000-000000000007', v_customer_id, 'job_completed',          'Mowing Complete',             'Your lawn at 5001 W Slaughter Ln was mowed today.',                                                   'SERVICE', 'View Details',   '/customer/history',   'job', 'd3001000-0000-0000-0000-000000000051', now() - interval '2 hours'),
    ('d3006000-0000-0000-0000-000000000008', v_customer_id, 'health_score_improved',  'Score Going Up!',             'Your Cedar Park property health improved from 80 to 83. Consistent service pays off!',                 'MARKETING',    'View Score',     '/customer',           NULL,  NULL, now() - interval '6 days'),
    ('d3006000-0000-0000-0000-000000000009', v_customer_id, 'job_scheduled',          'Visit This Week',             'Your next service at 2100 E MLK Blvd is scheduled for Friday.',                                       'SERVICE', 'View Schedule',  '/customer/upcoming',  'job', 'd3001000-0000-0000-0000-000000000068', now() - interval '12 hours'),
    ('d3006000-0000-0000-0000-00000000000a', v_customer_id, 'credit_applied',         'Credit Applied',              'Your $5.00 welcome credit was applied to this month''s invoice.',                                      'MARKETING',    'View Billing',   '/customer/billing',   NULL,  NULL, now() - interval '20 days'),
    -- Provider notifications
    ('d3006000-0000-0000-0000-000000000010', v_provider_id, 'job_assigned',           'New Job Assigned',            'You have a new lawn care job at 1401 Lavaca St scheduled for today.',                                  'CRITICAL',   'View Job',       '/provider/jobs',      'job', 'd3001000-0000-0000-0000-000000000053', now() - interval '2 hours'),
    ('d3006000-0000-0000-0000-000000000011', v_provider_id, 'payout_processed',       'Payout Sent — $480.00',       'Your weekly payout of $480.00 has been initiated. Expect it in 2-3 business days.',                    'SERVICE', 'View Earnings',  '/provider/earnings',  NULL,  NULL, now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000012', v_provider_id, 'new_customer_byoc',      'New BYOC Customer!',          'A customer activated their BYOC invite. Your $10 weekly bonus continues!',                             'SERVICE', 'View Customers', '/provider/byoc',      NULL,  NULL, now() - interval '20 days'),
    ('d3006000-0000-0000-0000-000000000013', v_provider_id, 'quality_score_updated',  'Quality Score: Excellent',    'Your quality score is 92 — Excellent tier! Keep up the great work.',                                   'MARKETING',    'View Quality',   '/provider/quality',   NULL,  NULL, now() - interval '1 day'),
    ('d3006000-0000-0000-0000-000000000014', v_provider_id, 'job_assigned',           'Tomorrow''s Route Ready',     'You have 3 jobs scheduled for tomorrow across Austin Central.',                                        'SERVICE', 'View Jobs',      '/provider/jobs',      NULL,  NULL, now() - interval '6 hours'),
    ('d3006000-0000-0000-0000-000000000015', v_provider_id, 'earnings_held',          'Earnings Held',               'An earning of $45.00 is held pending resolution of a customer complaint. Expected release in 7 days.',  'CRITICAL',   'View Earnings',  '/provider/earnings',  NULL,  NULL, now() - interval '3 days'),
    ('d3006000-0000-0000-0000-000000000016', v_provider_id, 'payout_processed',       'Payout Sent — $425.00',       'Your weekly payout of $425.00 has been processed.',                                                    'SERVICE', 'View Payouts',   '/provider/payouts',   NULL,  NULL, now() - interval '12 days'),
    ('d3006000-0000-0000-0000-000000000017', v_provider_id, 'job_completed',          'Job Completed',               'Job at 123 Main St marked complete. Earnings: $55.00.',                                                'SERVICE', 'View Job',       '/provider/jobs',      'job', 'd3001000-0000-0000-0000-000000000050', now() - interval '3 hours'),
    ('d3006000-0000-0000-0000-000000000018', v_provider_id, 'new_customer_byoc',      'Another BYOC Signup!',        'Another customer from your BYOC link signed up. You now have 4 BYOC customers!',                      'SERVICE', 'View BYOC',      '/provider/byoc',      NULL,  NULL, now() - interval '30 days'),
    ('d3006000-0000-0000-0000-000000000019', v_provider_id, 'quality_score_updated',  'Score Improved',              'Your quality score improved from 89 to 92. You earned Excellent tier!',                                'SERVICE', 'View Performance','/provider/performance',NULL, NULL, now() - interval '8 days'),
    -- Admin notifications
    ('d3006000-0000-0000-0000-000000000020', v_admin_id, 'exception_created',         'New Exception — Capacity',    'Round Rock zone at 95% capacity. Only 1 provider available Monday. Action needed.',                    'CRITICAL',   'View Exception', '/admin/exceptions',   'ops_exception', 'd3004000-0000-0000-0000-000000000010', now() - interval '1 hour'),
    ('d3006000-0000-0000-0000-000000000021', v_admin_id, 'provider_application',      'New Application',             'New mowing provider application for Austin South (78749, 78748). Review needed.',                      'SERVICE', 'Review',         '/admin/providers/applications', 'provider_application', 'd3004000-0000-0000-0000-000000000020', now() - interval '3 days'),
    ('d3006000-0000-0000-0000-000000000022', v_admin_id, 'kpi_alert',                 'Weekly KPI Summary',          '25 active customers, 8 providers, 42 jobs completed this week. Revenue: $2,350.',                      'MARKETING',    'View Dashboard', '/admin',              NULL,  NULL, now() - interval '7 days'),
    ('d3006000-0000-0000-0000-000000000023', v_admin_id, 'billing_alert',             'Past Due Alert',              '2 subscriptions are past due totaling $134.00. Dunning step 1 initiated.',                             'CRITICAL',   'View Billing',   '/admin/billing',      NULL,  NULL, now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000024', v_admin_id, 'quality_alert',             'Provider on Probation',       'Sunrise Property Care quality score dropped to 62. Auto-placed on probation.',                         'CRITICAL',   'View Provider',  '/admin/providers',    'provider_org', v_org7, now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000025', v_admin_id, 'capacity_warning',          'Cedar Park Growing',          'Cedar Park zone at 80% capacity. Consider recruiting additional providers.',                            'SERVICE', 'View Zones',     '/admin/zones',        NULL,  NULL, now() - interval '10 days'),
    ('d3006000-0000-0000-0000-000000000026', v_admin_id, 'payout_complete',           'Weekly Payouts Processed',    'Payout batch completed: 7 providers, $2,700 total. All payouts successful.',                           'MARKETING',    'View Payouts',   '/admin/payouts',      NULL,  NULL, now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000027', v_admin_id, 'growth_milestone',          'Growth Milestone!',           'Austin Metro reached 25 active customers across 5 zones. BYOC driving 40% of growth.',                'MARKETING',    'View Growth',    '/admin/growth',       NULL,  NULL, now() - interval '2 days'),
    ('d3006000-0000-0000-0000-000000000028', v_admin_id, 'exception_created',         'Payment Failure',             '2 payments failed during billing cycle. Auto-retry scheduled for 3 days.',                             'SERVICE', 'View Billing',   '/admin/billing',      NULL,  NULL, now() - interval '5 days'),
    ('d3006000-0000-0000-0000-000000000029', v_admin_id, 'cron_failure',              'Notification Cron Failed',    'Daily notification cron failed with push_provider_timeout. 5 of 15 sent. Investigate.',                'CRITICAL',   'View Health',    '/admin/cron-health',  NULL,  NULL, now() - interval '8 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Mark some notifications as read
  UPDATE notifications SET read_at = created_at + interval '30 minutes' WHERE id IN (
    'd3006000-0000-0000-0000-000000000006',
    'd3006000-0000-0000-0000-00000000000a',
    'd3006000-0000-0000-0000-000000000016',
    'd3006000-0000-0000-0000-000000000018',
    'd3006000-0000-0000-0000-000000000022',
    'd3006000-0000-0000-0000-000000000026'
  ) AND read_at IS NULL;

  -- I5. Notification delivery records (sample)
  INSERT INTO notification_delivery (id, notification_id, channel, status, attempted_at) VALUES
    ('d3005000-0000-0000-0000-000000000040', 'd3006000-0000-0000-0000-000000000001', 'PUSH',  'SENT', now() - interval '3 hours'),
    ('d3005000-0000-0000-0000-000000000041', 'd3006000-0000-0000-0000-000000000001', 'EMAIL', 'SENT', now() - interval '3 hours'),
    ('d3005000-0000-0000-0000-000000000042', 'd3006000-0000-0000-0000-000000000002', 'PUSH',  'SENT', now() - interval '1 hour'),
    ('d3005000-0000-0000-0000-000000000043', 'd3006000-0000-0000-0000-000000000004', 'EMAIL', 'SENT', now() - interval '5 days'),
    ('d3005000-0000-0000-0000-000000000044', 'd3006000-0000-0000-0000-000000000010', 'PUSH',  'SENT', now() - interval '2 hours'),
    ('d3005000-0000-0000-0000-000000000045', 'd3006000-0000-0000-0000-000000000011', 'PUSH',  'SENT', now() - interval '5 days'),
    ('d3005000-0000-0000-0000-000000000046', 'd3006000-0000-0000-0000-000000000011', 'EMAIL', 'SENT', now() - interval '5 days'),
    ('d3005000-0000-0000-0000-000000000047', 'd3006000-0000-0000-0000-000000000015', 'PUSH',  'SENT', now() - interval '3 days'),
    ('d3005000-0000-0000-0000-000000000048', 'd3006000-0000-0000-0000-000000000020', 'PUSH',  'SENT', now() - interval '1 hour'),
    ('d3005000-0000-0000-0000-000000000049', 'd3006000-0000-0000-0000-000000000020', 'EMAIL', 'SENT', now() - interval '1 hour'),
    ('d3005000-0000-0000-0000-00000000004a', 'd3006000-0000-0000-0000-000000000023', 'PUSH',  'SENT', now() - interval '5 days'),
    ('d3005000-0000-0000-0000-00000000004b', 'd3006000-0000-0000-0000-000000000023', 'EMAIL', 'SENT', now() - interval '5 days'),
    ('d3005000-0000-0000-0000-00000000004c', 'd3006000-0000-0000-0000-000000000029', 'PUSH',  'FAILED',   now() - interval '8 hours'),
    ('d3005000-0000-0000-0000-00000000004d', 'd3006000-0000-0000-0000-000000000029', 'EMAIL', 'SENT', now() - interval '8 hours')
  ON CONFLICT (id) DO NOTHING;

  UPDATE notification_delivery SET error_code = 'push_provider_timeout', error_message = 'APNs timeout after 30s' WHERE id = 'd3005000-0000-0000-0000-00000000004c' AND error_code IS NULL;

  RAISE NOTICE 'Phases G-J complete: Support, Growth, Governance, Notifications';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Rich Metro Seed complete! Day 90 Austin Metro populated.';
  RAISE NOTICE '5 zones, 25 properties, 8 providers, 90+ jobs, 60+ earnings';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;
