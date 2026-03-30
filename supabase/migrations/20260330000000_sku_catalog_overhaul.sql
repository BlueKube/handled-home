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

-- ============================================
-- B3: Specialty SKUs (IDs 009-00d)
-- ============================================

-- Window Cleaning
UPDATE public.service_skus SET
  description = 'Professional window cleaning — exterior only, interior + exterior, or full detail. 2-story surcharge applies.',
  category = 'windows',
  duration_minutes = 180,
  base_price_cents = 27500,
  handle_cost = 22,
  scheduling_profile = 'appointment_window',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Clean both sides of all windows','Frame and sill wipe','Screen cleaning','Track vacuuming'],
  exclusions = ARRAY['Hard water stain removal','Skylight interior','Storm window disassembly','Mirror cleaning'],
  checklist = '[{"label":"Clean all exterior windows","required":true},{"label":"Clean all interior windows","required":true},{"label":"Wipe frames and sills","required":true},{"label":"Clean screens","required":true},{"label":"Vacuum tracks","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": true}'::jsonb,
  customer_prep = ARRAY['Clear windowsills of items','Ensure access to all windows','Unlock windows for interior cleaning'],
  required_equipment = ARRAY['Squeegees','T-bars and scrubbers','Extension poles','Water-fed pole system','Ladders','Razor blades'],
  provider_category = 'outdoor',
  price_hint_cents = 17500,
  pricing_notes = 'Per pane (int+ext): $6-$12. Flat rate by home: $200-$500. 2-story: +50-75%. Provider payout ~$175. 2-4x/year.'
WHERE id = 'c1000000-0000-0000-0000-000000000009';

-- Power Wash
UPDATE public.service_skus SET
  description = 'Pressure washing for driveways, patios, siding, decks, and fences. Soft wash for delicate surfaces.',
  category = 'power_wash',
  duration_minutes = 150,
  base_price_cents = 30000,
  handle_cost = 25,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['House siding soft wash','Driveway pressure wash','Patio/walkway pressure wash','Pre-soak detergent application','Rinse all surfaces'],
  exclusions = ARRAY['Deck staining/sealing','Oil stain removal','Roof washing','Paint preparation','Fence staining'],
  checklist = '[{"label":"Pre-soak with detergent","required":true},{"label":"Soft wash siding","required":true},{"label":"Pressure wash driveway","required":true},{"label":"Pressure wash patio/walks","required":true},{"label":"Final rinse all surfaces","required":true}]'::jsonb,
  required_photos = '["before","after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Move vehicles off driveway','Close windows','Move patio furniture if possible','Ensure water spigot access'],
  required_equipment = ARRAY['Commercial pressure washer (3000-4000 PSI)','Surface cleaner attachment','Soft wash pump','50-100ft hose','Detergent tanks'],
  provider_category = 'outdoor',
  price_hint_cents = 20000,
  pricing_notes = 'Per sq ft (concrete): $0.15-$0.40. Home exterior pkg: $400-$800. Full property: $700-$1400. Provider payout ~$200. Annual service.'
WHERE id = 'c1000000-0000-0000-0000-00000000000a';

-- Pool Service
UPDATE public.service_skus SET
  description = 'Weekly pool maintenance — chemical balance, skimming, brushing, and equipment monitoring.',
  category = 'pool',
  duration_minutes = 35,
  base_price_cents = 5000,
  handle_cost = 6,
  scheduling_profile = 'day_commit',
  access_mode = 'provider_access',
  fulfillment_mode = 'same_day_preferred',
  presence_required = false,
  weather_sensitive = false,
  inclusions = ARRAY['Test and balance water chemistry','Skim surface debris','Brush walls and tile line','Vacuum pool floor','Empty skimmer and pump baskets','Check water level'],
  exclusions = ARRAY['Equipment repair/replacement','Filter deep clean (quarterly add-on)','Acid wash','Green-to-clean recovery','Tile calcium removal'],
  checklist = '[{"label":"Test water chemistry","required":true},{"label":"Balance pH/chlorine","required":true},{"label":"Skim surface","required":true},{"label":"Brush walls","required":true},{"label":"Vacuum floor","required":true},{"label":"Empty baskets","required":true}]'::jsonb,
  required_photos = '[]'::jsonb,
  proof_rules = '{"photo_required": false, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Ensure gate access or provide code','Remove pool toys/floats before service'],
  required_equipment = ARRAY['Test kit','Chemical caddy','Telepole with brush/net/vacuum','Leaf canister'],
  provider_category = 'outdoor',
  requires_training_gate = true,
  price_hint_cents = 4500,
  pricing_notes = 'Weekly service: $120-$200/mo standard. Pool size affects price. Provider payout ~$45/visit. CPO certification often required.'
WHERE id = 'c1000000-0000-0000-0000-00000000000b';

-- Pest Control
UPDATE public.service_skus SET
  description = 'Perimeter spray, inspection, and treatment for general household pests. Licensed applicator required.',
  category = 'pest',
  duration_minutes = 45,
  base_price_cents = 12500,
  handle_cost = 9,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'independent_cadence',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Exterior perimeter spray','De-web eaves and entry points','Granular treatment around foundation','Interior baseboard spray','Kitchen and bath crack-and-crevice treatment','Glue board monitors'],
  exclusions = ARRAY['Termite treatment','Mosquito yard treatment','Rodent exclusion','Bed bug treatment','Wildlife removal'],
  checklist = '[{"label":"Spray exterior perimeter","required":true},{"label":"De-web eaves","required":true},{"label":"Apply granular treatment","required":true},{"label":"Treat interior baseboards","required":true},{"label":"Treat kitchen/bath areas","required":true}]'::jsonb,
  required_photos = '[]'::jsonb,
  proof_rules = '{"photo_required": false, "privacy_safe": true}'::jsonb,
  customer_prep = ARRAY['Clear items from along baseboards','Ensure access to kitchen cabinets under sink','Keep pets secured during treatment'],
  required_equipment = ARRAY['Backpack sprayer','Compressed air sprayer','Bait stations','Granular spreader','Glue boards','PPE'],
  provider_category = 'outdoor',
  requires_training_gate = true,
  price_hint_cents = 7000,
  pricing_notes = 'Quarterly standard. Initial visit higher ($150-$250). Quarterly: $100-$175. Provider payout ~$70. All 50 states require pest control license.'
WHERE id = 'c1000000-0000-0000-0000-00000000000c';

-- Dog Poop Cleanup
UPDATE public.service_skus SET
  description = 'Weekly yard waste removal for dog owners. Quick, recurring service with high retention.',
  category = 'pet_waste',
  duration_minutes = 15,
  base_price_cents = 2000,
  handle_cost = 2,
  scheduling_profile = 'day_commit',
  access_mode = 'provider_access',
  fulfillment_mode = 'same_day_preferred',
  presence_required = false,
  weather_sensitive = false,
  inclusions = ARRAY['Scan full yard','Bag all waste','Dispose in trash receptacle','Close gate on exit'],
  exclusions = ARRAY['Yard deodorizing','Pet feeding/care','Indoor cleanup'],
  checklist = '[{"label":"Scan full yard systematically","required":true},{"label":"Bag and dispose all waste","required":true},{"label":"Secure gate on exit","required":true}]'::jsonb,
  required_photos = '["after"]'::jsonb,
  proof_rules = '{"photo_required": true, "privacy_safe": false}'::jsonb,
  customer_prep = ARRAY['Ensure gate is accessible or unlocked','Secure aggressive dogs during service'],
  required_equipment = ARRAY['Waste bags','Scoop/rake','Disposal container'],
  provider_category = 'outdoor',
  price_hint_cents = 1500,
  pricing_notes = 'Weekly: $12-$20/visit (1 dog). Multi-dog: +$5-$8/dog. Provider payout ~$15. 90M pet dogs in US. High retention.'
WHERE id = 'c1000000-0000-0000-0000-00000000000d';
