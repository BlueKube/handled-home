-- ============================================
-- Round 9, Phase 1, B2: Link Applications to Leads
-- ============================================
-- When a provider submits an application, auto-link it to their
-- provider_leads record (if one exists) and update lead status.
-- ============================================

-- Add FK column to provider_applications
ALTER TABLE public.provider_applications
  ADD COLUMN IF NOT EXISTS provider_lead_id UUID REFERENCES public.provider_leads(id);

CREATE INDEX IF NOT EXISTS idx_provider_applications_lead_id
  ON public.provider_applications(provider_lead_id);

-- Function: on application insert, match email to lead and link
CREATE OR REPLACE FUNCTION public.link_application_to_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_lead_id UUID;
BEGIN
  -- Get applicant's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching lead
  SELECT id INTO v_lead_id
  FROM public.provider_leads
  WHERE email = v_email
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    -- Update the lead status to 'applied'
    UPDATE public.provider_leads
    SET status = 'applied'
    WHERE id = v_lead_id;

    -- Link the application to the lead
    NEW.provider_lead_id := v_lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires before insert so we can modify NEW.provider_lead_id
DROP TRIGGER IF EXISTS trg_link_application_to_lead ON public.provider_applications;
CREATE TRIGGER trg_link_application_to_lead
  BEFORE INSERT ON public.provider_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.link_application_to_lead();
