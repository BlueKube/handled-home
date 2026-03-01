
-- Sprint 3B Phase 1 Fix: P1-F1 + P1-F2

-- P1-F2: Add created_at column to property_coverage
ALTER TABLE public.property_coverage
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

-- P1-F1: Fix switch_intent clearing logic
-- Clear for PROVIDER and NA (already have one / not applicable)
-- Preserve for SELF and NONE (open to switching)
CREATE OR REPLACE FUNCTION public.validate_property_coverage()
RETURNS trigger AS $$
BEGIN
  -- Validate coverage_status
  IF NEW.coverage_status NOT IN ('SELF', 'PROVIDER', 'NONE', 'NA') THEN
    RAISE EXCEPTION 'Invalid coverage_status: %', NEW.coverage_status;
  END IF;

  -- Validate switch_intent if provided
  IF NEW.switch_intent IS NOT NULL AND NEW.switch_intent NOT IN ('OPEN_NOW', 'OPEN_LATER', 'NOT_OPEN') THEN
    RAISE EXCEPTION 'Invalid switch_intent: %', NEW.switch_intent;
  END IF;

  -- Clear switch_intent when status is PROVIDER or NA (not meaningful)
  IF NEW.coverage_status IN ('PROVIDER', 'NA') THEN
    NEW.switch_intent := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
