
-- Drop old function with void return type, then recreate with jsonb return
DROP FUNCTION IF EXISTS public.insert_courtesy_upgrade(UUID, UUID, UUID, UUID, UUID, TEXT, UUID);

-- P3-F1 + P3-F2: Recreate with auth check + advisory lock
CREATE FUNCTION public.insert_courtesy_upgrade(
  p_job_id UUID,
  p_property_id UUID,
  p_sku_id UUID,
  p_scheduled_level_id UUID,
  p_performed_level_id UUID,
  p_reason_code TEXT,
  p_provider_org_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count INT;
  v_caller_id UUID := auth.uid();
  v_is_member BOOLEAN;
  v_result jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM provider_members
    WHERE user_id = v_caller_id
      AND provider_org_id = p_provider_org_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Caller is not an active member of the specified provider org';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_property_id::text || p_sku_id::text)
  );

  SELECT COUNT(*) INTO v_existing_count
  FROM courtesy_upgrades
  WHERE property_id = p_property_id
    AND sku_id = p_sku_id
    AND created_at >= (now() - interval '6 months');

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Courtesy upgrade already given for this property/SKU in the last 6 months';
  END IF;

  INSERT INTO courtesy_upgrades (job_id, property_id, sku_id, scheduled_level_id, performed_level_id, reason_code, provider_org_id)
  VALUES (p_job_id, p_property_id, p_sku_id, p_scheduled_level_id, p_performed_level_id, p_reason_code, p_provider_org_id)
  RETURNING to_jsonb(courtesy_upgrades.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- P3-F3: Atomic level reorder RPC
CREATE OR REPLACE FUNCTION public.swap_sku_level_order(
  p_level_a_id UUID,
  p_level_b_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num_a INT;
  v_num_b INT;
  v_sku_a UUID;
  v_sku_b UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT level_number, sku_id INTO v_num_a, v_sku_a FROM sku_levels WHERE id = p_level_a_id;
  SELECT level_number, sku_id INTO v_num_b, v_sku_b FROM sku_levels WHERE id = p_level_b_id;

  IF v_sku_a IS NULL OR v_sku_b IS NULL THEN
    RAISE EXCEPTION 'Level not found';
  END IF;
  IF v_sku_a != v_sku_b THEN
    RAISE EXCEPTION 'Levels must belong to the same SKU';
  END IF;

  UPDATE sku_levels SET level_number = -1, updated_at = now() WHERE id = p_level_a_id;
  UPDATE sku_levels SET level_number = v_num_a, updated_at = now() WHERE id = p_level_b_id;
  UPDATE sku_levels SET level_number = v_num_b, updated_at = now() WHERE id = p_level_a_id;
END;
$$;
