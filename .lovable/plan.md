

# Sprint 3F/3G Implementation Plan

## Current State

**What already exists:**
- `provider_applications` table (simple: category, zip_codes, status enum with draft/submitted/approved/waitlisted/rejected)
- Basic `Apply.tsx` — 3-step flow (pick category → enter ZIPs → submit)
- Full invite-code onboarding wizard: Org → Coverage → Capabilities → Compliance → Review
- `provider_orgs`, `provider_coverage`, `provider_capabilities`, `provider_compliance` tables
- `useProviderApplication`, `useProviderOrg`, `useProviderInvite` hooks
- `market_zone_category_state` table (status: CLOSED/SOFT_LAUNCH/OPEN/PROTECT_QUALITY)
- `byoc_attributions` + `byoc_bonus_ledger` tables (existing BYOC tracking)
- `invite_scripts` table (admin-managed scripts)
- `useByocAttributions` hook

**What's missing (from the 5 specs):**
- Provider agreement acceptance (clause-by-clause) — no table, no UI
- Category requirements config table (risk tiers, compliance rules per category)
- Opportunity banner system (dynamic variant A-E based on zone/category state)
- BYOC invite links with SKU/Level mapping + customer activation flow
- BYOC Center for providers (copy scripts, share links, track invites)
- Enhanced provider application with BYOC intake, multi-category support
- Admin application review queue with agreement audit log
- Provider compliance documents table (structured COI/license uploads)

---

## Phased Implementation

### Phase 1 — Schema Foundation (1 session)
**Goal:** Create all new tables and extend existing ones so subsequent phases have a stable data layer.

- **Migration 1a:** Create `provider_agreement_acceptance` table (application_id, clause_key, accepted_at, ip_address). Unique constraint on (application_id, clause_key).
- **Migration 1b:** Create `category_requirements` config table (category_key, risk_tier, requires_gl_insurance, requires_workers_comp_if_employees, requires_background_check, requires_license, license_authority, ops_review_required).
- **Migration 1c:** Create `provider_compliance_documents` table (org_id, doc_type, storage_path, expires_at, status, verified_by, verified_at, rejection_reason).
- **Migration 1d:** Create `byoc_invite_links` table (org_id, zone_id, category_key, sku_id, default_level_id, default_cadence, token unique, created_at). Create `byoc_invite_events` table (invite_id, event_type, actor, payload). Create `byoc_activations` table (invite_id, customer_user_id, property_id, provider_org_id, sku_id, level_id, cadence, status, activated_at).
- **Migration 1e:** Add `under_review` and `approved_conditional` to `provider_application_status` enum. Add `requested_categories` (text[]), `requested_zone_ids` (uuid[]), `byoc_estimate_json` (jsonb), `pitch_variant_seen` (text) columns to `provider_applications` if not present. Add founding_partner_slots_total/filled to `market_zone_category_state`.
- **Migration 1f:** Seed `category_requirements` with CA v1 defaults (Tier 0-3 per the spec matrix).
- **RLS policies** for all new tables following spec Part C rules.
- **Indexes** per spec Part D.

### Phase 2 — Clause-by-Clause Agreement Flow (1 session)
**Goal:** Provider can accept 12 clauses one-by-one during onboarding.

- Create `useProviderAgreement` hook (query accepted clauses, insert acceptance).
- Build `/provider/apply/agreement` page — ClauseCard component with title, plain-English text, "I Agree" button, progress indicator (e.g., 3/12).
- Define clause content as a static config array (12 clauses from Part B of the screen copy spec).
- Wire into existing onboarding flow: insert between Compliance and Review steps.
- Update OnboardingReview to check all required clauses accepted before submit.

### Phase 3 — Enhanced Application + Opportunity Banners (1 session)
**Goal:** Multi-category apply flow with dynamic opportunity messaging.

- Rewrite `Apply.tsx` to support multi-category selection (chips from spec A0).
- Add home base ZIP + service ZIPs step (spec A1).
- Build `OpportunityBanner` component — 5 variants (EARLY/OPEN/EARLY-2/WAITLIST/CLOSED) driven by `market_zone_category_state`.
- Implement banner decision algorithm (spec B3): score each (zone, category) pair, pick best, select variant.
- Add BYOC intake step (optional): estimated customer count, willingness, relationship type (spec A6/Stage 4).
- Update `useProviderApplication` to handle multi-category and new fields.

### Phase 4 — Category-Driven Compliance (1 session)
**Goal:** Compliance requirements adapt dynamically based on selected categories.

- Create `useCategoryRequirements` hook (fetch from `category_requirements` config table).
- Build `DynamicComplianceRenderer` component — shows/hides license, insurance, background check fields based on category risk tier.
- Add COI upload to `provider_compliance_documents` (using existing storage bucket pattern).
- Add CSLB license fields for Tier 3 categories (license number, classification, attestation).
- Replace existing static OnboardingCompliance with dynamic version.

### Phase 5 — BYOC Center + Invite Links (1 session)
**Goal:** Approved providers can generate invite links, copy scripts, and track invites.

- Build `/provider/byoc` page — BYOC Center with incentives summary, copy SMS/email script buttons, share invite link, invite stats.
- Build `/provider/byoc/create-link` — category picker, default SKU+Level+cadence review, generate link button.
- Create `useByocInviteLinks` hook (CRUD for invite links, query events).
- Wire invite scripts from existing `invite_scripts` table into copy buttons.
- Track invite events (CREATED, SHARED) in `byoc_invite_events`.
- Gate access: only show BYOC Center if provider org status is ACTIVE/APPROVED.

### Phase 6 — Customer BYOC Activation (1 session)
**Goal:** Customer clicks invite link and activates service with their provider.

- Build `/byoc/activate/:token` page — ProviderIntroCard, service summary (SKU+Level+cadence), property confirm, payment method, confirm activation.
- Create `activate-byoc-invite` edge function — validates token, creates activation record, links provider to customer, creates subscription/routine item.
- Track activation events (OPENED, ACTIVATION_STARTED, PAYMENT_ADDED, ACTIVATED).
- Success screen: "Your home is handled."

### Phase 7 — Admin Application Review Queue (1 session)
**Goal:** Ops can review, approve, waitlist, or reject provider applications.

- Build `/admin/providers/applications` — ApplicationsTable with filters (status, zone, category).
- Build `/admin/providers/applications/:id` — full applicant detail view: summary, coverage/categories, compliance checklist, agreement acceptance audit log, decision buttons (Approve/Approve w Conditions/Waitlist/Reject), notes field.
- Create `review_provider_application` RPC — sets status, sends notification, updates provider_org status on approval.
- Wire notifications to provider on decision.

---

## Technical Notes

- The existing `market_zone_category_state.status` enum uses CLOSED/SOFT_LAUNCH/OPEN/PROTECT_QUALITY. The specs reference EARLY/OPEN/WAITLIST/CLOSED. We'll map SOFT_LAUNCH→EARLY and add WAITLIST if needed, or use the existing enum with a mapping layer in the banner logic.
- The existing `provider_application_status` enum has: draft/submitted/approved/waitlisted/rejected. We need to add `under_review` and `approved_conditional`.
- Payout setup (Stripe Connect) is listed in the specs but will be stubbed as "Coming Soon" — actual Stripe integration is a separate workstream.
- All new tables get RLS enabled with provider-owns-own + admin-full-access policies.

