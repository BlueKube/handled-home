-- Previous migration: 20260425020000_customer_issues_category.sql
--
-- Round 64 Phase 6 Batch 6.1 — Seasonal bundles schema + RLS + Fall Prep strawman seed.
--
-- Adds two new tables:
--   - public.bundles       (bundle metadata: name, season, window, zones, pricing)
--   - public.bundle_items  (line items per bundle)
--
-- Coexists with the existing seasonal_templates / seasonal_orders infra
-- (which is SKU-anchored per-template) — these new tables model multi-SKU
-- bundles with itemized credit pricing per line.
--
-- RLS:
--   Customers read bundles whose status='active' AND today is inside the
--   window AND the customer's confirmed/offered service_day_assignment zone
--   is in bundles.zone_ids.
--   Admins read+write all.
--
-- Seed: one Fall Prep bundle in 'draft' status with empty zone_ids — admin
-- flips to 'active' and populates zones via the Batch 6.3 admin UI.

CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  season text NOT NULL CHECK (season IN ('fall', 'winter', 'spring', 'summer')),
  window_start_date date NOT NULL,
  window_end_date date NOT NULL,
  zone_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  hero_image_path text,
  description text,
  total_credits integer NOT NULL CHECK (total_credits > 0),
  separate_credits integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bundles_window_end_after_start
    CHECK (window_end_date >= window_start_date),
  CONSTRAINT bundles_separate_gte_total
    CHECK (separate_credits >= total_credits)
);

CREATE INDEX bundles_status_window_idx
  ON public.bundles (status, window_start_date, window_end_date);

CREATE INDEX bundles_zone_ids_gin
  ON public.bundles USING gin (zone_ids);

CREATE TRIGGER bundles_set_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.service_skus(id) ON DELETE RESTRICT,
  label text NOT NULL,
  est_minutes integer NOT NULL CHECK (est_minutes > 0),
  credits integer NOT NULL CHECK (credits > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bundle_items_bundle_idx
  ON public.bundle_items (bundle_id, sort_order);

CREATE TRIGGER bundle_items_set_updated_at
  BEFORE UPDATE ON public.bundle_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Customers: read active bundles in their assigned zone whose window covers today.
-- Zone resolved via service_day_assignments (properties has no zone_id column).
CREATE POLICY "bundles_read_active_by_zone_window" ON public.bundles
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND CURRENT_DATE BETWEEN window_start_date AND window_end_date
    AND EXISTS (
      SELECT 1
      FROM public.service_day_assignments sda
      JOIN public.properties p ON p.id = sda.property_id
      WHERE p.user_id = auth.uid()
        AND sda.status IN ('confirmed', 'offered')
        AND sda.zone_id = ANY (public.bundles.zone_ids)
    )
  );

-- Admins: full access to bundles.
CREATE POLICY "bundles_admin_all" ON public.bundles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Customers: read line items of any bundle they can read.
CREATE POLICY "bundle_items_read_via_bundle" ON public.bundle_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bundles b
      WHERE b.id = public.bundle_items.bundle_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR (
            b.status = 'active'
            AND CURRENT_DATE BETWEEN b.window_start_date AND b.window_end_date
            AND EXISTS (
              SELECT 1
              FROM public.service_day_assignments sda
              JOIN public.properties p ON p.id = sda.property_id
              WHERE p.user_id = auth.uid()
                AND sda.status IN ('confirmed', 'offered')
                AND sda.zone_id = ANY (b.zone_ids)
            )
          )
        )
    )
  );

-- Admins: full write access to bundle_items.
CREATE POLICY "bundle_items_admin_write" ON public.bundle_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed: Fall Prep strawman bundle.
--
-- status='draft' + zone_ids='{}' so customers see nothing until admin
-- flips status='active' and populates zone_ids via the Batch 6.3 UI.
-- Math: separate (660) = sum(items.credits) = 200+120+100+160+80; bundle
-- total_credits (540) discounts that by 120 (~18%).
-- ON CONFLICT (slug) DO NOTHING makes the seed idempotent — re-runs
-- (e.g. local `supabase db reset`) succeed silently. On a no-op INSERT
-- the CTE returns no rows, so the bundle_items SELECT inserts nothing.
WITH inserted AS (
  INSERT INTO public.bundles (
    slug, name, season,
    window_start_date, window_end_date,
    zone_ids, status,
    description,
    total_credits, separate_credits
  )
  VALUES (
    'fall-prep-2026',
    'Fall Prep',
    'fall',
    DATE '2026-09-15',
    DATE '2026-11-30',
    '{}',
    'draft',
    'Get your home ready before the cold sets in. Five seasonal services attached to one of your routine visit days.',
    540,
    660
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, label, est_minutes, credits, sort_order)
SELECT inserted.id, items.label, items.est_minutes, items.credits, items.sort_order
FROM inserted
CROSS JOIN (
  VALUES
    ('Gutter cleaning',                        60, 200, 1),
    ('Sprinkler winterization',                30, 120, 2),
    ('Dryer vent cleaning',                    30, 100, 3),
    ('Window wash (exterior)',                 60, 160, 4),
    ('Outdoor faucet shutoff + insulation',    15,  80, 5)
) AS items(label, est_minutes, credits, sort_order);

COMMENT ON TABLE public.bundles IS
  'Round 64 Phase 6 — multi-SKU seasonal bundles. Coexists with seasonal_templates (SKU-anchored).';
COMMENT ON TABLE public.bundle_items IS
  'Round 64 Phase 6 — line items per bundle, with itemized credit pricing.';
COMMENT ON COLUMN public.bundles.separate_credits IS
  'Sum of bundle_items.credits (denormalized for read perf). Savings = separate_credits - total_credits.';
