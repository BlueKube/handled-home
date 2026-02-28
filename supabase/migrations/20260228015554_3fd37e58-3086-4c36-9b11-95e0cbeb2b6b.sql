
-- D2-F1: Fix set_provider_org_contract — remove reference to non-existent updated_at column
CREATE OR REPLACE FUNCTION public.set_provider_org_contract(
  p_provider_org_id uuid,
  p_contract_type text,
  p_flat_rate_cents integer DEFAULT NULL,
  p_hourly_rate_cents integer DEFAULT NULL,
  p_time_guard_minutes integer DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_id uuid;
  v_before jsonb;
BEGIN
  IF NOT public.is_admin_member(v_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  -- Capture before state
  SELECT to_jsonb(c.*) INTO v_before
  FROM public.provider_org_contracts c
  WHERE c.provider_org_id = p_provider_org_id AND c.active_to IS NULL;

  -- Expire current contract (no updated_at column on this table)
  UPDATE public.provider_org_contracts
  SET active_to = now()
  WHERE provider_org_id = p_provider_org_id AND active_to IS NULL;

  -- Insert new contract
  INSERT INTO public.provider_org_contracts (
    provider_org_id, contract_type, flat_rate_cents, hourly_rate_cents, time_guard_minutes
  ) VALUES (
    p_provider_org_id, p_contract_type, p_flat_rate_cents, p_hourly_rate_cents, p_time_guard_minutes
  ) RETURNING id INTO v_new_id;

  PERFORM public.log_admin_action(
    v_user_id,
    'set_provider_org_contract',
    'provider_org_contracts',
    v_new_id::text,
    v_before,
    jsonb_build_object('contract_type', p_contract_type, 'flat_rate_cents', p_flat_rate_cents, 'hourly_rate_cents', p_hourly_rate_cents, 'time_guard_minutes', p_time_guard_minutes),
    p_reason
  );

  RETURN v_new_id;
END;
$$;
