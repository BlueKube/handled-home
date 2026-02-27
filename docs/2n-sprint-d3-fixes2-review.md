# Sprint D3 — Fixes Round 2 Review

**Commit reviewed:** `ff31d21` ("D3-F1/F2 RPC rewrite")
**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27

---

## Verdict: FAIL — RPC rewrite introduces 2 regressions

D3-F1 auth check and D3-F2 drop detection are correctly added, but the rewritten RPC body has two bugs that will cause incorrect scores at runtime.

---

## What Was Fixed (correctly)

**D3-F1 (HIGH) — Auth check: RESOLVED.**
**D3-F2 (MEDIUM) — Drop detection: RESOLVED.**

---

## New Regressions

### D3-F4 (HIGH) — Job status case mismatch: `'completed'` vs `'COMPLETED'`
- Fixed: Changed to `'COMPLETED'` per CHECK constraint.

### D3-F5 (HIGH) — Coverage query joins wrong table
- Fixed: Restored three-table join through `routines` table.

---

## Resolution

Both regressions fixed in migration that replaces the RPC with corrected status casing and proper join chain.
