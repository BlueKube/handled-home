

# Module 08 — Code Review Fixes

This plan addresses all issues identified in the code review, organized by priority.

---

## MUST FIX

### 1. R1 — Provider can bypass admin approval via direct UPDATE (CRITICAL SECURITY)

The `provider_orgs` UPDATE policy allows providers to change any column, including `status`. A malicious client could call `supabase.from('provider_orgs').update({ status: 'ACTIVE' })` directly.

**Fix:** Add a database trigger that prevents non-admin users from modifying the `status`, `needs_review`, and `accountable_owner_user_id` columns. The trigger fires BEFORE UPDATE and raises an exception if a non-admin attempts to change these protected fields. This is more reliable than column-level RLS (which Postgres does not natively support).

### 2. D1 — `provider_members` missing UNIQUE constraint

The `useProviderMembers` hook calls `.upsert(..., { onConflict: "provider_org_id,user_id" })` but no unique constraint exists on those columns. This will fail at runtime.

**Fix:** Add `UNIQUE(provider_org_id, user_id)` constraint to `provider_members`.

---

## SHOULD FIX

### 3. D2/S2 — Risk flag deduplication broken

`ON CONFLICT DO NOTHING` in `submit_provider_onboarding` has no conflict target because there is no unique constraint on `(provider_org_id, flag_type)`.

**Fix:** Add `UNIQUE(provider_org_id, flag_type)` constraint to `provider_risk_flags`, then update the RPC to use `ON CONFLICT (provider_org_id, flag_type) DO NOTHING`.

### 4. P1 — `location.state` lost on page refresh

All onboarding steps pass `orgId` and `allowedZoneIds` via `navigate(..., { state })`. If the user refreshes, state is lost and hooks have no `orgId`.

**Fix:** In each onboarding step page, fall back to reading `orgId` from `useProviderOrg()` when `location.state?.orgId` is absent. For `allowedZoneIds`, query the invite's `allowed_zone_ids` via the org's `invite_id` if state is missing.

### 5. P2 — Org form fields don't sync when async data loads

`OnboardingOrg.tsx` initializes `useState(org?.name || "")` but `org` is likely `undefined` on first render. When the query resolves, the state doesn't update.

**Fix:** Add a `useEffect` that syncs form state when `org` data loads (same pattern already used in `OnboardingCompliance.tsx`).

### 6. S1 — Audit log uses `admin_user_id` for provider action

The `submit_provider_onboarding` RPC inserts into `admin_audit_log` using `auth.uid()` (a provider) in the `admin_user_id` column. While technically functional (column has no FK constraint), it's semantically wrong.

**Fix:** This is a known modeling shortcut. For now, add a comment in the RPC clarifying the actor may be a provider. A proper generic `audit_log` table can be introduced in a future refactor without blocking MVP.

---

## NICE TO HAVE

### 7. P3 — `DraftResumeScreen` `allowedZoneIds` always empty

Both branches of the ternary produce `[]`. 

**Fix:** Query `provider_invites` to get `allowed_zone_ids` when `org.invite_id` exists, or pass them along from the org query.

### 8. P4 — Pending screen doesn't show missing upload warnings

All checklist items show green checkmarks regardless of upload status.

**Fix:** Query compliance data in `PendingReviewScreen` and show a warning icon for missing document uploads.

### 9. P6 — No document upload UI in compliance step

The storage bucket and compliance table support document URLs, but the UI has no file picker.

**Fix:** Add file upload inputs (insurance doc, tax doc, other doc) in `OnboardingCompliance.tsx` using Supabase Storage upload.

### 10. A1 — Coverage approve/deny not audit-logged

`updateCoverageStatus` in `useProviderAdmin` directly updates the table with no audit trail.

**Fix:** Create an `admin_update_coverage_status` RPC that updates the coverage, creates an enforcement action, and writes an audit log entry.

### 11. D3/D4/D5 — Missing CHECK constraints on status columns

`provider_orgs.status`, `provider_coverage.request_status`, and `provider_coverage.coverage_type` accept any text.

**Fix:** Add CHECK constraints to these columns via the migration.

### 12. S3 — NOTE and REASSIGN_OWNER actions not handled in RPC

The `admin_provider_action` RPC only handles APPROVE/PROBATION/SUSPEND/REINSTATE.

**Fix:** Add NOTE (no status change, just logs enforcement action) and REASSIGN_OWNER (updates `accountable_owner_user_id` with metadata containing new owner user_id) cases.

### 13. S4 — No unique constraint on `accountable_owner_user_id`

Spec says one org per owner. No server-side enforcement.

**Fix:** Add `UNIQUE(accountable_owner_user_id)` constraint to `provider_orgs`.

---

## Technical Details

### New Migration

A single migration will handle all schema changes:

```text
1. ALTER TABLE provider_members ADD CONSTRAINT ... UNIQUE(provider_org_id, user_id)
2. ALTER TABLE provider_risk_flags ADD CONSTRAINT ... UNIQUE(provider_org_id, flag_type)
3. ALTER TABLE provider_orgs ADD CONSTRAINT ... UNIQUE(accountable_owner_user_id)
4. ADD CHECK constraints on provider_orgs.status, provider_coverage.request_status, provider_coverage.coverage_type
5. CREATE trigger protect_provider_org_admin_fields (prevents non-admin status/needs_review/owner changes)
6. CREATE OR REPLACE submit_provider_onboarding (fix ON CONFLICT target)
7. CREATE OR REPLACE admin_provider_action (add NOTE + REASSIGN_OWNER)
8. CREATE OR REPLACE admin_update_coverage_status RPC (audit-logged coverage approval)
```

### Frontend Changes

| File | Changes |
|------|---------|
| `src/pages/provider/OnboardingOrg.tsx` | Add useEffect to sync form state when org loads; fall back to useProviderOrg for orgId |
| `src/pages/provider/OnboardingCoverage.tsx` | Fall back to useProviderOrg for orgId on refresh |
| `src/pages/provider/OnboardingCapabilities.tsx` | Fall back to useProviderOrg for orgId on refresh |
| `src/pages/provider/OnboardingCompliance.tsx` | Fall back to useProviderOrg for orgId on refresh; add file upload inputs |
| `src/pages/provider/OnboardingReview.tsx` | Fall back to useProviderOrg for orgId on refresh |
| `src/pages/provider/Onboarding.tsx` | Fix DraftResumeScreen allowedZoneIds; add compliance warning in PendingReviewScreen |
| `src/hooks/useProviderAdmin.ts` | Replace direct coverage update with RPC call |

### Implementation Order

1. Database migration (all schema + RPC changes)
2. Frontend refresh-resilience fixes (P1, P2, P3)
3. Pending screen compliance warnings (P4)
4. Document upload UI (P6)
5. Admin coverage audit logging (A1)
