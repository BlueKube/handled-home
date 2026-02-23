
-- SEED DATA for Scenario Testing (70 scenarios)

INSERT INTO service_skus (id, name, category, description, duration_minutes, base_price_cents, status, fulfillment_mode, required_photos, checklist) VALUES
  ('c1000000-0000-0000-0000-000000000009', 'Window Cleaning', 'windows', 'Interior and exterior window cleaning', 45, 6500, 'active', 'same_week_allowed', '["after"]'::jsonb, '["Clean all exterior windows","Clean all interior windows","Wipe sills and frames"]'::jsonb),
  ('c1000000-0000-0000-0000-00000000000a', 'Power Wash', 'power_wash', 'Driveway, patio, and walkway pressure washing', 60, 8500, 'active', 'same_week_allowed', '["after"]'::jsonb, '["Power wash driveway","Power wash patio","Power wash walkways"]'::jsonb),
  ('c1000000-0000-0000-0000-00000000000b', 'Pool Service', 'pool', 'Chemical balance check and debris removal', 30, 5000, 'active', 'same_week_allowed', '[]'::jsonb, '["Check chemical levels","Skim debris","Clean filter basket"]'::jsonb),
  ('c1000000-0000-0000-0000-00000000000c', 'Pest Control', 'pest', 'Perimeter spray and inspection', 20, 4000, 'active', 'independent_cadence', '[]'::jsonb, '["Perimeter spray","Inspect entry points"]'::jsonb),
  ('c1000000-0000-0000-0000-00000000000d', 'Dog Poop Cleanup', 'pet_waste', 'Yard waste removal', 15, 2500, 'active', 'same_day_preferred', '[]'::jsonb, '["Scan full yard","Bag and dispose waste"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_orgs (id, name, status, contact_phone, home_base_zip, created_by_user_id, accountable_owner_user_id, needs_review)
VALUES ('f1000000-0000-0000-0000-000000000001', 'Austin Pro Services', 'ACTIVE', '512-555-0100', '78701', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_members (id, provider_org_id, user_id, role_in_org, display_name, status)
VALUES ('f1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'OWNER', 'Test User', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_coverage (id, provider_org_id, zone_id, coverage_type, request_status)
VALUES ('f1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'PRIMARY', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_capabilities (id, provider_org_id, capability_key, capability_type, sku_id, is_enabled) VALUES
  ('f1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', 'mowing', 'sku', 'c1000000-0000-0000-0000-000000000001', true),
  ('f1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000001', 'mowing', 'sku', 'c1000000-0000-0000-0000-000000000002', true),
  ('f1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000001', 'windows', 'sku', 'c1000000-0000-0000-0000-000000000009', true),
  ('f1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000001', 'power_wash', 'sku', 'c1000000-0000-0000-0000-00000000000a', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (id, customer_id, property_id, zone_id, plan_id, entitlement_version_id, status, current_period_start, current_period_end, billing_cycle_start_at, billing_cycle_end_at, billing_cycle_length_days)
VALUES ('f1000000-0000-0000-0000-000000000010', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'edfedf3d-251d-4de7-89a8-1ce5f439e12e', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_day_assignments (id, customer_id, property_id, zone_id, day_of_week, service_window, status)
VALUES ('f1000000-0000-0000-0000-000000000011', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'edfedf3d-251d-4de7-89a8-1ce5f439e12e', 'b1000000-0000-0000-0000-000000000001', 'tuesday', 'any', 'confirmed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at)
VALUES ('f1000000-0000-0000-0000-000000000020', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'edfedf3d-251d-4de7-89a8-1ce5f439e12e', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'COMPLETED', (now() - interval '3 days')::date, now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '10 hours')
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
  ('f1000000-0000-0000-0000-000000000027', 'f1000000-0000-0000-0000-000000000020', 'job-photos/seed/after-mow.jpg', 'after', 'UPLOADED', now() - interval '3 days' + interval '10 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_events (id, job_id, event_type, actor_user_id, actor_role, metadata) VALUES
  ('f1000000-0000-0000-0000-000000000028', 'f1000000-0000-0000-0000-000000000020', 'ASSIGNED', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'system', '{}'::jsonb),
  ('f1000000-0000-0000-0000-000000000029', 'f1000000-0000-0000-0000-000000000020', 'CONFIRMED', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb),
  ('f1000000-0000-0000-0000-00000000002a', 'f1000000-0000-0000-0000-000000000020', 'IN_PROGRESS', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb),
  ('f1000000-0000-0000-0000-00000000002b', 'f1000000-0000-0000-0000-000000000020', 'COMPLETED', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'provider', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO referral_programs (id, name, description, referrer_type, milestone_triggers, referrer_reward_amount_cents, referred_reward_amount_cents, referrer_reward_type, referred_reward_type, hold_days, status)
VALUES ('f1000000-0000-0000-0000-000000000030', 'Provider Growth', 'Earn bonuses for every customer you refer', 'provider', ARRAY['installed', 'subscribed', 'first_visit']::referral_milestone_type[], 2500, 1000, 'provider_bonus', 'customer_credit', 14, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO referral_codes (id, program_id, user_id, code)
VALUES ('f1000000-0000-0000-0000-000000000031', 'f1000000-0000-0000-0000-000000000030', '7cfa1714-bf93-441f-99c0-4bc3e24a284c', 'TESTPRO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO market_zone_category_state (id, zone_id, category, status, config) VALUES
  ('f1000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000001', 'windows', 'OPEN', '{}'::jsonb),
  ('f1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000001', 'mowing', 'OPEN', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO growth_surface_config (id, zone_id, category, surface_weights, prompt_frequency_caps, incentive_visibility, share_brand_default, share_link_expiry_days)
VALUES ('f1000000-0000-0000-0000-000000000050', 'b1000000-0000-0000-0000-000000000001', 'mowing', '{"receipt_share": 1, "cross_pollination": 1, "provider_share": 1}'::jsonb, '{"share_per_job": 2, "reminder_per_week": 3}'::jsonb, true, 'handled', 30)
ON CONFLICT (id) DO NOTHING;
