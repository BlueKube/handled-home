
-- D1-F7: Add foreign key on user_id for referential integrity
ALTER TABLE public.customer_onboarding_progress
  ADD CONSTRAINT customer_onboarding_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- D1-F9: Add validation trigger for current_step values
CREATE OR REPLACE FUNCTION public.trg_validate_onboarding_step()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_step NOT IN ('property', 'zone_check', 'plan', 'subscribe', 'service_day', 'routine', 'complete') THEN
    RAISE EXCEPTION 'Invalid onboarding step: %', NEW.current_step;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_onboarding_step
  BEFORE INSERT OR UPDATE ON public.customer_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_onboarding_step();
