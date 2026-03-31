-- ============================================
-- Phase 2 B1: Add Billing Exception Types to ops_exception_type
-- ============================================
-- Extends the ops_exceptions system to handle billing-related exceptions,
-- enabling a unified exception queue across ops and billing domains.
--
-- Original ops types: window_at_risk, service_week_at_risk, provider_overload,
--   coverage_break, provider_unavailable, access_failure, customer_reschedule,
--   weather_safety, quality_block
--
-- New billing types added below:
-- ============================================

ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'payment_past_due';
ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'payout_failed';
ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'dispute_opened';
ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'earnings_held';
ALTER TYPE public.ops_exception_type ADD VALUE IF NOT EXISTS 'reconciliation_mismatch';

COMMENT ON TYPE public.ops_exception_type IS 'Exception types for the unified queue. Ops-origin: window_at_risk, service_week_at_risk, provider_overload, coverage_break, provider_unavailable, access_failure, customer_reschedule, weather_safety, quality_block. Billing-origin: payment_failed, payment_past_due, payout_failed, dispute_opened, earnings_held, reconciliation_mismatch.';
