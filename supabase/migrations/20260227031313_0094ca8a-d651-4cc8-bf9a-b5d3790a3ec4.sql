
-- Sprint D1.5: Scheduling UX Polish
-- Add align_days_preference and must_be_home to service_day_preferences

ALTER TABLE public.service_day_preferences
  ADD COLUMN IF NOT EXISTS align_days_preference boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_be_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_be_home_window text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add set_updated_at trigger
CREATE TRIGGER set_updated_at_service_day_prefs
  BEFORE UPDATE ON public.service_day_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add alignment_explanation to service_day_assignments (server-provided when alignment can't be met)
ALTER TABLE public.service_day_assignments
  ADD COLUMN IF NOT EXISTS alignment_explanation text DEFAULT NULL;
