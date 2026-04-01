-- ============================================
-- Round 10, Phase 1, B1: Phone on provider_leads
-- ============================================
-- Add phone number as optional identifier for provider leads.
-- Enables phone-based matching in lead-to-application triggers.
-- ============================================

ALTER TABLE public.provider_leads
  ADD COLUMN IF NOT EXISTS phone TEXT;
