
-- Drop existing void version, recreate with jsonb return
DROP FUNCTION IF EXISTS public.reorder_provider_route(uuid, date, jsonb);

CREATE OR REPLACE FUNCTION public.reorder_provider_route(
  p_provider_org_id uuid,
  p_date date,
  p_job_orders jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_is_member boolean;
  v_job_id uuid;
  v_order int;
  v_old_order int;
  v_job_status text;
  v_updated int := 0;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM provider_members
    WHERE provider_org_id = p_provider_org_id
      AND user_id = v_caller_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Not authorized to reorder routes for this organization';
  END IF;

  FOR v_job_id, v_order IN
    SELECT (elem->>'job_id')::uuid, (elem->>'route_order')::int
    FROM jsonb_array_elements(p_job_orders) AS elem
  LOOP
    SELECT status, route_order INTO v_job_status, v_old_order
    FROM jobs
    WHERE id = v_job_id
      AND provider_org_id = p_provider_org_id
      AND scheduled_date = p_date;

    IF v_job_status = 'IN_PROGRESS' THEN
      RAISE EXCEPTION 'Cannot reorder job % — it is currently in progress', v_job_id;
    END IF;

    UPDATE jobs
    SET route_order = v_order, updated_at = now()
    WHERE id = v_job_id
      AND provider_org_id = p_provider_org_id
      AND scheduled_date = p_date;

    IF FOUND THEN
      v_updated := v_updated + 1;
      INSERT INTO job_events (job_id, event_type, actor_user_id, actor_role, metadata)
      VALUES (
        v_job_id, 'ROUTE_REORDERED', v_caller_id, 'provider',
        jsonb_build_object('old_route_order', v_old_order, 'new_route_order', v_order)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('status', 'ok', 'updated_count', v_updated);
END;
$$;
