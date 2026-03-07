# PRD 301 — BYOC Onboarding Wizard (Provider-Referred Customer Flow)

> **Status:** Approved for build  
> **Priority:** P0  
> **Complexity:** L (full day)  
> **Route:** `/customer/onboarding/byoc/:token`

---

## Overview

A 7-screen provider-referred customer onboarding wizard that preserves existing provider-customer relationships, sets up the customer's home, optionally expands services, and lands in the dashboard with a "Your Home Team" section.

## Structural Decisions

1. **Auth moves before Screen 1** — BYOC link immediately gates auth, then the entire wizard flows uninterrupted
2. **Activation fires after Screen 4** (Home Setup), not Screen 2 — ensures property exists before provider-customer link is created
3. **Dashboard "Your Home Team" shows Next Visit** — immediate utility, not just a directory
4. **Invite validity guard** — Before activation, re-check invite status. If inactive/expired/already-used, show fallback screen
5. **Persist provider context early** — Save provider name, ID, service name, category into `customer_onboarding_progress.metadata` on wizard init (survives refresh/expiry)
6. **Screen 5 uses categories, not individual SKUs** — Query `zone_category_providers` for active categories in the BYOC zone, deduplicate, exclude BYOC category
7. **Processing state after Screen 4** — "Connecting your provider..." spinner with auto-advance

## Referral Decision Tree

```text
BYOC link arrives
│
├── Is invite active?
│   ├── NO → Fallback: "Invitation no longer active" + option to continue standard setup
│   └── YES → Continue
│       │
│       ├── Does customer already have a byoc_activation for this invite?
│       │   ├── YES (409) → "You've already activated this" + go to dashboard
│       │   └── NO → Continue BYOC wizard
│       │
│       └── relationship_type derived from context:
│           ├── EXISTING_PROVIDER_FIRST_TOUCH (default BYOC path — V1)
│           │   Full 7-screen wizard, activation + attribution
│           │
│           ├── EXISTING_PROVIDER_NOT_FIRST (future: add-provider flow)
│           │   Shorter flow: recognize → confirm → link to Home Team
│           │   Attribution: no bonus, relationship only
│           │   [NOT built in V1 — data model supports it]
│           │
│           └── COLD_REFERRAL (future: door-knocker)
│               Standard onboarding with referral source tracking
│               [NOT built in V1]
```

**V1 builds Path 1 only.** Paths 2 and 3 are supported by the data model but not UI-implemented yet.

## Flow

```text
/byoc/activate/:token
  → if !authed: redirect /auth?redirect=/customer/onboarding/byoc/:token
  → if authed: redirect /customer/onboarding/byoc/:token

/customer/onboarding/byoc/:token (ProtectedRoute, NO PropertyGate)
  Screen 1: Provider Recognition
  Screen 2: Confirm Service (read-only, no activation)
  Screen 3: Your Home (address, type)
  Screen 4: Home Setup (coverage + sizing)
       → "Connecting your provider..." spinner
       → Guard: if invite inactive → fallback screen
       → activate-byoc-invite(property_id, cadence)
  Screen 5: Other Services (by category, skip-friendly)
  Screen 6: Home Plan (conditional, only if services added)
  Screen 7: Success ("Your home is ready")
       → Dashboard (with "Your Home Team")
```

## Screen Copy

| # | Header | Subtext | Primary CTA | Secondary |
|---|--------|---------|-------------|-----------|
| 1 | Your provider is already on Handled Home | [Name] uses Handled Home to keep service simpler, more organized, and easier to manage. | Continue | I'm new here |
| 2 | We found your service | Service card (read-only) + "Does this look right?" | Yes, looks right | Edit details |
| 3 | Tell us about your home | This helps us organize your services and recommend what your home might need. | Continue | — |
| 4 | A few quick details | These help providers prepare for service. | Continue (triggers activation) | — |
| 4b | Connecting your provider... | (spinner, auto-advance) | — | — |
| 5 | Many homes also need help with: | Category cards with "Add to my home" toggle | Continue | Skip for now |
| 6 | Here's the simplest way to handle these | Summary + estimated monthly for added services | Start my plan | Keep services separate |
| 7 | Your home is ready | [Name] is connected. See upcoming visits · View service photos · Add more services anytime | Go to Dashboard | — |

## Dashboard: "Your Home Team"

New `HomeTeamCard` component:
- Shows linked provider orgs (from `byoc_activations` joined to `provider_orgs`)
- Each card: provider initial/logo, org name, service category, **next visit date** or "Scheduled soon"
- Max 1-2 empty category suggestions (not a full grid)
- Tagline: "Your home is handled."

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/customer/ByocOnboardingWizard.tsx` | 7-screen wizard |
| `src/hooks/useByocOnboardingContext.ts` | BYOC metadata persistence + invite wrapping |
| `src/components/customer/HomeTeamCard.tsx` | Dashboard "Your Home Team" section |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/ByocActivate.tsx` | Thin auth-gate redirect |
| `src/App.tsx` | Add route inside customer ProtectedRoute (no PropertyGate) |
| `src/pages/customer/Dashboard.tsx` | Render HomeTeamCard |
| `docs/tasks.md` | Add BYOC sprint entries |

### Key Rules

1. **Attribution ≠ Relationship** — first-touch attribution determines bonus eligibility; provider-customer linking is independent and many-to-one over time.
2. **No new database tables or migrations** — BYOC context stored in `customer_onboarding_progress.metadata` JSONB.
3. **Activation timing** — fires after Screen 4 creates the property, ensuring valid `property_id`.
4. **Zone-aware category query** — Screen 5 queries `zone_category_providers` WHERE `zone_id = byocZoneId` to get active categories.
5. **Estimated pricing** — Screen 6 shows "Estimated monthly total for added services" (not including existing provider service).
6. **Empty slots restrained** — Dashboard shows at most 1-2 suggested categories, not a full grid.

### Architectural Risk Note

Using `metadata JSONB` for BYOC state is fine for V1. If BYOC becomes a primary growth channel, `customer_referral_source` and `provider_referral_id` should become first-class columns (Phase 2).
