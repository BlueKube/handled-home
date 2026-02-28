
-- Sprint 2G-D Review Fixes: D-F1, D-F2, D-F3, D-F4, D-F5, C-F3

-- ============================================================
-- C-F3: Add actor_admin_role to admin_audit_log
-- ============================================================
ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS actor_admin_role text;

-- Update log_admin_action to accept and store actor_admin_role
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_before jsonb DEFAULT NULL,
  p_after jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT admin_role::text INTO v_role
  FROM public.admin_memberships
  WHERE user_id = p_admin_user_id AND is_active = true
  LIMIT 1;

  INSERT INTO public.admin_audit_log (admin_user_id, actor_admin_role, action, entity_type, entity_id, before, after, reason)
  VALUES (p_admin_user_id, v_role, p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason);
END;
$$;

-- ============================================================
-- D-F5: Drop and recreate effective price/payout RPCs with admin check
-- ============================================================
DROP FUNCTION IF EXISTS public.get_effective_sku_price(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_effective_provider_payout(uuid, uuid);

CREATE FUNCTION public.get_effective_sku_price(p_zone_id uuid, p_sku_id uuid)
RETURNS TABLE(sku_id uuid, base_price_cents integer, price_multiplier numeric, override_price_cents integer, effective_price_cents integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_member(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin membership required';
  END IF;

  RETURN QUERY
  WITH latest_base AS (
    SELECT b.sku_id, b.base_price_cents
    FROM public.sku_pricing_base b
    WHERE b.sku_id = p_sku_id
    ORDER BY b.active_from DESC
    LIMIT 1
  ),
  latest_override AS (
    SELECT zo.sku_id, zo.price_multiplier, zo.override_price_cents
    FROM public.sku_pricing_zone_overrides zo
    WHERE zo.zone_id = p_zone_id AND zo.sku_id = p_sku_id AND zo.active_to IS NULL
    ORDER BY zo.active_from DESC
    LIMIT 1
  )
  SELECT
    lb.sku_id,
    lb.base_price_cents,
    lo.price_multiplier,
    lo.override_price_cents,
    COALESCE(
      lo.override_price_cents,
      CASE WHEN lo.price_multiplier IS NOT NULL
        THEN (lb.base_price_cents * lo.price_multiplier)::integer
        ELSE lb.base_price_cents
      END
    ) AS effective_price_cents
  FROM latest_base lb
  LEFT JOIN latest_override lo ON lo.sku_id = lb.sku_id;
END;
$$;

CREATE FUNCTION public.get_effective_provider_payout(p_zone_id uuid, p_sku_id uuid)
RETURNS TABLE(sku_id uuid, base_payout_cents integer, payout_multiplier numeric, override_payout_cents integer, effective_payout_cents integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_member(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin membership required';
  END IF;

  RETURN QUERY
  WITH latest_base AS (
    SELECT b.sku_id, b.base_payout_cents
    FROM public.provider_payout_base b
    WHERE b.sku_id = p_sku_id
    ORDER BY b.active_from DESC
    LIMIT 1
  ),
  latest_override AS (
    SELECT zo.sku_id, zo.payout_multiplier, zo.override_payout_cents
    FROM public.provider_payout_zone_overrides zo
    WHERE zo.zone_id = p_zone_id AND zo.sku_id = p_sku_id AND zo.active_to IS NULL
    ORDER BY zo.active_from DESC
    LIMIT 1
  )
  SELECT
    lb.sku_id,
    lb.base_payout_cents,
    lo.payout_multiplier,
    lo.override_payout_cents,
    COALESCE(
      lo.override_payout_cents,
      CASE WHEN lo.payout_multiplier IS NOT NULL
        THEN (lb.base_payout_cents * lo.payout_multiplier)::integer
        ELSE lb.base_payout_cents
      END
    ) AS effective_payout_cents
  FROM latest_base lb
  LEFT JOIN latest_override lo ON lo.sku_id = lb.sku_id;
END;
$$;

-- ============================================================
-- D-F1/F2/F3/F4: Server-side pricing RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_sku_base_price(
  p_sku_id uuid,
  p_base_price_cents integer,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_version integer;
  v_new_id uuid;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Access denied: superuser required';
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.sku_pricing_base WHERE sku_id = p_sku_id;

  INSERT INTO public.sku_pricing_base (sku_id, base_price_cents, version, changed_by, reason)
  VALUES (p_sku_id, p_base_price_cents, v_next_version, v_user_id, trim(p_reason))
  RETURNING id INTO v_new_id;

  PERFORM public.log_admin_action(
    v_user_id, 'set_sku_base_price', 'sku_pricing_base', v_new_id::text,
    NULL,
    jsonb_build_object('sku_id', p_sku_id, 'base_price_cents', p_base_price_cents, 'version', v_next_version),
    trim(p_reason)
  );

  RETURN jsonb_build_object('id', v_new_id, 'version', v_next_version);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_zone_pricing_override(
  p_zone_id uuid,
  p_sku_id uuid,
  p_price_multiplier numeric DEFAULT NULL,
  p_override_price_cents integer DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_active_from timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_version integer;
  v_new_id uuid;
  v_expired_id uuid;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Access denied: superuser required';
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  UPDATE public.sku_pricing_zone_overrides
  SET active_to = now()
  WHERE zone_id = p_zone_id AND sku_id = p_sku_id AND active_to IS NULL
  RETURNING id INTO v_expired_id;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.sku_pricing_zone_overrides WHERE zone_id = p_zone_id AND sku_id = p_sku_id;

  INSERT INTO public.sku_pricing_zone_overrides (zone_id, sku_id, price_multiplier, override_price_cents, version, changed_by, reason, active_from)
  VALUES (p_zone_id, p_sku_id, p_price_multiplier, p_override_price_cents, v_next_version, v_user_id, trim(p_reason), p_active_from)
  RETURNING id INTO v_new_id;

  PERFORM public.log_admin_action(
    v_user_id, 'set_zone_pricing_override', 'sku_pricing_zone_overrides', v_new_id::text,
    CASE WHEN v_expired_id IS NOT NULL THEN jsonb_build_object('expired_id', v_expired_id) ELSE NULL END,
    jsonb_build_object('zone_id', p_zone_id, 'sku_id', p_sku_id, 'multiplier', p_price_multiplier, 'override_cents', p_override_price_cents, 'version', v_next_version),
    trim(p_reason)
  );

  RETURN jsonb_build_object('id', v_new_id, 'version', v_next_version);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_set_zone_multiplier(
  p_zone_id uuid,
  p_sku_ids uuid[],
  p_price_multiplier numeric,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_sku_id uuid;
  v_next_version integer;
  v_count integer := 0;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Access denied: superuser required';
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  FOREACH v_sku_id IN ARRAY p_sku_ids LOOP
    UPDATE public.sku_pricing_zone_overrides
    SET active_to = now()
    WHERE zone_id = p_zone_id AND sku_id = v_sku_id AND active_to IS NULL;

    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM public.sku_pricing_zone_overrides WHERE zone_id = p_zone_id AND sku_id = v_sku_id;

    INSERT INTO public.sku_pricing_zone_overrides (zone_id, sku_id, price_multiplier, override_price_cents, version, changed_by, reason)
    VALUES (p_zone_id, v_sku_id, p_price_multiplier, NULL, v_next_version, v_user_id, trim(p_reason));

    v_count := v_count + 1;
  END LOOP;

  PERFORM public.log_admin_action(
    v_user_id, 'bulk_set_zone_multiplier', 'sku_pricing_zone_overrides', p_zone_id::text,
    NULL,
    jsonb_build_object('zone_id', p_zone_id, 'sku_count', v_count, 'multiplier', p_price_multiplier),
    trim(p_reason)
  );

  RETURN jsonb_build_object('updated_count', v_count);
END;
$$;
