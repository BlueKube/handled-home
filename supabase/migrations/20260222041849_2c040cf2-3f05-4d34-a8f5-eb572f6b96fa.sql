
-- Add new columns to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS category TEXT NULL,
  ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price_hint_cents INTEGER NULL,
  ADD COLUMN IF NOT EXISTS pricing_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS edge_case_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Alter existing columns: set NOT NULL where needed
ALTER TABLE public.service_skus
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN inclusions SET NOT NULL,
  ALTER COLUMN exclusions SET NOT NULL,
  ALTER COLUMN required_photos SET NOT NULL;

-- Change default status from 'active' to 'draft'
ALTER TABLE public.service_skus
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add updated_at trigger
CREATE TRIGGER update_service_skus_updated_at
  BEFORE UPDATE ON public.service_skus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS: non-admins should only see active SKUs
DROP POLICY IF EXISTS "Anyone authenticated can read SKUs" ON public.service_skus;
CREATE POLICY "Authenticated can read active SKUs or admins read all"
  ON public.service_skus
  FOR SELECT
  USING (
    status = 'active'
    OR has_role(auth.uid(), 'admin'::app_role)
  );
