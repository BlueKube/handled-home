-- ============================================
-- Round 9, Phase 2, B3: Get Category Gaps RPC
-- ============================================
-- Returns categories that genuinely need providers for a set of ZIP codes.
-- Uses market_zone_category_state to determine which categories
-- are CLOSED, WAITLIST_ONLY, or PROVIDER_RECRUITING.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_category_gaps(p_zip_codes TEXT[])
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(gaps)), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT DISTINCT
      mzcs.category,
      mzcs.status::text AS status,
      z.name AS zone_name
    FROM public.zones z
    JOIN public.market_zone_category_state mzcs ON mzcs.zone_id = z.id
    WHERE z.zip_codes && p_zip_codes  -- array overlap: zone has at least one matching ZIP
      AND mzcs.status IN ('CLOSED', 'WAITLIST_ONLY', 'PROVIDER_RECRUITING')
    ORDER BY mzcs.category
  ) gaps;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_category_gaps(TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.get_category_gaps IS 'Returns categories that need providers for given ZIP codes, based on market_zone_category_state. Used on the post-application screen to show real category gaps.';
