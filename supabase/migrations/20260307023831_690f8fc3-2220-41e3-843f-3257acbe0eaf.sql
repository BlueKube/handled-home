
-- S8-P6-01: Auto-resolve stale ops_exceptions
-- Resolves exceptions whose underlying visit is no longer in a problematic state
-- (completed, canceled, or rescheduled past the exception date)

CREATE OR REPLACE FUNCTION public.auto_resolve_stale_exceptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resolved_count int := 0;
  v_ex RECORD;
BEGIN
  -- Find open exceptions where the linked visit is no longer at risk
  FOR v_ex IN
    SELECT oe.id, oe.visit_id, oe.exception_type,
           v.schedule_state, v.scheduled_date
    FROM ops_exceptions oe
    LEFT JOIN visits v ON v.id = oe.visit_id
    WHERE oe.status IN ('open', 'acknowledged', 'in_progress', 'escalated')
      AND (
        -- Visit was completed or canceled — exception is moot
        v.schedule_state IN ('completed', 'canceled', 'skipped')
        -- Visit no longer exists (deleted)
        OR v.id IS NULL AND oe.visit_id IS NOT NULL
        -- Predictive exception for a past date that was never escalated
        OR (oe.exception_type IN ('window_at_risk', 'service_week_at_risk', 'provider_overload', 'coverage_break')
            AND oe.scheduled_date < CURRENT_DATE)
      )
  LOOP
    UPDATE ops_exceptions
    SET status = 'resolved',
        resolved_at = now(),
        resolution_type = 'auto_stale',
        resolution_note = CASE
          WHEN v_ex.schedule_state IN ('completed', 'canceled', 'skipped')
            THEN 'Visit ' || v_ex.schedule_state || ' — exception auto-resolved'
          WHEN v_ex.visit_id IS NOT NULL AND v_ex.schedule_state IS NULL
            THEN 'Linked visit no longer exists — exception auto-resolved'
          ELSE 'Predictive exception for past date — auto-resolved'
        END,
        updated_at = now()
    WHERE id = v_ex.id;
    
    v_resolved_count := v_resolved_count + 1;
  END LOOP;

  RETURN jsonb_build_object('resolved_count', v_resolved_count);
END;
$$;

-- Only callable by service_role (cron/edge functions)
REVOKE EXECUTE ON FUNCTION public.auto_resolve_stale_exceptions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_stale_exceptions() FROM anon;

-- S8-P6-02: Exception analytics RPC
-- Returns aggregate metrics for ops exception analytics dashboard

CREATE OR REPLACE FUNCTION public.get_exception_analytics(
  p_days_back int DEFAULT 30,
  p_zone_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date;
  v_total_exceptions int;
  v_resolved_exceptions int;
  v_avg_resolve_hours numeric;
  v_result jsonb;
  v_by_type jsonb;
  v_by_zone jsonb;
  v_by_severity jsonb;
  v_break_freeze_count int;
  v_resolution_types jsonb;
BEGIN
  v_start_date := CURRENT_DATE - p_days_back;

  -- Total exceptions in period
  SELECT count(*) INTO v_total_exceptions
  FROM ops_exceptions
  WHERE created_at >= v_start_date
    AND (p_zone_id IS NULL OR zone_id = p_zone_id);

  -- Resolved exceptions
  SELECT count(*) INTO v_resolved_exceptions
  FROM ops_exceptions
  WHERE created_at >= v_start_date
    AND status = 'resolved'
    AND (p_zone_id IS NULL OR zone_id = p_zone_id);

  -- Average time-to-resolve (hours)
  SELECT COALESCE(
    avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 0
  )::numeric(10,1) INTO v_avg_resolve_hours
  FROM ops_exceptions
  WHERE created_at >= v_start_date
    AND status = 'resolved'
    AND resolved_at IS NOT NULL
    AND (p_zone_id IS NULL OR zone_id = p_zone_id);

  -- Breakdown by exception_type
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_by_type
  FROM (
    SELECT exception_type, count(*) AS count,
           count(*) FILTER (WHERE status = 'resolved') AS resolved_count,
           COALESCE(avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
             FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL), 0)::numeric(10,1) AS avg_resolve_hours
    FROM ops_exceptions
    WHERE created_at >= v_start_date
      AND (p_zone_id IS NULL OR zone_id = p_zone_id)
    GROUP BY exception_type
    ORDER BY count DESC
  ) t;

  -- Breakdown by zone
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_by_zone
  FROM (
    SELECT oe.zone_id, z.name AS zone_name, count(*) AS count,
           count(*) FILTER (WHERE oe.status = 'resolved') AS resolved_count
    FROM ops_exceptions oe
    LEFT JOIN zones z ON z.id = oe.zone_id
    WHERE oe.created_at >= v_start_date
      AND (p_zone_id IS NULL OR oe.zone_id = p_zone_id)
    GROUP BY oe.zone_id, z.name
    ORDER BY count DESC
  ) t;

  -- Breakdown by severity
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_by_severity
  FROM (
    SELECT severity, count(*) AS count
    FROM ops_exceptions
    WHERE created_at >= v_start_date
      AND (p_zone_id IS NULL OR zone_id = p_zone_id)
    GROUP BY severity
    ORDER BY count DESC
  ) t;

  -- Break-freeze frequency (actions that overrode frozen schedule)
  SELECT count(*) INTO v_break_freeze_count
  FROM ops_exception_actions oea
  JOIN ops_exceptions oe ON oe.id = oea.exception_id
  WHERE oea.is_freeze_override = true
    AND oea.created_at >= v_start_date
    AND (p_zone_id IS NULL OR oe.zone_id = p_zone_id);

  -- Resolution type distribution
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_resolution_types
  FROM (
    SELECT COALESCE(resolution_type, 'unknown') AS resolution_type, count(*) AS count
    FROM ops_exceptions
    WHERE created_at >= v_start_date
      AND status = 'resolved'
      AND (p_zone_id IS NULL OR zone_id = p_zone_id)
    GROUP BY resolution_type
    ORDER BY count DESC
  ) t;

  v_result := jsonb_build_object(
    'period_days', p_days_back,
    'total_exceptions', v_total_exceptions,
    'resolved_exceptions', v_resolved_exceptions,
    'open_exceptions', v_total_exceptions - v_resolved_exceptions,
    'resolution_rate', CASE WHEN v_total_exceptions > 0 
      THEN round((v_resolved_exceptions::numeric / v_total_exceptions) * 100, 1) 
      ELSE 0 END,
    'avg_resolve_hours', v_avg_resolve_hours,
    'break_freeze_count', v_break_freeze_count,
    'by_type', v_by_type,
    'by_zone', v_by_zone,
    'by_severity', v_by_severity,
    'resolution_types', v_resolution_types
  );

  RETURN v_result;
END;
$$;

-- Admin-only
REVOKE EXECUTE ON FUNCTION public.get_exception_analytics(int, uuid) FROM anon;
