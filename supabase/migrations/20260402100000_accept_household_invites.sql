-- ============================================
-- Round 10, Phase 2, B4: Accept Household Invites RPC
-- ============================================
-- Auto-accepts pending household invites when a user's email
-- matches a pending invite_email in household_members.
-- ============================================

CREATE OR REPLACE FUNCTION public.accept_household_invites()
RETURNS INTEGER AS $$
DECLARE
  v_email TEXT;
  v_count INTEGER;
BEGIN
  -- Get the current user's email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RETURN 0;
  END IF;

  -- Accept all pending invites matching this email
  UPDATE public.household_members
  SET user_id = auth.uid(),
      status = 'active'
  WHERE invite_email = v_email
    AND status = 'pending'
    AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_household_invites() TO authenticated;
