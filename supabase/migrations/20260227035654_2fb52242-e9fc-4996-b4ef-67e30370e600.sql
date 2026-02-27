
-- Sprint D3: Property Health Score - table + RPC

CREATE TABLE public.property_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 50,
  regularity_score int NOT NULL DEFAULT 0,
  coverage_score int NOT NULL DEFAULT 0,
  seasonal_score int NOT NULL DEFAULT 0,
  issue_score int NOT NULL DEFAULT 0,
  previous_overall_score int,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE INDEX idx_property_health_customer ON public.property_health_scores(customer_id);

CREATE TRIGGER set_updated_at_property_health_scores
  BEFORE UPDATE ON public.property_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.property_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own health scores"
  ON public.property_health_scores FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Admin read all health scores"
  ON public.property_health_scores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.compute_property_health_score(p_property_id uuid, p_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_regularity int;
  v_coverage int;
  v_seasonal int;
  v_issue int;
  v_overall int;
  v_prev_score int;
  v_completed_jobs int;
  v_active_skus int;
  v_seasonal_adopted int;
  v_seasonal_total int;
  v_issue_count int;
BEGIN
  -- 1. REGULARITY (0-100): completed jobs in last 90 days vs ~13 expected
  SELECT count(*) INTO v_completed_jobs
  FROM jobs
  WHERE property_id = p_property_id AND customer_id = p_customer_id
    AND status = 'COMPLETED'
    AND scheduled_date >= (current_date - interval '90 days')::text;

  v_regularity := LEAST(100, ROUND((v_completed_jobs::numeric / GREATEST(1, 13)) * 100)::int);

  -- 2. COVERAGE (0-100): unique SKUs in routine, cap at 4
  SELECT count(DISTINCT ri.sku_id) INTO v_active_skus
  FROM routine_items ri
  JOIN routine_versions rv ON rv.id = ri.routine_version_id
  JOIN routines r ON r.id = rv.routine_id
  WHERE r.property_id = p_property_id AND r.customer_id = p_customer_id
    AND r.status IN ('active', 'draft');

  v_coverage := LEAST(100, ROUND((LEAST(v_active_skus, 4)::numeric / 4) * 100)::int);

  -- 3. SEASONAL (0-100): seasonal adoption
  SELECT count(*) INTO v_seasonal_adopted
  FROM customer_seasonal_selections
  WHERE customer_id = p_customer_id AND property_id = p_property_id
    AND year = EXTRACT(YEAR FROM current_date)::int AND selection_state = 'confirmed';

  SELECT count(*) INTO v_seasonal_total
  FROM seasonal_service_templates
  WHERE is_active = true AND year = EXTRACT(YEAR FROM current_date)::int;

  v_seasonal := LEAST(100, ROUND((v_seasonal_adopted::numeric / GREATEST(1, v_seasonal_total)) * 100)::int);

  -- 4. ISSUE (0-100): fewer issues = higher score
  SELECT count(*) INTO v_issue_count
  FROM customer_issues
  WHERE customer_id = p_customer_id
    AND job_id IN (SELECT id FROM jobs WHERE property_id = p_property_id)
    AND created_at >= (now() - interval '90 days');

  v_issue := CASE
    WHEN v_issue_count = 0 THEN 100
    WHEN v_issue_count = 1 THEN 75
    WHEN v_issue_count = 2 THEN 50
    WHEN v_issue_count = 3 THEN 25
    ELSE 0
  END;

  -- OVERALL: weighted (regularity 40%, coverage 25%, seasonal 15%, issue 20%)
  v_overall := ROUND(v_regularity * 0.4 + v_coverage * 0.25 + v_seasonal * 0.15 + v_issue * 0.2)::int;

  -- Previous score
  SELECT overall_score INTO v_prev_score FROM property_health_scores WHERE property_id = p_property_id;

  -- Upsert
  INSERT INTO property_health_scores (
    property_id, customer_id, overall_score, regularity_score, coverage_score,
    seasonal_score, issue_score, previous_overall_score, computed_at
  ) VALUES (
    p_property_id, p_customer_id, v_overall, v_regularity, v_coverage,
    v_seasonal, v_issue, v_prev_score, now()
  )
  ON CONFLICT (property_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    regularity_score = EXCLUDED.regularity_score,
    coverage_score = EXCLUDED.coverage_score,
    seasonal_score = EXCLUDED.seasonal_score,
    issue_score = EXCLUDED.issue_score,
    previous_overall_score = v_prev_score,
    computed_at = now();

  RETURN jsonb_build_object(
    'overall', v_overall, 'regularity', v_regularity, 'coverage', v_coverage,
    'seasonal', v_seasonal, 'issue', v_issue, 'previous_overall', v_prev_score
  );
END;
$$;
