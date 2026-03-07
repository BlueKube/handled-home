
-- Fix P0: expire_stale_holds — wrong status 'active'→'held' and wrong emit_notification_event params
DROP FUNCTION IF EXISTS public.expire_stale_holds();

CREATE OR REPLACE FUNCTION public.expire_stale_holds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold RECORD;
  v_count int := 0;
  v_linked_exception_id uuid;
BEGIN
  FOR v_hold IN
    UPDATE customer_reschedule_holds
    SET status = 'expired', updated_at = now()
    WHERE status = 'held' AND expires_at < now()
    RETURNING *
  LOOP
    v_count := v_count + 1;

    -- Escalate linked access_failure exception to urgent
    SELECT oe.id INTO v_linked_exception_id
    FROM ops_exceptions oe
    WHERE oe.visit_id = v_hold.visit_id
      AND oe.exception_type = 'access_failure'
      AND oe.status IN ('open', 'acknowledged')
    LIMIT 1;

    IF v_linked_exception_id IS NOT NULL THEN
      UPDATE ops_exceptions
      SET severity = 'urgent', status = 'escalated', updated_at = now()
      WHERE id = v_linked_exception_id;
    END IF;

    -- Notify customer that hold expired (correct emit_notification_event signature)
    PERFORM emit_notification_event(
      p_event_type        := 'CUSTOMER_HOLD_EXPIRED',
      p_idempotency_key   := 'hold_expired:' || v_hold.id,
      p_audience_type     := 'CUSTOMER',
      p_audience_user_id  := v_hold.customer_id,
      p_priority          := 'SERVICE',
      p_payload           := jsonb_build_object(
        'hold_id', v_hold.id,
        'visit_id', v_hold.visit_id,
        'held_date', v_hold.held_date
      )
    );
  END LOOP;

  RETURN jsonb_build_object('expired_count', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_holds() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_stale_holds() FROM anon;
