# HANDLED HOME — MODULE 08

## Module: 08-provider-onboarding.md

Mobile-only app (iOS + Android via Capacitor) — Provider + Admin  

Admin Console (mobile-optimized but operationally usable)

Primary Provider Routes:

- `/provider/onboarding`

- `/provider/onboarding/org`

- `/provider/onboarding/coverage`

- `/provider/onboarding/capabilities`

- `/provider/onboarding/compliance`

- `/provider/onboarding/review`

- `/provider/dashboard` (entry after activation)

Primary Admin Routes:

- `/admin/providers`

- `/admin/providers/:provider_org_id`

- `/admin/invites` (lightweight ops tool)

Last updated: 2026-02-22

---

## Purpose

Module 08 builds the provider "supply layer" the rest of the system depends on (Service Day Engine + Job Execution later). It must produce providers that are:

- explicitly authorized for specific SKUs

- approved for specific zones

- accountable to clear expectations (proof/completion standards)

- onboarded quickly, without turning the product into a workforce management or scheduling calendar app

This module is designed **solo-first, team-ready**:

- MVP assumes **individual owner-operators**

- Data model supports provider org + members for later expansion to small crews

---

## North Star Outcomes

1) Providers can complete onboarding in **< 10 minutes** and reach **PENDING** review.

2) Admin can approve with confidence using a clear, scannable review surface.

3) Assignment safety: a provider cannot be assigned work they are not authorized to perform (SKU allowlist).

4) The system supports **curated, invite-only** onboarding for the first zones (quality + density).

5) Every enforcement action is auditable and instantly enforceable.

---

## Strategic Decisions (Locked)

### A) Launch approach

- Provider network is **curated / invite-only** for the first 1–3 zones.

- Self-apply may exist later, but MVP defaults to invite-only gating.

### B) Provider structure

- Approve at **org level** but require exactly one **Accountable Owner**.

- In MVP, the user who creates the provider org becomes the Accountable Owner by default.

- Support "create on behalf of someone else" is **out of scope** for MVP (to avoid proxy consent/legal ambiguity).

- Admin can reassign Accountable Owner only via a privileged action with reason + audit log.

### C) Team support

- MVP: no staff management UI.

- Team-ready: data model supports multiple members; UI remains owner-only unless feature-flagged later.

### D) No calendar app

- Providers do not choose dates.

- Providers are assigned work through Service Day Instances and jobs (Module 06/09+).

- Coverage + home base inform routing and assignment, not date negotiation.

---

## Scope

### In scope

- Invite gating and invite management (admin)

- Provider org creation (solo-first)

- Accountable Owner member creation (required)

- Zone coverage requests (admin-approved)

- Capabilities captured in provider-friendly language and mapped to explicit SKU authorizations

- Compliance intake (lightweight) + document uploads (optional, with risk flags)

- Admin review + approval + enforcement lifecycle

- Provider onboarding gating + "Under review" state + minimal provider dashboard entry gate

### Out of scope (later modules)

- Job execution flows (Module 09)

- Provider earnings/payouts (Module 11)

- Advanced provider performance dashboards (later)

- Workforce management (shifts, staff scheduling, dispatch calendar)

- Provider appointment negotiation or exact date selection

---

## Provider Status Lifecycle

Provider org status:

- `DRAFT`: onboarding started, incomplete

- `PENDING`: submitted for review, cannot receive jobs

- `ACTIVE`: can receive jobs

- `PROBATION`: can receive limited assignments; may be restricted to certain SKUs/zones

- `SUSPENDED`: cannot receive jobs; access limited to viewing status/support

Rules:

- Only admins can transition to ACTIVE/PROBATION/SUSPENDED.

- All transitions are recorded in audit logs + enforcement actions.

- Suspension must immediately prevent new assignments (hook for future modules).

---

## Invite-Only Gating (MVP)

### Provider onboarding entry rules

- Provider onboarding requires a valid invite code unless the environment/zone is configured as "open apply."

- Invite codes may be tied to:

  - one or more zones (recommended)

  - optional expiration

  - optional max uses

Provider flow:

- Provider enters invite code at `/provider/onboarding` start

- System reveals eligible zones tied to the invite

- Provider proceeds through onboarding steps

- Submit → status becomes PENDING

Admin flow:

- Admin creates invite codes in `/admin/invites`

- Admin can deactivate codes and see usage

This gating is critical for early quality and density.

---

## Provider Onboarding UX

### Experience principles

- Single primary CTA per screen

- Progress header (Step x of y)

- Calm, confident tone ("You're joining a curated network")

- No "calendar" language; use "service days" only as an internal concept

### Entry & routing logic

Route: `/provider/onboarding`

- If user is not authenticated → send to auth (Module 01)

- If user has no provider role → show "Apply to become a provider" message (MVP may hide this if invite-only)

- If provider org exists:

  - `DRAFT` → resume at next incomplete step

  - `PENDING` → show Under Review screen

  - `ACTIVE` → route to `/provider/dashboard`

  - `PROBATION` → route to `/provider/dashboard` with a banner

  - `SUSPENDED` → show Suspended screen + reason + support CTA

---

### Step 0 — Invite Code (required in MVP)

Route: `/provider/onboarding` (first card)

- Field: Invite Code

- Validation: active, not expired, usage remaining

- Result: store invite context (allowed zones)

---

### Step 1 — Organization

Route: `/provider/onboarding/org`

Collect minimal MVP:

- Provider org display name

- Contact phone (for ops)

- Home base (ZIP or coarse pin; not exact address)

- Optional: website

- Optional: logo

UX:

- Explain home base: "Helps us build dense routes so you drive less."

- Keep privacy-forward copy: "We don't need an exact address."

Accountable Owner:

- Default: the signed-in user is the Accountable Owner (explicitly shown)

- Capture:

  - owner display name (editable)

  - owner phone (prefill from user if available)

  - owner agrees they are accountable for service quality and standards

---

### Step 2 — Coverage (Zones)

Route: `/provider/onboarding/coverage`

Show only zones allowed by:

- invite code zone mapping

- zone enrollment enabled flag

Provider can request:

- one or more zones

- optional "Primary / Secondary" preference per zone

- optional max travel preference: 10/20/30 miles

Rules:

- Provider requests are `REQUESTED`, never auto-approved.

- If a zone is full/paused for provider onboarding, it is hidden or shown as unavailable.

---

### Step 3 — Capabilities (Provider-friendly → SKU-backed authorization)

Route: `/provider/onboarding/capabilities`

Goals:

- Capture what the provider can reliably execute

- Map selections to an explicit SKU allowlist for assignment safety

UX structure:

- Category cards (provider-friendly):

  - e.g., "Exterior", "Kitchen", "Utilities", "Seasonal Boosts"

- Inside each category, show "service items" that are SKU-backed:

  - toggle "I can perform"

  - expectations preview (photos required, checklist required, time constraints)

  - minimal equipment confirmations where relevant (checkboxes)

Important:

- Do not display internal SKU IDs, but ensure backend mapping is strict.

- Admin can refine/override the SKU allowlist later.

Output:

- Provider submits a declared capability set

- System creates `provider_capabilities` entries (CATEGORY + SKU-based as needed)

---

### Step 4 — Compliance (Lightweight MVP + Risk Flags)

Route: `/provider/onboarding/compliance`

Required in MVP:

- Terms accepted checkbox + link

- Insurance attestation checkbox ("I carry required insurance")

- Business type selection (Individual / Company)

- Tax form intent checkbox ("I will provide W-9 / equivalent if requested")

- Optional: background check consent checkbox (not gating MVP)

Uploads (supported but not gating MVP):

- Insurance document upload

- Tax document upload

- Other document upload

Risk flags:

- Missing uploads should generate risk flags for admin review (severity configurable)

- Providers can submit without uploads; Admin sees flags clearly

---

### Step 5 — Review & Submit

Route: `/provider/onboarding/review`

Show a clean summary:

- Org + owner

- Coverage requested

- Capabilities selected

- Compliance attestations + upload status

- "What happens next" message

Submit behavior:

- Create/lock submission snapshot for audit (diff-friendly JSON)

- Change status from DRAFT → PENDING

- Show confirmation screen:

  - "Under review"

  - "We'll notify you when approved"

  - A clear "Edit request" rule (see below)

---

## Under Review (PENDING) UX

Route: `/provider/onboarding` (PENDING state)

Display:

- Status: "Under review"

- Submitted timestamp

- Scannable checklist:

  - Coverage requested ✅

  - Capabilities selected ✅

  - Compliance completed ✅ / ⚠ missing uploads

- Support CTA (message/email/phone configured by ops)

Edit policy (MVP recommended):

- Providers can edit non-critical fields (phone, logo) while PENDING

- Changes to Coverage/Capabilities should either:

  - Option A (recommended): remain PENDING but add "UPDATED" badge and new review-needed flag

  - Option B: return to DRAFT (avoid if you want speed)

Choose Option A for MVP to keep supply flowing.

---

## Provider Dashboard Gate (Minimal)

Route: `/provider/dashboard`

MVP content:

- If ACTIVE: show "You're active" + readiness checklist

- If PROBATION: show probation banner + allowed scope note

- If SUSPENDED: block and show suspended screen

- No job list required in Module 08 (Module 09+), but allow a placeholder empty state:

  - "Jobs will appear here when assigned."

---

## Admin Console — Review & Enforcement

### Admin provider list

Route: `/admin/providers`

Each row shows:

- Org name

- Status pill

- Zones requested vs approved count

- Capability summary (categories + SKUs)

- Risk flags count (badge)

- Needs review indicator

Filters:

- Status

- Zone

- Risk flags presence

- "New since last view"

---

### Admin provider detail

Route: `/admin/providers/:provider_org_id`

Sections:

1) Overview

- Org name

- Accountable Owner (name + user link)

- Contact phone

- Home base ZIP/coarse map indicator

2) Coverage

- Requested zones (approve/deny)

- Approved zones list

- Admin override tools (add/remove coverage)

- Coverage preferences visible (if captured)

3) Capabilities

- Category selections

- SKU allowlist (editable by admin)

- Notes: "Only authorized SKUs will be assignable."

4) Compliance

- Terms acceptance timestamp

- Attestations

- Uploads (view/download)

- Risk flags visible inline

5) Risk Flags

- List flags with severity and recommended next action

6) Actions (always audit logged)

- Approve → set ACTIVE

- Probation → set PROBATION + reason + optional restrictions (SKU/zone scope)

- Suspend → set SUSPENDED + reason

- Reinstate → back to ACTIVE

- Reassign Accountable Owner (admin-only) + reason required

- Internal note (support-only)

---

## Data Model (Supabase)

Use canonical naming consistent with global architecture. Avoid duplicate concepts.

### `provider_invites` (new)

- id

- code (unique, human-friendly)

- allowed_zone_ids (array) OR join table if preferred

- max_uses (nullable)

- uses_count

- expires_at (nullable)

- is_active

- created_by_admin_user_id

- created_at, updated_at

### `provider_orgs`

- id

- name

- status (DRAFT/PENDING/ACTIVE/PROBATION/SUSPENDED)

- contact_phone

- home_base_zip (or coarse lat/lng)

- invite_id (nullable)

- accountable_owner_user_id (required)

- created_by_user_id

- created_at, updated_at

### `provider_members` (team-ready)

- id

- provider_org_id

- user_id

- role_in_org (OWNER/STAFF)

- status (ACTIVE/INACTIVE)

- created_at, updated_at

### `provider_coverage`

- id

- provider_org_id

- zone_id

- request_status (REQUESTED/APPROVED/DENIED)

- coverage_type (PRIMARY/SECONDARY) (optional MVP)

- max_travel_miles (nullable)

- created_at, updated_at

### `provider_capabilities`

- id

- provider_org_id

- capability_type (CATEGORY/SKU)

- capability_key (string; SKU key may reference sku_id)

- is_enabled

- created_at, updated_at

### `provider_compliance`

- id

- provider_org_id

- terms_accepted_at

- insurance_attested (bool)

- insurance_doc_url (nullable)

- tax_form_attested (bool)

- tax_doc_url (nullable)

- background_check_consented (bool)

- notes (nullable)

- created_at, updated_at

### `provider_risk_flags`

- id

- provider_org_id

- flag_type (MISSING_INSURANCE_DOC, MISSING_TAX_DOC, OTHER)

- severity (LOW/MED/HIGH)

- is_active

- created_at, updated_at

### `provider_enforcement_actions`

- id

- provider_org_id

- action_type (APPROVE, PROBATION, SUSPEND, REINSTATE, REASSIGN_OWNER, NOTE)

- reason (nullable)

- metadata (json nullable) — for restrictions, owner reassignment details, etc.

- created_by_admin_user_id

- created_at

### `audit_logs` (reuse canonical)

- module = "provider_onboarding"

- actor_user_id

- entity_type/entity_id

- action

- diff (json)

- created_at

---

## RLS & Security (Non-negotiable)

- Default deny across provider tables

- Providers can read/write only their own org, members, coverage requests, capabilities, compliance, and invite validation results

- Providers cannot:

  - see other provider orgs

  - approve zones

  - change org status

  - reassign accountable owner

  - edit admin-only restrictions

- Admins can read/write all provider tables

Documents (Supabase Storage):

- write: org members only

- read: org members + admins only (use signed URLs)

- URLs stored in compliance table must not be world-readable

---

## Server-side Validation Boundaries

UI must not be the source of truth for authorization.

Server must validate:

- invite code validity and zone bindings

- zone enrollment enablement

- capability mapping constraints (category → SKU mapping integrity)

- admin-only transitions of ACTIVE/PROBATION/SUSPENDED

- audit/enforcement action creation on privileged operations

Assignment safety hook:

- Provide a server-side validation path for "can provider execute sku_id in zone_id?"

- This will be used later by scheduling/assignment modules.

---

## Operational Guardrails & Edge Cases

1) Duplicate onboarding:

- one provider org per accountable owner by default (idempotent)

- resume DRAFT rather than creating duplicates

2) Edits after approval:

- If provider changes coverage/capabilities while ACTIVE:

  - Keep ACTIVE but set a "needs review" flag + audit event (recommended)

  - Admin may optionally move to PROBATION if risk is high

3) Invite code abuse:

- enforce max uses / expiration

- audit invite usage

4) Suspension:

- must prevent new assignments immediately

- provider can still see suspension reason and support contact

---

## Acceptance Tests

1) Invite gating:

- invalid/expired code blocks onboarding

- valid code reveals allowed zones

2) Provider submits onboarding:

- creates org, owner member, coverage REQUESTED, capabilities, compliance

- status becomes PENDING

- provider sees Under Review

3) Admin approves:

- status becomes ACTIVE

- enforcement action + audit log written

- provider can access provider dashboard

4) RLS:

- provider cannot read other providers

- provider cannot write status/enforcement

5) SKU authorization safety:

- provider without SKU capability cannot be considered eligible by server validation

---

## Deliverables

- Supabase migrations + typed models

- Provider onboarding screens + gating logic

- Admin providers list + detail review flows

- Admin invites tool

- RLS policies + storage rules for uploads

- Audit logs + enforcement action wiring

- Server-side validation endpoints/RPC for eligibility checks
