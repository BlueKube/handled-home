-- Round 64 / Phase 4 / Batch 4.4 — Snap routing + refund path
--
-- Creates:
--   - public.dispatch_requests        (queue for ad_hoc snaps awaiting provider dispatch)
--   - public.handle_snap_routing(uuid) RPC — attaches a finalized snap to either
--                                            the customer's next_visit (as a job_task)
--                                            or a new dispatch_requests row.
--   - public.resolve_snap(uuid, int, bool) RPC — closes a snap with optional partial
--                                                refund or full-cancel refund.
--
-- Does NOT create:
--   - Triggers on complete_job that auto-call resolve_snap (deferred; manual for now)
--   - Auto-assignment logic for dispatch_requests (Phase 7 provider tooling)
--   - Visit Detail UI for job_tasks (Phase 5)

-- ---------------------------------------------------------------------------
-- Table: dispatch_requests
-- ---------------------------------------------------------------------------
CREATE TABLE public.dispatch_requests (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snap_request_id           uuid NOT NULL REFERENCES public.snap_requests(id) ON DELETE CASCADE,
  property_id               uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                    text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','assigned','en_route','completed','canceled')),
  urgency                   text CHECK (urgency IN ('low','medium','high')),
  assigned_provider_org_id  uuid REFERENCES public.provider_orgs(id) ON DELETE SET NULL,
  dispatched_at             timestamptz,
  resolved_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatch_requests_customer ON public.dispatch_requests(customer_id);
CREATE INDEX idx_dispatch_requests_status   ON public.dispatch_requests(status);
CREATE INDEX idx_dispatch_requests_assigned ON public.dispatch_requests(assigned_provider_org_id)
  WHERE assigned_provider_org_id IS NOT NULL;

CREATE TRIGGER dispatch_requests_updated_at
  BEFORE UPDATE ON public.dispatch_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.dispatch_requests ENABLE ROW LEVEL SECURITY;

-- Customer reads own
CREATE POLICY "dispatch_req_customer_select" ON public.dispatch_requests
  FOR SELECT USING (customer_id = auth.uid());

-- Provider reads requests assigned to their org
CREATE POLICY "dispatch_req_provider_select" ON public.dispatch_requests
  FOR SELECT USING (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Provider can transition status on their own assigned dispatches
CREATE POLICY "dispatch_req_provider_update" ON public.dispatch_requests
  FOR UPDATE USING (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  ) WITH CHECK (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Admin full access
CREATE POLICY "dispatch_req_admin_all" ON public.dispatch_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Note: no customer INSERT policy — handle_snap_routing (SECURITY DEFINER)
-- inserts on the customer's behalf. Customers cannot create arbitrary
-- dispatch rows.

COMMENT ON TABLE public.dispatch_requests IS
  'Queue for ad_hoc Snap-a-Fix requests awaiting provider dispatch. Populated by handle_snap_routing RPC when snap_requests.routing=ad_hoc.';

-- ---------------------------------------------------------------------------
-- RPC: handle_snap_routing
-- ---------------------------------------------------------------------------
-- Called after the customer has finalized a snap (routing set, credits held
-- via spend_handles). Routes the snap per snap_requests.routing and advances
-- status. Caller: the customer themselves or an admin.
--
-- Returns structured JSON:
--   { success: true, route_type, linked_job_id? | dispatch_request_id }
--   { success: false, error, [status|routing] }
--
-- Known error codes:
--   snap_not_found, unauthorized, routing_not_set, credits_not_held,
--   already_routed, no_upcoming_job, invalid_routing
CREATE OR REPLACE FUNCTION public.handle_snap_routing(p_snap_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_snap RECORD;
  v_next_job uuid;
  v_dispatch_id uuid;
  v_urgency text;
BEGIN
  SELECT * INTO v_snap FROM snap_requests WHERE id = p_snap_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'snap_not_found');
  END IF;

  IF v_snap.customer_id <> v_caller
     AND NOT has_role(v_caller, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_snap.routing IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'routing_not_set');
  END IF;

  IF v_snap.credits_held <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'credits_not_held');
  END IF;

  IF v_snap.status NOT IN ('submitted','triaged') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_routed',
      'status', v_snap.status
    );
  END IF;

  v_urgency := COALESCE(v_snap.ai_classification->>'urgency_signal', 'medium');

  IF v_snap.routing = 'next_visit' THEN
    SELECT j.id INTO v_next_job
    FROM jobs j
    WHERE j.customer_id = v_snap.customer_id
      AND j.property_id = v_snap.property_id
      AND j.scheduled_date >= CURRENT_DATE
      AND j.status IN ('NOT_STARTED','IN_PROGRESS')
    ORDER BY j.scheduled_date ASC, j.created_at ASC
    LIMIT 1;

    IF v_next_job IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'no_upcoming_job');
    END IF;

    INSERT INTO job_tasks (
      job_id, task_type, snap_request_id, description, credits_estimated, status
    ) VALUES (
      v_next_job, 'snap', v_snap.id,
      COALESCE(v_snap.ai_classification->>'summary', v_snap.description),
      v_snap.credits_held, 'pending'
    );

    UPDATE snap_requests
    SET linked_job_id = v_next_job,
        status = 'scheduled',
        updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'route_type', 'next_visit',
      'linked_job_id', v_next_job
    );

  ELSIF v_snap.routing = 'ad_hoc' THEN
    INSERT INTO dispatch_requests (
      snap_request_id, property_id, customer_id, urgency
    ) VALUES (
      v_snap.id, v_snap.property_id, v_snap.customer_id, v_urgency
    )
    RETURNING id INTO v_dispatch_id;

    UPDATE snap_requests
    SET status = 'dispatched', updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'route_type', 'ad_hoc',
      'dispatch_request_id', v_dispatch_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'error', 'invalid_routing',
    'routing', v_snap.routing
  );
END;
$$;

COMMENT ON FUNCTION public.handle_snap_routing(uuid) IS
  'Routes a finalized Snap-a-Fix request. For next_visit: inserts a snap job_task onto the customer''s next job. For ad_hoc: inserts a dispatch_requests row. Returns structured JSON; on failure returns {success:false, error} without side effects.';

-- ---------------------------------------------------------------------------
-- RPC: resolve_snap
-- ---------------------------------------------------------------------------
-- Closes a routed snap. Two paths:
--
-- 1. Completion (p_canceled=false):
--    Update credits_actual = LEAST(p_credits_actual ?? credits_held, credits_held).
--    If actual < held, refund the difference via refund_handles. Set status='resolved'.
--
-- 2. Cancel (p_canceled=true):
--    Full refund of credits_held. Set status='canceled'.
--
-- Caller: owner, admin, or service_role (for future complete_job trigger).
CREATE OR REPLACE FUNCTION public.resolve_snap(
  p_snap_request_id uuid,
  p_credits_actual int DEFAULT NULL,
  p_canceled boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_snap RECORD;
  v_final_actual int;
  v_refund_amount int;
  v_is_service_caller boolean := (v_caller IS NULL);
BEGIN
  SELECT * INTO v_snap FROM snap_requests WHERE id = p_snap_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'snap_not_found');
  END IF;

  IF NOT v_is_service_caller
     AND v_snap.customer_id <> v_caller
     AND NOT has_role(v_caller, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_snap.status IN ('resolved','canceled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_resolved',
      'status', v_snap.status
    );
  END IF;

  IF p_canceled THEN
    IF v_snap.credits_held > 0 AND v_snap.subscription_id IS NOT NULL THEN
      PERFORM refund_handles(
        v_snap.subscription_id,
        v_snap.customer_id,
        v_snap.credits_held,
        v_snap.id,
        NULL
      );
    END IF;

    UPDATE snap_requests
    SET status = 'canceled',
        credits_actual = 0,
        resolved_at = now(),
        updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'resolution', 'canceled',
      'refunded', v_snap.credits_held
    );
  END IF;

  -- Completion
  v_final_actual := LEAST(
    COALESCE(p_credits_actual, v_snap.credits_held),
    v_snap.credits_held
  );
  IF v_final_actual < 0 THEN v_final_actual := 0; END IF;

  UPDATE snap_requests
  SET credits_actual = v_final_actual,
      status = 'resolved',
      resolved_at = now(),
      updated_at = now()
  WHERE id = v_snap.id;

  IF v_final_actual < v_snap.credits_held AND v_snap.subscription_id IS NOT NULL THEN
    v_refund_amount := v_snap.credits_held - v_final_actual;
    PERFORM refund_handles(
      v_snap.subscription_id,
      v_snap.customer_id,
      v_refund_amount,
      v_snap.id,
      NULL
    );
    RETURN jsonb_build_object(
      'success', true,
      'resolution', 'resolved_partial',
      'credits_actual', v_final_actual,
      'refunded', v_refund_amount
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'resolution', 'resolved_full',
    'credits_actual', v_final_actual
  );
END;
$$;

COMMENT ON FUNCTION public.resolve_snap(uuid, int, boolean) IS
  'Closes a Snap-a-Fix request with optional partial refund (credits_actual < credits_held) or full cancel refund. Called by owner, admin, or service_role (for future complete_job trigger integration).';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.handle_snap_routing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_snap(uuid, int, boolean) TO authenticated, service_role;
