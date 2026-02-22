# 07-bundle-builder.md  
**Handled Home — Module 07 PRD (Routine & Bundle Builder)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized, operationally usable (support + ops knobs only)  

**Primary Customer Routes:**  
- `/customer/routine`  
- `/customer/routine/review`  
- `/customer/routine/confirm`  
- `/customer/dashboard`  

**Primary Admin Routes (minimal):**  
- `/admin/bundles` (read-only support view) **OR** add “Routine” tab inside `/admin/subscriptions/:id`  
- `/admin/zones/:zoneId/ops` (zone ops knobs: provider home base, weekly targets)  

**Last updated:** 2026-02-21  

---

## 0) Why this module exists

Handled Home wins by making home maintenance **predictable** and **low-friction**.

Module 07 is the customer’s “control panel” for choosing:
- **what** gets done (SKUs)  
- **how often** it happens (cadence)  
- **what the next 4 weeks will look like** (preview timeline)  

The desired feeling:

> “I’m in control. I understand exactly what happens. I never have to micromanage scheduling.”

Operationally, Module 07 must:
- preserve the density-based model (no on-demand booking)  
- reduce confusion by making **scope + proof** undeniable  
- produce structured, versioned data for later modules (job generation, provider execution, proofs)  

---

## 1) Core outcomes (Definition of Done)

### 1.1 Customer outcomes (premium + clarity + control)
1) Build a routine tied to:
   - subscription entitlements (Module 05: **service weeks per billing cycle**)  
   - confirmed Service Day (Module 06)  
2) See a **4-week preview timeline** (Weeks 1–4) that updates instantly.  
3) Set cadence per SKU:
   - weekly  
   - every other week (biweekly)  
   - once per billing cycle (every 4 weeks)  
   - independent cadence (monthly/quarterly) **only when allowed and clearly explained**  
4) Review “Scope + Proof” in a calm review step that prevents misunderstandings.  
5) Confirm + lock the routine with a predictable **effective date**.  
6) Biweekly patterns are auto-selected for reliability, with a bounded “Swap pattern” option.

### 1.2 Business outcomes (ops optimization + low support)
1) Routine creation is entitlement-aware and prevents over-commitment.  
2) System auto-chooses biweekly patterns to optimize:
   - weekly stop balance (primary)  
   - drive-time proxy using provider home base + property geo (secondary)  
3) This module never becomes a calendar/scheduling UI.  

---

## 2) Hard product rules (non-negotiable)

- No marketplace behavior.  
- No on-demand booking.  
- No calendar browsing.  
- Users feel in control through transparency, previews, and bounded choices — not free-form scheduling.  
- Confirmation creates a versioned routine for a future cycle; it does not create provider jobs yet.  

---

## 3) Scope

### 3.1 In scope
A) **Routine builder (SKUs + cadence)**  
- SKU selection with clear labels for fulfillment timing + proof expectations  
- Cadence picker per SKU  
- Entitlement-aware guidance and fixes  

B) **4-week preview timeline** (core UX)  
- Week 1–4 cards with clear “what happens” summaries  

C) **Review step (Scope + Proof)**  
- Included vs not included  
- Proof expectations (photos/checklists)  
- Timing expectations in plain English  

D) **Confirm + lock (versioned routine)**  
- Create a locked routine version for the next effective cycle  
- Predictable effective date policy  

E) **Ops-optimized biweekly pattern optimizer**  
- Choose Weeks 1&3 vs 2&4 based on zone load + geo clustering proxy  
- Provide bounded user “swap” when feasible  

F) **Minimal admin/support visibility**  
- View routine + version history read-only  
- Zone ops knobs for optimization inputs  

### 3.2 Out of scope
- Job creation / dispatch / route optimization  
- Provider execution workflows (checklists/photos collection)  
- Customer rescheduling or picking dates  
- Refunds/support ticket workflows  

---

## 4) Premium UX principles (must follow)

### 4.1 Truth banner (sticky on routine screens)
Always visible (compact, scannable):
- Plan: `{plan_name}`  
- Included service weeks per billing cycle: `{X}`  
- Routine demand this cycle: `{D}` (computed)  
- Service Day: `{Tue • Any}`  
- Billing cycle range: `{start–end}` and next billing date  
- “4-week preview” label  

### 4.2 Progressive disclosure (3-step flow)
1) Build routine (what you want)  
2) Review scope + proof (what “done” means)  
3) Confirm lock (when it takes effect)  

### 4.3 Plain-English timing labels (from Module 04 fulfillment_mode)
- `same_day_preferred` → **“Done on your Service Day”**  
- `same_week_allowed` → **“Done sometime that week”**  
- `independent_cadence` → **“Runs on its own schedule”**  

### 4.4 Bounded agency
- Users can swap biweekly pattern **A ↔ B** (if feasible).  
- Users cannot pick arbitrary weeks/dates.  
- Any “optimization” is explainable and calm.

---

## 5) Customer flow (required)

### 5.1 Entry requirements / gating
- If Service Day not confirmed → route to Module 06 with CTA “Confirm Service Day”.  
- If zone not covered → show “Not available yet” and block confirm.  
- Soft onboarding:
  - allow building/saving draft routine without subscription  
  - block **Confirm** until subscription is active (Module 05)  

### 5.2 Step 1 — Build routine  
Route: `/customer/routine`

#### A) Layout (mobile-first)
- Sticky Truth Banner  
- 4-week preview timeline (Week 1–4 cards)  
- Primary CTA: “Add services” (floating button)  
- Secondary: “Review” (enabled if routine not empty and entitlement-fit is valid)

#### B) 4-week preview timeline (core concept)
Each week card shows:
- Week label: “Week 1” … “Week 4”  
- Date range (optional but helpful; computed from billing-cycle anchor)  
- Summary line: “{n} services • {m} photos”  
- Optional informational badge:
  - “Drive-friendly” (only if geo signals available and favorable)  
- Tap expands to list the week’s services:
  - service name  
  - timing label (Service Day / This week / Independent)  
  - cadence tag (Weekly / Biweekly / Monthly)  

**Key rule:** it’s a preview timeline, not a calendar.

#### C) Add services bottom sheet
Opens from “Add services”:
- Search  
- Category groups  
- “Recommended for your home” (automation)  
- “Common in your zone” (if you have data; otherwise hide)  

SKU row shows:
- name  
- optional duration minutes  
- timing label (from fulfillment_mode)  
- proof badge (“Photos: 2”, “Checklist: 4”)  

Tap SKU → SKU detail modal.

#### D) SKU detail modal (confidence)
- One-screen summary:
  - “What’s included” (top 3–5 bullets; expandable)  
  - “What’s not included” (top 3–5 bullets; expandable)  
  - “How we confirm it’s done” (photo labels + checklist count)  
  - Timing label in plain English  
- CTA: “Add to routine” → cadence picker  

#### E) Cadence picker (critical)
Shown immediately after “Add to routine”.

Options:
- Weekly  
- Every other week (biweekly)  
- Every 4 weeks (once per billing cycle)  
- If `independent_cadence`: Monthly / Quarterly options (only if allowed by entitlement rules)

When cadence changes:
- Week 1–4 preview updates instantly  
- Entitlement demand re-computes instantly  
- Biweekly pattern auto-picks A or B and displays it (with “Why?”)

---

## 6) Entitlement awareness (how we prevent over-commitment)

### 6.1 What the plan entitles (Module 05 contract)
Module 05 entitlements are expressed as:
- **service weeks per billing cycle** (no rollover)  

Interpretation in Module 07:
- A “service week” is a week where the customer expects the system to show up and do Service-Day-bound work for the routine.  
- Routine “demand” is computed from selected items and their cadence.

### 6.2 Demand model (user-facing, calm)
Compute:
- `service_weeks_demand` for the 4-week preview window

Suggested mapping (must be consistent across UI):
- Weekly item → appears in weeks 1,2,3,4 → contributes 4 service-week occurrences  
- Biweekly item → appears in 2 of 4 weeks → contributes 2  
- Every 4 weeks → appears in 1 of 4 weeks → contributes 1  
- `same_week_allowed` items:
  - still belong to a service week (they happen within a week)  
- `independent_cadence`:
  - does **not** create service-week commitment unless explicitly mapped to a service week by policy (keep it separate in preview)

### 6.3 Guardrails UI
If demand exceeds included entitlement:
- show a calm warning panel pinned under the Truth Banner:
  - “This routine uses **{D} service weeks** per billing cycle. Your plan includes **{X}**.”
- Provide 3 fix actions (always available):
  1) **Auto-fit to my plan** (automation)  
  2) **Adjust cadences** (deep link to items causing overage)  
  3) **Change plan** (go to Module 05)

**Confirm is blocked** until demand <= included (hard rule).

### 6.4 What “extra” means in Module 07
Because pricing is flexible and not fully defined:
- If demand > included, the UX frames it as “Doesn’t fit your plan yet” rather than “extra charges”.  
- Later modules can price extras; Module 07 stays entitlement-correct and honest.

---

## 7) Biweekly pattern optimizer (A/B selection)

### 7.1 Requirement
For biweekly items, system auto-selects:
- Pattern A: Weeks **1 & 3**  
- Pattern B: Weeks **2 & 4**

Primary objective:
- balance weekly customer counts (stops) within the zone

Secondary objective:
- reduce drive-time using distance proxy to provider home base

**No routing APIs. No map UI.**

### 7.2 Inputs
- Zone + service day assignment (Module 06)  
- Zone ops knobs (Module 07 admin config):
  - provider home base lat/lng  
  - weekly target stops (advisory)  
  - weekly max stops (hard cap optional)  
- Property geo:
  - lat/lng + geohash (if available)  
- Existing locked routines in zone (for demand baseline)

### 7.3 Deterministic scoring (non-magical)
For each candidate pattern (A or B), estimate impact across weeks 1–4:
- `stop_count_delta` (how many households now have at least one service-week-bound item that week)
- `geo_spread_proxy` (unique geohash cells served that week)
- `avg_distance_to_home_base_km` (optional; only if you can compute from lat/lng)

Score (lower is better):
- Hard penalties:
  - exceeding weekly max stops (if defined)  
  - exceeding zone day capacity (from Module 06 capacity table)  
- Soft objectives:
  - minimize imbalance vs target stop count  
  - minimize geo spread proxy  
  - minimize avg distance to home base

### 7.4 User-facing presentation (bounded agency)
For a biweekly item in the routine list:
- Show: “Every other week • Weeks **2 & 4** (optimized for reliability)”
- “Why?” expands to 1–2 lines:
  - “This pattern keeps weekly routes balanced in your zone and reduces drive time.”

Allow “Swap pattern”:
- toggles A ↔ B only  
- allowed only if alternative is feasible (capacity + score threshold)
- if blocked, show:
  - “That option is currently full for reliability.”

---

## 8) Step 2 — Review scope + proof (confidence step)  
Route: `/customer/routine/review`

Purpose:
- reassure customer and prevent disputes later
- reduce support tickets by aligning expectations

### 8.1 Review screen structure
A) Top summary
- Truth Banner  
- “4-week snapshot” (Week 1–4, stop count per week)  
- “Proof expectations” summary:
  - total photos per cycle  
  - total checklist items per cycle (optional)

B) Per-service cards (one card per SKU)
Each card shows:
- SKU name  
- cadence + timing label  
- biweekly pattern if applicable  
- “What’s included” bullets (top 3–5, expandable)  
- “What’s not included” bullets (top 3–5, expandable)  
- “How we confirm it’s done”
  - required photo labels (collapsed list)  
  - checklist item count  

C) Entitlement fit indicator
- Green: fits plan  
- Red: over plan (block “Continue”)  
- Provide same fix actions as Step 1

---

## 9) Step 3 — Confirm + lock (versioned routine)  
Route: `/customer/routine/confirm`

### 9.1 Subscription gate
If subscription not active:
- show paywall (Module 05)  
- after activation, return to `/customer/routine/confirm`

### 9.2 Effective date policy (predictable)
Global rule (recommended):
- Routine changes apply **next billing cycle start** (28-day boundary)

Implementation contract:
- `effective_at = next_billing_cycle_start_at`

### 9.3 Locking behavior
On confirm:
- create a new locked `routine_version`  
- snapshot critical fields for future stability:
  - fulfillment_mode  
  - duration minutes (if present)  
  - proof requirements counts and labels  
  - cadence + week pattern detail  
- set routine status:
  - `active` (with upcoming `effective_at`)  
- store acknowledgement:
  - “I understand what’s included and what proof is required.”

Success screen (premium):
- “You’re handled.”  
- “We’ll run this routine aligned to your Service Day and the timing rules shown.”  
- “You can edit anytime. Changes apply next cycle.”

---

## 10) Provider experience (light-touch, but future-ready)

Module 07 does not create jobs, but it should create confidence for providers later.

Provider-facing outcomes (minimal surface):
- Provider can view assigned zones and their weekly “shape” (counts), but not customer billing info.  
- Provider-facing UI is optional in Module 07, but data must enable later job generation:
  - routine items with cadence and proof snapshots  

---

## 11) Automations + AI assists (wow, but safe)

All assist features must be:
- explainable  
- template-based OR RAG-only from your own policy text  
- never invent guarantees or policies  
- user can accept/ignore easily  

Implement at least these 7:

### 11.1 One-tap recommended routine (explainable)
**Trigger:** “Build a recommended routine” button in `/customer/routine`  
**Data:** plan entitlements, property profile flags, zone popularity (if available)  
**Behavior:** proposes a conservative routine that fits entitlements exactly  
**Explain:** “Recommended because …” (template variables only)

### 11.2 Auto-fit to my plan
**Trigger:** routine is over entitlement  
**Behavior:** adjusts cadences downward to fit plan  
**Output:** diff summary:
- “Changed 3 items to every other week”
- “Moved 1 item to once per cycle”
**Guardrail:** never removes items without explicit user confirmation (unless user selects “remove extras”)

### 11.3 Biweekly pattern auto-pick (optimizer)
**Trigger:** user sets any SKU to biweekly  
**Behavior:** choose A/B using scoring described above  
**Explain:** short template “balanced routes + less drive time”

### 11.4 Drive-friendly suggestions (within rules)
**Trigger:** a single week shows unusually high geo spread proxy  
**Behavior:** suggest shifting `same_week_allowed` items to the other week (still within timing rules)  
**UI:** “Suggestion” chip with one-tap apply  
**Guardrail:** never shifts `same_day_preferred` items away from their service day

### 11.5 Confusion detector (help, not sales)
**Trigger:** user changes cadence on same SKU 3+ times in a short window  
**Action:** inline helper:
- “Want us to recommend the best cadence for your plan?”

### 11.6 Proof coach (text-only examples)
**Trigger:** Review step  
**Action:** small collapsible “Good proof looks like…” section:
- shows sample guidance based on photo labels (no images required)  
**Guardrail:** use SKU photo label variables only; no invented requirements

### 11.7 Gentle nudge (non-salesy)
**Trigger:** routine saved but not confirmed within 24h  
**Action:** in-app banner next login:
- “Your routine is ready to confirm.”
**Guardrail:** max once per week; dismissible; respect notification settings (later)

---

## 12) Admin/support surfaces (minimal)

### 12.1 Read-only routine view (support)
Route: `/admin/bundles` OR `/admin/subscriptions/:id` → Routine tab

Show:
- current plan + service day  
- routine status (draft/active) and effective date  
- latest locked version summary  
- week 1–4 preview summary  
- per-SKU cadence and proof expectations  

No editing by default (reduces accidental ops changes).  
(If you add admin edits, require audited overrides.)

### 12.2 Zone ops config
Route: `/admin/zones/:zoneId/ops`

Fields:
- provider home base label  
- provider home base lat/lng  
- target stops per week (advisory)  
- max stops per week (optional hard cap)  
- scoring weights (optional advanced; hide behind “Advanced”)

---

## 13) Data model (Supabase) — future-proof

### 13.1 New tables

#### A) `routines`
- `id` uuid pk  
- `customer_id` uuid not null  
- `property_id` uuid not null  
- `zone_id` uuid not null  
- `plan_id` uuid not null  
- `status` text not null default 'draft' (`draft` | `active`)  
- `effective_at` timestamptz null  
- `created_at` timestamptz default now()  
- `updated_at` timestamptz default now()  
Unique: `(property_id)`

#### B) `routine_versions`
- `id` uuid pk  
- `routine_id` uuid fk -> routines.id  
- `version_number` int not null  
- `status` text not null default 'draft' (`draft` | `locked`)  
- `effective_at` timestamptz not null  
- `created_at` timestamptz default now()  
Unique: `(routine_id, version_number)`

#### C) `routine_items`
- `id` uuid pk  
- `routine_version_id` uuid fk -> routine_versions.id  
- `sku_id` uuid fk -> service_skus.id  
- `cadence_type` text not null  
  (`weekly` | `biweekly` | `four_week` | `monthly` | `quarterly`)  
- `cadence_detail` jsonb not null default '{}'  
  - for biweekly: `{ "pattern": "A", "weeks": [1,3] }`  
- Snapshots:
  - `fulfillment_mode_snapshot` text not null  
  - `duration_minutes_snapshot` int null  
  - `proof_photos_required_snapshot` int null  
  - `proof_photo_labels_snapshot` text[] null  
  - `checklist_count_snapshot` int null  
- `created_at` timestamptz default now()  

#### D) `zone_ops_config`
- `zone_id` uuid pk fk -> zones.id  
- `provider_home_base_label` text null  
- `provider_home_base_lat` numeric null  
- `provider_home_base_lng` numeric null  
- `target_stops_per_week` int null  
- `max_stops_per_week` int null  
- `created_at` timestamptz default now()  
- `updated_at` timestamptz default now()  

### 13.2 Property geo fields (if missing)
Add to `properties`:
- `lat` numeric null  
- `lng` numeric null  
- `geohash` text null  

Fallback:
- if geo missing, optimizer uses stop-count-only and hides geo-based messaging.

---

## 14) Security + RLS

- Customers can read/write only their routines/versions/items  
- Admin can read all; write only to ops config by default  
- Provider has no access in Module 07 (future module can add safe views)

---

## 15) Business rules

- Confirmation blocked if routine demand > plan included service weeks.  
- No rollover.  
- Biweekly pattern chosen by optimizer; user can swap only A/B if feasible.  
- Review acknowledgement required before confirm.  
- Paused/archived SKU cannot be confirmed in a new locked version.

---

## 16) Edge cases

- Service Day not confirmed → redirect to Module 06  
- Plan downgraded → routine “Needs adjustment” next cycle; offer Auto-fit  
- SKU paused/archived after selection → require removal before confirm  
- Missing geo → stop-count-only optimization; hide “drive-friendly”  
- Offline → allow drafts; block confirm until online  

---

## 17) Acceptance tests

1) Customer builds routine and preview updates instantly.  
2) Biweekly cadence auto-picks A/B based on stop balance + distance proxy (if available).  
3) Swap pattern toggles only A↔B and may be blocked due to feasibility.  
4) Review shows scope + proof requirements per SKU.  
5) Confirm creates locked routine version effective next billing cycle start.  
6) Confirm blocked if over entitlement.  
7) Draft routine allowed without subscription; confirm blocked until subscribed.  
8) No calendar browsing exists.  
9) Missing geo falls back gracefully and hides geo messaging.  
10) Admin can view routine read-only (support) without exposing billing info to providers.

---

## 18) Definition of done

Module 07 delivers a premium routine builder that:
- makes customers feel in control through transparent previews and clear expectations  
- quietly optimizes biweekly patterns for ops reliability (stops + drive-time proxy)  
- produces versioned routine data ready for later job generation + provider execution  
- reduces confusion and support tickets via Review + guardrails  
