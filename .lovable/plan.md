

# Module 07: Routine & Bundle Builder — Implementation Plan

## What We're Building

A premium 3-step routine builder that lets customers choose **what** services they want, **how often** they happen, and **preview exactly what each week looks like** — then lock it in with confidence. This replaces the current simple quantity-based routine page with a polished, entitlement-aware experience.

---

## What Changes for the Customer

**Step 1 — Build Routine** (`/customer/routine`)
- A sticky "Truth Banner" showing plan name, service weeks, Service Day, and billing cycle at a glance
- A live 4-week preview timeline (Week 1 through Week 4) that updates instantly as services are added
- "Add services" button opens a bottom sheet with search, categories, and SKU detail modals showing what's included, what's not, and how completion is proven
- Cadence picker per service: weekly, every other week, every 4 weeks, or independent (monthly/quarterly when allowed)
- Biweekly items auto-pick Weeks 1&3 or 2&4 for operational efficiency, with a "Swap pattern" toggle
- Entitlement guardrails: if the routine exceeds plan limits, a calm warning appears with "Auto-fit to plan", "Adjust cadences", or "Change plan" options

**Step 2 — Review** (`/customer/routine/review`)
- Per-service cards showing scope (included/not included), proof expectations (photos/checklists), and timing
- Entitlement fit indicator (green = fits, red = blocked)
- A proof coach section explaining what good proof looks like

**Step 3 — Confirm** (`/customer/routine/confirm`)
- Subscription gate (redirects to plans if not subscribed)
- Shows effective date (next billing cycle start)
- Locks a versioned routine snapshot
- Premium success screen: "You're handled."

**Smart Assists (7 automations)**
1. One-tap recommended routine
2. Auto-fit to plan (adjusts cadences to fit entitlement)
3. Biweekly pattern auto-pick (A/B optimizer based on zone stop balance)
4. Drive-friendly suggestions (shift same-week items for geo efficiency)
5. Confusion detector (if user changes cadence 3+ times, offer help)
6. Proof coach (collapsible guidance in review step)
7. Gentle nudge banner (if draft not confirmed within 24h)

---

## What Changes for Admins

**Read-only routine view** (tab inside existing subscription detail or standalone `/admin/bundles`)
- Current plan, service day, routine status, effective date
- Latest locked version summary with week 1-4 preview
- Per-SKU cadence and proof expectations

**Zone ops config** (`/admin/zones/:zoneId/ops` — or panel inside zone detail)
- Provider home base label + lat/lng
- Target stops per week (advisory)
- Max stops per week (optional hard cap)

---

## Technical Plan

### Phase 1: Database (single migration)

**New tables:**

A) `routines` — one per property, status draft/active, effective_at, links to customer/property/zone/plan

B) `routine_versions` — versioned snapshots, version_number, status draft/locked, effective_at

C) `routine_items` — per version, links to SKU, stores cadence_type (weekly/biweekly/four_week/monthly/quarterly), cadence_detail JSONB (biweekly pattern A/B + weeks), plus snapshot fields: fulfillment_mode, duration_minutes, proof photo labels/counts, checklist count

D) `zone_ops_config` — zone_id PK, provider home base lat/lng/label, target/max stops per week

**Schema additions:**
- Add `lat`, `lng`, `geohash` columns to `properties` (nullable, for geo-based optimization)

**RLS policies:**
- Customers: read/write own routines/versions/items
- Admin: read all routines; write zone_ops_config
- Provider: no access in Module 07

**Database RPCs:**
1. `confirm_routine(p_routine_id uuid)` — atomic: creates locked routine_version with snapshots from current SKU data, sets effective_at = next billing cycle start, validates entitlement fit, blocks if over-limit
2. `compute_biweekly_pattern(p_zone_id uuid, p_property_id uuid)` — returns recommended pattern (A or B) based on zone stop counts and optional geo proximity

**Triggers:**
- `updated_at` auto-update on routines, zone_ops_config

### Phase 2: React Hooks (data layer)

1. `useRoutine(propertyId)` — fetches/creates routine for property, current version, items
2. `useRoutineActions()` — addItem, removeItem, updateCadence, swapPattern, autoFit, confirmRoutine (calls RPC)
3. `useRoutinePreview(items)` — computes 4-week preview from items + cadences, service week demand count
4. `useBiweeklyOptimizer(zoneId, propertyId)` — calls RPC or client-side scoring for A/B recommendation
5. `useZoneOpsConfig(zoneId)` — admin CRUD for zone ops config

### Phase 3: Customer UI — Step 1 (Build)

**Rewrite `src/pages/customer/Routine.tsx`** from scratch:
- Replace current quantity-based UI with the full 3-step flow
- Truth Banner component (sticky, shows plan/service weeks/service day/billing cycle)
- 4-week preview timeline (collapsible week cards)
- "Add services" floating button opening bottom sheet
- SKU detail modal (inclusions/exclusions/proof/timing — reuses existing `SkuDetailView` pattern)
- Cadence picker (inline after adding)
- Entitlement guardrails panel (warning + 3 fix actions)
- Items already in routine shown as editable cards with cadence/pattern controls

**New components:**
- `TruthBanner.tsx` — sticky context bar
- `WeekPreviewTimeline.tsx` — 4 week cards with expandable service lists
- `AddServicesSheet.tsx` — bottom sheet with search/categories/SKU rows
- `SkuDetailModal.tsx` — confidence-building detail view with "Add to routine" CTA
- `CadencePicker.tsx` — cadence selection with instant preview update
- `EntitlementGuardrails.tsx` — over-limit warning + fix actions
- `RoutineItemCard.tsx` — editable item in routine list
- `BiweeklyPatternToggle.tsx` — A/B swap with feasibility check

### Phase 4: Customer UI — Step 2 (Review) + Step 3 (Confirm)

**New pages:**
- `src/pages/customer/RoutineReview.tsx` — scope + proof review cards, entitlement fit indicator, proof coach
- `src/pages/customer/RoutineConfirm.tsx` — subscription gate, effective date display, confirm button, success screen

**New components:**
- `ReviewServiceCard.tsx` — per-SKU review card (included/excluded/proof/timing)
- `ProofCoach.tsx` — collapsible guidance section
- `RoutineSuccessScreen.tsx` — premium "You're handled" confirmation

### Phase 5: Smart Assists

- Recommended routine generator (template-based, fills entitlement exactly)
- Auto-fit algorithm (reduces cadences to fit plan)
- Confusion detector (track cadence change count per SKU)
- Drive-friendly suggestion chip (compare geo spread between weeks)
- Gentle nudge banner on dashboard (if draft exists, not confirmed in 24h)

### Phase 6: Admin UI

- `src/pages/admin/Bundles.tsx` — read-only routine viewer (list + detail)
- `ZoneOpsConfigPanel.tsx` — home base + stops config inside zone detail
- Add "Bundles" to admin More menu
- Add routes to App.tsx

### Phase 7: Routing + Navigation

**New routes:**
- `/customer/routine` (rewritten)
- `/customer/routine/review`
- `/customer/routine/confirm`
- `/admin/bundles`

**Navigation updates:**
- Bottom tab bar "Routine" already points to `/customer/routine` — no change needed
- Admin More menu: add "Bundles" entry

**Gating:**
- Step 1 (Build): requires property (CustomerPropertyGate) + confirmed Service Day (redirect to Module 06 if not confirmed)
- Step 2 (Review): requires non-empty routine + entitlement fit
- Step 3 (Confirm): requires active subscription (SubscriptionGate)

---

## Implementation Order

```text
Phase 1 (DB)  -->  Phase 2 (Hooks)  -->  Phase 3 (Build UI)
                                              |
                                         Phase 4 (Review + Confirm)
                                              |
                                         Phase 5 (Smart Assists)
                                              |
                                         Phase 6 (Admin)
                                              |
                                         Phase 7 (Routing)
```

Due to message size, this will be implemented across multiple steps. We'll start with Phase 1 (database) + Phase 2 (hooks), then build the customer UI progressively, then admin.

---

## Files Summary

**New files (~20):**
- `src/pages/customer/RoutineReview.tsx`
- `src/pages/customer/RoutineConfirm.tsx`
- `src/pages/admin/Bundles.tsx`
- `src/hooks/useRoutine.ts`
- `src/hooks/useRoutineActions.ts`
- `src/hooks/useRoutinePreview.ts`
- `src/hooks/useBiweeklyOptimizer.ts`
- `src/hooks/useZoneOpsConfig.ts`
- `src/components/routine/TruthBanner.tsx`
- `src/components/routine/WeekPreviewTimeline.tsx`
- `src/components/routine/AddServicesSheet.tsx`
- `src/components/routine/SkuDetailModal.tsx`
- `src/components/routine/CadencePicker.tsx`
- `src/components/routine/EntitlementGuardrails.tsx`
- `src/components/routine/RoutineItemCard.tsx`
- `src/components/routine/BiweeklyPatternToggle.tsx`
- `src/components/routine/ReviewServiceCard.tsx`
- `src/components/routine/ProofCoach.tsx`
- `src/components/routine/RoutineSuccessScreen.tsx`
- `src/components/admin/ZoneOpsConfigPanel.tsx`

**Modified files:**
- `src/pages/customer/Routine.tsx` (full rewrite)
- `src/App.tsx` (add routes)
- `src/components/MoreMenu.tsx` (add Bundles to admin)
- `src/pages/customer/Dashboard.tsx` (gentle nudge banner)

**Documentation:**
- Replace `docs/modules/07-bundle-builder.md` with uploaded spec

