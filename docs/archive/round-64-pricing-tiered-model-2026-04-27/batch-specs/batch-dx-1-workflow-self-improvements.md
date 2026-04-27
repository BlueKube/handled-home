# Batch DX.1 — Workflow self-improvements

> **Round:** 64 (post-Phase 5) · **Size:** Micro
> **Review:** Quality — 1 combined Sonnet reviewer (CLAUDE.md §5 Micro tier)
> **Branch:** `chore/dx-1-workflow-self-improvements`

---

## Problem

Five recurring workflow frictions accumulated across the Round 64 Phase 5 sessions, each costing minutes-per-cycle. They're all small, additive, and high-leverage. Bundling them into one Micro batch closes them before Phase 6 starts.

## Goals

1. **Drop the Stitch MCP server** from `.mcp.json` — never used in this codebase, ships a hardcoded `Bearer` token in the repo, costs ~30k context tokens / agent cycle in deferred tool warmth.
2. **`scripts/pre-pr-check.sh` + `/pre-pr` slash command** — run `tsc + build + vitest` in parallel with concise summary. Replaces the 7× I ran them manually in the prior session.
3. **`scripts/check-migration-chain.sh`** — validates new `supabase/migrations/*.sql` files include a `-- Previous migration: <filename>` header pointing at an existing file. Catches the orphan-chain trap (lessons-learned.md ~line 397) before push.
4. **`.claude/commands/closeout.md`** — slash command for the post-merge closeout flow (sync main → branch → update plan.md handoff + sarah-backlog if needed → docs PR → self-merge for docs-only). Replaces 5× manual closeout PRs in the prior session.
5. **`.github/workflows/regen-types.yml`** — runs on push to `main` when `supabase/migrations/**` changes. Calls `supabase gen types typescript --project-id $REF`, opens an auto-PR. **Half-blocked**: needs `SUPABASE_ACCESS_TOKEN` in GH Secrets (logged in TODO.md). Ships dormant; activates as soon as the secret lands. Closes the recurring `as any` carry-over pattern.

Plus two not-actionable-from-this-repo items logged for posterity:
6. `mcp__github__get_workflow_run_logs` MCP tool — upstream MCP server gap (lessons-learned entry).
7. `issue_comment.edited` webhook subscription — Anthropic agent harness gap (lessons-learned entry).

## Acceptance criteria

- [ ] `.mcp.json` no longer references Stitch.
- [ ] `scripts/pre-pr-check.sh` runs locally, produces a concise pass/fail summary, exits non-zero on failure.
- [ ] `/pre-pr` slash command file exists and invokes the script.
- [ ] `scripts/check-migration-chain.sh` exists, runs locally, exits non-zero when given a bad migration.
- [ ] `.claude/commands/closeout.md` exists with the standard closeout protocol.
- [ ] `.github/workflows/regen-types.yml` exists and is yaml-valid.
- [ ] `docs/upcoming/TODO.md` has the `SUPABASE_ACCESS_TOKEN` entry.
- [ ] `lessons-learned.md` has 2 new entries (#6 + #7).
- [ ] `docs/working/plan.md` shows DX.1 ✅ at the end.
- [ ] `npx tsc --noEmit` clean (no source change).

## Out of scope

- Updating any other Claude harness behavior (out of repo's reach).
- Changing the Supabase MCP server config (working as designed).
- Replacing existing slash commands (additive only).
- Anything that depends on `SUPABASE_ACCESS_TOKEN` running today (workflow ships dormant).

## Risk

Trivial. Worst case: a script has a typo, fails when invoked, no production impact.
