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

-- ============================================
-- B2: Treatment/Cleanup SKUs (IDs 005-008)
-- ============================================

-- Weed Treatment
UPDATE public.service_skus SET
  description = 'Targeted or broadcast herbicide application for lawn and bed weed control. Requires licensed applicator.',
  category = 'treatment',
  duration_minutes = 35,
  base_price_cents = 8500,
  handle_cost = 8,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'independent_cadence',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Pre-emergent or post-emergent application','Broadcast spray across full lawn','Spot treatment of visible weeds','Treatment notification sign posted'],
  exclusions = ARRAY['Hand weeding','Bed weed barrier installation','Invasive species removal','Hardscape weed treatment'],
  checklist = '[{"label":"Apply pre/post-emergent as needed","required":true},{"label":"Spot treat visible weeds","required":true},{"label":"Post notification sign","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Keep pets off lawn for 24 hours after treatment','No irrigation for 24-48 hours after application'],
  required_equipment = ARRAY['Backpack sprayer','Broadcast spreader','PPE (gloves, eye protection)','Treatment notification signs'],
  provider_category = 'outdoor',
  requires_training_gate = true,
  price_hint_cents = 6500,
  pricing_notes = 'Requires state pesticide applicator license. 4-7 apps/year. Research: $65-$150/app (Thumbtack 2024). Provider payout ~$65.'
WHERE id = 'c1000000-0000-0000-0000-000000000005';

-- Fertilization
UPDATE public.service_skus SET
  description = 'Seasonal lawn fertilizer application. Usually bundled with weed treatment in a lawn care program.',
  category = 'treatment',
  duration_minutes = 30,
  base_price_cents = 7500,
  handle_cost = 8,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'independent_cadence',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Granular or liquid fertilizer application','Seasonal-appropriate NPK blend','Coverage of full turf area'],
  exclusions = ARRAY['Soil testing','Weed control','Aeration','Overseeding','Lime/sulfur adjustment'],
  checklist = '[{"label":"Apply fertilizer at correct rate","required":true},{"label":"Cover full turf area","required":true},{"label":"Avoid hard surfaces","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Water lawn within 24-48 hours after application','Keep pets off treated area until watered in'],
  required_equipment = ARRAY['Broadcast spreader','Backpack sprayer (liquid apps)','Fertilizer product'],
  provider_category = 'outdoor',
  requires_training_gate = true,
  price_hint_cents = 5500,
  pricing_notes = 'Usually bundled with weed treatment. 4-7 apps/year. Research: $55-$110/app. Provider payout ~$55. Annual program: $275-$660.'
WHERE id = 'c1000000-0000-0000-0000-000000000006';

-- Mulch Application
UPDATE public.service_skus SET
  description = 'Spread mulch in garden beds. Priced by scope — typical suburban home needs 3-8 cubic yards.',
  category = 'cleanup',
  duration_minutes = 180,
  base_price_cents = 35000,
  handle_cost = 22,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = false,
  inclusions = ARRAY['Edge all beds','Lay weed barrier where needed','Spread mulch at 2-3 inch depth','Detail around plants and features'],
  exclusions = ARRAY['Old mulch removal','New bed creation','Planting','Soil amendment','Mulch material (billed separately or included in quote)'],
  checklist = '[{"label":"Edge all beds","required":true},{"label":"Lay weed barrier","required":false},{"label":"Spread mulch evenly","required":true},{"label":"Detail around plants","required":true},{"label":"Clean up spills","required":true}]'::jsonb,
  required_photos = '["before","after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Select mulch type in advance','Ensure bed access is clear'],
  required_equipment = ARRAY['Wheelbarrows','Pitchforks','Rakes','Bed edger','Mulch blower (large jobs)'],
  provider_category = 'outdoor',
  price_hint_cents = 17500,
  pricing_notes = 'Per cubic yard installed: $55-$85 (standard), $65-$110 (premium). 1 yard = ~100-160 sq ft at 2-3". Provider payout ~$175. 1-2x/year.'
WHERE id = 'c1000000-0000-0000-0000-000000000007';

-- Spring Prep
UPDATE public.service_skus SET
  description = 'Comprehensive spring yard preparation. The seasonal reset that starts the growing season right.',
  category = 'cleanup',
  duration_minutes = 240,
  base_price_cents = 35000,
  handle_cost = 25,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Rake/blow winter debris from lawn and beds','Cut back dead perennials','Edge all beds','Pre-emergent weed treatment','Spot weed pulling','Prune dead/damaged shrub branches','First mow of season'],
  exclusions = ARRAY['Mulch application (separate SKU)','Aeration','Overseeding','Fertilizer application (separate SKU)','Tree pruning above 10 feet'],
  checklist = '[{"label":"Clear winter debris","required":true},{"label":"Cut back perennials","required":true},{"label":"Edge beds","required":true},{"label":"Apply pre-emergent","required":true},{"label":"Prune dead branches","required":true},{"label":"First mow","required":true}]'::jsonb,
  required_photos = '["before","after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Remove temporary winter items from yard','Note any new plantings or changes'],
  required_equipment = ARRAY['Full lawn care kit','Pruners','Bed edger','Pre-emergent product','Rakes','Blowers'],
  provider_category = 'outdoor',
  price_hint_cents = 20000,
  pricing_notes = 'Research: $250-$450 standard prep (medium lot). Provider payout ~$200. 1x/year (March-May). May require multiple crew types.'
WHERE id = 'c1000000-0000-0000-0000-000000000008';
