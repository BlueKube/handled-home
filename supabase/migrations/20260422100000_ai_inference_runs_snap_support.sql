-- Round 64 / Phase 4 / Batch 4.3 — extend ai_inference_runs for Snap classification
--
-- Adds snap-aware columns so a single inference-log table tracks both
-- ticket-classify (support-ai-classify) AND snap-classify (snap-ai-classify)
-- runs. Alternatives considered: separate snap_ai_inference_runs table (splits
-- observability), skip logging for snaps (loses model-quality tracking).
--
-- Changes:
--   1. ticket_id becomes nullable (was NOT NULL).
--   2. New snap_request_id uuid FK → snap_requests(id) ON DELETE CASCADE.
--   3. CHECK constraint: every row has either ticket_id OR snap_request_id.
--   4. Partial index on snap_request_id for filtered queries.
--
-- RLS unchanged — admin-only SELECT already in place; edge functions use
-- service role and bypass.

ALTER TABLE public.ai_inference_runs
  ALTER COLUMN ticket_id DROP NOT NULL;

ALTER TABLE public.ai_inference_runs
  ADD COLUMN snap_request_id uuid REFERENCES public.snap_requests(id) ON DELETE CASCADE;

ALTER TABLE public.ai_inference_runs
  ADD CONSTRAINT ai_inference_runs_subject_chk
  CHECK (ticket_id IS NOT NULL OR snap_request_id IS NOT NULL);

CREATE INDEX idx_ai_inference_runs_snap_request
  ON public.ai_inference_runs(snap_request_id)
  WHERE snap_request_id IS NOT NULL;

COMMENT ON COLUMN public.ai_inference_runs.snap_request_id IS
  'Snap-a-Fix request the inference run belongs to (mutually inclusive with ticket_id — at least one of the two must be set).';
