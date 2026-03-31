# Batch Spec: B1 — Fix Lawn/Mowing SKU Metadata (IDs 001-004)

## Scope
Create a new migration to update Standard Mow, Edge & Trim, Leaf Cleanup, and Hedge Trimming with research-backed metadata.

## Changes

### Standard Mow (c1000000-...-001)
- category: 'mowing' (correct, no change)
- description: 'Full-service lawn mowing with edging and blowoff. The core recurring outdoor service.'
- duration_minutes: 45 (was 30 — 45 is standard for medium lot per research)
- base_price_cents: 7500 (was 4900 — $75 aligns with $55-$80 standard recurring range)
- handle_cost: 7 (baseline anchor)
- scheduling_profile: 'day_commit'
- access_mode: 'exterior_only'
- fulfillment_mode: 'same_day_preferred'
- presence_required: false
- weather_sensitive: true (no change)
- inclusions: {'Mow all turf areas','String trim around obstacles','Edge along hardscapes','Blow clippings off hard surfaces'}
- exclusions: {'Bagging/clipping removal','Bed weeding','Hedge trimming','Fertilization','Weed treatment'}
- checklist: [{"label":"Mow all turf areas","required":true},{"label":"String trim borders","required":true},{"label":"Edge hardscapes","required":true},{"label":"Blow hard surfaces clean","required":true}]
- required_photos: ["after"]
- proof_rules: {"photo_required": true, "privacy_safe": false}
- customer_prep: {'Clear toys/debris from lawn','Ensure gate is accessible'}
- required_equipment: {'Walk-behind or zero-turn mower','String trimmer','Stick edger','Backpack blower'}
- provider_category: 'outdoor'
- price_hint_cents: 5500 (provider payout target)
- pricing_notes: 'Standard mow = 7 handles. Research: $55-$80/visit recurring (Thumbtack/HomeAdvisor 2024-2025). Provider payout ~$55.'

### Edge & Trim (c1000000-...-002)
- category: 'trimming' (was 'mowing')
- description: 'Precision edge trimming along all borders, hardscapes, and beds.'
- duration_minutes: 25 (was 15 — 25 is realistic for standard edge + trim)
- base_price_cents: 3500 (was 1500 — $35 for standalone; usually bundled with mow)
- handle_cost: 4
- scheduling_profile: 'day_commit'
- access_mode: 'exterior_only'
- fulfillment_mode: 'same_day_preferred'
- presence_required: false
- weather_sensitive: false (can edge in light rain)
- is_addon: true (primarily bundled with mowing)
- inclusions: {'String trim around all obstacles','Mechanical edge along driveway and sidewalks','Blow debris off hardscapes'}
- exclusions: {'Bed edge re-definition','Mowing','Weed removal'}
- checklist: [{"label":"Trim around all obstacles","required":true},{"label":"Edge all hardscapes","required":true},{"label":"Blow clean","required":true}]
- required_photos: ["after"]
- customer_prep: {'Ensure borders are accessible'}
- required_equipment: {'String trimmer','Stick edger','Backpack blower'}
- price_hint_cents: 3000
- pricing_notes: 'Usually bundled with mow. Standalone: $25-$60. Provider payout ~$30.'

### Leaf Cleanup (c1000000-...-003)
- category: 'cleanup' (was 'mowing')
- description: 'Seasonal leaf removal from lawn, beds, and hardscapes. Fall is the primary season.'
- duration_minutes: 120 (was 45 — 2 hours is realistic for standard cleanup on medium lot)
- base_price_cents: 25000 (was 3500 — $250 is the standard cleanup midpoint per research)
- handle_cost: 15
- scheduling_profile: 'day_commit'
- access_mode: 'exterior_only'
- fulfillment_mode: 'same_week_allowed'
- presence_required: false
- weather_sensitive: true (wet leaves harder to manage)
- inclusions: {'Blow leaves off all turf and beds','Rake and pile leaves','Vacuum or bag for curbside pickup','Clear hardscapes'}
- exclusions: {'Off-site haul-away','Gutter cleaning','Branch/stump removal','Bed detailing'}
- checklist: [{"label":"Clear all turf areas","required":true},{"label":"Clear all beds","required":true},{"label":"Clear hardscapes","required":true},{"label":"Pile or bag at curb","required":true}]
- required_photos: ["before","after"]
- customer_prep: {'No vehicles on leaves','Ensure gate access'}
- required_equipment: {'Backpack blowers (2)','Leaf vacuum','Tarps','Rakes'}
- price_hint_cents: 12000
- pricing_notes: 'Seasonal (Oct-Dec). Research: $150-$400 standard cleanup. Provider payout ~$120 for medium lot. 1-3 visits per fall.'

### Hedge Trimming (c1000000-...-004)
- category: 'trimming' (was 'mowing')
- description: 'Shape and maintain hedges and shrubs. Pricing varies by scope — number and size of plants.'
- duration_minutes: 90 (was 30 — 90 min is realistic for 10-20 mixed shrubs)
- base_price_cents: 15000 (was 2500 — $150 for standard full trim per research)
- handle_cost: 13
- scheduling_profile: 'day_commit'
- access_mode: 'exterior_only'
- fulfillment_mode: 'same_week_allowed'
- presence_required: false
- weather_sensitive: false (no change — can trim in most conditions)
- inclusions: {'Shape all accessible sides','Remove dead branches','Clean up all debris on-site','Blow beds and hardscapes clean'}
- exclusions: {'Rejuvenation pruning','Tree work above 10 feet','Chemical treatment','Haul-away of large debris'}
- checklist: [{"label":"Trim all hedges to shape","required":true},{"label":"Remove dead branches","required":true},{"label":"Clean up debris","required":true},{"label":"Blow area clean","required":true}]
- required_photos: ["before","after"]
- customer_prep: {'Clear access around hedges','Note any areas to avoid'}
- required_equipment: {'Gas/electric hedge trimmers','Hand pruners','Loppers','Debris tarps','Blower'}
- price_hint_cents: 10000
- pricing_notes: 'Per-shrub: $15-$25. Per linear foot (hedge): $2-$5. 2-4 times/year. Provider payout ~$100.'

## Files Changed
- New migration: `supabase/migrations/20260330000000_sku_catalog_overhaul.sql`

## Acceptance Criteria
- [ ] All 4 SKUs updated with correct categories, descriptions, routing fields
- [ ] Handle costs are consistent (mow=7, edge=4, leaf=15, hedge=13)
- [ ] Migration SQL is valid
