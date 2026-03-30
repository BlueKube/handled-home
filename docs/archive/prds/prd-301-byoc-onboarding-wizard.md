# PRD 301 — Provider-Referred Customer Onboarding (BYOC)

> **Product:** Handled Home Mobile App  
> **Version:** 1.0  
> **Status:** Ready for Implementation  
> **Priority:** P0  
> **Complexity:** L (~1 dev day)  
> **Route:** `/customer/onboarding/byoc/:token`  
> **Scope:** Customer mobile app onboarding flow

---

## 1. Product Overview

Handled Home enables homeowners to manage recurring home services through a single mobile app.

A key growth strategy is **provider-led adoption**, where existing service providers invite their customers to download the app.

This onboarding flow is called:

**BYOC — Bring Your Own Customer**

The goal of the BYOC onboarding experience is to:

1. Preserve the existing provider-customer relationship
2. Set up the customer's home profile
3. Connect the provider to the customer's account
4. Introduce the concept of a Home Team
5. Optionally expand into additional services

The experience must feel:

- Fast
- Calm
- Trustworthy
- Non-salesy
- Mobile-native

**Target onboarding time: 60–90 seconds**

---

## 2. Core UX Principles

### Preserve Existing Relationship

Never imply the customer is switching providers.

Language must reinforce: **"Your provider is already here."**

### Avoid Sales Pressure

Do NOT use language like:
- Activate
- Subscribe
- Purchase
- Plan required

...until after the home is configured.

### Build Trust First

Order of operations:

1. Recognize provider
2. Confirm existing service
3. Setup home
4. Connect provider
5. Offer additional services

### Always Allow Skipping

Expansion steps must be optional.

### Mobile First

All screens must:

- Be vertically scrollable
- Optimized for ~390px mobile width
- Use large tap targets

---

## 3. Referral Model

The system must support three referral states. Only the first is implemented in V1.

**Critical rule: Attribution ≠ Relationship.** First-touch attribution determines bonus eligibility; provider-customer linking is independent and many-to-one over time.

### State 1 — Existing Provider, First Touch (V1)

- Provider already services the customer
- Provider sends invite link
- Customer joins through the link
- Provider receives referral attribution
- Relationship is created

This is the primary onboarding path.

### State 2 — Existing Provider, Not First Touch (Future)

- Customer already joined through another provider
- Second provider invites them later
- Customer can still add the provider to their Home Team
- Referral attribution is NOT granted

### State 3 — Cold Referral (Future)

- Provider invites a potential customer not currently serviced
- Customer downloads the app
- Onboarding behaves like normal acquisition flow
- Referral attribution may still apply

### Referral Decision Tree

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

---

## 4. Entry Points

The BYOC onboarding begins from a provider invite link.

Example: `/byoc/activate/:token`

Invite links are typically sent via:

- SMS
- Email
- QR code
- Printed card
- Provider website

---

## 5. Authentication Behavior

When the invite link is opened:

**If user is not authenticated:**

Redirect to: `/auth?redirect=/customer/onboarding/byoc/:token`

After login/signup, return to the onboarding wizard.

**If user is authenticated:**

Immediately redirect to: `/customer/onboarding/byoc/:token`

---

## 6. Invite Validation

Before onboarding begins, the system must validate the invite token.

**Validation checks:**

- Invite exists
- Invite is active
- Invite is not expired
- Invite is not revoked

**If validation fails — display fallback screen:**

- **Title:** This invitation is no longer active
- **Message:** You can still continue setting up your home and explore available services.
- **Primary CTA:** Continue Setup
- **Secondary CTA:** Return Home

---

## 7. Onboarding Flow Overview

The onboarding wizard contains 7 screens.

```text
/byoc/activate/:token
  → if !authed: redirect /auth?redirect=/customer/onboarding/byoc/:token
  → if authed: redirect /customer/onboarding/byoc/:token

/customer/onboarding/byoc/:token (ProtectedRoute, NO PropertyGate)
  Screen 1: Provider Recognition
  Screen 2: Confirm Service (read-only, no activation)
  Screen 3: Your Home (address, type)
  Screen 4: Home Setup (coverage + sizing)
       → "Connecting your provider..." spinner (Screen 4b)
       → Guard: if invite inactive → fallback screen
       → activate-byoc-invite(property_id, cadence)
  Screen 5: Other Services (by category, skip-friendly)
  Screen 6: Home Plan (conditional, only if services added)
  Screen 7: Success ("Your home is ready")
       → Dashboard (with "Your Home Team")
```

After completion the user lands on the **Customer Dashboard**.

---

## 8. Screen Specifications

### Screen 1 — Provider Recognition

**Purpose:** Transfer trust from the provider to the platform.

**UI:**
- Provider avatar
- Provider name
- Service category

**Headline:** Your provider is already on Handled Home

**Subtext:** [Provider Name] uses Handled Home to keep service simpler, more organized, and easier to manage.

**Primary CTA:** Continue

**Secondary:** I'm new here → Redirects to standard onboarding.

---

### Screen 2 — Confirm Existing Service

**Purpose:** Ensure the customer recognizes the service relationship.

**Display — Service card includes:**
- Provider name
- Service name
- Typical cadence
- Service day (if available)

**Prompt:** Does this look right?

**Primary CTA:** Yes, looks right

**Secondary:** Edit details → Expands cadence selector.

**Important:** This screen does NOT activate anything yet.

---

### Screen 3 — Your Home

**Purpose:** Create a property record.

**Fields:**
- Address
- Home type
- Property size (optional)

**Header:** Tell us about your home

**Subtext:** This helps us organize your services and recommend what your home might need.

**Primary CTA:** Continue

---

### Screen 4 — Home Setup

**Purpose:** Collect signals that help providers prepare.

**Fields — Checkbox list:**
- Pool
- Large trees
- Dogs or pets
- Garden beds
- Many windows

**Header:** A few quick details

**Subtext:** These help providers prepare for service.

**On Continue — System must:**
1. Save property signals
2. Re-fetch invite to verify `is_active` — if inactive, show fallback screen
3. Fire provider activation process

---

### Screen 4b — Connecting Provider (Processing)

**Purpose:** Show short processing state.

**UI:** Spinner

**Text:** Connecting your provider…

**System action:** `activate-byoc-invite(property_id, cadence)`

- On success → Screen 5
- On failure → return to Screen 4
- If 409 (duplicate) → redirect to dashboard with toast

---

### Screen 5 — Other Services

**Purpose:** Introduce the "Home Team" concept.

**Display:** Service categories available in the customer's zone. One card per category.

Example:
- Lawn Care
- Pool Service
- Pest Control
- Window Cleaning

**Each card contains:**
- Icon (from `getCategoryIcon`)
- Category name (from `getCategoryLabel`)
- Typical frequency
- "Add to my home" toggle

**Primary CTA:** Continue

**Secondary CTA:** Skip for now

**Implementation:** Query `zone_category_providers` WHERE `zone_id = byocZoneId` to get active categories in this zone. Deduplicate to unique categories client-side. Exclude the BYOC `category_key`. Use categories, NOT individual SKUs.

Selected categories saved to `customer_onboarding_progress.metadata.interested_services[]`.

---

### Screen 6 — Home Plan (Conditional)

**Only appears if user added services in Screen 5.**

**Purpose:** Offer coordinated scheduling and bundling.

**Display — Summary card includes:**
- Existing service
- Added services
- Estimated monthly total for added services

**Pricing note:** Label must read "Estimated monthly total for added services" — not including existing provider service. Only show if the number can feel stable and truthful.

**Primary CTA:** Start my plan

**Secondary CTA:** Keep services separate

---

### Screen 7 — Success

**Purpose:** Provide closure before dashboard.

**Header:** Your home is ready

**Summary — Bullet list (scannable):**
- [Provider Name] is connected
- See upcoming visits
- View service photos
- Add more services anytime

**Primary CTA:** Go to Dashboard

---

## 9. Dashboard Update — "Your Home Team"

New `HomeTeamCard` component.

**Purpose:** Show providers connected to the customer's home.

**Display — Provider cards including:**
- Provider avatar (initial from name, or logo_url if available)
- Provider name
- Service category
- Next scheduled visit

**Next visit source:** Query `jobs` table. Display earliest scheduled job. Fallback text: "Scheduled soon"

**Empty slots:** Show at most 1–2 suggested missing categories. Not a full grid. Must feel useful, not sales-heavy.

**Section tagline:** Your home is handled.

---

## 10. Data Model

No database migrations required for V1.

All BYOC context stored in: `customer_onboarding_progress.metadata`

**Stored fields:**
- `byoc_token`
- `byoc_provider_name`
- `byoc_provider_id`
- `byoc_service_name`
- `byoc_category_key`
- `byoc_zone_id`
- `byoc_sku_id`
- `byoc_default_cadence`
- `byoc_level_id`
- `interested_services[]`

**Architectural risk note:** Using metadata JSONB for BYOC state is fine for V1. If BYOC becomes a primary growth channel, `customer_referral_source` and `provider_referral_id` should become first-class columns (Phase 2).

---

## 11. Activation Logic

Provider-customer relationship created through: `activate-byoc-invite`

**Inputs:**
- `property_id`
- `cadence`
- `invite_token`

**Outputs:**
- `byoc_activation` record
- Provider-customer link
- Referral attribution

**Timing:** Fires after Screen 4 creates the property, ensuring valid `property_id`.

---

## 12. Error Handling

**Possible errors:**
- Invite expired
- Invite revoked
- Invite already used
- Activation failure

**Behavior:** Show user-friendly fallback screens. Never expose internal errors.

---

## 13. Performance Targets

- Maximum onboarding completion time: **90 seconds**
- Maximum activation processing time: **3 seconds**

---

## 14. Success Metrics

**Primary:**
- BYOC onboarding completion rate — Target: **70%+**

**Secondary:**
- Time to dashboard
- Additional services selected
- Conversion to subscription plans

---

## 15. Security Considerations

Invite tokens must:
- Be unguessable
- Expire
- Support revocation

Authentication required before property creation.

---

## 16. Out of Scope (V1)

- Add-provider flow (State 2)
- Cold referral onboarding (State 3)
- Door-knocker referral campaigns
- Provider referral analytics

---

## 17. Implementation Summary

### Structural Decisions

1. **Auth moves before Screen 1** — BYOC link immediately gates auth, then the entire wizard flows uninterrupted
2. **Activation fires after Screen 4** (Home Setup), not Screen 2 — ensures property exists before provider-customer link is created
3. **Dashboard "Your Home Team" shows Next Visit** — immediate utility, not just a directory
4. **Invite validity guard** — Before activation, re-check invite status
5. **Persist provider context early** — Save provider name, ID, service name, category into metadata on wizard init (survives refresh/expiry)
6. **Screen 5 uses categories, not individual SKUs** — Zone-aware query
7. **Processing state after Screen 4** — Spinner with auto-advance

### Files Created

| File | Purpose |
|------|---------|
| `src/pages/customer/ByocOnboardingWizard.tsx` | 7-screen wizard |
| `src/hooks/useByocOnboardingContext.ts` | BYOC metadata persistence + invite wrapping |
| `src/components/customer/HomeTeamCard.tsx` | Dashboard "Your Home Team" section |

### Files Modified

| File | Change |
|------|--------|
| `src/pages/ByocActivate.tsx` | Thin auth-gate redirect |
| `src/App.tsx` | Add route inside customer ProtectedRoute (no PropertyGate) |
| `src/pages/customer/Dashboard.tsx` | Render HomeTeamCard |
| `docs/tasks.md` | Add BYOC sprint entries |

### Key Rules

1. **Attribution ≠ Relationship** — first-touch for bonuses; linking is independent
2. **No new database tables or migrations** — metadata JSONB
3. **Activation timing** — after Screen 4 property creation
4. **Zone-aware categories** — Screen 5 queries active categories in BYOC zone
5. **Pricing language** — "Estimated monthly total for added services"
6. **Empty slots restrained** — at most 1–2 suggestions on dashboard

**Estimated complexity: Large — ~1 dev day**

---

## 18. Future Consideration — Viral Growth Loop

A future screen after success could prompt:

> "Invite your other pros"
>
> Does your landscaper use Handled Home yet?

This could become the most powerful viral growth loop: spreading provider-to-provider through customers.

---

## Screen Copy Reference Table

| # | Header | Subtext | Primary CTA | Secondary |
|---|--------|---------|-------------|-----------|
| 1 | Your provider is already on Handled Home | [Name] uses Handled Home to keep service simpler, more organized, and easier to manage. | Continue | I'm new here |
| 2 | We found your service | Service card (read-only) + "Does this look right?" | Yes, looks right | Edit details |
| 3 | Tell us about your home | This helps us organize your services and recommend what your home might need. | Continue | — |
| 4 | A few quick details | These help providers prepare for service. | Continue (triggers activation) | — |
| 4b | Connecting your provider... | (spinner, auto-advance) | — | — |
| 5 | Many homes also need help with: | Category cards with "Add to my home" toggle | Continue | Skip for now |
| 6 | Here's the simplest way to handle these | Summary + estimated monthly for added services | Start my plan | Keep services separate |
| 7 | Your home is ready | [Name] is connected · See upcoming visits · View service photos · Add more services anytime | Go to Dashboard | — |
