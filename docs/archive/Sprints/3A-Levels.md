# Handled Home — PRD: SKU Variants (LEVELS) System
**Sprint:** SKU Variants (Levels) v1  
**Product:** Handled Home (mobile-only iOS/Android)  
**Audience:** Product, Design, Engineering, Ops, Provider Success  
**Status:** Draft for implementation  
**Last updated:** 2026-02-28

---

## 1) Summary

Handled Home needs a universal, scalable way to standardize **service scope, time, pricing, and proof-of-work** across a diverse catalog — without turning every job into a custom quote or a dispute.

This PRD defines a **Levels system** (SKU variants) that:
- Standardizes each service into **scope + time + proof + handles cost** buckets
- Enables **smart level recommendations** and optional light intake questions (0–3) per SKU
- Enables provider feedback loops: **“recommended level next time”**
- Includes a controlled **Courtesy Upgrade** to protect quality today while correcting the level next cycle
- Creates a premium, non-spammy **upsell surface** (helpful, not salesy)
- Feeds the Service Day / routing engine with **planned minutes** per job so schedules remain viable
- Provides Ops/Admin visibility to prevent abuse and tune pricing/levels

This is a foundational system for Handled Home becoming a **one-tap multi-service subscription OS** with predictable quality and economics.

---

## 2) Goals

### 2.1 Product goals
1. Guarantee the **Handled standard** is met reliably, even when homes vary  
2. Keep adding services “one-tap” while still selecting the correct scope/time bucket  
3. Prevent providers from being forced to rush beyond time windows  
4. Reduce disputes with explicit scope + enforceable proof  
5. Make catalog expansion fast: new SKUs can launch with reusable level templates  

### 2.2 Business goals
1. Increase **ARR per household** via frictionless upgrades and add-ons  
2. Protect margin by aligning time, payout expectations, and handle pricing  
3. Reduce support cost by minimizing ambiguity and surprise escalations  

### 2.3 Operational goals
1. Scheduling engine uses accurate **planned minutes** per job  
2. Providers can signal under-leveling without drama  
3. Ops can see mis-calibration and abuse patterns quickly  

---

## 3) Non-goals (v1)

- Computer vision sizing from photos  
- On-site repricing / negotiated changes mid-job  
- Mid-cycle schedule reshuffling for level changes (default **next cycle**)  
- Unlimited custom quoting per customer  

---

## 4) Core Concepts

### 4.1 SKU
A service offering (e.g., Window Cleaning, Gutter Cleaning, Trash Bin Concierge).

### 4.2 Level (SKU Variant)
A **variant** of a SKU. A Level must define:
- **Scope** (inclusions/exclusions)
- **Time budget** (planned minutes)
- **Proof** (minimum photos + checklist template)
- **Handles cost** (customer price proxy)
- Optional (v1.5+): payout modifier, min/max minutes, constraints

Levels must appear everywhere a SKU appears:
- Catalog card, SKU detail, add sheet, routine list, cycle preview, provider job, receipt.

### 4.3 Courtesy Upgrade
A one-time upgrade performed by the provider when the scheduled level can’t meet the Handled standard:
- Customer is **not charged extra today**
- Customer is prompted to update level **next cycle**
- Strict guardrails prevent abuse

### 4.4 Provider Level Recommendation
Provider input at job completion that says:
- “The scheduled level was insufficient. Next time should be Level X.”
- Recorded with a reason code + optional proof.

### 4.5 Level Guidance Questions
0–3 SKU-specific questions asked after add (or during add if mandatory) to:
- Improve default level selection
- Improve planned minutes accuracy
- Reduce mismatch and disputes

---

## 5) Key User Stories

### Customer
- Add services quickly but get the correct scope (no surprises).
- Understand what each level includes.
- See a recommended level for my home and why.
- Upgrade easily (e.g., inside + outside windows).
- If provider needs more time, I still get the right outcome today without awkward on-site upselling.

### Provider
- Jobs have clear scope, time target, and proof expectations.
- I can recommend a higher level next time with minimal friction.
- I can do a courtesy upgrade to hit quality standards when needed.
- My route stays realistic.

### Admin/Ops
- I can create/edit levels per SKU and roll out changes safely.
- I can configure the guidance questions.
- I can monitor mismatch and courtesy upgrade rates to tune the system.
- I can spot abuse by providers or mis-calibration by SKU/zone.

---

## 6) Requirements

## 6.1 Data Model

### Level fields (required)
- `level_id`
- `sku_id`
- `level_number` (1..N)
- `label` (Maintenance / Standard / Deep / White-Glove)
- `short_description` (1 line)
- `inclusions` (bullet list)
- `exclusions` (bullet list)
- `planned_minutes` (int)
- `proof_photo_min` (int)
- `proof_checklist_template_id` (ref)
- `handles_cost` (int)
- `is_active` (bool)
- `effective_start_cycle` (optional)

### Optional (v1.5+)
- `min_minutes`, `max_minutes`
- `payout_modifier`
- `requires_property_signal` (e.g., pool=true)
- `default_level_rules` (json)

---

## 6.2 Where Levels must appear

**Customer:**
- Catalog list cards: show “From X handles” or show default level if known
- SKU detail: compare levels + scope + handle delta
- Add-to-routine flow: choose level, show handle cost and what’s included
- Routine list items: show level label + handle cost
- Cycle preview timeline: reflect level and minutes implicitly in schedule
- Receipts: show scheduled vs performed level + recommendations

**Provider:**
- Job detail: level label, planned minutes, scope bullets, proof requirements
- Completion: sufficiency + recommendation + courtesy upgrade

**Admin:**
- SKU editor: define levels, questions, rules
- Reports: mismatch, recommendations, courtesy upgrades

---

## 6.3 Default Level Selection (v1)

Default level is chosen via a weighted, explainable rules engine using:
- Property signals (sqft range, yard size, windows tier, stories, pool flag)
- Guidance answers (if present)
- Historical outcomes (prior recommendations, courtesy upgrades)
- Optional: “already handled” map

### Example rules
- If windows tier = MANY → default Level 3  
- If sqft >= 3500 → bump +1 (cap at max)  
- If last visit recommended Level 3 → default Level 3  
- If last visit courtesy-upgraded 2→3 → default Level 3  

### Explainability copy (required)
- “Homes your size typically use Level 3.”
- “We upgraded last time to meet standards — Level 3 will keep results consistent.”

---

## 6.4 Guidance Questions (0–3 per SKU)

### General rules
- Max 3 in v1
- Multiple-choice, tap-only
- Ask AFTER add confirmation unless mandatory for safety/eligibility
- Each question must map directly to: level selection OR planned minutes OR proof

### Mandatory questions (examples)
- Safety-related: home stories (gutter cleaning)
- Eligibility: “Do you have a pool?” (pool maintenance)

### Example: Window Cleaning
- Q1: “How many windows?” (<15 / 15–30 / 30+)  
- Q2: “Outside only or inside + outside?” (Outside / Both)  
- Q3: “Any hard-to-reach windows?” (No / Some / Many)  

Mapping:
- Outside → Level 2  
- Both → Level 3 (+5 handles)  
- Many hard-to-reach → bump +1

### Example: Yard Cleanup
- Q1: Yard size (S/M/L)
- Q2: Debris amount (Light/Normal/Heavy)
- Q3: Special areas (Dog area / Leaves / Weeds / None)

### Example: Gutter Cleaning
- Q1: Stories (1 / 2 / 3+)
- Q2: Gutter length (Short / Typical / Long)
- Q3: Heavy debris (No / Yes)

---

## 6.5 Customer UX: Adding + Upgrading Levels

### Add-to-routine / Add-on flow
- System selects default level
- Customer sees:
  - Level label
  - Handles cost
  - What’s included (collapsed)
  - “Compare levels” (expand)
- Customer can change level with immediate handle delta update

### Upsell positioning (must feel helpful)
Allowed upsell surfaces:
1) SKU detail: compare levels and show incremental value  
2) Add sheet: “Upgrade to Level 3 (+5 handles) — includes inside windows.”  
3) Post-visit: courtesy upgrade notice + “update going forward”  
4) Seasonal: throttled suggestions only

**No dark patterns:**
- No auto-upgrade without explicit customer confirmation (except courtesy upgrade today, which is not charged)

---

## 6.6 Provider UX: Completion Loop

### Job header (required)
- SKU name + Level label
- Planned minutes target
- Scope bullets (max 6)
- Proof requirements (min photos + checklist)

### Level sufficiency prompt at completion (required)
Prompt: “Was the scheduled level sufficient to meet Handled standards?”
- ✅ Yes → complete normally
- ⚠️ No → recommend next time’s level

If “No”:
- Choose recommended level (required)
- Choose reason code (required)
- Optional note (short)
- Optional supporting photo(s)

Reason codes (v1):
- Home larger than expected
- More buildup/debris than typical
- Access constraints reduced time
- Customer requested extra scope
- Requires deeper level to meet standard
- Other (requires note)

---

## 6.7 Courtesy Upgrade (Core Policy)

### When it’s allowed
- The scheduled level cannot meet the Handled standard within planned time
- Provider chooses to perform higher level scope now

### How it works
- Provider selects “Courtesy Upgrade to Level X”
- Must select reason code + add proof
- System records:
  - scheduled_level_id
  - performed_level_id
  - courtesy_upgrade=true

### Customer messaging (receipt)
- “We upgraded you to Level X today so your home meets Handled standards.”
- “To keep this quality, we recommend Level X going forward (+Y handles).”
- One-tap: “Update going forward”

### Guardrails (required in v1)
- **1 courtesy upgrade per property per SKU per 6 months**
- Provider outlier detection: if provider courtesy-upgrade rate > threshold → ops review
- Courtesy upgrades require proof + reason code
- Ops can disable courtesy upgrades per provider/org or per SKU

---

## 6.8 Customer UX: Handling Provider Recommendations

When a recommendation exists:
- Receipt shows recommended level and reason
- One-tap “Update going forward”
- Option “Keep current level” with calm warning:

> “Level 2 may not fully meet Handled standards for your home. We’ll do our best within the scheduled time window.”

Track declines for ops insight and future minimum-level enforcement (optional later).

---

## 6.9 Admin/Ops Requirements

### Admin must be able to:
- Create/edit levels per SKU (draft → active)
- Configure guidance questions per SKU
- Configure default rules per SKU (and zone overrides)
- Configure courtesy upgrade policy (global + per SKU + per provider/org)
- Version levels safely with `effective_start_cycle`

### Ops analytics dashboard (v1)
- Recommendation rate by SKU/zone/provider
- Courtesy upgrade rate by SKU/zone/provider
- Top mismatch hotspots
- Acceptance rate of recommendations
- Outlier provider list

---

## 6.10 Scheduling Integration

- Scheduling uses `planned_minutes` from the selected level.
- Level changes apply **next cycle** by default.
- Courtesy upgrades do not reroute mid-day in v1; they record overage for ops review.

---

## 6.11 Receipts Integration (Proof-of-Work)

Receipt must show:
- Scheduled level
- Performed level (if courtesy upgrade)
- Proof photos (with count)
- Checklist completion
- Provider recommendation (if any)
- One-tap update action

Receipts should be positioned as premium “Handled Receipts,” not generic job history.

---

## 7) Catalog Guidelines

### 7.1 Level naming (recommended)
- Level 1: Maintenance
- Level 2: Standard
- Level 3: Deep
- Level 4: White-Glove (only for certain SKUs)

Avoid “Bronze/Silver/Gold” (salesy).

### 7.2 Level differences must be obvious
Each step up should add clear scope/time value:
- Outside → inside+outside
- 1 story → 2 story
- Light → heavy debris
- Standard → deep detail

### 7.3 Avoid variant explosion
Most SKUs should have 2–3 levels. Add Level 4 only when economics demand it.

---

## 8) Expanded Examples

### 8.1 Window Cleaning (example)
**Level 2: Outside-only**  
- planned: 60 min  
- handles: 12  
- includes: outside glass + sills  
- excludes: inside, screens/track deep clean  

**Level 3: Inside + Outside**  
- planned: 90 min  
- handles: 17 (**+5**)  
- includes: inside/outside glass, sills, light track wipe  
- excludes: screen wash (optional add-on)

Guidance questions:
- windows tier
- inside/outside
- hard-to-reach

Upsell copy example:
> “Level 2 covers the outside only.”  
> “Level 3 adds inside windows for +5 handles.”

---

### 8.2 Gutter Cleaning (example)
**Level 2: 1-story typical** — 60 min — 14 handles  
**Level 3: 2-story or heavy debris** — 90 min — 20 handles  
**Level 4: complex roofline/3+ story** — 120 min — 28 handles

Mandatory questions:
- stories
- debris

---

### 8.3 Trash Bin Concierge (example)
**Level 1:** roll out/in — 10 min — 3 handles  
**Level 2:** roll out/in + sanitize — 20 min — 5 handles

Question:
- How many bins? (1 / 2 / 3+)

---

## 9) Edge Cases & Policies

- Customer declines recommendation → allowed; warn; track.
- Repeat “declines” with repeat insufficient outcomes → consider minimum level enforcement (v1.5+).
- Provider repeatedly recommending higher levels may be abuse or mis-calibration → ops review.
- Same-cycle level upgrades default off; consider Premium feature later.

---

## 10) Analytics & Success Metrics

### Core
- Level mix (L1/L2/L3) by SKU/zone
- Recommendation rate
- Courtesy upgrade rate
- Customer acceptance rate
- Dispute rate per SKU/level
- Proof compliance per level
- Schedule viability proxies (completion time vs planned)

### Guardrails
- Outlier provider courtesy upgrade rates
- Support contacts per 100 jobs by SKU/level

---

## 11) Implementation Plan (Sprint)

### Deliverables (v1)
1. Levels schema + admin editor
2. Customer: level selector in SKU detail and add flows; show in routine + receipts
3. Guidance questions framework + implement for 2–3 pilot SKUs
4. Provider completion: level sufficiency + recommendation
5. Courtesy upgrade flow + strict guardrails + ops override
6. Receipt messaging + one-tap “update going forward”
7. Basic analytics counters (recommendations & courtesy upgrades)

### Recommended Pilot SKUs
- Window Cleaning
- Gutter Cleaning
- Pressure Washing (or Yard Cleanup)

---

## 12) Acceptance Criteria

### Customer
- Default level selected and explainable
- Changing level updates handles instantly
- Guidance answers persist and influence defaults
- Receipt shows scheduled/performed level and offers one-tap update

### Provider
- Job shows level + time target
- Can recommend next level with reason code
- Courtesy upgrade is gated and rate limited

### Admin/Ops
- Can edit levels and activate them safely
- Can view mismatch/upgrade analytics
- Can disable courtesy upgrade per provider/org

### System
- Scheduling uses planned minutes from level
- Next-cycle enforcement of changes works
- Audit trail complete

---

## 13) UX Copy Guidelines

Tone: calm, premium, helpful.
- “Homes your size typically use Level 3.”
- “We upgraded today so your home meets Handled standards.”
- “To keep this result, update to Level 3 going forward (+5 handles).”

---

## 14) Open Questions
1. Max levels per SKU in v1: 3 or 4?
2. Show planned minutes to customers or keep internal?
3. Do handles map to dollars explicitly?
4. Zone-level minimum level enforcement?
5. Premium plan: same-day add-on booking?

---

## 15) Appendix: Suggested tables (informational)
- `sku_levels`
- `sku_level_questions`
- `routine_items` includes `sku_level_id`
- `jobs` includes scheduled vs performed level ids
- `job_level_feedback` includes sufficiency + recommendation + reason
- `courtesy_upgrade_policy` global and overrides

**End of PRD**
