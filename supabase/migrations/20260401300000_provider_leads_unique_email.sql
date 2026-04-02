-- ============================================
-- Round 9, Phase 1, B1: Unique email on provider_leads
-- ============================================
-- Prevents duplicate leads by enforcing one row per email.
-- Existing duplicates are cleaned up first (keep most recent).
-- ============================================

-- Remove duplicates: keep the most recent row per email
DELETE FROM public.provider_leads a
USING public.provider_leads b
WHERE a.email = b.email
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_leads_email_unique
  ON public.provider_leads (email);
