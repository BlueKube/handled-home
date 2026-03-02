

This is Lovable's reply after committing to the main branch...

# Phase 7 — Code Review (Thorough)

## VERDICT: FAIL — 1 Critical (P0), 2 Serious (P1), 2 Moderate (P2)

---

## P0 — CRITICAL: `review_provider_application` RPC will crash at runtime

**File:** `supabase/migrations/20260302154707_...sql`, lines 75-100

The RPC calls `emit_notification_event` with parameters that **do not exist** on the function:

```sql
-- What the RPC passes:
PERFORM public.emit_notification_event(
  p_event_type := '...',
  p_audience_type := 'USER',        -- ← should be valid audience type
  p_audience_user_id := v_app.user_id,
  p_priority := 'critical',         -- ← should be uppercase 'CRITICAL'
  p_title := '...',                  -- ← DOES NOT EXIST
  p_body := '...',                   -- ← DOES NOT EXIST
  p_data := jsonb_build_object(...), -- ← DOES NOT EXIST (param is p_payload)
  p_idempotency_key := '...'
);
```

**Actual `emit_notification_event` signature** (from migration `20260225072206`):
```
p_event_type text, p_idempotency_key text, p_audience_type text,
p_audience_user_id uuid, p_audience_org_id uuid, p_audience_zone_id uuid,
p_priority text, p_payload jsonb, p_scheduled_for timestamptz
```

Three phantom parameters (`p_title`, `p_body`, `p_data`) will cause a Postgres error every time an admin tries to approve/reject an application. Additionally, `p_priority` uses lowercase `'critical'` but the rate limits table uses uppercase `'CRITICAL'`.

**Fix:** Replace the `PERFORM` call with correct parameters, packing title/body into `p_payload`:
```sql
PERFORM public.emit_notification_event(
  p_event_type := 'PROVIDER_APPLICATION_APPROVED',
  p_idempotency_key := 'app_review_' || p_application_id || '_' || p_decision,
  p_audience_type := 'PROVIDER',
  p_audience_user_id := v_app.user_id,
  p_priority := 'CRITICAL',
  p_payload := jsonb_build_object(
    'title', 'Application Approved!',
    'body', COALESCE(p_reason, 'Your provider application status has been updated.'),
    'application_id', p_application_id,
    'decision', p_decision,
    'org_id', v_org_id
  )
);
```

---

## P1-1 — Rules of Hooks violation in `useAdminApplications`

**File:** `src/hooks/useAdminApplications.ts`, lines 19-50

`applicationDetail` is a plain function (not prefixed with `use`) that internally calls `useQuery`. This violates React's Rules of Hooks. ESLint would flag it, and it could cause issues with hot-reload or strict mode.

**Fix:** Rename to `useApplicationDetail` and export it as a separate hook, or restructure the hook so the caller passes `id` and the query is called unconditionally at the top level of `useAdminApplications`.

---

## P1-2 — Applications tab is a navigation hack

**File:** `src/pages/admin/Providers.tsx`, line 48

```tsx
<TabsTrigger value="applications" onClick={() => navigate("/admin/providers/applications")}>
```

This tab has no `TabsContent`. Clicking it navigates away but also selects the tab value, causing a flash of empty content before navigation fires. If the user is already on `/admin/providers/applications` and navigates back, the tab state won't reflect correctly.

**Fix:** Replace the tab approach with a `Button` or `Link` styled consistently with the other tabs, or use a proper `TabsContent` that renders an inline version.

---

## P2-1 — `p_audience_type` uses `'USER'` but system expects `'CUSTOMER'` or `'PROVIDER'`

**File:** `supabase/migrations/20260302154707_...sql`, line 83

The `notification_rate_limits` seed data only has entries for `CUSTOMER`, `PROVIDER`, and `ADMIN`. Passing `'USER'` as `p_audience_type` means the notification won't match any rate limit and could be silently dropped or error depending on downstream logic.

**Fix:** Use `'PROVIDER'` since the applicant is becoming a provider.

---

## P2-2 — Excessive `as any` casts in `ApplicationDetail.tsx`

**File:** `src/pages/admin/ApplicationDetail.tsx`, lines 62-65

```tsx
const byoc = app.byoc_estimate_json as any;
const clausesAccepted = (app as any).agreement_clauses?.length || 0;
const complianceDocs = (app as any).compliance_docs || [];
```

The `agreement_clauses` and `compliance_docs` properties are appended in the hook's queryFn but aren't typed, forcing `as any` throughout. This masks potential property name mismatches.

**Fix:** Define a return type in the hook that extends the base row type with `agreement_clauses` and `compliance_docs`.

---

## Summary of Required Fixes

| # | Severity | Issue | Effort |
|---|----------|-------|--------|
| 1 | **P0** | `emit_notification_event` called with 3 non-existent params — RPC crashes | Migration patch |
| 2 | **P1** | Rules of Hooks violation in `applicationDetail` | Rename/restructure hook |
| 3 | **P1** | Tab navigation hack causes UX flash | Replace with link/button |
| 4 | **P2** | `audience_type = 'USER'` not in rate limits | Change to `'PROVIDER'` |
| 5 | **P2** | Untyped `as any` casts in detail page | Add return type to hook |

Shall I fix all five?

