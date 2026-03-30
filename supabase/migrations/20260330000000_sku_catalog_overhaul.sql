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
  pricing_notes = 'Requires state pesticide applicator license. 4-7 apps/year. Research: $65-$150/app (Thumbtack 2024). Provider payout ~$65. Handle cost (8) exceeds time-based estimate (~5.5) because licensed applicator work commands a premium per-handle rate vs general lawn care.'
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
  pricing_notes = 'Usually bundled with weed treatment. 4-7 apps/year. Research: $55-$110/app. Provider payout ~$55. Annual program: $275-$660. Handle cost (8) exceeds time-based estimate (~4.7) because licensed applicator work commands a premium per-handle rate. Aligns with weed treatment anchor.'
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
-- NOTE: Base SKU defaults to exterior-only (no homeowner needed). Interior
-- cleaning is level-dependent — Level 2+ overrides access_mode to customer_present.
UPDATE public.service_skus SET
  description = 'Professional window cleaning — exterior only at base level. Interior + exterior and full detail available at higher service levels. 2-story surcharge applies.',
  category = 'windows',
  duration_minutes = 90,
  base_price_cents = 15000,
  handle_cost = 13,
  scheduling_profile = 'appointment_window',
  access_mode = 'exterior_only',
  fulfillment_mode = 'same_week_allowed',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Clean exterior side of all windows','Frame wipe','Screen rinse'],
  exclusions = ARRAY['Interior window cleaning (see higher service levels)','Hard water stain removal','Skylight interior','Storm window disassembly','Mirror cleaning'],
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
-- NOTE: Base SKU defaults to exterior-only (most common booking). Interior
-- treatment is level-dependent — Level 2+ overrides access_mode to customer_present.
-- sku_levels will specify per-level presence_required when levels are created (PRD-046).
UPDATE public.service_skus SET
  description = 'Exterior perimeter spray, de-web, and granular treatment for general household pests. Interior treatment available at higher service levels. Licensed applicator required.',
  category = 'pest',
  duration_minutes = 25,
  base_price_cents = 10000,
  handle_cost = 6,
  scheduling_profile = 'day_commit',
  access_mode = 'exterior_only',
  fulfillment_mode = 'independent_cadence',
  presence_required = false,
  weather_sensitive = true,
  inclusions = ARRAY['Exterior perimeter spray','De-web eaves and entry points','Granular treatment around foundation','Bait station placement'],
  exclusions = ARRAY['Interior treatment (see higher service levels)','Termite treatment','Mosquito yard treatment','Rodent exclusion','Bed bug treatment','Wildlife removal'],
  checklist = '[{"label":"Spray exterior perimeter","required":true},{"label":"De-web eaves","required":true},{"label":"Apply granular treatment","required":true},{"label":"Place bait stations","required":true}]'::jsonb,
  required_photos = '[]'::jsonb,
  proof_rules = '{"photo_required": false, "privacy_safe": true}'::jsonb,
  customer_prep = ARRAY['Ensure exterior perimeter is accessible','Move items away from foundation'],
  required_equipment = ARRAY['Backpack sprayer','Compressed air sprayer','Bait stations','Granular spreader','PPE'],
  provider_category = 'outdoor',
  requires_training_gate = true,
  price_hint_cents = 4500,
  pricing_notes = 'Quarterly standard. Base=exterior only (6 handles). Int+Ext level=9 handles. Comprehensive=15 handles. All 50 states require pest control license.'
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

-- ============================================
-- B4: New SKUs (IDs 00e-012)
-- ============================================

-- Gutter Cleaning
INSERT INTO public.service_skus (
  id, name, description, category, status,
  duration_minutes, base_price_cents, handle_cost,
  scheduling_profile, access_mode, fulfillment_mode,
  presence_required, weather_sensitive,
  inclusions, exclusions,
  checklist, required_photos, proof_rules,
  customer_prep, required_equipment,
  provider_category, price_hint_cents, pricing_notes
) VALUES (
  'c1000000-0000-0000-0000-00000000000e',
  'Gutter Cleaning',
  'Clear debris from gutters and flush downspouts. Recommended 2x/year (spring + fall). 2-story surcharge applies.',
  'cleanup', 'active',
  90, 17500, 15,
  'day_commit', 'exterior_only', 'same_week_allowed',
  false, true,
  ARRAY['Clear all gutter channels of debris','Flush downspouts','Check gutter guards if present','Bag debris for disposal'],
  ARRAY['Gutter repair','Guard installation','Roof repair','Fascia work','Interior downspout clearing'],
  '[{"label":"Clear all gutter channels","required":true},{"label":"Flush all downspouts","required":true},{"label":"Check gutter guards","required":false},{"label":"Bag and remove debris","required":true}]'::jsonb,
  '["before","after"]'::jsonb,
  '{"photo_required": true, "privacy_safe": false}'::jsonb,
  ARRAY['Ensure ladder access around full perimeter','Move vehicles away from house'],
  ARRAY['Extension ladders','Gutter scoop','Garden hose','Bucket','Safety harness (2+ story)'],
  'outdoor', 12000,
  'Research: $119-$234/visit (Angi 2025). 2-story: +50%. 2x/year. Provider payout ~$120. Bundles well with window cleaning.'
) ON CONFLICT (id) DO NOTHING;

-- Fall Prep
INSERT INTO public.service_skus (
  id, name, description, category, status,
  duration_minutes, base_price_cents, handle_cost,
  scheduling_profile, access_mode, fulfillment_mode,
  presence_required, weather_sensitive,
  inclusions, exclusions,
  checklist, required_photos, proof_rules,
  customer_prep, required_equipment,
  provider_category, price_hint_cents, pricing_notes
) VALUES (
  'c1000000-0000-0000-0000-00000000000f',
  'Fall Prep',
  'Comprehensive fall yard preparation and winterization. The seasonal bookend to Spring Prep.',
  'cleanup', 'active',
  240, 40000, 25,
  'day_commit', 'exterior_only', 'same_week_allowed',
  false, true,
  ARRAY['Full leaf removal (1-2 passes)','Final mow of season','Cut back perennials','Winterizer fertilizer application','Overseed bare spots','Blow out beds and hardscapes'],
  ARRAY['Gutter cleaning (separate SKU)','Irrigation blowout','Shrub wrapping','Aeration (add-on)','Mulch application (separate SKU)'],
  '[{"label":"Remove all leaves","required":true},{"label":"Final mow","required":true},{"label":"Cut back perennials","required":true},{"label":"Apply winterizer","required":true},{"label":"Overseed bare spots","required":false},{"label":"Blow beds clean","required":true}]'::jsonb,
  '["before","after"]'::jsonb,
  '{"photo_required": true, "privacy_safe": false}'::jsonb,
  ARRAY['Remove temporary items from yard','Note any plants to protect over winter'],
  ARRAY['Full lawn care kit','Leaf blowers','Leaf vacuum','Rakes','Fertilizer spreader','Seed spreader','Pruners'],
  'outdoor', 20000,
  'Research: $300-$500 standard (medium lot). Provider payout ~$200. 1x/year (Oct-Dec). Counterpart to Spring Prep.'
) ON CONFLICT (id) DO NOTHING;

-- Trash Can Cleaning
INSERT INTO public.service_skus (
  id, name, description, category, status,
  duration_minutes, base_price_cents, handle_cost,
  scheduling_profile, access_mode, fulfillment_mode,
  presence_required, weather_sensitive,
  inclusions, exclusions,
  checklist, required_photos, proof_rules,
  customer_prep, required_equipment,
  provider_category, price_hint_cents, pricing_notes
) VALUES (
  'c1000000-0000-0000-0000-000000000010',
  'Trash Can Cleaning',
  'Sanitize and deodorize residential trash and recycling cans. Service on collection day when cans are curbside and empty.',
  'cleanup', 'active',
  10, 3500, 3,
  'day_commit', 'exterior_only', 'same_day_preferred',
  false, false,
  ARRAY['Pressure wash interior of 2 cans','Sanitize with disinfectant','Apply enzyme deodorizer','Rinse exterior'],
  ARRAY['Cans with more than 2 receptacles (add-on pricing)','Dumpsters','Compost bins'],
  '[{"label":"Wash interior of all cans","required":true},{"label":"Apply sanitizer","required":true},{"label":"Deodorize","required":true},{"label":"Rinse exterior","required":true}]'::jsonb,
  '["after"]'::jsonb,
  '{"photo_required": true, "privacy_safe": false}'::jsonb,
  ARRAY['Leave cans at curb on collection day','Empty cans before service'],
  ARRAY['Pressure washer','Sanitizer','Enzyme deodorizer','Water tank or hose access'],
  'outdoor', 2000,
  'Monthly: $25-$40/visit (2 cans). Each additional: +$8-$12. Provider payout ~$20. Niche but 80%+ retention in HOA markets.'
) ON CONFLICT (id) DO NOTHING;

-- Grill Cleaning
INSERT INTO public.service_skus (
  id, name, description, category, status,
  duration_minutes, base_price_cents, handle_cost,
  scheduling_profile, access_mode, fulfillment_mode,
  presence_required, weather_sensitive,
  inclusions, exclusions,
  checklist, required_photos, proof_rules,
  customer_prep, required_equipment,
  provider_category, price_hint_cents, pricing_notes
) VALUES (
  'c1000000-0000-0000-0000-000000000011',
  'Grill Cleaning',
  'Professional grill deep clean — disassembly, degreasing, and reassembly. Seasonal service (pre-summer + pre-winter).',
  'cleanup', 'active',
  75, 17500, 13,
  'appointment_window', 'exterior_only', 'same_week_allowed',
  false, false,
  ARRAY['Full disassembly of removable parts','Degrease firebox','Clean and season grates','Clean heat plates/flavorizer bars','Burner inspection','Exterior detail','Grease management system clean'],
  ARRAY['Part replacement','Structural repair','Built-in island repair','Rotisserie kit cleaning'],
  '[{"label":"Disassemble removable parts","required":true},{"label":"Degrease firebox","required":true},{"label":"Clean and season grates","required":true},{"label":"Clean heat plates","required":true},{"label":"Inspect burners","required":true},{"label":"Detail exterior","required":true},{"label":"Reassemble and test","required":true}]'::jsonb,
  '["before","after"]'::jsonb,
  '{"photo_required": true, "privacy_safe": false}'::jsonb,
  ARRAY['Ensure grill is cool','Turn off gas supply','Clear area around grill'],
  ARRAY['Commercial degreaser','Wire brushes','Scraper set','Shop vac','Detail cloths','Replacement grates (inventory)'],
  'outdoor', 10000,
  'Standard deep clean: $150-$225. Full service: $200-$300. Provider payout ~$100. 2x/year (pre-summer + pre-winter).'
) ON CONFLICT (id) DO NOTHING;

-- Dryer Vent Cleaning
INSERT INTO public.service_skus (
  id, name, description, category, status,
  duration_minutes, base_price_cents, handle_cost,
  scheduling_profile, access_mode, fulfillment_mode,
  presence_required, weather_sensitive,
  inclusions, exclusions,
  checklist, required_photos, proof_rules,
  customer_prep, required_equipment,
  provider_category, price_hint_cents, pricing_notes
) VALUES (
  'c1000000-0000-0000-0000-000000000012',
  'Dryer Vent Cleaning',
  'Professional dryer vent cleaning for fire prevention. NFPA recommends annual service. 2,900 home fires/year from clogged vents.',
  'home_assistant', 'active',
  45, 14000, 11,
  'appointment_window', 'customer_present', 'window_booking',
  true, false,
  ARRAY['Disconnect dryer','Clean lint trap housing','Rotary brush full vent run','Compressed air blow-out','Reconnect dryer','Airflow test','Inspect vent path for damage','Check exterior vent flap'],
  ARRAY['Vent repair or rerouting','Booster fan work','Full vent replacement','Electrical work'],
  '[{"label":"Disconnect dryer safely","required":true},{"label":"Clean lint trap housing","required":true},{"label":"Brush and blow full vent","required":true},{"label":"Inspect vent path","required":true},{"label":"Check exterior flap","required":true},{"label":"Reconnect and test","required":true},{"label":"Measure airflow","required":false}]'::jsonb,
  '["before","after"]'::jsonb,
  '{"photo_required": true, "privacy_safe": true}'::jsonb,
  ARRAY['Ensure access to dryer (clear laundry area)','Know location of exterior vent termination'],
  ARRAY['Rotary brush kit','High-powered blower','HEPA vacuum','Vent inspection camera','Anemometer','Replacement vent covers','Foil tape'],
  'home_assistant', 9000,
  'Standard clean: $100-$175. Clean + inspect: $150-$250. Provider payout ~$90. Annual service. NFPA/CSIA recommended. Safety-driven demand.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRD-046: SKU LEVEL DEFINITIONS
-- ============================================
-- Handle cost anchor: 7 handles = 1 standard lawn mow (~45 min)
-- Formula: handles ≈ planned_minutes / 6.4 (time-based) or provider_payout / $7.86 (cost-based)
-- Licensed/specialty work uses cost-based anchoring (premium per handle)
-- ============================================

-- ============================================
-- B1: Lawn Care Levels (SKUs 001-004)
-- ============================================

-- Standard Mow: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0001-000000000001',
  'c1000000-0000-0000-0000-000000000001', 1,
  'Basic Mow', 'Mow and go — cut only, no edging or trimming',
  ARRAY['Mow all turf areas','Mulch clippings in place'],
  ARRAY['Edging','String trimming','Blowing','Bagging'],
  30, 1, 5,
  '[{"label":"Mow all turf areas","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0001-000000000002',
  'c1000000-0000-0000-0000-000000000001', 2,
  'Standard Mow', 'Full-service mow with trimming, edging, and blowoff',
  ARRAY['Mow all turf areas','String trim around obstacles','Edge along hardscapes','Blow clippings off hard surfaces'],
  ARRAY['Bagging/clipping removal','Bed weeding','Hedge trimming'],
  45, 1, 7,
  '[{"label":"Mow all turf areas","required":true},{"label":"String trim borders","required":true},{"label":"Edge hardscapes","required":true},{"label":"Blow hard surfaces","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0001-000000000003',
  'c1000000-0000-0000-0000-000000000001', 3,
  'Premium Mow', 'Show-ready cut with bagging, cross-cut pattern, and spot weed pulling',
  ARRAY['Mow all turf areas with cross-cut pattern','String trim around obstacles','Edge along hardscapes','Blow clippings off hard surfaces','Bag and remove clippings','Spot weed pulling in adjacent beds'],
  ARRAY['Full bed weeding','Hedge trimming','Fertilization'],
  65, 2, 10,
  '[{"label":"Mow with pattern","required":true},{"label":"String trim","required":true},{"label":"Edge hardscapes","required":true},{"label":"Bag clippings","required":true},{"label":"Blow hard surfaces","required":true},{"label":"Spot weed pull","required":false}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Edge & Trim: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0002-000000000001',
  'c1000000-0000-0000-0000-000000000002', 1,
  'Trim Only', 'String trimmer around obstacles — no mechanical edging',
  ARRAY['String trim around fences, trees, beds, and AC units'],
  ARRAY['Mechanical edging','Bed edge re-definition','Blowing'],
  15, 1, 2,
  '[{"label":"Trim around all obstacles","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0002-000000000002',
  'c1000000-0000-0000-0000-000000000002', 2,
  'Edge & Trim', 'String trimming plus mechanical edging along all hardscapes',
  ARRAY['String trim around all obstacles','Mechanical edge along driveway and sidewalks','Blow debris off hardscapes'],
  ARRAY['Bed edge re-definition','Mowing','Weed removal'],
  25, 1, 4,
  '[{"label":"Trim all obstacles","required":true},{"label":"Edge all hardscapes","required":true},{"label":"Blow clean","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0002-000000000003',
  'c1000000-0000-0000-0000-000000000002', 3,
  'Detail Edge', 'Full trim and edge plus bed border re-definition',
  ARRAY['String trim around all obstacles','Mechanical edge along all hardscapes','Re-cut bed borders with vertical edge','Blow all debris clean'],
  ARRAY['Mowing','Weed removal','Mulching'],
  40, 1, 6,
  '[{"label":"Trim all obstacles","required":true},{"label":"Edge hardscapes","required":true},{"label":"Re-cut bed borders","required":true},{"label":"Blow clean","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Leaf Cleanup: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0003-000000000001',
  'c1000000-0000-0000-0000-000000000003', 1,
  'Leaf Blowout', 'Blow leaves off lawn and hardscapes into tree line or pile area',
  ARRAY['Blow leaves off lawn','Blow leaves off hardscapes','Pile at designated area on property'],
  ARRAY['Removal from property','Bed cleaning','Gutter cleaning','Raking'],
  45, 1, 8,
  '[{"label":"Blow leaves off lawn","required":true},{"label":"Blow hardscapes clean","required":true},{"label":"Pile at designated area","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0003-000000000002',
  'c1000000-0000-0000-0000-000000000003', 2,
  'Full Cleanup', 'Blow, rake, and vacuum leaves from lawn, beds, and hardscapes',
  ARRAY['Blow leaves from all areas','Rake beds clean','Vacuum or bag leaves on lawn','Pile or bag at curb for pickup','Clear all hardscapes'],
  ARRAY['Off-site haul-away','Gutter cleaning','Branch removal','Bed detailing'],
  120, 2, 15,
  '[{"label":"Clear all turf","required":true},{"label":"Rake beds","required":true},{"label":"Bag or pile at curb","required":true},{"label":"Clear hardscapes","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0003-000000000003',
  'c1000000-0000-0000-0000-000000000003', 3,
  'Removal & Haul', 'Complete leaf removal with off-site disposal and under-shrub cleanup',
  ARRAY['All Full Cleanup inclusions','Load into truck for off-site disposal','Under-shrub and tight-space cleanup','Bed detailing around plants'],
  ARRAY['Gutter cleaning','Large branch removal','Stump removal'],
  180, 2, 25,
  '[{"label":"Clear all areas","required":true},{"label":"Clean under shrubs","required":true},{"label":"Detail beds","required":true},{"label":"Load for haul-away","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Hedge Trimming: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0004-000000000001',
  'c1000000-0000-0000-0000-000000000004', 1,
  'Shape Trim', 'Maintain existing shape — trim new growth and blow debris',
  ARRAY['Trim top and accessible sides to maintain shape','Blow debris off beds'],
  ARRAY['Reshaping','Interior thinning','Dead wood removal','Haul-away'],
  45, 1, 6,
  '[{"label":"Trim to existing shape","required":true},{"label":"Blow debris clean","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0004-000000000002',
  'c1000000-0000-0000-0000-000000000004', 2,
  'Full Trim', 'Shape all sides plus dead branch removal and full cleanup',
  ARRAY['Shape all sides including hard-to-reach areas','Remove dead branches','Clean up all debris on-site','Blow beds and hardscapes clean'],
  ARRAY['Rejuvenation pruning','Stump removal','Heavy reshaping','Chemical treatment'],
  90, 2, 13,
  '[{"label":"Shape all sides","required":true},{"label":"Remove dead branches","required":true},{"label":"Clean up debris","required":true},{"label":"Blow area clean","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0004-000000000003',
  'c1000000-0000-0000-0000-000000000004', 3,
  'Sculpt & Restore', 'Species-appropriate pruning with thinning, reshaping, and haul-away',
  ARRAY['Species-appropriate pruning (not just shearing)','Interior thinning for airflow','Full reshaping to desired form','Dead wood removal','All debris hauled away','Plant health assessment'],
  ARRAY['Tree work above 10 feet','Chemical treatment','Stump grinding'],
  150, 2, 22,
  '[{"label":"Prune species-appropriately","required":true},{"label":"Thin interior","required":true},{"label":"Reshape to form","required":true},{"label":"Remove dead wood","required":true},{"label":"Haul away debris","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- ============================================================
-- PRD-046 B2: Treatment & Seasonal SKU Levels
-- ============================================================

-- Weed Treatment: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0005-000000000001',
  'c1000000-0000-0000-0000-000000000005', 1,
  'Spot Treatment', 'Target visible weeds only — no broadcast application',
  ARRAY['Spot spray visible weeds','Mark treated areas'],
  ARRAY['Broadcast spray','Pre-emergent application','Bed treatment','Hardscape treatment'],
  20, 1, 5,
  '[{"label":"Spot spray visible weeds","required":true},{"label":"Mark treated areas","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0005-000000000002',
  'c1000000-0000-0000-0000-000000000005', 2,
  'Full Lawn', 'Broadcast spray across full lawn plus spot treatment',
  ARRAY['Pre-emergent or post-emergent application','Broadcast spray full lawn','Spot treatment of visible weeds','Post notification sign'],
  ARRAY['Hand weeding','Bed weed barrier installation','Invasive species removal','Hardscape treatment'],
  35, 1, 8,
  '[{"label":"Apply pre/post-emergent","required":true},{"label":"Broadcast spray full lawn","required":true},{"label":"Spot treat visible weeds","required":true},{"label":"Post notification sign","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0005-000000000003',
  'c1000000-0000-0000-0000-000000000005', 3,
  'Comprehensive', 'Full lawn broadcast plus beds, hardscape cracks, and invasive ID',
  ARRAY['Full lawn broadcast spray','Targeted bed treatment','Hardscape crack treatment','Invasive species identification and treatment','Post notification sign'],
  ARRAY['Hand weeding','Bed weed barrier installation','Tree and shrub root treatment'],
  55, 2, 13,
  '[{"label":"Broadcast spray full lawn","required":true},{"label":"Treat beds","required":true},{"label":"Treat hardscape cracks","required":true},{"label":"ID and treat invasives","required":true},{"label":"Post notification sign","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Fertilization: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0006-000000000001',
  'c1000000-0000-0000-0000-000000000006', 1,
  'Basic Application', 'Granular fertilizer — seasonal blend, full turf coverage',
  ARRAY['Granular fertilizer application','Seasonal-appropriate blend','Full turf coverage'],
  ARRAY['Soil testing','Liquid application','Spot treatment','Lime or sulfur adjustment'],
  20, 1, 5,
  '[{"label":"Apply granular fertilizer","required":true},{"label":"Cover full turf area","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0006-000000000002',
  'c1000000-0000-0000-0000-000000000006', 2,
  'Standard Program', 'Granular or liquid application with slow-release formula',
  ARRAY['Granular or liquid fertilizer application','Seasonal NPK blend','Full turf coverage','Slow-release formula'],
  ARRAY['Soil testing','Aeration','Overseeding','Lime or sulfur adjustment'],
  30, 1, 8,
  '[{"label":"Apply fertilizer (granular or liquid)","required":true},{"label":"Cover full turf area","required":true},{"label":"Use slow-release formula","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0006-000000000003',
  'c1000000-0000-0000-0000-000000000006', 3,
  'Premium Program', 'Custom NPK blend with liquid + granular and micronutrient supplement',
  ARRAY['Custom NPK blend based on season','Liquid and granular application','Micronutrient supplement','Full turf coverage','Soil health notes provided'],
  ARRAY['Soil lab testing','Aeration','Overseeding'],
  45, 2, 13,
  '[{"label":"Apply custom NPK blend","required":true},{"label":"Apply liquid and granular","required":true},{"label":"Add micronutrient supplement","required":true},{"label":"Cover full turf area","required":true},{"label":"Provide soil health notes","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Mulch Application: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0007-000000000001',
  'c1000000-0000-0000-0000-000000000007', 1,
  'Basic Spread', 'Spread mulch at 2-3 inch depth — no edging or barrier',
  ARRAY['Spread mulch at 2-3 inch depth','Basic cleanup of spills'],
  ARRAY['Bed edging','Weed barrier','Old mulch removal','Plant detailing'],
  90, 2, 13,
  '[{"label":"Spread mulch at 2-3 inch depth","required":true},{"label":"Clean up spills","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0007-000000000002',
  'c1000000-0000-0000-0000-000000000007', 2,
  'Edge & Spread', 'Edge all beds, lay weed barrier, spread and detail around plants',
  ARRAY['Edge all beds','Lay weed barrier where needed','Spread mulch at 2-3 inch depth','Detail around plants and features'],
  ARRAY['Old mulch removal','New bed creation','Planting','Soil amendment'],
  180, 2, 22,
  '[{"label":"Edge all beds","required":true},{"label":"Lay weed barrier","required":true},{"label":"Spread mulch evenly","required":true},{"label":"Detail around plants","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0007-000000000003',
  'c1000000-0000-0000-0000-000000000007', 3,
  'Full Refresh', 'Remove old mulch, edge, install barrier, spread fresh at 3 inches, haul debris',
  ARRAY['Remove old mulch top layer','Edge all beds','Install weed barrier','Spread fresh mulch at 3 inch depth','Detail around all plants and features','Clean up all spills','Haul away debris'],
  ARRAY['New bed creation','Planting','Soil amendment','Hardscape repair'],
  300, 3, 35,
  '[{"label":"Remove old mulch layer","required":true},{"label":"Edge all beds","required":true},{"label":"Install weed barrier","required":true},{"label":"Spread mulch at 3 inches","required":true},{"label":"Detail around plants","required":true},{"label":"Haul away debris","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Spring Prep: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0008-000000000001',
  'c1000000-0000-0000-0000-000000000008', 1,
  'Basic Cleanup', 'Clear winter debris and first mow — no bed work or treatment',
  ARRAY['Rake and blow winter debris from lawn','Cut back dead perennials','First mow of season'],
  ARRAY['Bed edging','Pre-emergent application','Shrub pruning','Mulch application','Aeration'],
  120, 2, 13,
  '[{"label":"Clear winter debris from lawn","required":true},{"label":"Cut back dead perennials","required":true},{"label":"First mow of season","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0008-000000000002',
  'c1000000-0000-0000-0000-000000000008', 2,
  'Standard Prep', 'Full cleanup with bed edging, pre-emergent, and shrub pruning',
  ARRAY['Rake and blow winter debris from lawn and beds','Cut back dead perennials','Edge all beds','Pre-emergent weed treatment','Prune dead and damaged shrub branches','First mow of season'],
  ARRAY['Mulch application','Aeration','Overseeding','Fertilizer application','Tree pruning above 10 feet'],
  240, 2, 25,
  '[{"label":"Clear winter debris","required":true},{"label":"Cut back perennials","required":true},{"label":"Edge beds","required":true},{"label":"Apply pre-emergent","required":true},{"label":"Prune shrubs","required":true},{"label":"First mow","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0008-000000000003',
  'c1000000-0000-0000-0000-000000000008', 3,
  'Premium Prep', 'Complete spring restoration — full debris removal, bed redefining, weed pulling, plant assessment',
  ARRAY['Full debris removal from lawn, beds, and hardscapes','Cut back all perennials','Edge and redefine all beds','Pre-emergent weed treatment','Spot weed pulling','Prune all shrubs','First mow with bagging','Blow all hardscapes clean','Plant health assessment'],
  ARRAY['Mulch application','Aeration','Overseeding','Fertilizer application','Tree pruning above 10 feet'],
  420, 3, 44,
  '[{"label":"Full debris removal","required":true},{"label":"Cut back all perennials","required":true},{"label":"Edge and redefine beds","required":true},{"label":"Apply pre-emergent","required":true},{"label":"Spot weed pulling","required":true},{"label":"Prune all shrubs","required":true},{"label":"First mow with bagging","required":true},{"label":"Blow hardscapes","required":true},{"label":"Plant health assessment","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Fall Prep: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-000f-000000000001',
  'c1000000-0000-0000-0000-00000000000f', 1,
  'Basic Cleanup', 'Single-pass leaf removal, final mow, blow beds and hardscapes',
  ARRAY['Single-pass leaf removal','Final mow of season','Blow beds and hardscapes'],
  ARRAY['Perennial cutback','Winterizer application','Overseeding','Gutter cleaning','Shrub wrapping'],
  120, 2, 13,
  '[{"label":"Remove leaves (single pass)","required":true},{"label":"Final mow of season","required":true},{"label":"Blow beds and hardscapes","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000f-000000000002',
  'c1000000-0000-0000-0000-00000000000f', 2,
  'Standard Prep', 'Multi-pass leaf removal, perennial cutback, and winterizer application',
  ARRAY['Full leaf removal (1-2 passes)','Final mow of season','Cut back perennials','Winterizer fertilizer application','Blow out beds and hardscapes'],
  ARRAY['Gutter cleaning','Irrigation blowout','Shrub wrapping','Aeration','Mulch application'],
  300, 2, 25,
  '[{"label":"Full leaf removal","required":true},{"label":"Final mow","required":true},{"label":"Cut back perennials","required":true},{"label":"Apply winterizer","required":true},{"label":"Blow out beds and hardscapes","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000f-000000000003',
  'c1000000-0000-0000-0000-00000000000f', 3,
  'Premium Prep', 'Complete fall restoration — multi-pass leaf clearing, overseeding, tender plant protection',
  ARRAY['Multi-pass leaf removal until clear','Final mow with bagging','Cut back all perennials','Winterizer fertilizer application','Overseed bare spots','Blow out all beds and hardscapes','Protect tender plants','Full property walkthrough'],
  ARRAY['Gutter cleaning','Irrigation blowout','Shrub wrapping','Mulch application'],
  480, 3, 44,
  '[{"label":"Multi-pass leaf removal","required":true},{"label":"Final mow with bagging","required":true},{"label":"Cut back all perennials","required":true},{"label":"Apply winterizer","required":true},{"label":"Overseed bare spots","required":true},{"label":"Blow out beds and hardscapes","required":true},{"label":"Protect tender plants","required":true},{"label":"Full property walkthrough","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- ============================================================
-- PRD-046 B3: Specialty Service SKU Levels
-- ============================================================

-- Window Cleaning: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-0009-000000000001',
  'c1000000-0000-0000-0000-000000000009', 1,
  'Exterior Only', 'Exterior windows only — squeegee, rinse, screen and sill wipe',
  ARRAY['Squeegee and rinse all exterior windows','Screen wipe down','Sill wipe'],
  ARRAY['Interior windows','Storm windows','Skylights','Hard water stain removal'],
  90, 2, 13,
  '[{"label":"Clean all exterior windows","required":true},{"label":"Wipe screens","required":true},{"label":"Wipe sills","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0009-000000000002',
  'c1000000-0000-0000-0000-000000000009', 2,
  'Interior + Exterior', 'Both sides of all accessible windows plus screen and track cleaning',
  ARRAY['Clean both sides of all accessible windows','Remove and clean screens','Clean sills and tracks'],
  ARRAY['Skylights','Hard water stain removal','Storm window disassembly'],
  180, 2, 22,
  '[{"label":"Clean interior windows","required":true},{"label":"Clean exterior windows","required":true},{"label":"Remove and clean screens","required":true},{"label":"Clean sills and tracks","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-0009-000000000003',
  'c1000000-0000-0000-0000-000000000009', 3,
  'Full Detail', 'All windows both sides, screen reinstall, track detailing, hard water treatment',
  ARRAY['All windows interior and exterior','Screen removal, cleaning, and reinstall','Track and sill detailing','Hard water stain treatment','Storm window cleaning'],
  ARRAY['Skylight access requiring specialized equipment'],
  270, 3, 35,
  '[{"label":"Clean all windows both sides","required":true},{"label":"Remove, clean, reinstall screens","required":true},{"label":"Detail tracks and sills","required":true},{"label":"Treat hard water stains","required":true},{"label":"Clean storm windows","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Power Wash: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-000a-000000000001',
  'c1000000-0000-0000-0000-00000000000a', 1,
  'Single Surface', 'One surface type — driveway, patio, deck, or walkway',
  ARRAY['Pre-treat stains on selected surface','Pressure wash one surface type','Blow dry edges'],
  ARRAY['Second surface types','House siding','Roof','Chemical treatment or sealing'],
  90, 2, 13,
  '[{"label":"Pre-treat stains","required":true},{"label":"Pressure wash surface","required":true},{"label":"Blow dry edges","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000a-000000000002',
  'c1000000-0000-0000-0000-00000000000a', 2,
  'Home Exterior', 'House siding, foundation, all walkways and patios with mildew pre-treatment',
  ARRAY['Wash house siding','Wash foundation','Wash all walkways and patios','Pre-treat mildew and algae'],
  ARRAY['Roof washing','Fencing','Deck','Chemical sealing'],
  150, 2, 25,
  '[{"label":"Wash house siding","required":true},{"label":"Wash foundation","required":true},{"label":"Wash walkways and patios","required":true},{"label":"Pre-treat mildew and algae","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000a-000000000003',
  'c1000000-0000-0000-0000-00000000000a', 3,
  'Full Property', 'Complete property — siding, hardscapes, deck, fencing, furniture, post-wash inspection',
  ARRAY['Wash siding and foundation','Wash all hardscapes','Wash deck and fencing','Wash driveway','Clean outdoor furniture','Pre-treat all surfaces','Post-wash inspection'],
  ARRAY['Roof washing','Paint stripping','Sealing or staining'],
  300, 3, 44,
  '[{"label":"Wash siding and foundation","required":true},{"label":"Wash all hardscapes","required":true},{"label":"Wash deck and fencing","required":true},{"label":"Wash driveway","required":true},{"label":"Clean outdoor furniture","required":true},{"label":"Post-wash inspection","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Pool Service: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-000b-000000000001',
  'c1000000-0000-0000-0000-00000000000b', 1,
  'Chemical Check', 'Test water chemistry and add chemicals as needed',
  ARRAY['Test water chemistry (pH, chlorine, alkalinity)','Add chemicals as needed','Log readings'],
  ARRAY['Skimming','Brushing','Vacuuming','Equipment check'],
  15, 1, 3,
  '[{"label":"Test water chemistry","required":true},{"label":"Add chemicals as needed","required":true},{"label":"Log readings","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000b-000000000002',
  'c1000000-0000-0000-0000-00000000000b', 2,
  'Weekly Maintenance', 'Skim, brush, vacuum, test and adjust chemicals, empty baskets',
  ARRAY['Skim surface','Brush walls and tile line','Vacuum pool floor','Test and adjust chemicals','Empty skimmer baskets'],
  ARRAY['Filter cleaning','Equipment repair','Drain clearing'],
  35, 2, 6,
  '[{"label":"Skim surface","required":true},{"label":"Brush walls and tile line","required":true},{"label":"Vacuum floor","required":true},{"label":"Test and adjust chemicals","required":true},{"label":"Empty skimmer baskets","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000b-000000000003',
  'c1000000-0000-0000-0000-00000000000b', 3,
  'Full Service', 'Complete pool care — weekly maintenance plus filter, equipment, and tile scrub',
  ARRAY['Skim surface','Brush walls and tile line','Vacuum pool floor','Test and adjust chemicals','Empty skimmer baskets','Check pump and filter pressure','Backwash or clean filter','Inspect equipment','Clean pump strainer basket','Tile line scrub'],
  ARRAY['Equipment repair or replacement','Acid wash','Drain and refill'],
  50, 2, 8,
  '[{"label":"Skim surface","required":true},{"label":"Brush walls","required":true},{"label":"Vacuum floor","required":true},{"label":"Test chemicals","required":true},{"label":"Empty baskets","required":true},{"label":"Check pump/filter","required":true},{"label":"Clean filter","required":true},{"label":"Inspect equipment","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Pest Control: 3 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-000c-000000000001',
  'c1000000-0000-0000-0000-00000000000c', 1,
  'Exterior Perimeter', 'Foundation perimeter spray, entry point treatment, web removal',
  ARRAY['Perimeter spray around foundation','Entry point treatment (doors, windows, utility penetrations)','Web removal from exterior'],
  ARRAY['Interior treatment','Baiting systems','Crawlspace','Attic access'],
  25, 1, 6,
  '[{"label":"Spray foundation perimeter","required":true},{"label":"Treat entry points","required":true},{"label":"Remove exterior webs","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000c-000000000002',
  'c1000000-0000-0000-0000-00000000000c', 2,
  'Interior + Exterior', 'Full perimeter plus interior baseboard, kitchen/bath, and crack treatment',
  ARRAY['Full exterior perimeter spray','Interior baseboard spray','Kitchen and bath treatment','Crack and crevice application'],
  ARRAY['Crawlspace','Attic access','Baiting systems','Wildlife removal'],
  45, 2, 9,
  '[{"label":"Spray exterior perimeter","required":true},{"label":"Spray interior baseboards","required":true},{"label":"Treat kitchen and bath","required":true},{"label":"Crack and crevice application","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000c-000000000003',
  'c1000000-0000-0000-0000-00000000000c', 3,
  'Comprehensive', 'Full interior/exterior, crawlspace/attic inspection, bait stations, service report',
  ARRAY['Full interior and exterior treatment','Crawlspace and accessible attic inspection','Bait station placement','Targeted treatment by pest type','Detailed service report'],
  ARRAY['Wildlife removal','Structural repair','Fumigation'],
  75, 2, 15,
  '[{"label":"Full interior treatment","required":true},{"label":"Full exterior treatment","required":true},{"label":"Inspect crawlspace/attic","required":true},{"label":"Place bait stations","required":true},{"label":"Provide service report","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;

-- Dog Poop Cleanup: 2 levels
INSERT INTO public.sku_levels (id, sku_id, level_number, label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template, is_active) VALUES
(
  'c2000000-0000-0000-000d-000000000001',
  'c1000000-0000-0000-0000-00000000000d', 1,
  'Weekly Yard', 'Full yard walk, pick up and bag all waste, dispose — 1-dog household',
  ARRAY['Walk full yard','Pick up and bag all waste','Tie and dispose in bin'],
  ARRAY['Deodorizing','Sanitizing','Patio or deck areas'],
  15, 1, 2,
  '[{"label":"Walk full yard","required":true},{"label":"Pick up all waste","required":true},{"label":"Dispose in bin","required":true}]'::jsonb,
  true
),
(
  'c2000000-0000-0000-000d-000000000002',
  'c1000000-0000-0000-0000-00000000000d', 2,
  'Multi-Dog Yard', 'Full yard walk for multi-dog households, includes patio/deck check',
  ARRAY['Full yard walk for multi-dog households','Pick up and bag all waste','Check patio and deck areas','Dispose in bin'],
  ARRAY['Deodorizing','Sanitizing','Kennel or run cleaning'],
  25, 1, 3,
  '[{"label":"Walk full yard","required":true},{"label":"Pick up all waste","required":true},{"label":"Check patio and deck","required":true},{"label":"Dispose in bin","required":true}]'::jsonb,
  true
)
ON CONFLICT (sku_id, level_number) DO NOTHING;
