# Pricing and Market Sizing for High-Demand Home Services

## Executive context and assumptions

This research is structured for a marketplace-style app SKU catalog: you want a small initial set of services that (a) drives high customer acquisition (downloads + first booking), (b) retains customers via repeat frequency, and (c) expands LTV via natural “next” services that solve adjacent problems in the same household.

Two framing facts shape the SKU strategy:

- U.S. home improvement and repair spend is enormous and persistent—Harvard’s entity["organization","Joint Center for Housing Studies of Harvard University","housing research center"] published modeling indicating annual spend on home improvements and repairs reaching the low-to-mid $500B range by 2026 in its Leading Indicator of Remodeling Activity (LIRA) updates. citeturn0search0turn11news40  
- The “home services” economy isn’t one market—it’s dozens of fragmented trade and service verticals. For market sizing, the cleanest public, comparable numbers are industry market-size (revenue) estimates from entity["organization","IBISWorld","market research firm"] for U.S. industries, complemented with niche sources when a service is on-demand or not separately broken out. citeturn3search4turn18search19turn21search5  

Definitions used in this report:

- **TAM (Total Addressable Market)**: used here as *annual U.S. industry market size (revenue)* for the closest-fit industry category, generally for **2026** if available (or 2025 if 2026 isn’t published in the free excerpt). This is consistent with how many market-sizing sources present “market size” for service industries. citeturn11search2turn19search1turn21search2  
- **Current annual revenue**: the same “market size” number, but tracked as **2025** when available.
- **Pricing**: “national average” prices are anchored primarily on consumer cost guides from entity["company","Angi","home services platform"], supplemented where useful (e.g., entity["organization","This Old House","home improvement publisher"]). Many tier prices are **modeled estimates** built from those anchors, because real SKU catalogs require predefined tiers even when the industry prices “by the hour,” “by the foot,” or “by the load.” citeturn12search0turn13search1turn14search0  

## Market sizing and service ranking

The table below lists **50 commonly purchased home service categories** (mix of recurring services + repair/maintenance + larger projects) and ranks them by **TAM (2026 market size where available)**. These are *industry-level* views and will include both residential and nonresidential work for some trades; you’ll handle “residential-only” targeting later via geography, licensing, and homeowner-intent filters.

### Top home service categories by TAM and annual revenue

| Rank | Home service category | TAM (Market size, $B) | Year | Current annual revenue ($B) | Year | Notes for app positioning | Source |
|---:|---|---:|:--:|---:|:--:|---|---|
| 1 | Handyman services | 355.3 | 2025 | 355.3 | 2025 | Broad “catch-all” repairs/installs; often competes with specialty trades | citeturn3search4 |
| 2 | Electrical contractors (electricians) | 347.5 | 2026 | 345.1 | 2025 | Massive category; includes substantial nonresidential work | citeturn15search1turn3search0 |
| 3 | Excavation contractors | 203.1 | 2025 | 203.1 | 2025 | Large-project work; useful as a “Phase 3” expansion service | citeturn21search5 |
| 4 | Plumbing contractors (plumbers) | 191.4 | 2026 | 190.6 | 2025 | High-intent, urgent; scheduling/logistics tougher (in-home access) | citeturn9search16turn1search5 |
| 5 | Landscaping services | 188.8 | 2025 | 188.8 | 2025 | Huge and fragmented; excellent for recurring maintenance SKUs | citeturn21search14 |
| 6 | Remodeling | 175.4 | 2026 | 174.3 | 2025 | Big-ticket; trust-heavy and longer sales cycle | citeturn11search2 |
| 7 | HVAC contractors (heating & air-conditioning) | 159.4 | 2026 | 158.4 | 2025 | Seasonal spikes; strong upsell ladder from tune-up → repair → replace | citeturn9search19 |
| 8 | Drywall & insulation installers | 122.2 | 2025 | 122.2 | 2025 | Often bundled with remodeling/restoration; not typically “app anchor” | citeturn6search0 |
| 9 | Water supply & irrigation systems | 120.0 | 2025 | 120.0 | 2025 | Broad category; app-relevant subset is irrigation installs/repairs | citeturn17search5 |
| 10 | Janitorial services (incl. residential cleaning services) | 112.0 | 2026 | 110.0 | 2025 | Industry includes commercial + residential; residential is the app focus | citeturn18search0turn18search19 |
| 11 | Concrete contractors | 110.5 | 2026 | 110.4 | 2025 | Driveways, slabs, foundations; larger ticket and permits in some areas | citeturn8search16 |
| 12 | Roofing contractors | 92.5 | 2026 | 92.2 | 2025 | Storm-driven demand; insurance complexity can be a moat | citeturn19search1turn19search5 |
| 13 | Waste collection & disposal services | 86.1 | 2025 | 86.1 | 2025 | App-relevant slice is junk hauling / debris removal | citeturn3search7 |
| 14 | Carpenters | 63.5 | 2026 | 63.7 | 2025 | Framing/finish carpentry; overlaps with handyman + remodeling | citeturn20search2 |
| 15 | Painting contractors (painters) | 49.0 | 2026 | 49.3 | 2025 | Great “visual” upsell; predictable estimating by room/sq ft | citeturn19search18turn2search13 |
| 16 | Masonry | 40.0 | 2025 | 40.0 | 2025 | Hard-skill trade; more common in older housing stock | citeturn8search4 |
| 17 | Tree trimming services | 39.5 | 2025 | 39.5 | 2025 | Includes utility vegetation work; residential subset is still meaningful | citeturn6search4 |
| 18 | Security alarm services | 38.6 | 2026 | 38.6 | 2026 | Recurring monitoring + installs; strong attach to moves/renovations | citeturn5search20 |
| 19 | Flooring installers | 33.8 | 2026 | 33.8 | 2026 | Often remodel-driven; predictable SKU design (rooms/sq ft/material) | citeturn10search19 |
| 20 | Maids, nannies & gardeners | 30.9 | 2026 | 30.9 | 2025 | Proxy for “domestic help”; only part maps to cleaning/garden care | citeturn18search3turn18search5 |
| 21 | Pest control | 29.7 | 2026 | 26.1 | 2025 | Subscription-friendly; residential is the majority per industry sources | citeturn19search0turn19search8 |
| 22 | House painting & decorating contractors | 28.2 | 2026 | 28.2 | 2025 | A more residential-leaning painting category in IBISWorld taxonomy | citeturn19search2turn20search12 |
| 23 | Waste treatment & disposal services | 25.9 | 2026 | 25.9 | 2026 | App subset: construction debris disposal, dumpsters, specialty removal | citeturn9search14 |
| 24 | Glass & glazing contractors | 25.2 | 2026 | 25.3 | 2025 | Windows/doors/shower glass; strong upsell from window installs | citeturn8search1 |
| 25 | Swimming pool construction | 24.8 | 2025 | 24.8 | 2025 | Regionally concentrated; huge ticket but long cycle | citeturn5search5 |
| 26 | Snowplowing services | 23.0 | 2025 | 23.0 | 2025 | Weather & region dependent; strong recurring seasonal subscriptions | citeturn17search4 |
| 27 | Moving services | 23.4 | 2026 | 23.4 | 2025 | Great “event-based” anchor; lower repeat, high cross-sell adjacency | citeturn19search7turn21search3 |
| 28 | Solar panel installation | 22.4 | 2026 | 22.4 | 2025 | Highly regulated/financed; strong lead value but complex fulfillment | citeturn10search0turn10search4 |
| 29 | Fence construction | 20.5 | 2025 | 20.5 | 2025 | Predictable (linear feet/material); good “yard bundle” upsell | citeturn6search9 |
| 30 | Building finishing contractors | 19.1 | 2026 | 19.1 | 2025 | Includes waterproofing/weather stripping/fixtures; good add-on SKUs | citeturn11search17turn20search24 |
| 31 | Paving contractors | 17.6 | 2026 | 17.5 | 2025 | Driveway paving/sealcoat; strong geography & seasonality effects | citeturn10search2turn10search6 |
| 32 | Tile installers | 17.2 | 2026 | 17.2 | 2026 | Remodel-linked; high variation by material and layout | citeturn10search3 |
| 33 | Building exterior cleaners | 15.6 | 2026 | 15.6 | 2026 | Pressure washing/window cleaning; easy to SKU; often no in-home access | citeturn9search1 |
| 34 | Insulation contractors | 13.6 | 2025 | 13.6 | 2025 | Energy-efficiency tailwinds; permitting/inspection often needed | citeturn6search22 |
| 35 | Portable toilet rental & septic tank cleaning | 11.4 | 2026 | 11.3 | 2025 | Relevant primarily for septic cleaning + construction support | citeturn9search9 |
| 36 | Demolition & wrecking | 11.2 | 2026 | 11.2 | 2025 | Remodel adjacency; regulatory/disposal complexity creates operational moat | citeturn21search0turn21search4 |
| 37 | Landscape design | 9.7 | 2026 | 9.7 | 2025 | Natural upsell from “yard cleanup” to “design/install” | citeturn21search2turn21search10 |
| 38 | Septic, drain & sewer cleaning services | 8.1 | 2026 | 8.1 | 2025 | Strong rural/suburban weighting; specialized equipment and routing | citeturn9search2turn9search5 |
| 39 | Swimming pool cleaning services | 8.8 | 2025 | 8.8 | 2025 | Highly subscription-friendly in pool-heavy regions | citeturn5search4 |
| 40 | Damage restoration services | 7.1 | 2026 | 7.2 | 2025 | Storm/fire/water events; insurance workflow is a key differentiator | citeturn20search5turn20search13 |
| 41 | Appliance repair | 7.0 | 2025 | 7.0 | 2025 | High-intent; SKU by appliance type + diagnostic + parts authorization | citeturn3search6 |
| 42 | Mobile storage services | 6.9 | 2026 | 6.9 | 2026 | Move/remodel adjacency; simple SKU (container size + weeks) | citeturn21search11 |
| 43 | Carpet cleaning services | 6.8 | 2025 | 6.8 | 2025 | Excellent upsell from cleaning; easy packaging by rooms/sq ft | citeturn5search1 |
| 44 | Window installation | 6.7 | 2025 | 6.7 | 2025 | Big-ticket but modular (per window/door); strong energy efficiency angle | citeturn20search25 |
| 45 | Building inspectors | 4.9 | 2026 | 5.1 | 2025 | Move/sell/refinance adjacency; monetizes “events” | citeturn10search1 |
| 46 | Locksmiths | 3.0 | 2025 | 3.0 | 2025 | Emergency-intent; great for instant booking and retention hooks | citeturn5search0 |
| 47 | Cabinet makers | 2.7 | 2025 | 2.7 | 2025 | Remodel adjacency; long lead times & design steps | citeturn11search12 |
| 48 | Deck & patio construction | 1.3 | 2025 | 1.3 | 2025 | Outdoor living trend; strong seasonality | citeturn6search6 |
| 49 | Gutter services | 0.80 | 2025 | 0.80 | 2025 | Seasonal but easy to book; strong “prevent damage” positioning | citeturn8search3turn8search7 |
| 50 | Garage door installation | 0.46 | 2025 | 0.46 | 2025 | Repair/replace adjacency; simple SKUs by door size + opener | citeturn20search7turn17search7 |

Key takeaways from the ranking:

- Several **largest-by-revenue trades** (electricians, plumbers, HVAC) are not always the best **customer acquisition anchors** because many jobs require (1) in-home access, (2) higher trust, (3) licensed pros, and (4) uncertain scope until diagnosis. citeturn12search1turn12search2turn12search3  
- By contrast, **repeatable maintenance** categories (cleaning, lawn, pest subscriptions, pool) drive higher lifetime value because customers rebook on a cadence, and subscription economics are common in the category. citeturn13search0turn5search4turn16search27  

## Go-to-market prioritization

The goal for “new market launch” isn’t picking the biggest industries—it’s choosing services that maximize:

- **First-booking conversion** (customer can understand the SKU and cost fast)
- **Operational simplicity** (low variance scope, minimal on-site surprises)
- **Repeat behavior** (weekly/biweekly/quarterly)
- **Upsell adjacency** (same pros/equipment, or same household event)

Below is a **recommended initial set of 10 services** optimized for customer acquisition + cross-sell pathways, followed by how they ladder into second/third services.

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["house cleaning service professionals cleaning kitchen","lawn mowing service crew mowing suburban yard","handyman installing shelf in home","pest control technician spraying home exterior","junk removal truck hauling away household items"],"num_per_query":1}

### Recommended initial ten services for new markets

**Anchor services (designed to get the download and first booking)**  
These are understood instantly by most homeowners, easy to quote, and often don’t require a lengthy diagnostic conversation:

- **House Cleaning** → naturally ladders to deep clean, carpet cleaning, move-out clean  
- **Lawn Mowing / Basic Lawn Care** → ladders to yard cleanup, hedge trimming, aeration/overseeding  
- **Junk Removal / Haul-Away** → ladders to garage cleanout, move-out clean, donation runs  
- **Pest Control (subscription-ready)** → ladders to exclusion work, rodent proofing, termite-focused services  
- **Gutter Cleaning** (or pressure washing in some markets) → ladders to gutter guards/repairs, roof tune-ups  

The reason these work as anchors is simple: each has a widely understood unit of work and “felt need,” and several can be executed **without the homeowner present** if access rules are solved (key box, gate code, curbside pile). citeturn13search1turn14search0turn2search19turn13search0  

**Core upsell services (higher ticket; excellent for second/third booking once trust exists)**  
These are high-intent and drive strong GMV per order, but scope uncertainty and in-home access requirements are higher:

- **Handyman (pre-priced small jobs + half-day/full-day blocks)**  
- **Plumbing repair**  
- **Electrical small jobs**  
- **HVAC maintenance / tune-ups**  
- **Carpet cleaning** (or interior painting if you want to skew higher ticket sooner)

### Recommended “service ladder” for each anchor

A catalog that performs well tends to have a **primary service** plus **two natural follow-ons** that reuse the same household context:

- **House Cleaning → Deep Clean → Carpet Cleaning** citeturn13search3turn2search16  
- **Lawn Mow → Yard Cleanup → Landscape Design Consult** citeturn14search19turn21search2  
- **Junk Removal → Garage Cleanout → Move-Out Clean / Moving Support** citeturn13search1turn14search5  
- **Pest Control → Recurring Plan → Rodent/Termite Add-on** citeturn13search0turn16search27turn13search8  
- **Gutter Cleaning → Downspout Flush / Minor Repair → Roof Tune-up Referral** citeturn14search0turn14search16  

Opinionated constraint that improves outcomes: **don’t launch with big remodeling SKUs as “shop-able” packages** unless you already have strong local contractor supply and a trust brand. Remodel is huge, but scope variance is extreme; you’ll burn customer trust and ops time if you try to force it into rigid tiers too early. citeturn11search2  

## Pricing tiers for the initial ten services

Format below is designed for app SKU cards:

- **Headline**: short and salesy
- **Tap-for-details copy**: 1–2 sentences
- **National average anchor**: sourced
- **Levels 1–5**: *modeled tier pricing* based on the anchor and typical price structure (room, visit, hour, linear feet, etc.)
- **Home access requirement**: “Inside” vs “Outside” to simplify scheduling UX (customer-at-home vs no)

### House cleaning

**Compelling headline:** “A clean home you can feel—without giving up your weekend.”  
**Tap for details:** Choose a quick refresh or a deep reset. Great for weekly routines, guests, or just getting your space back under control.  
**National average price (anchor):** Professional house cleaning commonly prices in the low-hundreds per visit nationally, with ranges depending on home size and service depth. citeturn12search16  

**Level 1 — Quick Refresh Clean (small space)** *(estimated: $99–$149)*  
Checklist:
- Kitchen wipe-down (counters, sink, exterior appliances)
- 1 bathroom quick clean
- Vacuum + light mop main areas  
Home access: **Inside required** (yes)

**Level 2 — Standard Clean (most common)** *(estimated: $160–$240)*  
Checklist:
- All bathrooms cleaned (toilet, sink, shower/tub)
- Full kitchen clean (exterior surfaces)
- Dusting reachable surfaces
- Vacuum all floors + mop hard floors  
Home access: **Inside required** (yes)

**Level 3 — Deep Clean Reset** *(estimated: $250–$400)*  
Checklist:
- Everything in Standard Clean
- Baseboards/door frames spot-detailed
- Heavier soap scum / buildup focus
- Inside microwave (optional add-on if allowed)  
Home access: **Inside required** (yes)

**Level 4 — Move-In / Move-Out Clean** *(estimated: $350–$650)*  
Checklist:
- Everything in Deep Clean
- Empty-cabinet wipe-down (if empty)
- Inside fridge/oven (optional priced add-ons)
- Extra time allocation for neglected areas  
Home access: **Inside required** (yes; access coordination is critical)

**Level 5 — Recurring Plan (weekly/biweekly)** *(estimated: 10–20% lower per visit than Level 2)*  
Checklist:
- Level 2 scope
- Same team preference (when possible)
- Priority scheduling windows  
Home access: **Inside required** (yes)

### Lawn mowing and basic lawn care

**Compelling headline:** “Curb appeal on autopilot.”  
**Tap for details:** Book a one-time mow or set a recurring schedule. Most jobs can be done while you’re away—just provide gate/access notes.  
**National average price (anchor):** Professional lawn mowing commonly averages around ~$122 per visit nationally, with typical ranges from ~$50 to ~$200 depending on yard size and terrain. citeturn2search19  

**Level 1 — Small Yard Mow** *(estimated: $49–$79)*  
Checklist:
- Mow front + back (small lot)
- Blow clippings off hard surfaces  
Home access: **Outside only** (no inside)

**Level 2 — Standard Yard Mow (most common)** *(estimated: $80–$140)*  
Checklist:
- Mow all grass areas
- Edge sidewalks/driveway
- Blow clean hard surfaces  
Home access: **Outside only**

**Level 3 — Large Lot Mow** *(estimated: $140–$220)*  
Checklist:
- Level 2 scope
- Larger equipment / longer time allocation  
Home access: **Outside only**

**Level 4 — Full-Service Visit** *(estimated: $175–$275)*  
Checklist:
- Level 2 scope
- Light weeding in beds (time-boxed)
- Quick hedge touch-up (time-boxed)  
Home access: **Outside only**

**Level 5 — Recurring Maintenance Plan** *(estimated: $45–$90 per visit for frequent schedules, depending on lot size)*  
Checklist:
- Weekly or biweekly
- Weather reschedule logic
- Optional seasonal add-ons (aeration, cleanup) citeturn14search19turn14search3  
Home access: **Outside only**

### Handyman

**Compelling headline:** “Finally get the little stuff done.”  
**Tap for details:** Perfect for installs, minor repairs, and punch lists. Choose a small job or book a half-day/full-day block for better value.  
**National average price (anchor):** Hiring a handyman averages about $408 nationally, with typical ranges roughly $176–$689; many charge $50–$150/hr depending on task and market. citeturn12search0  

**Level 1 — Small Fix (up to ~1 hour labor)** *(estimated: $125–$225)*  
Checklist:
- Basic install/repair (1–2 small tasks)
- Fasteners/consumables included (small)
- Customer supplies major parts (e.g., shelf, faucet)  
Home access: **Inside required** (usually)

**Level 2 — Standard Job (2–3 hours)** *(estimated: $250–$450)*  
Checklist:
- Multi-task (mount + patch + adjust)
- Light drywall patching
- Basic assembly/installation  
Home access: **Inside required**

**Level 3 — Half-Day Punch List (4 hours)** *(estimated: $450–$650)*  
Checklist:
- Multiple rooms/tasks
- Prioritized checklist flow
- Minor materials run (optional)  
Home access: **Inside required**

**Level 4 — Full-Day Punch List (8 hours)** *(estimated: $700–$1,050)*  
Checklist:
- Larger checklist completion
- More complex installs (within handyman scope)
- Photo documentation of completed tasks (good for rentals)  
Home access: **Inside required**

**Level 5 — Ongoing Home Maintenance Membership** *(estimated: $29–$79/mo + discounted labor)*  
Checklist:
- Priority scheduling
- Discounted hourly rate
- Seasonal “home check” reminder cadence  
Home access: **Inside sometimes** (depends on tasks)

### Pest control

**Compelling headline:** “Stop pests before they become a problem.”  
**Tap for details:** Choose a one-time treatment or a recurring plan for year-round protection. Pricing depends on pest type and severity.  
**National average price (anchor):** Pest control ranges roughly $50–$500, with a national average around $171; one-time visits often price higher (e.g., $300–$550). citeturn13search0  

**Level 1 — Pest Identification & Inspection** *(estimated: $99–$175)*  
Checklist:
- Pest ID + entry point scan
- Treatment recommendation
- Simple prevention checklist  
Home access: **Inside sometimes** (often optional; exterior-only possible)

**Level 2 — Standard One-Time Treatment (common pests)** *(estimated: $150–$250)*  
Checklist:
- Perimeter exterior treatment
- Targeted interior treatment as needed
- Basic crack/crevice attention (not full exclusion)  
Home access: **Inside sometimes** (may be required for interior)

**Level 3 — Intensive One-Time Treatment** *(estimated: $300–$550)*  
Checklist:
- Level 2 scope
- Follow-up visit (if included)  
Home access: **Inside often** (depends on pest)

**Level 4 — Recurring Protection Plan (monthly or quarterly)** *(estimated: $40–$70/mo or $100–$300/quarter)*  
Checklist:
- Scheduled preventative treatments
- Priority callbacks
- Seasonal targeting (ants in spring, etc.) citeturn13search20  
Home access: **Inside sometimes** (many plans can be exterior-focused)

**Level 5 — Specialty Pests (e.g., termites/bed bugs)** *(estimated: “quote required”; often can run into the thousands)*  
Checklist:
- On-site assessment
- Treatment plan + safety protocol
- Possible tenting/isolated remediation for severe cases citeturn13search0turn13search8  
Home access: **Inside required** (yes)

### Junk removal and haul-away

**Compelling headline:** “Clear the clutter today.”  
**Tap for details:** Fast pickup for single items to full cleanouts. You can save time by placing items curbside when possible.  
**National average price (anchor):** Junk removal averages about $241, with typical ranges from ~$60 to $700+ depending on load size and type. citeturn13search1  

**Level 1 — Single Item Pickup** *(estimated: $75–$150)*  
Checklist:
- One bulky item (mattress, chair, appliance*)
- Load + haul away
- Basic sweep of pickup area  
Home access: **Outside only** if curbside; **Inside** if item is indoors  
\*Appliance removal per-item pricing is often higher. citeturn13search5  

**Level 2 — Small Load (about 1/8 truck)** *(estimated: $150–$275)*  
Checklist:
- Small pile (garage corner, a few boxes, small furniture)
- Load, haul, disposal fees  
Home access: **Outside preferred**

**Level 3 — Medium Load (about 1/4–1/2 truck)** *(estimated: $275–$500)*  
Checklist:
- Multiple items / moderate debris
- Includes standard dump fees (within reason)  
Home access: **Outside preferred; inside optional**

**Level 4 — Full Load / Heavy Debris** *(estimated: $500–$900)*  
Checklist:
- Near full truckload
- Heavier material handling (fees vary)
- Photo confirmation of cleared areas  
Home access: **Often inside** (if whole-room/garage)

**Level 5 — Whole-Home / Estate Cleanout** *(estimated: $900–$2,500+)*  
Checklist:
- Multi-room content removal
- Multi-crew routing
- Donation sort (optional add-on)  
Home access: **Inside required**

### Plumbing repair

**Compelling headline:** “Fix the leak before it becomes a flood.”  
**Tap for details:** Book a standard repair or emergency service. Many jobs require diagnosis first; you’ll approve any major parts before work continues.  
**National average price (anchor):** Hiring a plumber can be as low as ~$99 and as high as ~$975, with many homeowners paying around $339 nationally. citeturn12search1  

**Level 1 — Service Call / Diagnostic (includes first hour)** *(estimated: $100–$250)*  
Checklist:
- Diagnose issue
- Safety shutoff check
- Written estimate for repair  
Home access: **Inside required** (yes) citeturn12search5  

**Level 2 — Minor Repair (e.g., small leak, clogged sink)** *(estimated: $250–$450)*  
Checklist:
- Standard repair labor
- Basic parts (washers, seals) if in-stock
- Test + clean up  
Home access: **Inside required**

**Level 3 — Fixture Replacement (faucet, toilet parts, disposal swap)** *(estimated: $400–$750)*  
Checklist:
- Remove + install
- Seal/fitment checks
- Disposal of old fixture  
Home access: **Inside required**

**Level 4 — Drain / Sewer Issue (more complex)** *(estimated: $600–$1,200)*  
Checklist:
- Advanced clog removal (equipment dependent)
- Camera/line inspection if needed (often add-on)
- Recommendations to prevent recurrence  
Home access: **Inside required** (often)

**Level 5 — Emergency Plumber (after-hours / urgent)** *(estimated: $100–$500+ starting, with high hourly rates possible)*  
Checklist:
- Rapid response window
- Temporary stabilization (stop leak, shutoffs)
- Follow-up repair plan if parts needed citeturn12search9  
Home access: **Inside required**

### Electrical small jobs

**Compelling headline:** “Make your home safer—and your outlets work again.”  
**Tap for details:** Ideal for outlet/switch fixes, fixture installs, and quick troubleshooting. Service-call pricing typically covers the first hour.  
**National average price (anchor):** Hiring an electrician averages about $350 nationally; hourly rates commonly range $50–$130 with a service call fee often ~$100–$200 for the first hour. citeturn12search2  

**Level 1 — Service Call / Troubleshoot (first hour)** *(estimated: $100–$200)*  
Checklist:
- Diagnose breaker/outlet/fixture issue
- Safety check
- Repair quote before major work  
Home access: **Inside required**

**Level 2 — Minor Electrical Job** *(estimated: $150–$600)*  
Checklist:
- Replace switch/outlet/light fixture (simple swap)
- Test + label notes (optional)  
Home access: **Inside required** citeturn12search2  

**Level 3 — New Outlet Installation (per outlet)** *(estimated: $130–$300 per outlet)*  
Checklist:
- Install new receptacle (standard)
- Secure box + faceplate
- Test and verify polarity/GFCI as applicable  
Home access: **Inside required** citeturn12search18  

**Level 4 — Complex Job (panel work / major circuits)** *(estimated: $2,000–$10,000)*  
Checklist:
- Multi-hour or multi-day scope
- Permits/inspection coordination where required
- Detailed estimate required before starting citeturn12search2  
Home access: **Inside required**

**Level 5 — Emergency Electrical (after-hours)** *(estimated: quote + emergency minimum)*  
Checklist:
- Rapid stabilization (make safe)
- Temporary shutoff/isolation
- Next-day repair plan  
Home access: **Inside required**

### HVAC maintenance and tune-ups

**Compelling headline:** “Spend a little now—avoid a huge repair later.”  
**Tap for details:** Routine maintenance improves performance and can help detect failures early. Choose a tune-up, repair, or a maintenance plan.  
**National average price (anchor):** HVAC maintenance costs about $250 on average, typically ranging $100–$650 depending on system type and season. citeturn12search3  

**Level 1 — Seasonal Tune-Up (AC or furnace)** *(estimated: $70–$150 for AC tune-up; ~$100 average furnace inspection)*  
Checklist:
- Basic inspection + performance checks
- Filter check/recommendation
- Safety checks (as applicable) citeturn12search11turn12search38  
Home access: **Inside required** (yes)

**Level 2 — Full Maintenance Visit (most common)** *(estimated: $200–$350)*  
Checklist:
- Cleaning of accessible components
- System performance testing
- Written recommendations for repairs  
Home access: **Inside required** citeturn12search3  

**Level 3 — Standard Repair** *(estimated: $150–$450 typical; average repair cost ~ $350)*  
Checklist:
- Diagnosis + repair of common failures
- Parts authorization workflow
- System test + temperature differential check citeturn12search7  
Home access: **Inside required**

**Level 4 — Major Repair (compressor/coil class work)** *(estimated: $900–$2,500)*  
Checklist:
- Advanced component replacement
- Refrigerant work as required
- Longer on-site time window citeturn12search15  
Home access: **Inside required**

**Level 5 — System Replacement** *(estimated: $5,000–$12,500)*  
Checklist:
- Load sizing / equipment selection
- Permits + disposal of old equipment
- Commissioning + start-up checklist citeturn12search15  
Home access: **Inside required**

### Gutter cleaning

**Compelling headline:** “Prevent water damage with a 1-hour visit.”  
**Tap for details:** Clean gutters help protect your roof, siding, and foundation. Most homes can be serviced without anyone home (exterior-only).  
**National average price (anchor):** Gutter cleaning often prices ~$0.95 to $2.25 per linear foot; many homes have ~125–200 feet of gutters. citeturn14search0turn14search16  

**Level 1 — Single-Story Standard Clean** *(estimated: $125–$225)*  
Checklist:
- Remove debris from gutters
- Bag debris (or per local disposal rules)
- Blow off roofline where safe  
Home access: **Outside only** (no inside)

**Level 2 — Two-Story Standard Clean** *(estimated: $200–$350)*  
Checklist:
- Level 1 scope
- Ladder safety setup + extra labor time  
Home access: **Outside only**

**Level 3 — Heavy Debris / Storm Cleanout** *(estimated: $350–$500)*  
Checklist:
- Compact debris removal
- Extra time allocation
- Photo verification of cleared sections  
Home access: **Outside only**

**Level 4 — Clean + Downspout Flush** *(estimated: $400–$650)*  
Checklist:
- Level 2 or 3 scope
- Downspout flush/test
- Identify clogs/leaks and recommend repair  
Home access: **Outside only**

**Level 5 — Preventative Add-On Quote (guards/repairs)** *(estimated: inspection + quote)*  
Checklist:
- Condition assessment
- Recommend guard types / repairs
- Provide estimate options  
Home access: **Outside only**

### Carpet cleaning

**Compelling headline:** “Make carpets look (and smell) new again.”  
**Tap for details:** Standard steam cleaning removes dirt and allergens; add pet treatment or deodorizing for tougher jobs.  
**National average price (anchor):** Carpet cleaning averages about $182 nationally, typically ~$123–$241; pricing is often per room ($40–$125) or per sq ft. citeturn13search3  

**Level 1 — Spot/Small Area Clean (1–2 rooms)** *(estimated: $99–$149)*  
Checklist:
- 1–2 rooms
- Light stain focus
- Fast dry guidance  
Home access: **Inside required**

**Level 2 — Standard Clean (most common)** *(estimated: $150–$250; average ~$182)*  
Checklist:
- Up to ~3 rooms or equivalent area
- Standard steam clean
- Basic deodorize (light) citeturn13search3  
Home access: **Inside required**

**Level 3 — Deep Steam + Deodorize** *(estimated: $250–$350)*  
Checklist:
- Slower passes + heavier extraction
- Deeper deodorize
- Higher soil-load handling  
Home access: **Inside required**

**Level 4 — Pet Stain & Odor Treatment** *(estimated: $300–$450)*  
Checklist:
- Enzyme treatment
- Deodorize + extraction
- Targeted spot treatment plan  
Home access: **Inside required**

**Level 5 — Whole-Home + Upholstery Bundle** *(estimated: $450–$850)*  
Checklist:
- Multiple rooms + stairs
- Add one upholstered item (sofa/chairs) as packaged add-on
- Post-care instructions  
Home access: **Inside required**

## Regional SKU and pricing variation

Pricing is not uniform across the entity["country","United States","country"]; **labor costs, disposal fees, permitting/licensing rules, climate, and housing stock** drive meaningful spreads. The key SKU-catalog decision is whether to:

- keep pricing **nationally consistent** (simpler UX, but margin risk), or
- implement **regional price books** (better unit economics, but higher catalog complexity).

Evidence of meaningful regional variation appears even in consumer cost guides that “anchor” to national averages:

- **Pest control:** national average around $171, but a Los Angeles average of ~$232 is reported on city-specific pages—suggesting material metro premiums. citeturn13search0turn13search4  
- **Gutter cleaning:** national per-foot pricing ~$0.95–$2.25, while Los Angeles pages show a much wider ~$0.75–$4 per foot range—multi-story and labor effects amplify spreads. citeturn14search0turn14search4  
- **Electricians:** national hourly ranges cited broadly, while Los Angeles pages show $58–$115/hr as a local range—again reflecting metro labor pricing. citeturn12search2turn12search6  
- **Carpet cleaning:** Los Angeles average ~$196 versus a national average ~$182 is presented in the same publisher’s city vs national pages. citeturn13search3turn13search7  
- **Moving:** Angi’s moving data shows national averages (e.g., local move ~$1,692) and highlights wide state spreads (e.g., Alaska much lower, Idaho much higher for certain local moves), confirming that geo-pricing matters for event-based services. citeturn14search5  

### SKU and region design considerations that reduce operational pain

- **Separate “outside-only” SKUs from “inside-required” SKUs at the top level.** This reduces scheduling friction because outside-only jobs can be executed without the customer home (in many cases), which increases acceptance and reduces cancellations. Gutter cleaning and lawn care are strong examples. citeturn14search0turn2search19  
- **Use “sizing proxies” customers understand.** Examples:
  - Cleaning: bedrooms/bathrooms + “deep vs standard”
  - Lawn: lot size bands or “small/standard/large”
  - Gutter: stories + approximate linear footage bands (customers don’t know linear feet)
  - Junk: “single item / small / medium / full load”  
  These match how many categories are practically priced (per room, per foot, per load). citeturn14search0turn13search1turn13search3  
- **Build a “quote required” escape hatch for high-variance work** (e.g., specialty pests, major electrical, major HVAC repairs/replacements). This protects CX and margin by preventing underpriced fixed-tier disasters. citeturn13search0turn12search2turn12search15  

## Methodology and limitations

- **Market size data:** Primary market size figures come from free excerpts of IBISWorld U.S. industry market size pages and industry analyses when available; some categories only present 2025 values publicly, while others provide both 2025 and 2026. citeturn19search1turn20search2turn21search2  
- **Pricing data:** National pricing anchors are taken from Angi consumer “cost” guides and related pages, which report typical national averages and ranges and explicitly note location sensitivity; city examples are used to illustrate regional spreads. citeturn12search1turn13search0turn14search0turn13search4  
- **Tier pricing:** Many real-world services price hourly/per-unit. The “levels” presented are **designed for SKU merchandising** and use modeled estimates tied to anchored ranges. They should be validated with local provider quote sampling as you onboard supply (especially for trades and any service with high “unknown until on-site” variance). citeturn12search0turn12search2turn12search3