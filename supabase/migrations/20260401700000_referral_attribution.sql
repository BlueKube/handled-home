-- ============================================
-- Round 9, Phase 4, B7: Referral Attribution
-- ============================================
-- When a provider submits an application, check if they were referred
-- by matching their email/name against provider_referrals.referred_contact.
-- Update matching referral status to 'applied'.
-- ============================================

CREATE OR REPLACE FUNCTION public.attribute_referral_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get applicant's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  -- Match against provider_referrals by referred_contact (email or phone)
  -- Update any matching referrals where status is still 'new' or 'contacted'
  UPDATE public.provider_referrals
  SET status = 'applied'
  WHERE (referred_contact = v_email OR referred_contact ILIKE '%' || v_email || '%')
    AND status IN ('new', 'contacted');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_attribute_referral ON public.provider_applications;
CREATE TRIGGER trg_attribute_referral
  AFTER INSERT ON public.provider_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.attribute_referral_on_application();
