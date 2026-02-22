

# Module 02 Cleanup: Drop Redundant RLS Policy

## Context
Claude Code's review identified that the `properties` table has two overlapping policies:
- `"Users can manage their own properties"` — FOR ALL (covers SELECT, INSERT, UPDATE, DELETE)
- `"Users can view their own properties"` — FOR SELECT only

The SELECT-only policy is redundant since the FOR ALL policy already covers SELECT. Not a bug, but unnecessary clutter.

## Regarding the other findings

- **Issue 4 (placeholder page)**: Already fully implemented — property form with address fields, access/logistics section, zone coverage indicator, sticky save button, validation, prefill, onboarding gate, and non-serviced area dialog are all live.
- **Issues 2 and 3 (provider access, delete protection)**: Correctly deferred — both require the `jobs` table which will be built in a future module.

## Change

**Single database migration** to drop the redundant policy:

```sql
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
```

No code changes needed. No other files affected.
