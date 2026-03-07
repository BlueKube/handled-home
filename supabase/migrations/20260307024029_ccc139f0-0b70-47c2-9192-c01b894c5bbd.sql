
-- Fix: auto_resolve_stale_exceptions uses wrong visit_schedule_state enum values
-- Correct values: 'complete' (not 'completed'), 'canceled', no 'skipped'

CREATE OR REPLACE FUNCTION public.auto_resolve_stale_exceptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ex RECORD;
  v_count int := 0;
BEGIN
  FOR v_ex IN
    SELECT oe.id, oe.visit_id, oe.exception_type,
           v.schedule_state, v.scheduled_date
    FROM ops_exceptions oe
    LEFT JOIN visits v ON v.id = oe.visit_id
    WHERE oe.status IN ('open', 'acknowledged', 'in_progress', 'escalated')
      AND (
        -- Visit completed, canceled, or rescheduled — exception is moot
        v.schedule_state IN ('complete', 'canceled', 'rescheduled')
        -- Visit no longer exists (deleted)
        OR (v.id IS NULL AND oe.visit_id IS NOT NULL)
        -- Predictive exception for a past date
        OR (oe.exception_type IN ('window_at_risk', 'service_week_at_risk', 'provider_overload', 'coverage_break')
            AND oe.scheduled_date < CURRENT_DATE)
      )
  LOOP
    UPDATE ops_exceptions
    SET status = 'resolved',
        resolved_at = now(),
        resolution_type = 'auto_stale',
        resolution_note = CASE
          WHEN v_ex.schedule_state IN ('complete', 'canceled', 'rescheduled')
            THEN 'Visit ' || v_ex.schedule_state || ' — exception auto-resolved'
          WHEN v_ex.visit_id IS NOT NULL AND v_ex.schedule_state IS NULL
            THEN 'Linked visit no longer exists — exception auto-resolved'
          ELSE 'Predictive exception for past date — auto-resolved'
        END,
        updated_at = now()
    WHERE id = v_ex.id;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('resolved_count', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_resolve_stale_exceptions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_stale_exceptions() FROM anon;
