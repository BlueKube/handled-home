
-- 3A-F1: Create SECURITY DEFINER RPC for courtesy upgrade with atomic guardrail
CREATE OR REPLACE FUNCTION public.insert_courtesy_upgrade(
  p_job_id UUID,
  p_property_id UUID,
  p_sku_id UUID,
  p_scheduled_level_id UUID,
  p_performed_level_id UUID,
  p_reason_code TEXT,
  p_provider_org_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count INT;
  v_id UUID;
BEGIN
  -- Atomic 6-month guardrail check
  SELECT COUNT(*) INTO v_existing_count
  FROM courtesy_upgrades
  WHERE property_id = p_property_id
    AND sku_id = p_sku_id
    AND created_at >= (now() - interval '6 months');

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'A courtesy upgrade was already given for this service at this property in the last 6 months.';
  END IF;

  INSERT INTO courtesy_upgrades (job_id, property_id, sku_id, scheduled_level_id, performed_level_id, reason_code, provider_org_id)
  VALUES (p_job_id, p_property_id, p_sku_id, p_scheduled_level_id, p_performed_level_id, p_reason_code, p_provider_org_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3A-F3: Add unique constraint to level_recommendations (one per job)
ALTER TABLE public.level_recommendations ADD CONSTRAINT level_recommendations_job_id_unique UNIQUE (job_id);
