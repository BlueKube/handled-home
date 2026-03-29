# Batch 1: Shared Edge Function Utilities (`_shared/`)

## Phase
Phase 1 — Edge Function Security Hardening

## Review: Quality

## Why it matters
Every subsequent batch (B2-B4) depends on importing shared auth utilities. Without a standardized auth layer, each of the 19 function fixes would re-implement auth logic independently — the exact problem that created the current vulnerability surface.

## Scope
- Create `supabase/functions/_shared/cors.ts` — shared CORS headers with origin restriction
- Create `supabase/functions/_shared/auth.ts` — four auth utility functions
- Create `supabase/functions/_shared/deps.ts` — re-exported pinned dependencies

## Non-goals
- Migrating existing functions to use `_shared/` (that's B2-B4)
- Changing any existing function behavior
- Adding new Edge Functions

## File targets
| Action | File |
|--------|------|
| Create | supabase/functions/_shared/cors.ts |
| Create | supabase/functions/_shared/auth.ts |
| Create | supabase/functions/_shared/deps.ts |

## Acceptance criteria
- [ ] `_shared/auth.ts` exports: `requireServiceRole`, `requireCronSecret`, `requireUserJwt`, `requireAdminJwt`
- [ ] `_shared/cors.ts` exports shared CORS headers (no wildcard `*` for sensitive endpoints)
- [ ] `_shared/deps.ts` re-exports pinned Supabase client creator
- [ ] All files use Deno-compatible imports
- [ ] No existing functions are modified

## Regression risks
- None — this batch only creates new files
