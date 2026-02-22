
-- Phase 1: Seasonal Services tables

-- 1) seasonal_service_templates
CREATE TABLE public.seasonal_service_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id UUID NOT NULL REFERENCES public.service_skus(id),
  name TEXT,
  description TEXT,
  default_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_service_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active seasonal templates"
  ON public.seasonal_service_templates FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage seasonal templates"
  ON public.seasonal_service_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_seasonal_service_templates_updated_at
  BEFORE UPDATE ON public.seasonal_service_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) zone_seasonal_service_rules
CREATE TABLE public.zone_seasonal_service_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id),
  seasonal_template_id UUID NOT NULL REFERENCES public.seasonal_service_templates(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  price_override_cents INTEGER,
  windows_override JSONB,
  capacity_reserve_rule JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (zone_id, seasonal_template_id)
);

ALTER TABLE public.zone_seasonal_service_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read enabled zone seasonal rules"
  ON public.zone_seasonal_service_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage zone seasonal rules"
  ON public.zone_seasonal_service_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_zone_seasonal_service_rules_updated_at
  BEFORE UPDATE ON public.zone_seasonal_service_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) customer_seasonal_selections
CREATE TABLE public.customer_seasonal_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id),
  zone_id UUID NOT NULL REFERENCES public.zones(id),
  seasonal_template_id UUID NOT NULL REFERENCES public.seasonal_service_templates(id),
  selection_state TEXT NOT NULL DEFAULT 'off' CHECK (selection_state IN ('off', 'included', 'upsell')),
  window_preference TEXT NOT NULL DEFAULT 'mid' CHECK (window_preference IN ('early', 'mid', 'late')),
  year INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'bundle_builder' CHECK (source IN ('bundle_builder', 'support', 'promo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id, seasonal_template_id, year)
);

ALTER TABLE public.customer_seasonal_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own seasonal selections"
  ON public.customer_seasonal_selections FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all seasonal selections"
  ON public.customer_seasonal_selections FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_customer_seasonal_selections_updated_at
  BEFORE UPDATE ON public.customer_seasonal_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) seasonal_orders
CREATE TABLE public.seasonal_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id),
  zone_id UUID NOT NULL REFERENCES public.zones(id),
  seasonal_template_id UUID NOT NULL REFERENCES public.seasonal_service_templates(id),
  year INTEGER NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'upsell' CHECK (pricing_type IN ('included', 'upsell')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'scheduled', 'completed', 'canceled')),
  planned_window_start DATE,
  planned_window_end DATE,
  scheduled_service_day_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id, seasonal_template_id, year)
);

ALTER TABLE public.seasonal_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own seasonal orders"
  ON public.seasonal_orders FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all seasonal orders"
  ON public.seasonal_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_seasonal_orders_updated_at
  BEFORE UPDATE ON public.seasonal_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
