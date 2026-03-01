
-- =============================================
-- Sprint 3C Phase 1: get_service_suggestions RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.get_service_suggestions(
  p_property_id uuid,
  p_surface text DEFAULT 'home'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_max_results int;
  v_result jsonb;
BEGIN
  -- Auth check: caller must own the property
  SELECT user_id INTO v_user_id FROM properties WHERE id = p_property_id;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Surface-based limits
  IF p_surface = 'home' THEN
    v_max_results := 4;
  ELSIF p_surface = 'drawer' THEN
    v_max_results := 6;
  ELSE
    v_max_results := 4;
  END IF;

  WITH
  -- 1. Get coverage data for this property
  coverage AS (
    SELECT category_key, coverage_status, switch_intent
    FROM property_coverage
    WHERE property_id = p_property_id
  ),
  has_coverage AS (
    SELECT EXISTS (SELECT 1 FROM coverage) AS has_data
  ),
  -- 2. Get sizing signals
  sizing AS (
    SELECT home_sqft_tier, yard_tier, windows_tier, stories_tier
    FROM property_signals
    WHERE property_id = p_property_id
  ),
  -- 3. Get existing routine SKU IDs (exclude from suggestions)
  routine_skus AS (
    SELECT DISTINCT ri.sku_id
    FROM routine_items ri
    JOIN routine_versions rv ON rv.id = ri.routine_version_id
    JOIN routines r ON r.id = rv.routine_id
    WHERE r.property_id = p_property_id
      AND r.status IN ('draft', 'active')
  ),
  -- 4. Get active suppressions
  suppressed AS (
    SELECT sku_id, category
    FROM suggestion_suppressions
    WHERE property_id = p_property_id
      AND suppressed_until > now()
  ),
  -- 5. Get impression counts (last 14 days)
  impression_counts AS (
    SELECT sku_id, COUNT(*) AS cnt
    FROM suggestion_impressions
    WHERE property_id = p_property_id
      AND created_at > now() - interval '14 days'
    GROUP BY sku_id
  ),
  -- 6. Eligible categories from coverage map
  eligible_cats AS (
    SELECT category_key FROM coverage
    WHERE coverage_status IN ('NONE', 'SELF')
    UNION ALL
    -- If no coverage data, all categories are eligible
    SELECT DISTINCT category FROM service_skus
    WHERE category IS NOT NULL
      AND (SELECT has_data FROM has_coverage) = false
  ),
  -- 7. High-pain categories for SELF scoring
  high_pain_cats AS (
    SELECT unnest(ARRAY['lawn_mowing', 'mowing', 'trimming', 'cleanup', 'gutters', 'windows', 'power_wash']) AS cat
  ),
  -- 8. Score and rank candidates
  candidates AS (
    SELECT
      s.id AS sku_id,
      s.name AS sku_name,
      s.category,
      s.handle_cost,
      s.description,
      -- Coverage score
      CASE
        WHEN c.coverage_status = 'NONE' THEN 10
        WHEN c.coverage_status = 'SELF' AND hp.cat IS NOT NULL THEN 7
        WHEN c.coverage_status = 'SELF' THEN 3
        WHEN c.coverage_status = 'PROVIDER' AND c.switch_intent IN ('OPEN_NOW', 'OPEN_LATER') THEN 2
        ELSE 0
      END
      -- Seasonality boost (month-based)
      + CASE
          WHEN s.category IN ('windows', 'gutters') AND EXTRACT(MONTH FROM now()) IN (3,4,9,10) THEN 5
          WHEN s.category = 'power_wash' AND EXTRACT(MONTH FROM now()) IN (4,5,6) THEN 5
          WHEN s.category IN ('cleanup', 'leaf_removal') AND EXTRACT(MONTH FROM now()) IN (10,11) THEN 5
          WHEN s.category IN ('mowing', 'trimming', 'treatment') AND EXTRACT(MONTH FROM now()) IN (4,5,6,7,8) THEN 3
          ELSE 0
        END
      -- Home sizing boost
      + CASE
          WHEN sz.home_sqft_tier IN ('3500_5000', '5000_plus')
            AND s.category IN ('windows', 'gutters', 'power_wash', 'cleanup') THEN 3
          WHEN sz.yard_tier = 'LARGE'
            AND s.category IN ('mowing', 'trimming', 'treatment') THEN 3
          ELSE 0
        END
      AS score,
      -- Suggestion type
      CASE
        WHEN EXTRACT(MONTH FROM now()) IN (3,4,5,9,10,11)
          AND s.category IN ('windows', 'gutters', 'power_wash', 'cleanup', 'leaf_removal') THEN 'seasonal'
        ELSE 'best_next'
      END AS suggestion_type,
      -- Reason string
      CASE
        WHEN c.coverage_status = 'NONE' THEN 'No one covers this for your home yet'
        WHEN c.coverage_status = 'SELF' AND hp.cat IS NOT NULL THEN 'Most homeowners prefer to hand this off'
        WHEN c.coverage_status = 'SELF' THEN 'Let us handle this for you'
        WHEN EXTRACT(MONTH FROM now()) IN (3,4,9,10) AND s.category IN ('windows', 'gutters') THEN 'Seasonal timing is ideal right now'
        WHEN EXTRACT(MONTH FROM now()) IN (4,5,6) AND s.category = 'power_wash' THEN 'Spring is the best time for this'
        WHEN sz.home_sqft_tier IN ('3500_5000', '5000_plus') AND s.category IN ('windows', 'gutters') THEN 'Recommended for larger homes'
        ELSE 'Popular service for homes like yours'
      END AS reason
    FROM service_skus s
    -- Join coverage
    LEFT JOIN coverage c ON c.category_key = s.category
    LEFT JOIN sizing sz ON true
    LEFT JOIN high_pain_cats hp ON hp.cat = s.category
    WHERE s.status = 'active'
      AND s.is_addon = false
      -- Must be in eligible categories (or no coverage data)
      AND (
        (SELECT has_data FROM has_coverage) = false
        OR s.category IN (SELECT category_key FROM eligible_cats)
      )
      -- Not already in routine
      AND s.id NOT IN (SELECT sku_id FROM routine_skus)
      -- Not suppressed (by SKU)
      AND s.id NOT IN (SELECT sku_id FROM suppressed WHERE sku_id IS NOT NULL)
      -- Not suppressed (by category)
      AND s.category NOT IN (SELECT category FROM suppressed WHERE category IS NOT NULL AND sku_id IS NULL)
      -- Not over impression limit
      AND COALESCE((SELECT cnt FROM impression_counts WHERE impression_counts.sku_id = s.id), 0) < 2
      -- NA categories always excluded
      AND (c.coverage_status IS NULL OR c.coverage_status != 'NA')
  )
  SELECT COALESCE(
    jsonb_agg(sub ORDER BY sub.score DESC),
    '[]'::jsonb
  ) INTO v_result
  FROM (
    SELECT
      ca.sku_id,
      ca.sku_name,
      ca.category,
      ca.handle_cost,
      ca.score,
      ca.suggestion_type,
      ca.reason,
      -- Get default level info
      (
        SELECT jsonb_build_object(
          'id', sl.id,
          'label', sl.label,
          'handles_cost', sl.handles_cost
        )
        FROM sku_levels sl
        WHERE sl.sku_id = ca.sku_id AND sl.is_active = true
        ORDER BY sl.level_number ASC
        LIMIT 1
      ) AS default_level
    FROM candidates ca
    ORDER BY ca.score DESC
    LIMIT v_max_results
  ) sub;

  RETURN v_result;
END;
$$;
