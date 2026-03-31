-- ============================================
-- PRD-048: SKU Schema Enhancements
-- ============================================
-- Adds recommended fields to sku_levels and service_skus
-- for level-specific overrides, licensing, seasonality, and frequency.
-- NULL values = inherit from parent SKU (sku_levels) or no constraint (service_skus).
-- ============================================

-- ============================================
-- PART 1: Add columns to sku_levels
-- ============================================

ALTER TABLE public.sku_levels
  ADD COLUMN IF NOT EXISTS presence_required BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS access_mode public.access_mode DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weather_sensitive BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_payout_hint_cents INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS property_size_tier TEXT DEFAULT NULL;

COMMENT ON COLUMN public.sku_levels.presence_required IS 'Override SKU default. NULL = inherit from service_skus.presence_required.';
COMMENT ON COLUMN public.sku_levels.access_mode IS 'Override SKU default. NULL = inherit from service_skus.access_mode.';
COMMENT ON COLUMN public.sku_levels.weather_sensitive IS 'Override SKU default. NULL = inherit from service_skus.weather_sensitive.';
COMMENT ON COLUMN public.sku_levels.provider_payout_hint_cents IS 'Advisory payout reference for provider interviews and Control Room pricing. Not billing-connected.';
COMMENT ON COLUMN public.sku_levels.property_size_tier IS 'Values: small, medium, large, xl. When set, level auto-selects based on property metadata.';

-- ============================================
-- PART 2: Add columns to service_skus
-- ============================================

ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS licensing_required TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seasonal_availability TEXT DEFAULT 'year_round',
  ADD COLUMN IF NOT EXISTS recommended_frequency TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_provider_rating NUMERIC(2,1) DEFAULT NULL;

COMMENT ON COLUMN public.service_skus.licensing_required IS 'Required certifications/licenses (e.g., pesticide_applicator, cpo). Used for provider capability filtering.';
COMMENT ON COLUMN public.service_skus.seasonal_availability IS 'Values: year_round, spring_summer, fall_winter, seasonal_custom. Controls catalog visibility by season.';
COMMENT ON COLUMN public.service_skus.recommended_frequency IS 'Display text: weekly, biweekly, monthly, quarterly, 2x_yearly, annually. Used in customer-facing plan builder.';
COMMENT ON COLUMN public.service_skus.min_provider_rating IS 'Minimum star rating (1.0-5.0) for provider assignment. Premium services may require higher-rated providers.';

-- ============================================
-- PART 3: Seed sku_levels overrides
-- ============================================
-- Window Cleaning L2+: interior access requires customer presence
-- Pest Control L2+: interior treatment requires customer presence

-- Window Cleaning L2 (Interior + Exterior)
UPDATE public.sku_levels SET
  presence_required = true,
  access_mode = 'customer_present',
  weather_sensitive = false
WHERE id = 'c2000000-0000-0000-0009-000000000002';

-- Window Cleaning L3 (Full Detail)
UPDATE public.sku_levels SET
  presence_required = true,
  access_mode = 'customer_present',
  weather_sensitive = false
WHERE id = 'c2000000-0000-0000-0009-000000000003';

-- Pest Control L2 (Interior + Exterior)
UPDATE public.sku_levels SET
  presence_required = true,
  access_mode = 'customer_present'
WHERE id = 'c2000000-0000-0000-000c-000000000002';

-- Pest Control L3 (Comprehensive)
UPDATE public.sku_levels SET
  presence_required = true,
  access_mode = 'customer_present'
WHERE id = 'c2000000-0000-0000-000c-000000000003';

-- ============================================
-- PART 4: Seed service_skus metadata
-- ============================================

-- Licensing requirements
UPDATE public.service_skus SET licensing_required = ARRAY['pesticide_applicator']
WHERE id = 'c1000000-0000-0000-0000-000000000005'; -- Weed Treatment

UPDATE public.service_skus SET licensing_required = ARRAY['pesticide_applicator']
WHERE id = 'c1000000-0000-0000-0000-000000000006'; -- Fertilization

UPDATE public.service_skus SET licensing_required = ARRAY['pest_control_license']
WHERE id = 'c1000000-0000-0000-0000-00000000000c'; -- Pest Control

UPDATE public.service_skus SET licensing_required = ARRAY['cpo']
WHERE id = 'c1000000-0000-0000-0000-00000000000b'; -- Pool Service

-- Seasonal availability
UPDATE public.service_skus SET seasonal_availability = 'fall_winter'
WHERE id = 'c1000000-0000-0000-0000-000000000003'; -- Leaf Cleanup

UPDATE public.service_skus SET seasonal_availability = 'spring_summer'
WHERE id = 'c1000000-0000-0000-0000-000000000008'; -- Spring Prep

UPDATE public.service_skus SET seasonal_availability = 'fall_winter'
WHERE id = 'c1000000-0000-0000-0000-00000000000f'; -- Fall Prep

-- Recommended frequency
UPDATE public.service_skus SET recommended_frequency = 'weekly'
WHERE id IN (
  'c1000000-0000-0000-0000-000000000001', -- Standard Mow
  'c1000000-0000-0000-0000-000000000002', -- Edge & Trim
  'c1000000-0000-0000-0000-00000000000b', -- Pool Service
  'c1000000-0000-0000-0000-00000000000d'  -- Dog Poop Cleanup
);

UPDATE public.service_skus SET recommended_frequency = 'quarterly'
WHERE id IN (
  'c1000000-0000-0000-0000-000000000005', -- Weed Treatment
  'c1000000-0000-0000-0000-000000000006', -- Fertilization
  'c1000000-0000-0000-0000-00000000000c'  -- Pest Control
);

UPDATE public.service_skus SET recommended_frequency = '2x_yearly'
WHERE id IN (
  'c1000000-0000-0000-0000-000000000009', -- Window Cleaning
  'c1000000-0000-0000-0000-00000000000e'  -- Gutter Cleaning
);

UPDATE public.service_skus SET recommended_frequency = 'annually'
WHERE id IN (
  'c1000000-0000-0000-0000-000000000012', -- Dryer Vent Cleaning
  'c1000000-0000-0000-0000-00000000000a'  -- Power Wash
);

UPDATE public.service_skus SET recommended_frequency = '2x_yearly'
WHERE id = 'c1000000-0000-0000-0000-000000000011'; -- Grill Cleaning

UPDATE public.service_skus SET recommended_frequency = 'annually'
WHERE id IN (
  'c1000000-0000-0000-0000-000000000007', -- Mulch Application
  'c1000000-0000-0000-0000-000000000008', -- Spring Prep
  'c1000000-0000-0000-0000-00000000000f'  -- Fall Prep
);

UPDATE public.service_skus SET recommended_frequency = 'monthly'
WHERE id = 'c1000000-0000-0000-0000-000000000010'; -- Trash Can Cleaning
