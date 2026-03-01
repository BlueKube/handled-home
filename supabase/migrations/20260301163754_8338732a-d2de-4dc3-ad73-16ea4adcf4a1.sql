
-- =============================================
-- Sprint 3C Phase 1: Suggestion Engine Tables
-- =============================================

-- 1. suggestion_suppressions — user hides a suggestion for N days
CREATE TABLE public.suggestion_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.service_skus(id) ON DELETE CASCADE,
  category text,
  reason text NOT NULL CHECK (reason IN ('already_have_someone', 'not_relevant', 'too_expensive', 'not_now')),
  suppressed_until timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only one suppression per property+sku (when sku_id is not null)
CREATE UNIQUE INDEX idx_suggestion_suppressions_prop_sku
  ON public.suggestion_suppressions (property_id, sku_id)
  WHERE sku_id IS NOT NULL;

-- Category-level suppression unique
CREATE UNIQUE INDEX idx_suggestion_suppressions_prop_cat
  ON public.suggestion_suppressions (property_id, category)
  WHERE category IS NOT NULL AND sku_id IS NULL;

ALTER TABLE public.suggestion_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own property suppressions"
  ON public.suggestion_suppressions
  FOR ALL
  USING (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all suppressions"
  ON public.suggestion_suppressions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. suggestion_impressions — tracks when a suggestion was shown
CREATE TABLE public.suggestion_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  surface text NOT NULL CHECK (surface IN ('home', 'drawer', 'routine', 'receipt')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestion_impressions_lookup
  ON public.suggestion_impressions (property_id, sku_id, created_at DESC);

ALTER TABLE public.suggestion_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own impressions"
  ON public.suggestion_impressions
  FOR ALL
  USING (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all impressions"
  ON public.suggestion_impressions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. suggestion_actions — tracks add/dismiss/hide actions
CREATE TABLE public.suggestion_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('added', 'dismissed', 'hidden', 'drawer_open')),
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestion_actions_lookup
  ON public.suggestion_actions (property_id, sku_id, created_at DESC);

ALTER TABLE public.suggestion_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own actions"
  ON public.suggestion_actions
  FOR ALL
  USING (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all actions"
  ON public.suggestion_actions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
