

# Module 10 — Code Review Fixes

Three issues identified by the code review, plus one spec cleanup.

---

## Fix P1: NextVisitCard navigation dead clicks

**Problem**: The onClick handler only navigates for COMPLETED/PARTIAL_COMPLETE statuses. For Planned, En route, In progress, and Issue states, clicking the button does nothing.

**Fix**: Add navigation for all states:
- Planned: scroll to the 4-week timeline section (use `document.getElementById` or just navigate to dashboard anchor)
- In progress / En route / Issue: navigate to `/customer/visits/${job.id}` (the receipt page handles all statuses)

**File**: `src/components/customer/NextVisitCard.tsx` (lines 62-74)

---

## Fix P3: useFourWeekPreview hardcodes jobs to Week 1

**Problem**: Lines 88-96 always overlay jobs onto `weeks[0]` regardless of their `scheduled_date`. A job scheduled for next week still shows in "This Week."

**Fix**: Compute which week a job belongs to by comparing `job.scheduled_date` against the current date:
- Calculate the Monday of the current week
- Determine `weekIndex` from `(jobDate - mondayOfThisWeek) / 7`
- Clamp to 0-3 range; only overlay if within the 4-week window
- Fall back to week 0 if `scheduled_date` is null

**File**: `src/hooks/useFourWeekPreview.ts` (lines 82-97)

---

## Fix R1: Customer issue photos unreadable

**Problem**: Issue photos are uploaded to `issues/{jobId}/{photoId}.jpg` in the `job-photos` bucket. The read policy joins through the `job_photos` table (`jp.storage_path = name`), but issue photos are never inserted into `job_photos` -- they're stored as `photo_storage_path` on the `customer_issues` table. So customers can upload but never read back their issue photos.

**Fix**: Add a new storage SELECT policy (via migration) that also checks `customer_issues.photo_storage_path`:

```sql
CREATE POLICY "Customers can read own issue photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM public.customer_issues ci
      WHERE ci.photo_storage_path = name
        AND ci.customer_id = auth.uid()
    )
  );
```

**File**: New migration SQL

---

## Spec Cleanup: Remove outdated short spec

**Problem**: `docs/modules/10-visit-tracking-photos.md` still references `visit_ratings` table and ratings acceptance criteria. The expanded spec `10-customer-dashboard-and-proof.md` explicitly excludes ratings (section 2.2). These contradict.

**Fix**: Replace `10-visit-tracking-photos.md` with a redirect note pointing to the canonical spec:

```
# Module 10: Visit Tracking & Photos

> This module has been superseded by `10-customer-dashboard-and-proof.md`.
> See that document for the full specification.
```

**File**: `docs/modules/10-visit-tracking-photos.md`

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/customer/NextVisitCard.tsx` | Add navigation for all job statuses (P1) |
| `src/hooks/useFourWeekPreview.ts` | Use `scheduled_date` to place jobs in correct week (P3) |
| New migration SQL | Add storage policy for customer issue photos (R1) |
| `docs/modules/10-visit-tracking-photos.md` | Replace with redirect to canonical spec |

