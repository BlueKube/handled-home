

# Sprint 5 Review Fixes (S5-F1 through S5-F6)

## Findings Summary

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | HIGH | Waitlist INSERT allows unlimited unauthenticated writes — no rate limiting, attacker can inflate waitlist metrics that drive expansion decisions | Move waitlist signup to an edge function with rate limiting; remove public INSERT RLS policy |
| 2 | MEDIUM | `useJoinWaitlist` leaks zone boundary data by querying all zones with zip_codes client-side | Move zip→zone lookup server-side into the new edge function |
| 3 | MEDIUM | `notify_waitlist_on_launch` marks entries as "notified" but never actually sends email or calls `emit_notification` (waitlist entries have email but no user_id) | Add clear TODO/log acknowledging this is a "mark for external email" step; update return payload to flag that external email integration is needed |
| 4 | MEDIUM | `review_expansion_suggestion` is SECURITY DEFINER with no admin check — any authenticated user can approve/reject | Add `has_role(auth.uid(), 'admin')` check at top of function |
| 5 | MEDIUM | `p_decision` parameter accepts arbitrary text — no validation | Add check that `p_decision IN ('approved', 'rejected')` or raise exception |
| 6 | MEDIUM | `notify_waitlist_on_launch` has no admin check — any authenticated user can call it | Add `has_role(auth.uid(), 'admin')` check at top of function |

## Implementation Plan

### Migration: Fix RPCs (findings 4, 5, 6)

**`review_expansion_suggestion`** — surgical patch, two guards added at top:
```sql
IF NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'Admin role required';
END IF;

IF p_decision NOT IN ('approved', 'rejected') THEN
  RAISE EXCEPTION 'Decision must be approved or rejected';
END IF;
```
Rest of function unchanged.

**`notify_waitlist_on_launch`** — add admin check at top:
```sql
IF NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'Admin role required';
END IF;
```
Also add a log/comment acknowledging that marking status='notified' is a placeholder — actual email delivery requires external integration (e.g., SendGrid edge function). The RPC is not broken, it just can't send emails from inside Postgres. Return payload already includes `notified_count` which is correct.

**`get_waitlist_summary`** — convert from SQL to PL/pgSQL to add admin check:
```sql
IF NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'Admin role required';
END IF;
```

### Migration: Remove public INSERT RLS policy (finding 1)

Drop the `"Anyone can join waitlist"` INSERT policy. Waitlist signups will go through an edge function instead.

### Edge Function: `join-waitlist` (findings 1, 2)

New edge function that:
1. Validates email format and zip code format server-side
2. Rate limits by IP (e.g., 5 requests per hour per IP, tracked via a simple in-memory map or waitlist_entries count check)
3. Looks up zone_id server-side using service role (no zone data leaked to client)
4. Inserts into `waitlist_entries` using service role
5. Returns success/duplicate/rate-limited response — no zone boundary data exposed

### Hook: Rewrite `useJoinWaitlist` (finding 2)

Replace the current implementation that queries zones client-side with a simple edge function call:
```typescript
const res = await supabase.functions.invoke("join-waitlist", {
  body: { email, full_name, zip_code, source, referral_code }
});
```
No more `supabase.from("zones").select(...)` in the hook.

### Tasks.md Update

Add S5-F1 through S5-F6 tracking entries, mark done.

## Technical Details

- All three RPCs (`review_expansion_suggestion`, `notify_waitlist_on_launch`, `get_waitlist_summary`) use `SECURITY DEFINER` which bypasses RLS — the admin check must be inside the function body
- The `has_role()` function already exists and is the standard pattern used across the codebase
- Rate limiting in the edge function will use a DB query approach: count recent entries from same email in last hour, reject if > 5
- The edge function uses service role key so it can insert without needing a public INSERT RLS policy

