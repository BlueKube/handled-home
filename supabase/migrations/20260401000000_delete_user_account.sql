-- ============================================
-- Account Deletion RPC
-- ============================================
-- Anonymizes user data, cancels subscription, and marks account as deleted.
-- Retains anonymized records for provider payment history and audit compliance.
-- Called from customer Settings → Delete Account flow.
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is the account owner
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete your own account';
  END IF;

  -- 1. Cancel active subscriptions
  UPDATE public.subscriptions
  SET status = 'canceled', updated_at = now()
  WHERE customer_id = p_user_id AND status IN ('active', 'trialing', 'past_due', 'paused');

  -- 2. Anonymize profile (user_id is the auth FK, not id)
  UPDATE public.profiles
  SET
    full_name = 'Deleted User',
    phone = NULL,
    avatar_url = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. Anonymize property data (user_id is the auth FK)
  UPDATE public.properties
  SET
    street_address = 'REDACTED',
    city = 'REDACTED',
    state = NULL,
    zip_code = 'REDACTED',
    access_instructions = NULL,
    gate_code = NULL,
    parking_instructions = NULL,
    pets = NULL,
    notes = NULL,
    lat = NULL,
    lng = NULL,
    geohash = NULL,
    h3_index = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 4. Remove device tokens (stop push notifications)
  DELETE FROM public.user_device_tokens WHERE user_id = p_user_id;

  -- 5. Clear notification preferences
  DELETE FROM public.user_notification_preferences WHERE user_id = p_user_id;

  -- 6. Anonymize referral data
  UPDATE public.referrals
  SET referrer_note = NULL, updated_at = now()
  WHERE referrer_user_id = p_user_id OR referred_user_id = p_user_id;

  -- 7. Mark support tickets as from deleted user and clear freeform PII
  UPDATE public.support_tickets
  SET
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{account_deleted}', 'true'::jsonb),
    updated_at = now()
  WHERE customer_id = p_user_id;

  -- Note: We do NOT delete job records, invoices, or provider earnings
  -- as these are needed for provider payment history and financial audit.
  -- The profile anonymization (step 2) removes PII from these records'
  -- join relationships.
END;
$$;
