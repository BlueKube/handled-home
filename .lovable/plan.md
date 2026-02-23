

# SQL Test Snippets + Admin Test Toggles

## Part 1: SQL Snippets in docs (immediate)

Add a "Test Toggles (SQL)" section to `docs/Scenario-Test-Results.md` with copy-paste SQL using exact seeded IDs and correct typing.

### G-03: Market state to SOFT_LAUNCH (proxy for "not open")

No WAITLIST enum value exists. Use SOFT_LAUNCH as the "limited/invite-only" state per the recommendation. Update G-03 scenario language accordingly.

```sql
-- ACTIVATE: Set mowing to SOFT_LAUNCH for Austin Central
UPDATE market_zone_category_state
SET status = 'SOFT_LAUNCH', updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';

-- RESTORE:
UPDATE market_zone_category_state
SET status = 'OPEN', updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';
```

### G-09: Disable receipt_share surface (weight = 0)

Uses `to_jsonb()` for proper JSON number typing and `create_missing = true`.

```sql
-- ACTIVATE:
UPDATE growth_surface_config
SET surface_weights = jsonb_set(surface_weights, '{receipt_share}', to_jsonb(0::numeric), true),
    updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';

-- RESTORE (seeded value = 1):
UPDATE growth_surface_config
SET surface_weights = jsonb_set(surface_weights, '{receipt_share}', to_jsonb(1::numeric), true),
    updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';
```

### G-10: Set reminder cap to 1 for suppression testing

Uses 1 (not 0) so behavior is "suppress after first prompt" rather than ambiguous "disable vs unlimited."

```sql
-- ACTIVATE:
UPDATE growth_surface_config
SET prompt_frequency_caps = jsonb_set(prompt_frequency_caps, '{reminder_per_week}', to_jsonb(1::numeric), true),
    updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';

-- RESTORE (seeded value = 3):
UPDATE growth_surface_config
SET prompt_frequency_caps = jsonb_set(prompt_frequency_caps, '{reminder_per_week}', to_jsonb(3::numeric), true),
    updated_at = now()
WHERE zone_id = 'b1000000-0000-0000-0000-000000000001'
  AND category = 'mowing';
```

---

## Part 2: Admin Test Toggles Page

A lightweight page at `/admin/test-toggles` that wraps existing hooks. Since `Growth.tsx` already has the full surfaces UI, this page focuses on **quick state flips** with safety guardrails.

### Safety guardrails
- Yellow banner: "Test Toggles -- changes affect live zone behavior. All changes are audit-logged."
- Every state change calls `overrideState` with `reason = "test toggle"` (already writes to `growth_autopilot_actions` + `admin_audit_log`)
- "Reset to Seeded Defaults" button restores exact seeded values

### UI sections

1. **Zone/Category selector** -- dropdown pre-filled with Austin Central / mowing
2. **Market State** -- RadioGroup with CLOSED / SOFT_LAUNCH / OPEN / PROTECT_QUALITY, one-click apply via `overrideState.mutate()`
3. **Surface Weights** -- 3 sliders (receipt_share, provider_share, cross_pollination), 0-1 range, step 0.1, calls `upsertConfig.mutate()`
4. **Frequency Caps** -- 2 number inputs (share_per_job, reminder_per_week), calls `upsertConfig.mutate()`
5. **Reset to Defaults** button -- restores to seeded values: weights `{receipt_share:1, provider_share:1, cross_pollination:1}`, caps `{share_per_job:2, reminder_per_week:3}`

### Canonical defaults constant

A single source of truth for reset values, defined in the page file:

```text
SEEDED_DEFAULTS = {
  weights: { receipt_share: 1, provider_share: 1, cross_pollination: 1 },
  caps: { share_per_job: 2, reminder_per_week: 3 }
}
```

---

## Files

| File | Action |
|------|--------|
| `docs/Scenario-Test-Results.md` | Add "Test Toggles (SQL)" section with 3 blocks; update G-03 language to say SOFT_LAUNCH |
| `src/pages/admin/TestToggles.tsx` | New page: zone selector, state radio, weight sliders, cap inputs, reset button, safety banner |
| `src/App.tsx` | Add route `/admin/test-toggles` with `ProtectedRoute requiredRole="admin"` |

### Hooks reused (no new hooks)

- `useMarketZoneState` -- for state radio + overrideState
- `useGrowthSurfaceConfig` -- for weights/caps + upsertConfig
- `useZones` -- for zone dropdown

### Key decisions

- **No WAITLIST enum** -- use SOFT_LAUNCH for G-03 testing
- **Weights are 0-1 floats** -- sliders match existing Growth.tsx pattern
- **SQL uses `to_jsonb()`** -- prevents string-vs-number jsonb gotcha
- **G-10 cap = 1** (not 0) -- avoids ambiguous "0 = disabled vs unlimited"
- **Restore values match seeded data** -- not schema defaults (which differ)
