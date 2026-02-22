

# Module 13.2 — Founding Partner + Provider Self-Serve Growth Hub

## Overview

Transform the existing thin `/provider/referrals` page into a full **Growth Hub** with Founding Partner status, invite-customers tooling (magic link + SMS scripts), zone/category eligibility messaging, launch path progress, and minimal admin partner-management surfaces.

Builds on top of Module 13.1's referral_programs, referral_codes, referrals, referral_milestones, and referral_rewards tables.

---

## Phase 1: Database Migration

### 1A. New table: `provider_applications`

Tracks the self-serve application funnel (separate from the existing invite-code flow which is more admin-controlled).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | applicant |
| provider_org_id | uuid FK nullable | linked after approval |
| category | text NOT NULL | e.g. lawn_care, cleaning |
| zip_codes | text[] NOT NULL | requested service area |
| status | enum | draft, submitted, approved, waitlisted, rejected |
| waitlist_reason | text nullable | calm explanation |
| founding_partner | boolean DEFAULT false | badge flag |
| cohort_id | uuid FK nullable | links to market_cohorts |
| program_id | uuid FK nullable | links to referral_programs |
| launch_path_target | int nullable | e.g. "invite 10 to unlock" |
| metadata | jsonb | |
| created_at, updated_at | timestamptz | |

### 1B. New table: `invite_scripts`

Admin-managed SMS script templates for providers to copy.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| program_id | uuid FK nullable | scoped to a program or global |
| tone | text NOT NULL | short, friendly, professional |
| body | text NOT NULL | template with {provider_name}, {link} vars |
| is_active | boolean DEFAULT true | |
| sort_order | int DEFAULT 0 | |
| created_at | timestamptz | |

### 1C. Add columns to `market_cohorts`

- `launch_status` enum: `open`, `soft_launch`, `waitlist`, `not_supported` (DEFAULT `waitlist`)

### 1D. RLS policies

- `provider_applications`: customers/providers SELECT own, admins FOR ALL
- `invite_scripts`: authenticated SELECT active scripts, admins FOR ALL

### 1E. RPC: `check_zone_readiness(p_zip_codes text[], p_category text)`

Returns zone eligibility status (open/soft_launch/waitlist/not_supported) by checking zones matching provided zips and market_cohorts launch_status. Returns the best available status across matched zones.

---

## Phase 2: Hooks

| Hook | Purpose |
|------|---------|
| `useProviderApplication` | Submit/fetch application, check status |
| `useZoneReadiness` | Call `check_zone_readiness` RPC |
| `useInviteScripts` | Fetch active scripts for provider invite flow |
| `useProviderGrowthStats` | Aggregate referral stats: invites sent, installs, subs, first visits, bonuses |

---

## Phase 3: Provider Growth Hub (main deliverable)

### 3A. Restructure `/provider/referrals` into Growth Hub

Replace the current simple bonus-list page with a multi-section Growth Hub:

**Header area:**
- Founding Partner badge (if applicable)
- Application status banner (if pending/waitlisted)

**Section 1: Invite Customers** (core loop)
- "Copy invite link" primary button
- SMS scripts (tap-to-copy cards) with tone labels (Short / Friendly / Professional)
- Variable substitution: `{provider_name}` from org, `{link}` from referral code
- Progress stats row: Invites | Installs | Subs | Visits | Bonuses

**Section 2: Bonus Summary** (existing, keep)
- Earned / On Hold / Paid cards

**Section 3: Reward History** (existing, keep)

**Section 4: Launch Path** (shown when waitlisted)
- Progress bar toward launch_path_target
- "Invite X more customers to unlock priority activation"

### 3B. New page: `/provider/referrals/invite-customers`

Dedicated invite page (also accessible inline from growth hub):
- Copy link button
- Script cards with tap-to-copy
- QR code display (using a simple inline SVG/canvas QR generator -- no external dependency)

---

## Phase 4: Provider Application Flow

### 4A. New page: `/provider/apply`

Lightweight 3-step form:
1. **Category** -- select from known categories (lawn_care, cleaning, etc.)
2. **Service area** -- enter zip codes
3. **Submit** -- calls `check_zone_readiness` to show eligibility, then submits application

Post-submit states:
- **Open**: "You're eligible! Complete onboarding to start earning."  Link to `/provider/onboarding`
- **Soft launch**: "Limited spots available. Apply now for priority access."
- **Waitlist**: "Not open yet. Invite customers to accelerate your launch." Shows launch path.
- **Not supported**: "We don't serve this area yet. We'll notify you when we expand."

### 4B. Customer invite landing page: `/invite/:code`

Simple public page (no auth required):
- "Your pro is moving updates to Handled Home."
- "Welcome credit when you activate."
- "Proof after each visit."
- CTA: "Get Started" -> `/auth?ref={code}`

---

## Phase 5: Admin Partner Management

### 5A. Add "Partners" tab to `/admin/incentives`

Extend existing Incentives page with a 4th tab:
- **Partners**: List of provider_applications with status filters
- Assign to cohort/program
- Approve / Waitlist / Reject actions
- Toggle founding_partner badge
- View linked referral stats

### 5B. Invite Scripts management

Add to admin incentives or as sub-section:
- CRUD for invite_scripts (tone, body, active toggle)

---

## Technical Details

### Database migration (single file)

```text
1. Create provider_application_status enum (draft, submitted, approved, waitlisted, rejected)
2. Create zone_launch_status enum (open, soft_launch, waitlist, not_supported)
3. Create provider_applications table
4. Create invite_scripts table
5. Add launch_status column to market_cohorts
6. RLS policies for both new tables
7. Create check_zone_readiness RPC (SECURITY DEFINER)
8. Indexes on provider_applications(user_id, status)
```

### Files created/modified

| File | Action |
|------|---------|
| Migration SQL | Create (2 tables, 2 enums, RLS, 1 RPC) |
| `src/hooks/useProviderApplication.ts` | Create |
| `src/hooks/useZoneReadiness.ts` | Create |
| `src/hooks/useInviteScripts.ts` | Create |
| `src/hooks/useProviderGrowthStats.ts` | Create |
| `src/pages/provider/Referrals.tsx` | Rewrite into Growth Hub |
| `src/pages/provider/InviteCustomers.tsx` | Create |
| `src/pages/provider/Apply.tsx` | Create |
| `src/pages/InviteLanding.tsx` | Create (public route) |
| `src/pages/admin/Incentives.tsx` | Add Partners tab + Scripts sub-section |
| `src/App.tsx` | Add routes: `/provider/referrals/invite-customers`, `/provider/apply`, `/invite/:code` |

### Key design decisions

- `provider_applications` is separate from `provider_orgs` -- applications can exist before an org is created
- Zone readiness is derived from `market_cohorts.launch_status` joined through zone zip_code overlap
- Launch path progress is computed client-side from referral counts vs `launch_path_target`
- SMS scripts use simple variable substitution (`{provider_name}`, `{link}`) -- no complex templating
- QR code rendered client-side with a lightweight canvas function (no npm dependency)
- Invite landing page is a public route (no auth gate)

