-- ============================================================
-- Demo Data Seed — populates realistic "day 30" data
-- for investor demos and seeded screenshot catalog.
--
-- IDEMPOTENT: safe to run multiple times (ON CONFLICT DO NOTHING).
-- REQUIRES: existing test users in auth.users + bootstrap data
--           from migration 20260223032019 (SKUs, provider_orgs, etc.)
--
-- Usage:
--   Via Supabase SQL Editor: paste and run
--   Via CLI: supabase db execute --file supabase/seed-demo-data.sql
--   Via Playwright: see e2e/seed-demo-data.ts
-- ============================================================

DO $$
DECLARE
  -- Resolve test user IDs from auth.users by email.
  -- These env-specific emails are the same ones used for Playwright tests.
  v_customer_id uuid;
  v_provider_id uuid;
  v_admin_id    uuid;

  -- Known fixture IDs from migration seed data
  v_zone_id         uuid := 'b1000000-0000-0000-0000-000000000001';
  v_plan_id         uuid := 'd1000000-0000-0000-0000-000000000001';
  v_entitlement_id  uuid := 'e1000000-0000-0000-0000-000000000001';
  v_provider_org_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_property_id     uuid := 'edfedf3d-251d-4de7-89a8-1ce5f439e12e';
  v_subscription_id uuid := 'f1000000-0000-0000-0000-000000000010';

  -- Demo-specific IDs (d2 prefix = demo seed batch 2)
  v_job_upcoming    uuid := 'd2000000-0000-0000-0000-000000000001';
  v_job_inprogress  uuid := 'd2000000-0000-0000-0000-000000000002';
  v_job_completed2  uuid := 'd2000000-0000-0000-0000-000000000003';
  v_job_completed3  uuid := 'd2000000-0000-0000-0000-000000000004';
  v_job_completed4  uuid := 'd2000000-0000-0000-0000-000000000005';
  v_invoice_paid1   uuid := 'd2000000-0000-0000-0000-000000000010';
  v_invoice_paid2   uuid := 'd2000000-0000-0000-0000-000000000011';
  v_invoice_current uuid := 'd2000000-0000-0000-0000-000000000012';
  v_routine_id      uuid := 'd2000000-0000-0000-0000-000000000020';
  v_routine_ver_id  uuid := 'd2000000-0000-0000-0000-000000000021';
  v_exception1      uuid := 'd2000000-0000-0000-0000-000000000030';
  v_exception2      uuid := 'd2000000-0000-0000-0000-000000000031';
  v_exception3      uuid := 'd2000000-0000-0000-0000-000000000032';
  v_application1    uuid := 'd2000000-0000-0000-0000-000000000040';
  v_application2    uuid := 'd2000000-0000-0000-0000-000000000041';
  v_health_score_id uuid := 'd2000000-0000-0000-0000-000000000050';
BEGIN
  -- ── Resolve user IDs ──
  -- Use the single test user that already has seed data
  v_customer_id := '7cfa1714-bf93-441f-99c0-4bc3e24a284c';

  -- Try to find provider/admin users; fall back to the same user
  SELECT id INTO v_provider_id FROM auth.users
    WHERE email = current_setting('app.provider_email', true)
    LIMIT 1;
  IF v_provider_id IS NULL THEN
    v_provider_id := v_customer_id;
  END IF;

  SELECT id INTO v_admin_id FROM auth.users
    WHERE email = current_setting('app.admin_email', true)
    LIMIT 1;
  IF v_admin_id IS NULL THEN
    v_admin_id := v_customer_id;
  END IF;

  -- ════════════════════════════════════════════════════════════
  -- 1. MORE COMPLETED JOBS (history for customer & provider)
  -- ════════════════════════════════════════════════════════════

  -- Job completed 7 days ago: Mow + Edge
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at, provider_summary)
  VALUES (v_job_completed2, v_customer_id, v_property_id, v_provider_org_id, v_zone_id, 'COMPLETED',
    (now() - interval '7 days')::date,
    now() - interval '7 days' + interval '8 hours',
    now() - interval '7 days' + interval '9 hours 15 minutes',
    'Standard mow and edge trim completed. Yard looking great!')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    ('d2000000-0000-0000-0000-000000000060', v_job_completed2, 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 30),
    ('d2000000-0000-0000-0000-000000000061', v_job_completed2, 'c1000000-0000-0000-0000-000000000002', 'Edge & Trim', 15)
  ON CONFLICT (id) DO NOTHING;

  -- Job completed 14 days ago: Mow + Leaf Blowoff
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at, provider_summary)
  VALUES (v_job_completed3, v_customer_id, v_property_id, v_provider_org_id, v_zone_id, 'COMPLETED',
    (now() - interval '14 days')::date,
    now() - interval '14 days' + interval '9 hours',
    now() - interval '14 days' + interval '10 hours 30 minutes',
    'Full mow with leaf cleanup. Cleared all leaves from beds and lawn.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    ('d2000000-0000-0000-0000-000000000062', v_job_completed3, 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 30),
    ('d2000000-0000-0000-0000-000000000063', v_job_completed3, 'c1000000-0000-0000-0000-000000000003', 'Leaf Blowoff', 20)
  ON CONFLICT (id) DO NOTHING;

  -- Job completed 21 days ago: Window Cleaning
  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, completed_at, provider_summary)
  VALUES (v_job_completed4, v_customer_id, v_property_id, v_provider_org_id, v_zone_id, 'COMPLETED',
    (now() - interval '21 days')::date,
    now() - interval '21 days' + interval '10 hours',
    now() - interval '21 days' + interval '11 hours',
    'All exterior windows cleaned. Interior windows on first floor done.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    ('d2000000-0000-0000-0000-000000000064', v_job_completed4, 'c1000000-0000-0000-0000-000000000009', 'Window Cleaning', 45)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 2. UPCOMING JOB (scheduled for next Tuesday)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date)
  VALUES (v_job_upcoming, v_customer_id, v_property_id, v_provider_org_id, v_zone_id, 'CONFIRMED',
    (now() + interval '2 days')::date)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    ('d2000000-0000-0000-0000-000000000065', v_job_upcoming, 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 30),
    ('d2000000-0000-0000-0000-000000000066', v_job_upcoming, 'c1000000-0000-0000-0000-000000000002', 'Edge & Trim', 15)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 3. IN-PROGRESS JOB (today — provider is on site)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO jobs (id, customer_id, property_id, provider_org_id, zone_id, status, scheduled_date, started_at, arrived_at)
  VALUES (v_job_inprogress, v_customer_id, v_property_id, v_provider_org_id, v_zone_id, 'IN_PROGRESS',
    now()::date,
    now() - interval '20 minutes',
    now() - interval '22 minutes')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_skus (id, job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot) VALUES
    ('d2000000-0000-0000-0000-000000000067', v_job_inprogress, 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 30),
    ('d2000000-0000-0000-0000-000000000068', v_job_inprogress, 'c1000000-0000-0000-0000-00000000000d', 'Dog Poop Cleanup', 15)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO job_checklist_items (id, job_id, label, status, is_required) VALUES
    ('d2000000-0000-0000-0000-000000000069', v_job_inprogress, 'Mow front yard', 'DONE', true),
    ('d2000000-0000-0000-0000-00000000006a', v_job_inprogress, 'Mow back yard', 'NOT_STARTED', true),
    ('d2000000-0000-0000-0000-00000000006b', v_job_inprogress, 'Scan yard for pet waste', 'DONE', true),
    ('d2000000-0000-0000-0000-00000000006c', v_job_inprogress, 'Bag and dispose waste', 'DONE', true)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 4. CUSTOMER INVOICES (billing history)
  -- ════════════════════════════════════════════════════════════

  -- Paid invoice: 2 months ago
  INSERT INTO customer_invoices (id, customer_id, subscription_id, invoice_type, status, subtotal_cents, total_cents, credits_applied_cents,
    cycle_start_at, cycle_end_at, due_at, paid_at)
  VALUES (v_invoice_paid1, v_customer_id, v_subscription_id, 'recurring', 'paid', 8500, 8500, 0,
    date_trunc('month', now() - interval '2 months'),
    date_trunc('month', now() - interval '1 month'),
    date_trunc('month', now() - interval '1 month') + interval '7 days',
    date_trunc('month', now() - interval '1 month') + interval '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- Paid invoice: last month
  INSERT INTO customer_invoices (id, customer_id, subscription_id, invoice_type, status, subtotal_cents, total_cents, credits_applied_cents,
    cycle_start_at, cycle_end_at, due_at, paid_at)
  VALUES (v_invoice_paid2, v_customer_id, v_subscription_id, 'recurring', 'paid', 11000, 10000, 1000,
    date_trunc('month', now() - interval '1 month'),
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '7 days',
    date_trunc('month', now()) + interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- Current (open) invoice: this month
  INSERT INTO customer_invoices (id, customer_id, subscription_id, invoice_type, status, subtotal_cents, total_cents, credits_applied_cents,
    cycle_start_at, cycle_end_at, due_at)
  VALUES (v_invoice_current, v_customer_id, v_subscription_id, 'recurring', 'open', 8500, 8500, 0,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    date_trunc('month', now()) + interval '1 month' + interval '7 days')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 5. ROUTINE (customer's service routine)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO routines (id, customer_id, property_id, plan_id, zone_id, status, cadence_anchor_date, effective_at)
  VALUES (v_routine_id, v_customer_id, v_property_id, v_plan_id, v_zone_id, 'active',
    (now() - interval '30 days')::date, now() - interval '30 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO routine_versions (id, routine_id, version_number, status, effective_date, locked_at)
  VALUES (v_routine_ver_id, v_routine_id, 1, 'active', (now() - interval '30 days')::date, now() - interval '30 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO routine_items (id, routine_version_id, sku_id, sku_name, cadence_type, cadence_detail, duration_minutes) VALUES
    ('d2000000-0000-0000-0000-000000000022', v_routine_ver_id, 'c1000000-0000-0000-0000-000000000001', 'Standard Mow', 'weekly', '{"day_of_week": "tuesday"}'::jsonb, 30),
    ('d2000000-0000-0000-0000-000000000023', v_routine_ver_id, 'c1000000-0000-0000-0000-000000000002', 'Edge & Trim', 'biweekly', '{"day_of_week": "tuesday", "week_parity": "odd"}'::jsonb, 15),
    ('d2000000-0000-0000-0000-000000000024', v_routine_ver_id, 'c1000000-0000-0000-0000-00000000000d', 'Dog Poop Cleanup', 'weekly', '{"day_of_week": "tuesday"}'::jsonb, 15)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 6. PROPERTY HEALTH SCORE
  -- ════════════════════════════════════════════════════════════

  INSERT INTO property_health_scores (id, customer_id, property_id, overall_score, previous_overall_score, coverage_score, regularity_score, issue_score, seasonal_score, computed_at)
  VALUES (v_health_score_id, v_customer_id, v_property_id, 82, 75, 90, 85, 70, 83, now() - interval '1 hour')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 7. NOTIFICATIONS (for all roles)
  -- ════════════════════════════════════════════════════════════

  -- Customer notifications
  INSERT INTO notifications (id, user_id, type, title, body, priority, cta_label, cta_route, context_type, context_id) VALUES
    ('d2000000-0000-0000-0000-000000000070', v_customer_id, 'job_completed', 'Service Complete!', 'Your lawn service was completed today. Check out the before/after photos!', 'normal', 'View Details', '/customer/visits', 'job', v_job_completed2::text),
    ('d2000000-0000-0000-0000-000000000071', v_customer_id, 'job_scheduled', 'Upcoming Visit', 'Your next lawn service is scheduled for this week. Make sure the gate is unlocked!', 'normal', 'View Schedule', '/customer/routine', 'job', v_job_upcoming::text),
    ('d2000000-0000-0000-0000-000000000072', v_customer_id, 'health_score_improved', 'Property Health Up!', 'Your property health score improved from 75 to 82. Keep it up!', 'low', 'View Score', '/customer', NULL, NULL),
    ('d2000000-0000-0000-0000-000000000073', v_customer_id, 'invoice_ready', 'Invoice Ready', 'Your monthly invoice for $85.00 is ready. Due in 7 days.', 'normal', 'View Invoice', '/customer/billing', 'invoice', v_invoice_current::text)
  ON CONFLICT (id) DO NOTHING;

  -- Provider notifications
  INSERT INTO notifications (id, user_id, type, title, body, priority, cta_label, cta_route, context_type, context_id) VALUES
    ('d2000000-0000-0000-0000-000000000074', v_provider_id, 'job_assigned', 'New Job Assigned', 'You have a new lawn care job at 123 Main Street scheduled for today.', 'high', 'View Job', '/provider/jobs', 'job', v_job_inprogress::text),
    ('d2000000-0000-0000-0000-000000000075', v_provider_id, 'payout_processed', 'Payout Sent', 'Your weekly payout of $342.50 has been initiated. Expect it in 2-3 business days.', 'normal', 'View Earnings', '/provider/earnings', NULL, NULL),
    ('d2000000-0000-0000-0000-000000000076', v_provider_id, 'new_customer_byoc', 'New Customer Added!', 'Sarah M. activated their BYOC invite. You earned a $25 bonus!', 'normal', 'View Customers', '/provider/customers', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Admin notifications
  INSERT INTO notifications (id, user_id, type, title, body, priority, cta_label, cta_route, context_type, context_id) VALUES
    ('d2000000-0000-0000-0000-000000000077', v_admin_id, 'exception_created', 'New Exception', 'Weather delay affecting 3 jobs in Austin Central zone. Action needed.', 'high', 'View Exception', '/admin/exceptions', 'ops_exception', v_exception1::text),
    ('d2000000-0000-0000-0000-000000000078', v_admin_id, 'provider_application', 'New Application', 'Green Thumb Landscaping applied for the Austin South zone. Review needed.', 'normal', 'Review', '/admin/applications', 'provider_application', v_application1::text),
    ('d2000000-0000-0000-0000-000000000079', v_admin_id, 'kpi_alert', 'Weekly KPI Summary', 'Customer satisfaction 4.7/5, 12 new signups, 3 provider applications pending.', 'low', 'View Dashboard', '/admin', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 8. OPS EXCEPTIONS (for admin dashboard)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO ops_exceptions (id, exception_type, severity, status, source, reason_summary, reason_details, customer_id, provider_org_id, zone_id, scheduled_date, sla_target_at) VALUES
    (v_exception1, 'weather_delay', 'urgent', 'open', 'system',
      'Thunderstorm warning — 3 jobs rescheduled in Austin Central',
      '{"affected_jobs": 3, "weather_type": "thunderstorm", "forecast_source": "NWS"}'::jsonb,
      NULL, v_provider_org_id, v_zone_id,
      now()::date,
      now() + interval '4 hours'),
    (v_exception2, 'provider_no_show', 'soon', 'open', 'system',
      'Provider did not check in for 9:00 AM job at 456 Elm Street',
      '{"expected_arrival": "09:00", "customer_name": "Demo Customer"}'::jsonb,
      v_customer_id, v_provider_org_id, v_zone_id,
      now()::date,
      now() + interval '2 hours'),
    (v_exception3, 'customer_complaint', 'watch', 'open', 'customer',
      'Customer reports missed spot near back fence — requesting re-service',
      '{"complaint_type": "quality", "area": "back yard fence line"}'::jsonb,
      v_customer_id, v_provider_org_id, v_zone_id,
      (now() - interval '1 day')::date,
      now() + interval '24 hours')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 9. PROVIDER APPLICATIONS (for admin review queue)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO provider_applications (id, user_id, category, status, zip_codes, founding_partner, submitted_at, requested_categories) VALUES
    (v_application1, v_provider_id, 'mowing', 'submitted', ARRAY['78745', '78748'], false, now() - interval '2 days', ARRAY['mowing', 'hedge_trimming']),
    (v_application2, v_provider_id, 'windows', 'submitted', ARRAY['78701', '78702', '78703'], true, now() - interval '5 days', ARRAY['windows', 'power_wash'])
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 10. CUSTOMER CREDITS (show balance in billing)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO customer_credits (id, customer_id, amount_cents, reason, status) VALUES
    ('d2000000-0000-0000-0000-000000000080', v_customer_id, 1000, 'Referral reward — friend signed up', 'available'),
    ('d2000000-0000-0000-0000-000000000081', v_customer_id, 500, 'Service quality credit', 'available')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Demo data seeded successfully (customer=%, provider=%, admin=%)',
    v_customer_id, v_provider_id, v_admin_id;
END $$;
