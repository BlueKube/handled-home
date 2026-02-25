
-- Sprint 6: Route Optimization — reorder_provider_route RPC
-- Allows providers to manually reorder their day's jobs

CREATE OR REPLACE FUNCTION public.reorder_provider_route(
  p_date date,
  p_job_orders jsonb -- array of {job_id: uuid, route_order: int}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_org_id uuid;
  v_item jsonb;
  v_job_id uuid;
  v_order int;
  v_updated int := 0;
BEGIN
  -- Get provider org for current user
  SELECT po.id INTO v_provider_org_id
  FROM provider_members pm
  JOIN provider_orgs po ON po.id = pm.provider_org_id
  WHERE pm.user_id = auth.uid()
  LIMIT 1;

  IF v_provider_org_id IS NULL THEN
    RAISE EXCEPTION 'Provider organization not found';
  END IF;

  -- Validate and update each job's route_order
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_job_orders)
  LOOP
    v_job_id := (v_item->>'job_id')::uuid;
    v_order := (v_item->>'route_order')::int;

    UPDATE jobs
    SET route_order = v_order, updated_at = now()
    WHERE id = v_job_id
      AND provider_org_id = v_provider_org_id
      AND scheduled_date = p_date
      AND status NOT IN ('COMPLETED', 'CANCELED');

    IF FOUND THEN
      v_updated := v_updated + 1;

      -- Audit log the reorder
      INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
      VALUES (v_job_id, auth.uid(), 'provider', 'ROUTE_REORDERED',
              jsonb_build_object('new_route_order', v_order, 'date', p_date));
    END IF;
  END LOOP;

  RETURN jsonb_build_object('status', 'ok', 'updated_count', v_updated);
END;
$$;
