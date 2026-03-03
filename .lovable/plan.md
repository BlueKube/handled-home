

# Sprint 3 Audit Findings — Fix Plan

Two findings from Claude Code's full audit need fixing before Sprint 5.

---

## S3-F1 (CRITICAL): Threshold Config Key Mismatches

**Problem**: The seed migration uses different key names than the edge function and UI. Admin threshold changes are written under seeded keys but the edge function looks up different keys — so admin edits are silently ignored.

| Seeded (DB) | Edge Function Expects |
|---|---|
| `protect_quality_enter` | `protect_quality_utilization_enter` |
| `protect_quality_exit` | `protect_quality_utilization_exit` |
| `provider_recruiting_trigger_util` | `provider_recruiting_utilization_trigger` |
| (missing) | `min_time_in_state_days` |

Additionally, `ThresholdDials.tsx` line 20 uses `provider_recruiting_utilization` — a third variant that matches neither.

**Fix**: Data migration to UPDATE the 4 mismatched `config_key` values in `zone_state_threshold_configs` to match what the edge function expects. No code changes needed — the edge function keys are already correct, and `ThresholdDials.tsx` already uses the correct keys for 3 of 4. Fix the ThresholdDials label map entry from `provider_recruiting_utilization` → `provider_recruiting_utilization_trigger`.

Changes:
1. **SQL data migration** — UPDATE 4 rows in `zone_state_threshold_configs` to rename keys
2. **ThresholdDials.tsx** — Fix label map key on line 20

---

## S3-F2 (HIGH): Waitlist Preference Chips Silently Dropped

**Problem**: `CategoryWaitlistSheet` collects `selectedChips` but never passes them. The hook and edge function don't accept metadata.

**Fix** (3 files):
1. **`useWaitlist.ts`** — Add `metadata?: Record<string, unknown>` to the mutation input type; pass it in the body
2. **`join-waitlist/index.ts`** — Extract `metadata` from request body; include it in the INSERT
3. **`CategoryWaitlistSheet.tsx`** — Pass `metadata: { category, preferences: selectedChips }` in the `mutateAsync` call

---

## Technical Details

### S3-F1 SQL Migration
```sql
UPDATE zone_state_threshold_configs SET config_key = 'protect_quality_utilization_enter' WHERE config_key = 'protect_quality_enter';
UPDATE zone_state_threshold_configs SET config_key = 'protect_quality_utilization_exit' WHERE config_key = 'protect_quality_exit';
UPDATE zone_state_threshold_configs SET config_key = 'provider_recruiting_utilization_trigger' WHERE config_key = 'provider_recruiting_trigger_util';
UPDATE zone_state_threshold_configs SET config_key = 'minimum_time_in_state_days', description = 'Minimum days before non-emergency state change' WHERE config_key = 'minimum_time_in_state_days';
```
Wait — need to check if `minimum_time_in_state_days` exists or if it's `min_time_in_state_days` in the seed. The edge function expects `min_time_in_state_days`. The ThresholdDials uses `min_time_in_state_days`. Need to verify the seed has a row for this at all.

The seed migration shows no row for `minimum_time_in_state_days` or `min_time_in_state_days` — so the edge function always uses the fallback `?? 7`. If we want admin-tunable, we INSERT it. But the ThresholdDials label map already has `min_time_in_state_days` on line 21, so it will render if the row exists.

**Revised SQL**: 3 UPDATEs + 1 INSERT for the missing `min_time_in_state_days` row.

### S3-F2 Changes
Minimal — add `metadata` passthrough across 3 files. The `waitlist_entries.metadata` JSONB column already exists.

---

## Scope
- 1 data migration (4 SQL statements)
- 3 file edits (ThresholdDials.tsx, useWaitlist.ts, join-waitlist/index.ts, CategoryWaitlistSheet.tsx)
- No schema changes needed — columns already exist

