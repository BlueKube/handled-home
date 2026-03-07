
-- Sprint 9 Phase 4: Provider Self-Healing Actions (fixed column name)

-- 1) Table for provider action proposals
CREATE TABLE public.provider_action_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  action_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  decision text NOT NULL DEFAULT 'pending',
  decision_reason text,
  customer_notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by text
);

ALTER TABLE public.provider_action_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers_select_own_proposals" ON public.provider_action_proposals
  FOR SELECT TO authenticated
  USING (
    provider_org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "providers_insert_own_proposals" ON public.provider_action_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_all_proposals" ON public.provider_action_proposals
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE INDEX idx_provider_action_proposals_visit ON public.provider_action_proposals(visit_id);
CREATE INDEX idx_provider_action_proposals_provider ON public.provider_action_proposals(provider_org_id, created_at DESC);

-- 2) RPC: propose_provider_action
CREATE OR REPLACE FUNCTION public.propose_provider_action(
  p_visit_id uuid,
  p_action_type text,
  p_payload jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_org_id uuid;
  v_visit record;
  v_decision text;
  v_reason text;
  v_proposal_id uuid;
  v_notify_customer boolean := false;
  v_eta_slip_minutes int;
  v_max_slip int;
  v_customer_id uuid;
BEGIN
  SELECT provider_org_id INTO v_provider_org_id
  FROM provider_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_provider_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a provider member');
  END IF;

  SELECT v.* INTO v_visit
  FROM visits v
  WHERE v.id = p_visit_id
    AND v.provider_org_id = v_provider_org_id
    AND v.scheduled_date = current_date::text
    AND v.schedule_state IN ('scheduled', 'dispatched', 'in_progress');

  IF v_visit IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Visit not found or not yours today');
  END IF;

  CASE p_action_type
    WHEN 'running_late' THEN
      v_eta_slip_minutes := COALESCE((p_payload->>'slip_minutes')::int, 15);
      
      SELECT COALESCE((config_value)::int, 30) INTO v_max_slip
      FROM assignment_config
      WHERE config_key = 'autopilot_max_eta_slip_minutes';
      IF v_max_slip IS NULL THEN v_max_slip := 30; END IF;

      IF v_eta_slip_minutes <= v_max_slip THEN
        IF v_visit.time_window_end IS NOT NULL 
           AND v_visit.eta_range_end IS NOT NULL
           AND (v_visit.eta_range_end::time + (v_eta_slip_minutes || ' minutes')::interval) > v_visit.time_window_end::time THEN
          v_decision := 'denied';
          v_reason := format('ETA slip of %s min would breach window ending at %s', v_eta_slip_minutes, v_visit.time_window_end);
        ELSE
          v_decision := 'approved';
          v_reason := format('ETA slip of %s min within tolerance (%s min max)', v_eta_slip_minutes, v_max_slip);
          v_notify_customer := v_eta_slip_minutes > 10 OR v_visit.time_window_end IS NOT NULL;
        END IF;
      ELSE
        v_decision := 'denied';
        v_reason := format('ETA slip of %s min exceeds max tolerance of %s min — escalate to ops', v_eta_slip_minutes, v_max_slip);
      END IF;

    WHEN 'reorder_stops' THEN
      IF v_visit.scheduling_profile IN ('APPOINTMENT_WINDOW') THEN
        v_decision := 'denied';
        v_reason := 'Cannot reorder windowed appointments — contact ops';
      ELSE
        v_decision := 'approved';
        v_reason := 'Reorder approved for non-windowed stop';
      END IF;

    WHEN 'push_stop' THEN
      IF v_visit.scheduling_profile IN ('APPOINTMENT_WINDOW', 'DAY_COMMIT') THEN
        v_decision := 'denied';
        v_reason := 'Cannot push committed appointment/day — contact ops';
      ELSE
        v_decision := 'approved';
        v_reason := 'Push approved for flexible stop';
      END IF;

    ELSE
      RETURN jsonb_build_object('success', false, 'error', format('Unknown action type: %s', p_action_type));
  END CASE;

  INSERT INTO provider_action_proposals (
    visit_id, provider_org_id, action_type, payload,
    decision, decision_reason, customer_notified,
    decided_at, decided_by
  ) VALUES (
    p_visit_id, v_provider_org_id, p_action_type, p_payload,
    v_decision, v_reason, v_notify_customer,
    now(), 'system'
  )
  RETURNING id INTO v_proposal_id;

  -- If approved running_late, update ETA
  IF v_decision = 'approved' AND p_action_type = 'running_late' AND v_visit.eta_range_start IS NOT NULL THEN
    UPDATE visits SET
      eta_range_start = (eta_range_start::time + (v_eta_slip_minutes || ' minutes')::interval)::text,
      eta_range_end = (eta_range_end::time + (v_eta_slip_minutes || ' minutes')::interval)::text,
      updated_at = now()
    WHERE id = p_visit_id;
  END IF;

  -- If approved and customer should be notified, emit notification
  IF v_decision = 'approved' AND v_notify_customer THEN
    SELECT p.customer_id INTO v_customer_id
    FROM properties p
    WHERE p.id = v_visit.property_id;

    IF v_customer_id IS NOT NULL THEN
      PERFORM emit_notification(
        v_customer_id,
        'SERVICE',
        'Running late',
        format('Your pro is running about %s minutes behind. Updated ETA coming soon.', v_eta_slip_minutes),
        jsonb_build_object('visit_id', p_visit_id, 'slip_minutes', v_eta_slip_minutes)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', v_proposal_id,
    'decision', v_decision,
    'reason', v_reason,
    'customer_notified', v_notify_customer
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_provider_action(uuid, text, jsonb) TO authenticated;

-- 3) Seed ETA slip config dial
INSERT INTO public.assignment_config (config_key, config_value, description)
VALUES ('autopilot_max_eta_slip_minutes', '30', 'Max ETA slip (minutes) a provider can self-report before denial')
ON CONFLICT (config_key) DO NOTHING;
