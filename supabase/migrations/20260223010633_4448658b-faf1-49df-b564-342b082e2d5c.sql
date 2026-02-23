
-- A1: RPC to attribute referral on signup
CREATE OR REPLACE FUNCTION public.attribute_referral_signup(
  p_referral_code text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_existing_referral uuid;
BEGIN
  -- Look up the referral code
  SELECT rc.id, rc.user_id, rc.program_id
  INTO v_code
  FROM referral_codes rc
  WHERE rc.code = p_referral_code AND rc.is_active = true;

  IF NOT FOUND THEN
    RETURN; -- silently ignore invalid codes
  END IF;

  -- Don't self-refer
  IF v_code.user_id = auth.uid() THEN
    RETURN;
  END IF;

  -- First-touch: check if already referred in this program
  SELECT id INTO v_existing_referral
  FROM referrals
  WHERE program_id = v_code.program_id AND referred_user_id = auth.uid();

  IF FOUND THEN
    RETURN; -- already attributed
  END IF;

  -- Create the referral (first-touch attribution)
  INSERT INTO referrals (program_id, referrer_user_id, referred_user_id, code_id, status)
  VALUES (v_code.program_id, v_code.user_id, auth.uid(), v_code.id, 'active')
  ON CONFLICT (program_id, referred_user_id) DO NOTHING;

  -- Record signup milestone
  PERFORM record_referral_milestone(
    (SELECT id FROM referrals WHERE program_id = v_code.program_id AND referred_user_id = auth.uid()),
    'signup'::referral_milestone_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.attribute_referral_signup(text) TO authenticated;
