
-- ============================================================
-- Module 05: Subscription Engine — Full Schema
-- ============================================================

-- 0. Drop the old subscription_plans table (empty, doesn't match new schema)
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- 1. Create enum for entitlement model types
CREATE TYPE public.entitlement_model AS ENUM (
  'credits_per_cycle',
  'count_per_cycle',
  'minutes_per_cycle'
);

-- 2. Create enum for entitlement SKU rule types
CREATE TYPE public.sku_rule_type AS ENUM (
  'included',
  'extra_allowed',
  'blocked',
  'provider_only'
);

-- ============================================================
-- TABLE 1: plans
-- ============================================================
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  display_price_text TEXT,
  recommended_rank INTEGER DEFAULT 0,
  current_entitlement_version_id UUID, -- FK added after plan_entitlement_versions created
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Authenticated can read active/hidden plans
CREATE POLICY "Authenticated can read active or hidden plans"
  ON public.plans FOR SELECT
  USING (
    status IN ('active', 'hidden')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can manage all plans
CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE 2: plan_zone_availability
-- ============================================================
CREATE TABLE public.plan_zone_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, zone_id)
);

ALTER TABLE public.plan_zone_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read zone availability"
  ON public.plan_zone_availability FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage zone availability"
  ON public.plan_zone_availability FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_plan_zone_availability_plan_zone ON public.plan_zone_availability(plan_id, zone_id);

-- ============================================================
-- TABLE 3: plan_entitlement_versions
-- ============================================================
CREATE TABLE public.plan_entitlement_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  model_type public.entitlement_model NOT NULL DEFAULT 'credits_per_cycle',
  included_credits INTEGER DEFAULT 0,
  included_count INTEGER DEFAULT 0,
  included_minutes INTEGER DEFAULT 0,
  extra_allowed BOOLEAN NOT NULL DEFAULT false,
  max_extra_credits INTEGER DEFAULT 0,
  max_extra_count INTEGER DEFAULT 0,
  max_extra_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_entitlement_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read published entitlement versions"
  ON public.plan_entitlement_versions FOR SELECT
  USING (
    status = 'published'
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage entitlement versions"
  ON public.plan_entitlement_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Now add FK from plans to plan_entitlement_versions
ALTER TABLE public.plans
  ADD CONSTRAINT plans_current_entitlement_version_fk
  FOREIGN KEY (current_entitlement_version_id)
  REFERENCES public.plan_entitlement_versions(id)
  ON DELETE SET NULL;

-- ============================================================
-- TABLE 4: plan_entitlement_sku_rules
-- ============================================================
CREATE TABLE public.plan_entitlement_sku_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entitlement_version_id UUID NOT NULL REFERENCES public.plan_entitlement_versions(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  rule_type public.sku_rule_type NOT NULL DEFAULT 'included',
  reason TEXT,
  UNIQUE (entitlement_version_id, sku_id, rule_type)
);

ALTER TABLE public.plan_entitlement_sku_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read SKU rules"
  ON public.plan_entitlement_sku_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage SKU rules"
  ON public.plan_entitlement_sku_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- TABLE 5: customer_plan_selections (draft routine)
-- ============================================================
CREATE TABLE public.customer_plan_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  selected_plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  entitlement_version_id UUID REFERENCES public.plan_entitlement_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  draft_routine JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id)
);

ALTER TABLE public.customer_plan_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own selections"
  ON public.customer_plan_selections FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can read all selections"
  ON public.customer_plan_selections FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_customer_plan_selections_customer_property ON public.customer_plan_selections(customer_id, property_id);

CREATE TRIGGER update_customer_plan_selections_updated_at
  BEFORE UPDATE ON public.customer_plan_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE 6: subscriptions
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  entitlement_version_id UUID REFERENCES public.plan_entitlement_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  pending_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  pending_effective_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_subscriptions_customer_status ON public.subscriptions(customer_id, status);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE 7: subscription_events
-- ============================================================
CREATE TABLE public.subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'system',
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own subscription events"
  ON public.subscription_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id
      AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all subscription events"
  ON public.subscription_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert subscription events"
  ON public.subscription_events FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TABLE 8: admin_audit_log
-- ============================================================
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
