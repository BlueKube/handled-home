

# Module 13.4 — Viral Surfaces + Growth Event Bus

## Overview

Add the "automatic virality" layer on top of 13.1-13.3: shareable receipt cards, a growth event bus for funnel instrumentation, autopilot surface controls, and provider milestone share prompts. This module makes growth measurable and organic-first.

---

## Phase 1: Documentation

Create `docs/modules/13.4-viral-surfaces-and-growth-event-bus.md` from the uploaded spec.

Update `docs/modules/13-referrals-and-incentives.md` index to add the 13.4 row.

---

## Phase 2: Database Migration

### 2A. New table: `growth_events` (append-only event bus)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| created_at | timestamptz DEFAULT now() | |
| event_type | text NOT NULL | prompt_shown, share_initiated, share_completed, landing_viewed, etc. |
| actor_role | text NOT NULL | customer, provider, system, admin |
| actor_id | uuid NOT NULL | |
| zone_id | uuid nullable | |
| category | text nullable | |
| sku_id | uuid nullable | |
| cohort_id | uuid nullable | |
| source_surface | text NOT NULL | receipt_share_card, provider_milestone_share, cross_pollination_invite, etc. |
| context | jsonb DEFAULT '{}' | job_id, share_id, channel, variant, etc. |
| idempotency_key | text UNIQUE NOT NULL | deduplication |

Indexes: `(event_type, created_at DESC)`, `(actor_id)`, `(zone_id, category)`.

### 2B. New table: `share_cards`

Tracks individual shareable artifacts generated from completed jobs.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid NOT NULL FK jobs | |
| customer_id | uuid NOT NULL | |
| zone_id | uuid nullable | |
| category | text nullable | |
| share_code | text UNIQUE NOT NULL | short code for URL |
| hero_photo_path | text nullable | best after photo storage path |
| asset_mode | text DEFAULT 'after_only' | after_only or before_after |
| brand_mode | text DEFAULT 'minimal' | minimal or full |
| show_first_name | boolean DEFAULT false | |
| show_neighborhood | boolean DEFAULT false | |
| checklist_bullets | jsonb DEFAULT '[]' | 1-3 text items |
| expires_at | timestamptz NOT NULL | default now + 30 days |
| expiry_mode | text DEFAULT 'default_30d' | default_30d, user_permanent, hard_cap_12m |
| is_revoked | boolean DEFAULT false | |
| revoked_at | timestamptz nullable | |
| created_at | timestamptz DEFAULT now() | |

### 2C. New table: `growth_surface_config`

Per zone/category autopilot surface controls (linked to 13.3).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| zone_id | uuid NOT NULL | |
| category | text NOT NULL | |
| surface_weights | jsonb DEFAULT '{"receipt_share":1,"provider_share":1,"cross_pollination":0.5}' | |
| prompt_frequency_caps | jsonb DEFAULT '{"share_per_job":1,"reminder_per_week":1}' | |
| incentive_visibility | boolean DEFAULT false | |
| share_brand_default | text DEFAULT 'minimal' | |
| share_link_expiry_days | int DEFAULT 30 | |
| share_link_hard_cap_days | int DEFAULT 365 | |
| updated_at | timestamptz DEFAULT now() | |
| created_at | timestamptz DEFAULT now() | |

UNIQUE constraint on `(zone_id, category)`.

### 2D. RLS policies

- `growth_events`: users INSERT own events, admins FOR ALL, authenticated SELECT own
- `share_cards`: customers manage own (SELECT, INSERT, UPDATE for revoke), admins FOR ALL
- `growth_surface_config`: authenticated SELECT, admins FOR ALL

### 2E. RPC: `create_share_card`

SECURITY DEFINER. Called after job completion when customer taps "Share." Picks best photo (latest `job_photos` with `slot_key = 'after'` or last uploaded), generates short `share_code`, sets expiry, pulls 1-3 checklist bullet labels. Returns the share card. Checks: no open dispute on job (`customer_issues` with status != resolved).

### 2F. RPC: `revoke_share_card`

SECURITY DEFINER. Sets `is_revoked = true`, `revoked_at = now()`. Owner-only check.

### 2G. RPC: `record_growth_event`

SECURITY DEFINER. Inserts into `growth_events` with ON CONFLICT (idempotency_key) DO NOTHING. Returns the event or null if duplicate. Validates event_type against a known set.

---

## Phase 3: Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useShareCard` | `src/hooks/useShareCard.ts` | Create, fetch, revoke share cards for a job |
| `useGrowthEvents` | `src/hooks/useGrowthEvents.ts` | Record events (client-side wrapper for `record_growth_event` RPC) |
| `useGrowthSurfaceConfig` | `src/hooks/useGrowthSurfaceConfig.ts` | Admin: fetch/update surface configs per zone/category |

---

## Phase 4: Surface A -- Customer Receipt Share Card

### 4A. Share CTA on Visit Detail page

Add a "Share the after photo" button to `src/pages/customer/VisitDetail.tsx`:
- Only shown when job status is COMPLETED
- Hidden if an unresolved dispute exists for the job
- Tapping opens a sheet/modal with share card preview

### 4B. New component: `ShareCardSheet`

`src/components/customer/ShareCardSheet.tsx`

- Creates share card via `create_share_card` RPC (if not already created for this job)
- Shows hero after photo with "Handled" stamp overlay (CSS-based)
- Toggle: "Add before/after" (changes asset_mode)
- Toggle: "Show my first name" (off by default)
- Toggle: "Show neighborhood" (off by default)
- Share actions: Copy link, Native share (via `navigator.share` API)
- Each action emits a `share_initiated` / `share_completed` growth event
- "Disable shared link" revoke button

### 4C. Public share landing page

New route: `/share/:shareCode`
New page: `src/pages/ShareLanding.tsx`

- Public (no auth required)
- Fetches share card by `share_code` via a public RPC or anon-safe query
- Shows: full-width after photo, "Handled." + category + date, 1-3 checklist bullets
- Primary CTA: "Get Handled Home" -> app store or `/auth`
- Secondary CTA: "I'm a provider" -> `/provider/apply`
- If expired or revoked: "This share has expired."
- Emits `landing_viewed` growth event (server-side via RPC, using share_code as idempotency prefix)

---

## Phase 5: Surface B -- Provider Milestone/Payout Share Prompt

### 5A. Growth event on payout/bonus moments

Update `src/pages/provider/Referrals.tsx` (Growth Hub):
- When bonus summary shows new earned rewards, display a dismissible "Invite more customers" prompt card
- State-aware copy based on `market_zone_category_state`:
  - OPEN: "We're live -- invite customers now"
  - SOFT_LAUNCH: "Limited early spots available"
  - WAITLIST/CLOSED: "Launching soon -- build your waitlist"
- One-tap link to `/provider/referrals/invite-customers`
- Emit `prompt_shown` growth event on render

### 5B. Update InviteCustomers page

- Emit `share_initiated` and `share_completed` events when link is copied or scripts are used

---

## Phase 6: Surface C -- Cross-Pollination (Customer)

### 6A. "Invite your other pro" prompt

New component: `src/components/customer/CrossPollinationCard.tsx`

- Shown on customer dashboard after first completed visit or active subscription
- Lists other categories not yet subscribed (e.g., "Have a pool cleaner? Invite them to Handled Home")
- Tap generates a pre-filled SMS text with invite link
- Emits `prompt_shown` + `share_initiated` events
- Respects `growth_surface_config` weights (hidden if weight = 0)

### 6B. Add to customer dashboard

Add `CrossPollinationCard` to `src/pages/customer/Dashboard.tsx` conditionally.

---

## Phase 7: Admin Surface Controls

### 7A. Add "Surfaces" tab to Admin Growth Console

Extend `src/pages/admin/Growth.tsx` with a 4th tab: **Surfaces**

- Per zone/category config editor:
  - Surface weights (receipt_share, provider_share, cross_pollination) -- sliders 0-1
  - Prompt frequency caps
  - Incentive visibility toggle
  - Brand default (minimal/full)
  - Link expiry defaults
- Save updates to `growth_surface_config`

### 7B. Growth events analytics view

Add a simple "Events" sub-section in the Actions tab or as a 5th tab:
- Event counts by type, surface, and time period
- Conversion funnel: prompt_shown -> share_initiated -> share_completed -> landing_viewed -> signup_completed

---

## Phase 8: Fraud Controls

### 8A. Share card dispute check

The `create_share_card` RPC will refuse to create a card if the job has an unresolved `customer_issues` record. The UI also hides the share button in this case.

### 8B. Rate limiting via config

`growth_surface_config.prompt_frequency_caps` enforced client-side (check last event timestamps before showing prompts). Server-side idempotency prevents duplicate event recording.

---

## Technical Details

### Migration SQL structure

```text
1. Create growth_events table with idempotency_key UNIQUE
2. Create share_cards table with share_code UNIQUE
3. Create growth_surface_config table with UNIQUE(zone_id, category)
4. Enable RLS on all 3 tables
5. Create RLS policies
6. Create create_share_card RPC (SECURITY DEFINER)
7. Create revoke_share_card RPC (SECURITY DEFINER)
8. Create record_growth_event RPC (SECURITY DEFINER)
9. Indexes on growth_events, share_cards
```

### Files created/modified

| File | Action |
|------|--------|
| `docs/modules/13.4-viral-surfaces-and-growth-event-bus.md` | Create (from upload) |
| `docs/modules/13-referrals-and-incentives.md` | Update (add 13.4 row) |
| Migration SQL | Create (3 tables, RLS, 3 RPCs) |
| `src/hooks/useShareCard.ts` | Create |
| `src/hooks/useGrowthEvents.ts` | Create |
| `src/hooks/useGrowthSurfaceConfig.ts` | Create |
| `src/components/customer/ShareCardSheet.tsx` | Create |
| `src/components/customer/CrossPollinationCard.tsx` | Create |
| `src/pages/ShareLanding.tsx` | Create (public route) |
| `src/pages/customer/VisitDetail.tsx` | Add share CTA button |
| `src/pages/customer/Dashboard.tsx` | Add cross-pollination card |
| `src/pages/provider/Referrals.tsx` | Add milestone share prompt |
| `src/pages/provider/InviteCustomers.tsx` | Add growth event emissions |
| `src/pages/admin/Growth.tsx` | Add Surfaces tab |
| `src/App.tsx` | Add `/share/:shareCode` route |

### Key design decisions

- Growth events are append-only with idempotency_key UNIQUE -- safe for retries and offline sync
- Share cards are owned by customers; providers cannot share customer cards (spec section 7)
- Default share is after-only with minimal branding -- organic-first posture
- Share landing page is a public route inside the app (not a separate site per spec section 2.1, since we're in a single Vite app; the page is lightweight and loads fast)
- Expiry/revocation enforced at query time (WHERE expires_at > now() AND is_revoked = false)
- Photo for share card uses signed URL generated on demand (respects revocation)
- Surface weights and caps are advisory/client-enforced; the config table provides the data
- No external QR or image generation libraries; share card uses CSS overlay for "Handled" stamp

