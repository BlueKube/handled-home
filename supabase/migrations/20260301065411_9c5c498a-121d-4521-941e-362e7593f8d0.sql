
-- =============================================
-- Sprint 3B Phase 1: Coverage Map + Property Sizing + Personalization Events
-- =============================================

-- 1) property_coverage: one row per property per category
CREATE TABLE public.property_coverage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category_key text NOT NULL,
  coverage_status text NOT NULL DEFAULT 'NONE',
  switch_intent text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, category_key)
);

-- Validation trigger for coverage_status
CREATE OR REPLACE FUNCTION public.validate_property_coverage()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.coverage_status NOT IN ('SELF', 'PROVIDER', 'NONE', 'NA') THEN
    RAISE EXCEPTION 'Invalid coverage_status: %', NEW.coverage_status;
  END IF;
  IF NEW.switch_intent IS NOT NULL AND NEW.switch_intent NOT IN ('OPEN_NOW', 'OPEN_LATER', 'NOT_OPEN') THEN
    RAISE EXCEPTION 'Invalid switch_intent: %', NEW.switch_intent;
  END IF;
  -- Clear switch_intent if not PROVIDER
  IF NEW.coverage_status != 'PROVIDER' THEN
    NEW.switch_intent := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_property_coverage
  BEFORE INSERT OR UPDATE ON public.property_coverage
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_coverage();

-- RLS for property_coverage
ALTER TABLE public.property_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own property coverage"
  ON public.property_coverage FOR ALL
  USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  )
  WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins full access to property_coverage"
  ON public.property_coverage FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for lookups
CREATE INDEX idx_property_coverage_property_id ON public.property_coverage(property_id);

-- 2) property_signals: one row per property (sizing tiers)
CREATE TABLE public.property_signals (
  property_id uuid NOT NULL PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  home_sqft_tier text,
  yard_tier text,
  windows_tier text,
  stories_tier text,
  signals_version int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for property_signals tiers
CREATE OR REPLACE FUNCTION public.validate_property_signals()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.home_sqft_tier IS NOT NULL AND NEW.home_sqft_tier NOT IN ('lt_1500', '1500_2500', '2500_3500', '3500_5000', '5000_plus') THEN
    RAISE EXCEPTION 'Invalid home_sqft_tier: %', NEW.home_sqft_tier;
  END IF;
  IF NEW.yard_tier IS NOT NULL AND NEW.yard_tier NOT IN ('NONE', 'SMALL', 'MEDIUM', 'LARGE') THEN
    RAISE EXCEPTION 'Invalid yard_tier: %', NEW.yard_tier;
  END IF;
  IF NEW.windows_tier IS NOT NULL AND NEW.windows_tier NOT IN ('lt_15', '15_30', '30_plus') THEN
    RAISE EXCEPTION 'Invalid windows_tier: %', NEW.windows_tier;
  END IF;
  IF NEW.stories_tier IS NOT NULL AND NEW.stories_tier NOT IN ('1', '2', '3_plus') THEN
    RAISE EXCEPTION 'Invalid stories_tier: %', NEW.stories_tier;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_property_signals
  BEFORE INSERT OR UPDATE ON public.property_signals
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_signals();

-- RLS for property_signals
ALTER TABLE public.property_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own property signals"
  ON public.property_signals FOR ALL
  USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  )
  WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins full access to property_signals"
  ON public.property_signals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) personalization_events: append-only analytics
CREATE TABLE public.personalization_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for personalization_events
ALTER TABLE public.personalization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers insert own personalization events"
  ON public.personalization_events FOR INSERT
  WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers read own personalization events"
  ON public.personalization_events FOR SELECT
  USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins full access to personalization_events"
  ON public.personalization_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for property lookups + time queries
CREATE INDEX idx_personalization_events_property ON public.personalization_events(property_id, created_at DESC);
