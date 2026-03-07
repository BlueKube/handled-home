-- Revoke authenticated access to get_exception_analytics and add admin guard
REVOKE EXECUTE ON FUNCTION public.get_exception_analytics(int, uuid) FROM authenticated;

-- Recreate with admin check inside function body
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
  v_result jsonb;
  v_cutoff timestamptz := now() - (p_days_back || ' days')::interval;
  v_caller uuid := auth.uid();
BEGIN
  -- Admin guard: only admin members or service_role can call
  IF v_caller IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = v_caller AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin membership required';
  END IF;

  WITH base AS (
    SELECT * FROM ops_exceptions
    WHERE created_at >= v_cutoff
      AND (p_zone_id IS NULL OR zone_id = p_zone_id)
  ),
  kpis AS (
    SELECT
      count(*)::int AS total_exceptions,
      count(*) FILTER (WHERE status = 'resolved')::int AS resolved_exceptions,
      count(*) FILTER (WHERE status != 'resolved')::int AS open_exceptions,
      CASE WHEN count(*) > 0
        THEN round((count(*) FILTER (WHERE status = 'resolved')::numeric / count(*)) * 100, 1)
        ELSE 0 END AS resolution_rate,
      round(COALESCE(avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
        FILTER (WHERE status = 'resolved'), 0)::numeric, 1) AS avg_resolve_hours,
      count(*) FILTER (WHERE break_freeze_override = true)::int AS break_freeze_count
    FROM base
  ),
  by_type AS (
    SELECT jsonb_agg(jsonb_build_object(
      'exception_type', exception_type,
      'count', cnt,
      'resolved_count', res_cnt,
      'avg_resolve_hours', avg_hrs
    )) AS arr
    FROM (
      SELECT
        exception_type::text,
        count(*)::int AS cnt,
        count(*) FILTER (WHERE status = 'resolved')::int AS res_cnt,
        round(COALESCE(avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
          FILTER (WHERE status = 'resolved'), 0)::numeric, 1) AS avg_hrs
      FROM base GROUP BY exception_type
    ) t
  ),
  by_zone AS (
    SELECT jsonb_agg(jsonb_build_object(
      'zone_id', zone_id,
      'zone_name', z.name,
      'count', cnt,
      'resolved_count', res_cnt
    )) AS arr
    FROM (
      SELECT
        b.zone_id,
        count(*)::int AS cnt,
        count(*) FILTER (WHERE b.status = 'resolved')::int AS res_cnt
      FROM base b GROUP BY b.zone_id
    ) t
    LEFT JOIN zones z ON z.id = t.zone_id
  ),
  by_severity AS (
    SELECT jsonb_agg(jsonb_build_object(
      'severity', severity::text,
      'count', cnt
    )) AS arr
    FROM (
      SELECT severity, count(*)::int AS cnt
      FROM base GROUP BY severity
    ) t
  ),
  resolution_types AS (
    SELECT jsonb_agg(jsonb_build_object(
      'resolution_type', resolution_type,
      'count', cnt
    )) AS arr
    FROM (
      SELECT COALESCE(resolution_type, 'unresolved') AS resolution_type, count(*)::int AS cnt
      FROM base GROUP BY resolution_type
    ) t
  )
  SELECT jsonb_build_object(
    'period_days', p_days_back,
    'total_exceptions', k.total_exceptions,
    'resolved_exceptions', k.resolved_exceptions,
    'open_exceptions', k.open_exceptions,
    'resolution_rate', k.resolution_rate,
    'avg_resolve_hours', k.avg_resolve_hours,
    'break_freeze_count', k.break_freeze_count,
    'by_type', COALESCE(bt.arr, '[]'::jsonb),
    'by_zone', COALESCE(bz.arr, '[]'::jsonb),
    'by_severity', COALESCE(bs.arr, '[]'::jsonb),
    'resolution_types', COALESCE(rt.arr, '[]'::jsonb)
  ) INTO v_result
  FROM kpis k, by_type bt, by_zone bz, by_severity bs, resolution_types rt;

  RETURN v_result;
END;
$$;

-- Re-grant to authenticated (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.get_exception_analytics(int, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_exception_analytics(int, uuid) FROM anon;