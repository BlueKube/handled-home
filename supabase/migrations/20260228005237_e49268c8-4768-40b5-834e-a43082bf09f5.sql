
-- =============================================
-- Sprint 2G-D Part 2: Change Requests + Payout RPCs
-- =============================================

-- 1. admin_change_requests table
CREATE TABLE IF NOT EXISTS public.admin_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  requester_role text NOT NULL,
  target_table text NOT NULL,
  target_entity_id text,
  change_type text NOT NULL, -- 'pricing', 'payout', 'incentive', 'algorithm'
  proposed_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewer_user_id uuid,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_change_requests ENABLE ROW LEVEL SECURITY;

-- Admin can read all change requests
CREATE POLICY "admin_read_change_requests" ON public.admin_change_requests
  FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

-- Any admin can INSERT (submit a request)
CREATE POLICY "admin_insert_change_requests" ON public.admin_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_member(auth.uid()) AND requester_user_id = auth.uid());

-- Only superuser can UPDATE (approve/reject)
CREATE POLICY "superuser_update_change_requests" ON public.admin_change_requests
  FOR UPDATE TO authenticated
  USING (public.is_superuser(auth.uid()));

-- 2. RPC: set_provider_payout_base (atomic, versioned, audited)
CREATE OR REPLACE FUNCTION public.set_provider_payout_base(
  p_sku_id uuid,
  p_base_payout_cents integer,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_version integer;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can set payout base prices';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.provider_payout_base WHERE sku_id = p_sku_id;

  INSERT INTO public.provider_payout_base (sku_id, base_payout_cents, version, changed_by, reason, active_from)
  VALUES (p_sku_id, p_base_payout_cents, v_next_version, v_user_id, p_reason, now());

  PERFORM public.log_admin_action(
    v_user_id,
    'set_provider_payout_base',
    'provider_payout_base',
    p_sku_id::text,
    NULL,
    jsonb_build_object('base_payout_cents', p_base_payout_cents, 'version', v_next_version),
    p_reason
  );
END;
$$;

-- 3. RPC: set_provider_payout_zone_override (atomic, versioned, audited)
CREATE OR REPLACE FUNCTION public.set_provider_payout_zone_override(
  p_zone_id uuid,
  p_sku_id uuid,
  p_payout_multiplier numeric DEFAULT NULL,
  p_override_payout_cents integer DEFAULT NULL,
  p_reason text DEFAULT '',
  p_active_from timestamptz DEFAULT now()
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_version integer;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can set payout overrides';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  -- Expire current active override
  UPDATE public.provider_payout_zone_overrides
  SET active_to = now()
  WHERE zone_id = p_zone_id AND sku_id = p_sku_id AND active_to IS NULL;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.provider_payout_zone_overrides WHERE zone_id = p_zone_id AND sku_id = p_sku_id;

  INSERT INTO public.provider_payout_zone_overrides (zone_id, sku_id, payout_multiplier, override_payout_cents, version, changed_by, reason, active_from, active_to)
  VALUES (p_zone_id, p_sku_id, p_payout_multiplier, p_override_payout_cents, v_next_version, v_user_id, p_reason, p_active_from, NULL);

  PERFORM public.log_admin_action(
    v_user_id,
    'set_provider_payout_zone_override',
    'provider_payout_zone_overrides',
    p_zone_id::text || ':' || p_sku_id::text,
    NULL,
    jsonb_build_object('payout_multiplier', p_payout_multiplier, 'override_payout_cents', p_override_payout_cents, 'version', v_next_version),
    p_reason
  );
END;
$$;

-- 4. RPC: set_provider_org_contract (atomic, audited)
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
  SET active_to = now(), updated_at = now()
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

-- 5. RPC: set_payout_overtime_rules (atomic, versioned, audited)
CREATE OR REPLACE FUNCTION public.set_payout_overtime_rules(
  p_zone_id uuid,
  p_sku_id uuid,
  p_expected_minutes integer,
  p_overtime_rate_cents_per_min integer,
  p_overtime_start_after_minutes integer,
  p_overtime_cap_cents integer,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_version integer;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can set overtime rules';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.payout_overtime_rules WHERE zone_id = p_zone_id AND sku_id = p_sku_id;

  INSERT INTO public.payout_overtime_rules (zone_id, sku_id, expected_minutes, overtime_rate_cents_per_min, overtime_start_after_minutes, overtime_cap_cents, version, changed_by, reason)
  VALUES (p_zone_id, p_sku_id, p_expected_minutes, p_overtime_rate_cents_per_min, p_overtime_start_after_minutes, p_overtime_cap_cents, v_next_version, v_user_id, p_reason);

  PERFORM public.log_admin_action(
    v_user_id,
    'set_payout_overtime_rules',
    'payout_overtime_rules',
    p_zone_id::text || ':' || p_sku_id::text,
    NULL,
    jsonb_build_object('expected_minutes', p_expected_minutes, 'overtime_rate', p_overtime_rate_cents_per_min, 'cap', p_overtime_cap_cents, 'version', v_next_version),
    p_reason
  );
END;
$$;

-- 6. RPC: submit_change_request (any admin)
CREATE OR REPLACE FUNCTION public.submit_change_request(
  p_target_table text,
  p_target_entity_id text,
  p_change_type text,
  p_proposed_changes jsonb,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_id uuid;
BEGIN
  IF NOT public.is_admin_member(v_user_id) THEN
    RAISE EXCEPTION 'Must be admin member';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT admin_role::text INTO v_role FROM public.admin_memberships WHERE user_id = v_user_id AND is_active LIMIT 1;

  INSERT INTO public.admin_change_requests (requester_user_id, requester_role, target_table, target_entity_id, change_type, proposed_changes, reason)
  VALUES (v_user_id, v_role, p_target_table, p_target_entity_id, p_change_type, p_proposed_changes, p_reason)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7. RPC: review_change_request (superuser only)
CREATE OR REPLACE FUNCTION public.review_change_request(
  p_request_id uuid,
  p_decision text,
  p_reviewer_note text DEFAULT ''
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_req record;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can review change requests';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO v_req FROM public.admin_change_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Change request not found'; END IF;
  IF v_req.status != 'pending' THEN RAISE EXCEPTION 'Request already reviewed'; END IF;

  UPDATE public.admin_change_requests
  SET status = p_decision,
      reviewer_user_id = v_user_id,
      reviewer_note = p_reviewer_note,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  PERFORM public.log_admin_action(
    v_user_id,
    'review_change_request',
    'admin_change_requests',
    p_request_id::text,
    to_jsonb(v_req),
    jsonb_build_object('decision', p_decision, 'note', p_reviewer_note),
    p_decision || ': ' || COALESCE(p_reviewer_note, '')
  );
END;
$$;
