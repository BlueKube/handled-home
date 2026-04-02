-- ============================================
-- Round 11, Phase 3, B3: Handoff Processed Flag
-- ============================================

ALTER TABLE public.property_transitions
  ADD COLUMN IF NOT EXISTS handoff_processed BOOLEAN NOT NULL DEFAULT false;
