-- D2-F5: Restore original set_provider_org_contract with minimal fix (remove updated_at only)
CREATE OR REPLACE FUNCTION public.set_provider_org_contract(
  p_provider_org_id uuid,
  p_contract_type text,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old jsonb;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can set contract types';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;
  IF p_contract_type NOT IN ('partner_flat', 'partner_time_guarded', 'contractor_time_based') THEN
    RAISE EXCEPTION 'Invalid contract type: %', p_contract_type;
  END IF;

  -- Expire any current active contract
  SELECT to_jsonb(c.*) INTO v_old
  FROM public.provider_org_contracts c
  WHERE c.provider_org_id = p_provider_org_id AND c.active_to IS NULL
  LIMIT 1;

  UPDATE public.provider_org_contracts
  SET active_to = now()
  WHERE provider_org_id = p_provider_org_id AND active_to IS NULL;

  INSERT INTO public.provider_org_contracts (provider_org_id, contract_type, active_from, changed_by, reason)
  VALUES (p_provider_org_id, p_contract_type, now(), v_user_id, p_reason);

  PERFORM public.log_admin_action(
    v_user_id,
    'set_provider_org_contract',
    'provider_org_contracts',
    p_provider_org_id::text,
    v_old,
    jsonb_build_object('contract_type', p_contract_type),
    p_reason
  );
END;
$$;