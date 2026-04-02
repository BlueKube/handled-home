-- ============================================
-- Round 11, Phase 1, B1: Auto-Cancel on Move Date
-- ============================================
-- Processes property_transitions where move_date has arrived.
-- Sets matching subscriptions to cancel_at_period_end and marks
-- the transition as completed.
-- ============================================

CREATE OR REPLACE FUNCTION public.process_move_date_transitions()
RETURNS INTEGER AS $$
DECLARE
  v_transition RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_transition IN
    SELECT pt.id, pt.property_id, pt.old_owner_user_id
    FROM public.property_transitions pt
    WHERE pt.move_date <= CURRENT_DATE
      AND pt.status = 'planned'
      AND pt.keep_services_until_move = true
  LOOP
    -- Cancel the subscription for this property
    UPDATE public.subscriptions
    SET cancel_at_period_end = true,
        status = 'canceling',
        cancel_reason = 'moving',
        cancel_feedback = 'Auto-cancelled on move date',
        updated_at = now()
    WHERE property_id = v_transition.property_id
      AND status IN ('active', 'trialing');

    -- Mark transition as completed
    UPDATE public.property_transitions
    SET status = 'completed'
    WHERE id = v_transition.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
