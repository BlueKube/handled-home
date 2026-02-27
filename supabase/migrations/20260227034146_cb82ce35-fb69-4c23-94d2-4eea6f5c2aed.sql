
-- Sprint D2: Ratings & Reviews

-- 1) visit_ratings table
CREATE TABLE public.visit_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT NULL,
  is_suppressed boolean NOT NULL DEFAULT false,
  suppression_reason text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, customer_id)
);

-- Updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.visit_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_visit_ratings_provider ON public.visit_ratings(provider_org_id);
CREATE INDEX idx_visit_ratings_customer ON public.visit_ratings(customer_id);

-- RLS
ALTER TABLE public.visit_ratings ENABLE ROW LEVEL SECURITY;

-- Customers can read their own ratings
CREATE POLICY "Customers read own ratings" ON public.visit_ratings
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Customers can insert their own ratings
CREATE POLICY "Customers insert own ratings" ON public.visit_ratings
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their own ratings
CREATE POLICY "Customers update own ratings" ON public.visit_ratings
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Admins can read all ratings
CREATE POLICY "Admins read all ratings" ON public.visit_ratings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Provider rating summary view (admin-visible)
CREATE OR REPLACE VIEW public.provider_rating_summary AS
SELECT
  provider_org_id,
  COUNT(*)::int AS total_reviews,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*) FILTER (WHERE rating >= 4)::int AS positive_count,
  COUNT(*) FILTER (WHERE rating <= 2)::int AS negative_count
FROM public.visit_ratings
WHERE NOT is_suppressed
GROUP BY provider_org_id;
