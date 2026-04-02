-- ============================================
-- Round 10, Phase 1, B2: Phone matching in triggers
-- ============================================
-- Update lead-linking and referral attribution triggers to match
-- on phone OR email. Phone comes from profiles table.
-- ============================================

-- Update link_application_to_lead to match on phone OR email
CREATE OR REPLACE FUNCTION public.link_application_to_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
  v_lead_id UUID;
BEGIN
  -- Get applicant's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get applicant's phone from profiles
  SELECT phone INTO v_phone
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching lead: email match first, then phone match
  SELECT id INTO v_lead_id
  FROM public.provider_leads
  WHERE (v_email IS NOT NULL AND email = v_email)
     OR (v_phone IS NOT NULL AND v_phone != '' AND phone = v_phone)
  ORDER BY
    CASE WHEN email = v_email THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    UPDATE public.provider_leads
    SET status = 'applied'
    WHERE id = v_lead_id;

    NEW.provider_lead_id := v_lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update attribute_referral_on_application to match on phone OR email
CREATE OR REPLACE FUNCTION public.attribute_referral_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
BEGIN
  -- Get applicant's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get applicant's phone from profiles
  SELECT phone INTO v_phone
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF (v_email IS NULL OR v_email = '') AND (v_phone IS NULL OR v_phone = '') THEN
    RETURN NEW;
  END IF;

  -- Match against provider_referrals by referred_contact (email or phone)
  UPDATE public.provider_referrals
  SET status = 'applied'
  WHERE status IN ('new', 'contacted')
    AND (
      (v_email IS NOT NULL AND v_email != '' AND referred_contact = v_email)
      OR (v_phone IS NOT NULL AND v_phone != '' AND referred_contact = v_phone)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
