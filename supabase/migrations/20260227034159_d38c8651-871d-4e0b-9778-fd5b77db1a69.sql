
-- Fix: make provider_rating_summary use SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.provider_rating_summary;
CREATE VIEW public.provider_rating_summary WITH (security_invoker = true) AS
SELECT
  provider_org_id,
  COUNT(*)::int AS total_reviews,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*) FILTER (WHERE rating >= 4)::int AS positive_count,
  COUNT(*) FILTER (WHERE rating <= 2)::int AS negative_count
FROM public.visit_ratings
WHERE NOT is_suppressed
GROUP BY provider_org_id;
