
CREATE OR REPLACE FUNCTION public.compute_property_health_score(
  p_property_id uuid,
  p_customer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_count int;
  v_sku_count int;
  v_seasonal_confirmed int;
  v_seasonal_total int;
  v_issue_count int;
  v_regularity int;
  v_coverage int;
  v_seasonal int;
  v_issue int;
  v_overall int;
  v_prev_score int;
BEGIN
  -- D3-F1: Authorization check
  IF p_customer_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Regularity: completed jobs in last 90 days (expect ~13 for weekly)
  SELECT count(*) INTO v_job_count
  FROM public.jobs
  WHERE customer_id = p_customer_id
    AND property_id = p_property_id
    AND status = 'completed'
    AND scheduled_date >= (current_date - interval '90 days')::text;

  v_regularity := LEAST(100, round(v_job_count::numeric / 13.0 * 100));

  -- Coverage: distinct SKUs in active/draft routines
  SELECT count(DISTINCT ri.sku_id) INTO v_sku_count
  FROM public.routine_items ri
  JOIN public.routine_versions rv ON rv.id = ri.routine_version_id
  WHERE rv.customer_id = p_customer_id
    AND rv.property_id = p_property_id
    AND rv.status IN ('active', 'draft');

  v_coverage := LEAST(100, round(v_sku_count::numeric / 4.0 * 100));

  -- Seasonal: confirmed selections this year
  SELECT count(*) INTO v_seasonal_confirmed
  FROM public.customer_seasonal_selections
  WHERE customer_id = p_customer_id
    AND property_id = p_property_id
    AND year = extract(year FROM current_date)
    AND selection_state = 'confirmed';

  SELECT count(*) INTO v_seasonal_total
  FROM public.seasonal_service_templates
  WHERE is_active = true;

  v_seasonal := LEAST(100, round(v_seasonal_confirmed::numeric / GREATEST(1, v_seasonal_total)::numeric * 100));

  -- Issue score: step function on 90-day issues
  SELECT count(*) INTO v_issue_count
  FROM public.customer_issues
  WHERE customer_id = p_customer_id
    AND job_id IN (
      SELECT id FROM public.jobs
      WHERE property_id = p_property_id
        AND scheduled_date >= (current_date - interval '90 days')::text
    );

  v_issue := CASE
    WHEN v_issue_count = 0 THEN 100
    WHEN v_issue_count = 1 THEN 75
    WHEN v_issue_count = 2 THEN 50
    WHEN v_issue_count = 3 THEN 25
    ELSE 0
  END;

  -- Weighted overall
  v_overall := round(v_regularity * 0.4 + v_coverage * 0.25 + v_seasonal * 0.15 + v_issue * 0.2);

  -- Get previous score before upsert
  SELECT overall_score INTO v_prev_score
  FROM public.property_health_scores
  WHERE property_id = p_property_id;

  -- Upsert
  INSERT INTO public.property_health_scores (
    property_id, customer_id, overall_score, regularity_score,
    coverage_score, seasonal_score, issue_score,
    previous_overall_score, computed_at
  ) VALUES (
    p_property_id, p_customer_id, v_overall, v_regularity,
    v_coverage, v_seasonal, v_issue,
    v_prev_score, now()
  )
  ON CONFLICT (property_id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id,
    overall_score = EXCLUDED.overall_score,
    regularity_score = EXCLUDED.regularity_score,
    coverage_score = EXCLUDED.coverage_score,
    seasonal_score = EXCLUDED.seasonal_score,
    issue_score = EXCLUDED.issue_score,
    previous_overall_score = property_health_scores.overall_score,
    computed_at = now(),
    updated_at = now();

  -- D3-F2: Drop detection — emit notification if score dropped by 5+
  IF v_prev_score IS NOT NULL AND v_overall < v_prev_score - 5 THEN
    PERFORM public.emit_notification(
      p_customer_id,
      'health_score_drop',
      'Your Home Health Score dropped',
      format('Your score went from %s to %s. Adding services or resolving issues can help improve it.', v_prev_score, v_overall),
      jsonb_build_object('previous_score', v_prev_score, 'new_score', v_overall, 'property_id', p_property_id)
    );
  END IF;

  RETURN jsonb_build_object(
    'overall', v_overall,
    'regularity', v_regularity,
    'coverage', v_coverage,
    'seasonal', v_seasonal,
    'issue', v_issue,
    'previous_overall', v_prev_score
  );
END;
$$;
