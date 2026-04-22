# Session Handoff — between Round 64 phases 4 → 5

> **Last session ended:** 2026-04-22 · **Next session:** starts fresh at this handoff

---

## Round 64 status

| Phase | Status | Archive |
|---|---|---|
| Phase 1 (plan variants schema) | ✅ Shipped | pre-existing |
| Phase 2 (onboarding variant resolution + "Starts at" pricing) | ✅ Shipped | `docs/archive/round-64-phase-2-2026-04-21/` |
| Phase 3 (Credits UX + credit-pack purchase + autopay) | ✅ Shipped | `docs/archive/round-64-phase-3-2026-04-21/` |
| Phase 4 (Snap-a-Fix) | ✅ Shipped | `docs/archive/round-64-phase-4-2026-04-22/` |
| Phase 5 (Nav shape + Visit Detail) | ⬜ Not started | — |
| Phase 6 (Fall Prep bundle) | ⬜ Not started | — |
| Phase 7 (Provider tooling) | ⬜ Not started | — |
| Phase 8 (Admin + growth) | ⬜ Not started | — |

## PRs shipped 2026-04-22

| PR | Title | Status |
|---|---|---|
| #6  | Batch 4.1 — Snap-a-Fix schema (snap_requests, job_tasks, snap-photos bucket) | Merged |
| #7  | Bootstrap-chain fix (unblocked Supabase Preview for every PR) | Merged |
| #8  | Batch 4.2 — SnapSheet + SnapFab + useSubmitSnap | Merged |
| #9  | Batch 4.3 — snap-ai-classify edge function + AI preview wire-up | Merged |
| #10 | Batch 4.4 — routing RPCs + dispatch_requests + refund path | Merged (self-merged) |
| #11 | chore: assign roles to bkennington+ test users | Merged (self-merged) |
| #12 | chore: add auth-smoke scripts + mark Tier 3 credential TODO resolved | Merged (self-merged) |
| #13 | docs: Playwright env vars in settings.local.example.json | Merged (self-merged) |

## What's different going into the next session

New since Round 64 started:

1. **`docs/testing-strategy.md`** — living 5-tier testing protocol with canonical "Sarah the busy mom" persona as the AI judge. Next session's batches should cite the right tier and include Tier 2 Vitest coverage from day one.
2. **Self-merge authority.** I merge my own PRs after the pre-merge checklist (CI green / review protocol complete / doc sync / progress table updated / phase archive if applicable). Lesson from this session: actively poll `get_check_runs` instead of waiting on silent success-webhooks.
3. **Lane 4 synthesis must run as a sub-agent.** Inline synthesis cuts the corner and misses cross-read findings. Logged in `lessons-learned.md` under "Code review."
4. **Three test users provisioned.** `bkennington+{customer,provider,admin}@bluekube.com` with password `65406540`. Roles live in prod via migration `20260422210000`. Smoke scripts at `scripts/smoke-auth-roles.sh` and `scripts/smoke-auth.mjs` verify.

## Blockers still in play

- **Sandbox egress** doesn't include `handledhome.app` or `*.vercel.app`. Browser-based Playwright against the real app has to run from CI or a dev machine. The API-level smoke works from anywhere.
- **Playwright WebKit** not pre-installed in the sandbox; only Chromium-1194. `e2e/auth.setup.ts` uses iPhone 15 (WebKit). Workaround: add a Chromium-based auth-setup variant OR run on CI.
- **Supabase MCP** configured in `.mcp.json` but needs `SUPABASE_ACCESS_TOKEN` set in `.claude/settings.local.json` (gitignored). Until that lands, direct DB queries from the agent aren't available — use migrations via PR instead.
- **Types regen** for `snap_requests` / `job_tasks` / `dispatch_requests` still blocked on `SUPABASE_ACCESS_TOKEN`. Carried `as any` casts from Phase 4 are tracked in TODO.md for cleanup.

## Recommended next-session entry points

Pick **one** and have the next session start there:

### Option A — Start Phase 5

Read `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 255+ for Phase 5 PRD (nav restructure: 5-tab → 4-tab + center Snap FAB + avatar drawer; Visit Detail as one URL with preview/live/complete temporal modes). Decompose into 3–5 batches, seed a fresh `docs/working/plan.md`, begin Batch 5.1.

This is the largest, most strategically-valuable remaining work.

### Option B — Knock out scattered TODO items

From `docs/upcoming/TODO.md`, items the agent can handle autonomously:

- `BundleSavingsCard` family-awareness cleanup (drop the local translation map)
- `check-weather` edge function `[object Object]` error-serialization fix
- Feature 75 — confusion detector (per-session cadence change counter in Routine.tsx)
- Feature 263 — WorkSetup.tsx decomposition (469 → <300 lines)
- Feature 272 — ZoneBuilder.tsx decomposition (579 → <300 lines)
- Provider geo-indexes in WorkSetup.handleSave (h3-js is already installed)
- Admin review surface for variant-override flag (Phase 2 deferred)
- Public Browse live plan data (RLS policy or SECURITY DEFINER RPC)

Each is a small, self-contained batch. Good for warming up a fresh session before Phase 5.

### Option C — Start Phase 6 or Phase 7 first

Phases are not strictly ordered. If there's a business reason to prioritize Fall Prep bundle content (6), provider tooling (7), or admin + growth (8) over the nav restructure, skip Phase 5 for now.

## Pending human tasks (carried forward, not blocking)

See `docs/upcoming/TODO.md` — active items include:
- Stripe credit-pack product creation (Phase 3)
- `supabase functions deploy snap-ai-classify` (Phase 4)
- Smoke-test Phase 4 RPCs in prod
- Surface `SUPABASE_ACCESS_TOKEN` to unlock types regen + Supabase MCP in the sandbox
- Install WebKit + allow `handledhome.app`/`*.vercel.app` through sandbox egress to unlock full Tier 3 Playwright

---

## Session Handoff

- **Branch:** `main` (clean, synced at commit `3c90f7d`).
- **Last completed:** PR #13 merged. Phase 4 shipped + archived. Test users provisioned + verified.
- **Next up:** Pick Option A, B, or C above. Read `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` + this handoff first.
- **Context at previous exit:** 65% reported (≈32% actual per 2× calibration).
- **Blockers:** None for continuing work. See "Blockers still in play" for tools the agent can't currently use.
- **Round progress:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phases 5–8 ⬜.
