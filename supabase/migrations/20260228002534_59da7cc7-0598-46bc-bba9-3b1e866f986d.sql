
-- D-F9 FIX: Drop and recreate rollback_pricing_override with new log_admin_action signature
DROP FUNCTION IF EXISTS public.rollback_pricing_override(uuid, text);

CREATE OR REPLACE FUNCTION public.rollback_pricing_override(
  p_override_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_prev sku_pricing_zone_overrides;
  v_new_id uuid;
  v_next_version integer;
BEGIN
  IF NOT public.is_superuser(v_user_id) THEN
    RAISE EXCEPTION 'Only superusers can rollback pricing overrides';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT * INTO v_prev
  FROM sku_pricing_zone_overrides
  WHERE id = p_override_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Override not found';
  END IF;

  UPDATE sku_pricing_zone_overrides
  SET active_to = now()
  WHERE zone_id = v_prev.zone_id
    AND sku_id = v_prev.sku_id
    AND active_to IS NULL
    AND id != p_override_id;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM sku_pricing_zone_overrides
  WHERE zone_id = v_prev.zone_id AND sku_id = v_prev.sku_id;

  INSERT INTO sku_pricing_zone_overrides (
    zone_id, sku_id, price_multiplier, override_price_cents,
    active_from, version, changed_by, reason
  ) VALUES (
    v_prev.zone_id, v_prev.sku_id, v_prev.price_multiplier, v_prev.override_price_cents,
    now(), v_next_version, v_user_id, p_reason
  )
  RETURNING id INTO v_new_id;

  PERFORM public.log_admin_action(
    v_user_id,
    'rollback_pricing',
    'sku_pricing_zone_overrides',
    v_new_id::text,
    to_jsonb(v_prev),
    jsonb_build_object('rolled_back_to_version', v_prev.version, 'new_id', v_new_id),
    p_reason
  );

  RETURN v_new_id;
END;
$$;
