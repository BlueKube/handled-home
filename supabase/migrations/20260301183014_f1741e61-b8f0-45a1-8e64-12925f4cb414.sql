
-- Make ai_inference_runs more generic for non-ticket AI usage
ALTER TABLE public.ai_inference_runs
  ALTER COLUMN ticket_id DROP NOT NULL,
  ADD COLUMN entity_type TEXT,
  ADD COLUMN entity_id UUID;

-- Add index for entity lookups
CREATE INDEX idx_ai_inference_entity ON public.ai_inference_runs (entity_type, entity_id) WHERE entity_type IS NOT NULL;
