-- Replace reorder_provider_route to log old_route_order and reject IN_PROGRESS jobs
CREATE OR REPLACE FUNCTION public.reorder_provider_route(
  p_provider_org_id uuid,
  p_date date,
  p_job_orders jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry jsonb;
  v_job_id uuid;
  v_order int;
  v_old_order int;
  v_job_status text;
  v_member_org_id uuid;
BEGIN
  -- Verify caller belongs to provider org
  SELECT provider_org_id INTO v_member_org_id
  FROM provider_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_member_org_id IS NULL OR v_member_org_id != p_provider_org_id THEN
    RAISE EXCEPTION 'Not a member of this provider organization';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_job_orders)
  LOOP
    v_job_id := (v_entry->>'job_id')::uuid;
    v_order := (v_entry->>'route_order')::int;

    -- Get current route_order and status
    SELECT route_order, status INTO v_old_order, v_job_status
    FROM jobs
    WHERE id = v_job_id
      AND provider_org_id = p_provider_org_id
      AND scheduled_date = p_date;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Job % not found for this provider on this date', v_job_id;
    END IF;

    -- Freeze: do not allow reordering IN_PROGRESS jobs
    IF v_job_status = 'IN_PROGRESS' THEN
      RAISE EXCEPTION 'Cannot reorder job % — it is currently in progress', v_job_id;
    END IF;

    -- Update route_order
    UPDATE jobs
    SET route_order = v_order, updated_at = now()
    WHERE id = v_job_id
      AND provider_org_id = p_provider_org_id
      AND scheduled_date = p_date;

    -- Audit log with old and new order
    INSERT INTO job_events (job_id, event_type, actor_user_id, actor_role, metadata)
    VALUES (
      v_job_id,
      'ROUTE_REORDERED',
      auth.uid(),
      'provider',
      jsonb_build_object(
        'old_route_order', v_old_order,
        'new_route_order', v_order,
        'date', p_date::text
      )
    );
  END LOOP;
END;
$$;
