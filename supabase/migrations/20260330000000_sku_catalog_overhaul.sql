-- ============================================
-- SKU Catalog Overhaul: Research-Backed Seed Data
-- ============================================
-- Source: FULL-IMPLEMENTATION-PLAN-SKU-CALIBRATION.md
-- Baseline data for provider interview calibration.
-- Handle cost anchor: 7 handles = 1 standard lawn mow (~45 min, ~$55 payout)
-- ============================================

-- ============================================
-- B1: Lawn/Mowing SKUs (IDs 001-004)
-- ============================================

-- Standard Mow
UPDATE public.service_skus SET
  description = 'Full-service lawn mowing with edging and blowoff. The core recurring outdoor service.',
  category = 'mowing',
  duration_minutes = 45,
  base_price_cents = 7500,
  handle_cost = 7,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_day_preferred',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Mow all turf areas','String trim around obstacles','Edge along hardscapes','Blow clippings off hard surfaces'],
  exclusions = ARRAY['Bagging/clipping removal','Bed weeding','Hedge trimming','Fertilization','Weed treatment'],
  checklist = '[{"label":"Mow all turf areas","required":true},{"label":"String trim borders","required":true},{"label":"Edge hardscapes","required":true},{"label":"Blow hard surfaces clean","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Clear toys/debris from lawn','Ensure gate is accessible'],
  required_equipment = ARRAY['Walk-behind or zero-turn mower','String trimmer','Stick edger','Backpack blower'],
  provider_category = 'outdoor',
  price_hint_cents = 5500,
  pricing_notes = 'Standard mow = 7 handles. Research: $55-$80/visit recurring (Thumbtack/HomeAdvisor 2024-2025). Provider payout ~$55.'
WHERE id = 'c1000000-0000-0000-0000-000000000001';

-- Edge & Trim
UPDATE public.service_skus SET
  description = 'Precision edge trimming along all borders, hardscapes, and beds.',
  category = 'trimming',
  duration_minutes = 25,
  base_price_cents = 3500,
  handle_cost = 4,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_day_preferred',
  presence_required = false,
  weather_sensitive = false,
  is_addon = true,
  inclusions = ARRAY['String trim around all obstacles','Mechanical edge along driveway and sidewalks','Blow debris off hardscapes'],
  exclusions = ARRAY['Bed edge re-definition','Mowing','Weed removal'],
  checklist = '[{"label":"Trim around all obstacles","required":true},{"label":"Edge all hardscapes","required":true},{"label":"Blow clean","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Ensure borders are accessible'],
  required_equipment = ARRAY['String trimmer','Stick edger','Backpack blower'],
  provider_category = 'outdoor',
  price_hint_cents = 3000,
  pricing_notes = 'Usually bundled with mow. Standalone: $25-$60. Provider payout ~$30.'
WHERE id = 'c1000000-0000-0000-0000-000000000002';

-- Leaf Cleanup
UPDATE public.service_skus SET
  description = 'Seasonal leaf removal from lawn, beds, and hardscapes. Fall is the primary season.',
  category = 'cleanup',
  duration_minutes = 120,
  base_price_cents = 25000,
  handle_cost = 15,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Blow leaves off all turf and beds','Rake and pile leaves','Vacuum or bag for curbside pickup','Clear hardscapes'],
  exclusions = ARRAY['Off-site haul-away','Gutter cleaning','Branch/stump removal','Bed detailing'],
  checklist = '[{"label":"Clear all turf areas","required":true},{"label":"Clear all beds","required":true},{"label":"Clear hardscapes","required":true},{"label":"Pile or bag at curb","required":true}]'::jsonb,
  required_photos = '["before","after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['No vehicles parked on leaves','Ensure gate access'],
  required_equipment = ARRAY['Backpack blowers','Leaf vacuum','Tarps','Rakes'],
  provider_category = 'outdoor',
  price_hint_cents = 12000,
  pricing_notes = 'Seasonal (Oct-Dec). Research: $150-$400 standard cleanup. Provider payout ~$120 for medium lot. 1-3 visits per fall.'
WHERE id = 'c1000000-0000-0000-0000-000000000003';

-- Hedge Trimming
UPDATE public.service_skus SET
  description = 'Shape and maintain hedges and shrubs. Scope varies by number and size of plants.',
  category = 'trimming',
  duration_minutes = 90,
  base_price_cents = 15000,
  handle_cost = 13,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = false,
  inclusions = ARRAY['Shape all accessible sides','Remove dead branches','Clean up all debris on-site','Blow beds and hardscapes clean'],
  exclusions = ARRAY['Rejuvenation pruning','Tree work above 10 feet','Chemical treatment','Haul-away of large debris'],
  checklist = '[{"label":"Trim all hedges to shape","required":true},{"label":"Remove dead branches","required":true},{"label":"Clean up debris","required":true},{"label":"Blow area clean","required":true}]'::jsonb,
  required_photos = '["before","after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Clear access around hedges','Note any areas to avoid'],
  required_equipment = ARRAY['Gas/electric hedge trimmers','Hand pruners','Loppers','Debris tarps','Blower'],
  provider_category = 'outdoor',
  price_hint_cents = 10000,
  pricing_notes = 'Per-shrub: $15-$25. Per linear foot (hedge): $2-$5. 2-4 times/year. Provider payout ~$100.'
WHERE id = 'c1000000-0000-0000-0000-000000000004';
