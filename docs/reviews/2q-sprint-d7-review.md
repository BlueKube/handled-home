# Sprint D7 Review — PASS with 2 findings

## D6 Fix Verification
All three D6 findings (F1/F2/F3) correctly fixed in migration 20260227045346.

## Findings

### D7-F1 — HIGH — book_home_assistant silent spend failure
- **Problem**: `PERFORM spend_handles(...)` silently discards return value. `spend_handles` returns `{success: false}` on insufficient balance instead of raising. Zero-balance user gets free booking.
- **Fix**: Added balance pre-check (`handles_balance < handle_cost → RAISE EXCEPTION`) and changed `PERFORM` to `SELECT * INTO v_spend` with success check.

### D7-F2 — MEDIUM — Home Assistant SKUs missing fulfillment_mode
- **Problem**: All 5 seeded SKUs inherited `same_day_preferred` default — incorrect for window-based scheduling.
- **Fix**: Added `window_booking` value to `fulfillment_mode` enum. Updated all Home Assistant SKUs.

## Migrations Applied
1. RPC rewrite with balance pre-check (migration)
2. Enum extension: `fulfillment_mode` + `'window_booking'` (migration)
3. Data update: set `fulfillment_mode = 'window_booking'` on HA SKUs (insert tool)
