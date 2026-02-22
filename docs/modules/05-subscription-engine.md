# 05-subscription-engine.md  
**Handled Home — Module 05 PRD (Subscription Engine + Soft Onboarding)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized but operationally usable  
**Primary Admin Routes:** `/admin/plans` and `/admin/subscriptions`  
**Primary Customer Routes:** `/plans`, `/plans/:planId`, `/routine`, `/subscribe`, `/account/subscription`  
**Last updated:** 2026-02-21  

---

## 0) Why this module exists

Handled Home is **not on-demand**. The business depends on:
- predictable routines  
- standardized services (Module 04 SKUs)  
- zone-based density + operational control (Module 03)  
- recurring revenue with low support overhead  

**Module 05 converts “curious users” into “committed subscribers”** by building confidence:
- what’s included  
- what will happen next  
- what to expect monthly  
- what’s available in *their* zone  
- how changes work (**effective next cycle**, not chaos)  

Core promise: **“Your home is handled.”**

---

## 1) Core outcomes (Definition of Done)

### 1.1 Customer outcomes (premium + confidence)
1) Browse plans **before** subscribing (soft onboarding).  
2) Preview plan coverage for **their property + zone** (personalized).  
3) Build a **Draft Routine** (mock monthly bundle) with **no operational obligation**.  
4) Always see honest boundaries:
   - included  
   - extra  
   - not available in zone  
   - provider-only vs self-serve  
5) Subscribe with minimal friction + clear next steps.  
6) Change plans predictably (default **effective next cycle**).  
7) Cancel now; design pause now (implement later).

### 1.2 Business outcomes (cash flow + low support)
1) Entitlements live in **Handled Home (Supabase)**, not trapped in Stripe config.  
2) Plans are **zone-toggleable**.  
3) All enforcement goes through a single **entitlement-resolution layer**.  
4) Admin can iterate plans quickly without app updates.  
5) Paywall appears at the **moment of obligation**, not first contact.

---

## 2) Scope

### 2.1 Must implement
A) **Plan + Entitlements (internal source of truth)**  
- Plan lifecycle (draft/active/hidden/retired)  
- Zone availability toggles (on/off per zone)  
- Entitlements rules (what can be selected per cycle)  
- Stripe mapping fields (price/product ids), but entitlements are **not** Stripe-derived  

B) **Customer soft-onboarding mode**
- Browse plans, preview SKUs in plan context  
- Build + save **Draft Routine**  
- Clearly label included/extra/blocked  
- **Hard rule:** No operational obligation until subscription is active  

C) **Subscription checkout + state machine**
- Subscribe via Stripe (or Stripe-ready stub if Stripe not fully wired)  
- Record subscription state: `trialing?`, `active`, `past_due`, `canceled`, `incomplete`  
- Premium “Fix Payment” flow  
- Webhook reconciliation (if Stripe implemented)  
- Subscription status updates app gating for future modules  

D) **Admin console**
- Plan builder (create/edit plans, entitlements, zone toggles)  
- Subscription list + view detail  
- Minimal guarded override (with audit log)  

E) **Entitlement resolution layer**
A single function/service used everywhere:
`resolve_entitlements(customer_id, property_id, zone_id, plan_id, entitlement_version) -> payload`

Used by:
- `/plans` and `/plans/:planId`  
- `/routine` (draft routine)  
- `/subscribe` confirmation  
- future modules (bundles/scheduling/execution)  

### 2.2 Non-goals (do NOT implement)
- No scheduling, service-day generation, route optimization, dispatch, job execution  
- No provider payout logic  
- No multi-property management  
- No complex proration (default: next cycle)  
- No deep analytics dashboards (basic logging only)

---

## 3) Glossary (shared language)

### Plan
A productized subscription offering. Plans define **entitlements**, not just price.

### Routine
A customer’s recurring set of services they *intend* to run monthly/weekly.  
In Module 05, routine is **draftable** before subscription and **activatable** after.

### Entitlements
Rules that define what a customer may select per cycle:
- included SKUs / groups  
- add-on SKUs  
- limits/caps (counts, credits, minutes, “slots”)  
- zone blocks + reasons  

### “Moment of obligation”
The first time a user action would create operational work:
- activating a plan  
- locking a routine  
- entering modules that assume active subscription  

Paywall only appears here.

---

## 4) Premium UX principles (non-negotiable)

- Concierge-level clarity: always show “what happens next”  
- Predictability over novelty: **changes apply next cycle** by default  
- Calm interface: 2–3 plans max, strong recommendation  
- Trust markers: boundaries are explicit (“included”, “extra”, “not in your zone”)  
- No spammy urgency patterns  

---

## 5) Customer experience spec (soft onboarding)

### 5.0 Entry conditions
- Authenticated (Module 01)  
- Property profile completed (Module 02 gating)  
- Zone coverage known (Module 03 matching)  

If property zip is not covered:
- Customer can still browse plans (optional), but show “Not yet in your area” and guide to waitlist (future).  
- Draft routine is allowed, but subscribe CTA is disabled with reason.

---

### 5.1 Plans (preview mode)
Route: `/plans`

#### Content
- Top: **Recommended for your home** (1–2 plans)
- Below: up to **2–3 total plans** displayed (avoid choice overload)

Each plan card includes:
- Plan name + short promise line  
- “Best for…” (plain-English)  
- Top 3–5 included highlights (bullets)  
- “Extras you can add” examples (2–3 SKUs)  
- Zone availability label:
  - “Available in your zone”  
  - or “Not available in your zone (reason)”  
- CTAs:
  - Primary: “Preview plan” → `/plans/:planId`  
  - Secondary: “Build a routine” → `/routine?plan=...`

#### Recommendation logic (deterministic first, AI-enhanced optional)
- If zone has only 1 active plan enabled → recommend it  
- Else use simple rules (property flags like yard/pets/pool if present)  
- Explain recommendation in 1 sentence: “Recommended because …”

---

### 5.2 Plan detail (what’s included)
Route: `/plans/:planId`

#### Content blocks (scan-friendly)
- Header: plan name + “Recommended for your home” badge (if true)  
- “What you get”:
  - Included categories / SKU groups  
  - Key limits (e.g., “Up to 8 service credits/month”)  
- “What’s extra”:
  - Add-on SKUs list (or “available as extras”)  
- “What’s not available”:
  - SKUs blocked by zone or plan rules, with reasons  
- “How changes work”:
  - “Plan changes apply next cycle by default.”  
- CTA row:
  - “Build routine with this plan” → `/routine?plan=...`  
  - “Subscribe” → `/subscribe?plan=...` (allowed only if zone covered + plan enabled)

---

### 5.3 Build your routine (Draft Routine)
Route: `/routine`

#### Purpose
Let users “try the program on” before paying.

#### Required behaviors
- User can select plan context:
  - default: recommended plan  
  - allow switching among available plans (max 3)
- User browses SKUs with plan context:
  - show **Included / Extra / Not available** on each SKU
  - show caps/limits in a sticky summary header
- User can add/remove SKUs to a draft monthly bundle  
- User can save draft routine (persisted)  
- **No operational obligation** until subscription is active

#### UI sections
A) **Routine header**
- “Your routine (Draft)”  
- Plan selector (dropdown / segmented)  
- Sticky summary:
  - “Included used: 5/8 credits” (or equivalent)  
  - “Extras: 2”  
  - “Blocked: 1” (tappable list)  

B) **Catalog list (plan-aware)**
- Use Module 04 SKUs, filtered:
  - only `active` SKUs shown by default  
  - show “Not available in your zone” (disabled) when blocked  
- Each SKU row shows:
  - name, short description  
  - included/extra badge  
  - “Provider-only” badge if flagged by entitlement rule  
  - optional “Proof required” icon (photos/checklist exists) as FYI  

C) **Draft routine drawer (bottom sheet)**
- Shows selected SKUs grouped:
  - Included  
  - Extras  
- Each item has remove button  
- “Why is this extra?” link opens entitlement explanation snippet  

D) **CTAs**
- Primary: “Activate plan” (subscribe)  
- Secondary: “Save draft routine”  
- If not covered zone or plan disabled:
  - Primary disabled + reason (no dead ends)

#### Entitlement enforcement on draft
Draft routine must be constrained by entitlements:
- If plan uses “credits”, enforce max credits  
- If plan uses “counts”, enforce max count  
- If plan uses “minutes”, enforce max minutes  
- When user exceeds included cap:
  - Items added are marked **Extra**  
  - If plan disallows extras: prevent adding and explain why  
- If SKU blocked (zone or plan):
  - disable “Add” and show reason  

---

### 5.4 Subscribe flow
Route: `/subscribe`

#### Steps (minimal)
1) Confirm plan  
2) Confirm billing  
3) Subscribe

#### Requirements
- Show plan summary + what happens next:
  - “You’re joining Handled Home.”  
  - “Your routine stays draft until scheduling starts in Module 06.” (or similar)  
- Payment method collection via Stripe:
  - Stripe Checkout (webview) OR PaymentSheet  
  - pick one and use consistently  
- On success:
  - Create internal subscription record  
  - Mark customer `subscription_status = active`  
  - Show success screen:
    - “You’re in. Here’s what happens next.”
    - “Next: finalize your routine and continue setup.”

---

### 5.5 Subscription management
Route: `/account/subscription`

#### Content
- Current plan + status pill  
- Renewal date (if available)  
- Plan features summary  
- Buttons:
  - “Change plan” (effective next cycle)
  - “Cancel subscription”
  - “Fix payment” (only if `past_due`)

#### Change plan rules (default next cycle)
- Customer selects new plan → shows:
  - “Effective on: {next_cycle_start}”
  - “Your routine will be re-evaluated under new entitlements.”
- System stores a pending change:
  - `pending_plan_id`
  - `effective_at` date

#### Cancel rules (implement now)
- Confirmation screen:
  - “You’ll keep access until {period_end}.” (if known)
  - Optional reason capture (1–2 taps)
- State becomes `canceled` or `canceling` (see state machine)
- Gating updates when subscription is no longer active

#### Fix payment (premium)
- If `past_due`:
  - Show calm message: “Your payment didn’t go through. Update it to keep your home handled.”
  - CTA launches Stripe update payment method flow
  - On success: state returns to `active`

---

## 6) Gating & app behavior changes (important)

### 6.1 New gating rule: subscription required for obligation modules
Rules:
- Browsing `/plans`, `/plans/:id`, `/routine` is allowed without subscription  
- Actions that create obligation require active subscription:
  - “Activate plan”  
  - any route flagged as `requiresActiveSubscription` (future modules)

### 6.2 Suggested gating implementation
Extend existing route protection (Module 01/02 patterns):
- `requiresAuth`
- `requiresProperty`
- `requiresActiveSubscription`

If customer lacks active subscription and visits a protected route:
- redirect to `/plans` with context banner:
  - “Choose a plan to continue.”

---

## 7) Admin experience spec

### 7.1 Plan builder
Route: `/admin/plans`

#### Plan list
- Scannable rows:
  - Plan name
  - Status
  - Zones enabled count (e.g., “3 zones”)
  - Entitlement version (e.g., “v2”)
  - Updated date
- Actions:
  - New plan
  - Edit
  - Duplicate
  - Retire (soft)

#### Create/edit plan form
Sections:

A) Basics
- Name (required)
- Short marketing line (required)
- Status: `draft` | `active` | `hidden` | `retired`

B) Zone availability
- Multi-select zones with toggle:
  - Enabled / Disabled
- Quick actions:
  - “Enable all active zones”
  - “Disable all”

C) Entitlements (structured, versioned)
- Choose entitlement model (one for MVP):
  - **Credits per cycle** (recommended for flexibility)
  - or Count-per-cycle
  - or Minutes-per-cycle
- Define:
  - `included_credits_per_cycle` (e.g., 8)
  - `extra_allowed` boolean
  - `max_extra_credits_per_cycle` (optional)
- Define **SKU rules**
  - Included SKUs (picklist)
  - Allowed as extras (picklist)
  - Blocked SKUs (picklist + reason)
  - Provider-only SKUs (picklist or rule)
- Copy preview:
  - “Included” summary sentence
  - “Extras” summary sentence

D) Billing mapping (Stripe fields)
- Stripe product_id (optional)
- Stripe price_id (optional)
- Display price (string) for UI (e.g., “$249/mo”)  
  - This is display text; Stripe price is the payment rail.

E) Publishing workflow
- Draft → Active requires:
  - at least 1 zone enabled  
  - entitlement rules valid  
  - Stripe mapping present OR billing mode flagged as “Manual/Stub”

#### Admin safety
- Any change to entitlements requires:
  - “Create new entitlement version?” prompt
  - Default: **create new version**, do not mutate existing version used by active subscribers
- If admin insists on editing existing version:
  - require typed confirmation: “EDIT LIVE ENTITLEMENTS”
  - log audit event

---

### 7.2 Subscriptions admin
Route: `/admin/subscriptions`

#### List view
Search by:
- customer name/email
- plan name
- status

Columns:
- Customer
- Plan
- Zone
- Status
- Start date
- Renewal date
- Payment state (ok/past_due)
- Actions: View

#### Detail view (read-only by default)
- Customer profile summary
- Property + zone
- Plan + entitlement version
- Stripe ids (if present)
- Status timeline (from events)
- Guarded admin actions (optional, minimal):
  - “Mark as comped / manual active”
  - “Force cancel”
All admin actions:
- require reason
- write audit log

---

## 8) Data model (Supabase)

> Design goals:
> - Entitlements live in your DB  
> - Plan edits don’t break existing customers  
> - Zone toggles are fast and explicit  
> - Customer draft routine is persisted before paying  

### 8.1 Tables

#### 1) `plans`
- `id` uuid pk
- `name` text not null
- `tagline` text not null
- `status` text not null default 'draft'  
  allowed: `draft`, `active`, `hidden`, `retired`
- `display_price_text` text null  (e.g., “$249/mo”)
- `recommended_rank` int null  (lower = more recommended)
- `current_entitlement_version_id` uuid null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

#### 2) `plan_zone_availability`
- `id` uuid pk
- `plan_id` uuid fk -> plans.id
- `zone_id` uuid fk -> zones.id
- `is_enabled` boolean not null default false
- `created_at` timestamptz default now()
Unique: `(plan_id, zone_id)`

#### 3) `plan_entitlement_versions`
- `id` uuid pk
- `plan_id` uuid fk -> plans.id
- `version` int not null
- `status` text not null default 'draft'  
  allowed: `draft`, `published`, `retired`
- `model_type` text not null  
  allowed: `credits_per_cycle`, `count_per_cycle`, `minutes_per_cycle`
- `included_credits` int null
- `included_count` int null
- `included_minutes` int null
- `extra_allowed` boolean not null default true
- `max_extra_credits` int null
- `max_extra_count` int null
- `max_extra_minutes` int null
- `created_at` timestamptz default now()

#### 4) `plan_entitlement_sku_rules`
- `id` uuid pk
- `entitlement_version_id` uuid fk -> plan_entitlement_versions.id
- `sku_id` uuid fk -> service_skus.id
- `rule_type` text not null  
  allowed: `included`, `extra_allowed`, `blocked`, `provider_only`
- `reason` text null
Unique: `(entitlement_version_id, sku_id, rule_type)`

#### 5) `customer_plan_selections`
- `id` uuid pk
- `customer_id` uuid not null
- `property_id` uuid not null
- `zone_id` uuid null
- `selected_plan_id` uuid not null
- `entitlement_version_id` uuid not null
- `status` text not null default 'draft'  
  allowed: `draft`, `locked`
- `draft_routine` jsonb not null default '[]'
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
Unique: `(customer_id, property_id)`

Draft routine item:
```json
{
  "sku_id": "uuid",
  "quantity": 1,
  "notes": null
}
```

#### 6) `subscriptions`
- `id` uuid pk
- `customer_id` uuid not null
- `property_id` uuid not null
- `zone_id` uuid null
- `plan_id` uuid not null
- `entitlement_version_id` uuid not null
- `status` text not null  
  allowed: `trialing`, `active`, `past_due`, `incomplete`, `canceling`, `canceled`
- `current_period_start` timestamptz null
- `current_period_end` timestamptz null
- `cancel_at_period_end` boolean not null default false
- `pending_plan_id` uuid null
- `pending_effective_at` timestamptz null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

#### 7) `stripe_mappings` (optional)
- `id` uuid pk
- `entity_type` text not null
- `entity_id` uuid not null
- `stripe_product_id` text null
- `stripe_price_id` text null
- `stripe_customer_id` text null
- `stripe_subscription_id` text null
- `created_at` timestamptz default now()
Unique: `(entity_type, entity_id)`

#### 8) `admin_audit_log`
- `id` uuid pk
- `admin_user_id` uuid not null
- `action` text not null
- `entity_type` text not null
- `entity_id` uuid not null
- `before` jsonb null
- `after` jsonb null
- `reason` text null
- `created_at` timestamptz default now()

#### 9) `subscription_events`
- `id` uuid pk
- `subscription_id` uuid fk -> subscriptions.id
- `source` text not null
- `event_type` text not null
- `payload` jsonb not null
- `created_at` timestamptz default now()

---

## 9) Entitlement resolution (critical)

### 9.1 Inputs
- `customer_id`
- `property_id`
- `zone_id` (optional; computed if missing)
- `plan_id`
- `entitlement_version_id` (optional)

### 9.2 Resolution rules (deterministic)
1) Compute zone from property zip (Module 03 logic).  
2) If no zone:
   - mark `zone.is_covered = false` and block subscription activation  
3) Check plan-zone availability:
   - if disabled: `zone.plan_enabled = false` with reason  
4) Load entitlement version:
   - provided OR plan.current_entitlement_version_id  
5) Load all SKU rules for the entitlement version.  
6) For each active SKU (Module 04):
   - if not covered or plan disabled → `blocked`
   - else apply rules with precedence:
     - `blocked` > `included` > `extra_allowed`
   - apply `provider_only` as a tag (not a classifier)

### 9.3 Output (stable payload)
```json
{
  "plan": {
    "plan_id": "uuid",
    "entitlement_version_id": "uuid",
    "model_type": "credits_per_cycle",
    "included": { "credits": 8, "count": null, "minutes": null },
    "extras": { "allowed": true, "max_credits": 4 }
  },
  "zone": {
    "zone_id": "uuid",
    "is_covered": true,
    "plan_enabled": true,
    "blocks": []
  },
  "skus": [
    {
      "sku_id": "uuid",
      "status": "included",
      "provider_only": false,
      "reason": null,
      "ui_badge": "Included",
      "ui_explainer": "Included in your plan"
    }
  ],
  "messages": {
    "included_explainer": "These services are included each cycle.",
    "extra_explainer": "Extras are available if you want more coverage.",
    "change_policy": "Plan changes apply next cycle."
  }
}
```

---

## 10) Stripe / billing integration (Stripe is the rail, not the brain)

### 10.1 Approach
Preferred: **Stripe Checkout in webview** (fastest, reliable for hybrid apps).

### 10.2 Webhooks (if enabled)
- `checkout.session.completed`
- `customer.subscription.created/updated/deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

Webhook handler:
- Upsert subscription status + period dates into `subscriptions`
- Write `subscription_events`
- Never compute entitlements from Stripe

### 10.3 Payment failure UX
- `incomplete` → “Finish setup”
- `past_due` → “Fix payment” (update payment method)
- `canceled/canceling` → clear end date messaging

---

## 11) AI + automations (practical “wow”)

All features must be:
- explainable  
- optional (admin toggle)  
- template-guardrailed  

1) **Plan recommender (explainable)**  
- Trigger: `/plans` load  
- Data: property flags + zone availability  
- Output: recommended plan + one sentence “Because …”  

2) **Routine auto-builder**  
- Trigger: “Build my routine” button  
- Data: entitlements + common SKUs  
- Guardrail: never exceeds included cap; never adds blocked SKUs  

3) **Confidence microcopy generator (templated)**  
- Trigger: plan detail + subscribe success  
- Data: plan limits + next-cycle rule  
- Guardrail: approved templates only  

4) **Subscription FAQ concierge (strict RAG)**  
- Trigger: “Questions?”  
- Data: policy snippets only  
- Guardrail: refuse/hand-off if uncertain  

5) **Churn early-warning nudge**  
- Trigger: repeated routine edits without subscribing OR repeated zone blocks  
- Tone: helpful, not salesy  
- Admin control: thresholds and on/off  

---

## 12) Security + compliance

- Customers can only access their own drafts/subscriptions  
- Admin routes gated by role (Module 01)  
- Providers cannot access billing tables  
- Admin audit logs required for plan edits and overrides  

---

## 13) Acceptance tests (explicit)

1) Customer can browse `/plans` without subscription.  
2) Customer can build and save draft routine on `/routine` without subscription.  
3) Paywall appears only on “Activate plan” or subscription-gated routes.  
4) Plan disabled in zone shows unavailable label + disables subscribe.  
5) Subscribe success sets subscription `active` and gating updates.  
6) Past due shows “Fix payment” and restores on success.  
7) Cancel updates state and gating correctly.  
8) Admin creates plan + entitlements + zone toggles successfully.  
9) Admin changes entitlements by creating new version; existing subscribers remain pinned (no breaking).

---

## 14) Implementation notes for Lovable

### Routes
Customer:
- `/plans`
- `/plans/:planId`
- `/routine`
- `/subscribe`
- `/account/subscription`

Admin:
- `/admin/plans`
- `/admin/subscriptions`

### Reusable components
- PlanCard
- EntitlementBadge (Included/Extra/Blocked)
- RoutineSummaryBar (caps + usage)
- FixPaymentPanel
- SubscriptionStatusPanel

### Migrations
- Create tables listed in Section 8
- Add indexes:
  - `plan_zone_availability(plan_id, zone_id)`
  - `customer_plan_selections(customer_id, property_id)`
  - `subscriptions(customer_id, status)`
- Add RLS policies from Section 9

### Seed data (dev)
- 2–3 plans (Essential/Standard/Premium)
- 1 published entitlement version each
- enable in at least 1 active zone
- include a few Module 04 SKUs in included/extra/block rules

---

## 15) Definition of done

- Customers can confidently browse plans and build a draft routine without paying.  
- Subscribe flow creates a real subscription record with a robust state machine.  
- Admin can create/edit plans, entitlements, and zone availability safely.  
- Entitlement logic is centralized, deterministic, and reusable for Modules 06+.  
