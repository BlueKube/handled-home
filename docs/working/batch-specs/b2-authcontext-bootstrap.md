# Batch 2: AuthContext + Bootstrap — Error UX & Retry

## Phase
Round 12: Authentication & Identity

## Review: Quality

## Scope
Single file: `src/contexts/AuthContext.tsx`

## Changes
1. **Surface bootstrap errors to UI** — Currently, bootstrap errors are only `console.error`'d (line 98). Add a `bootstrapError` state that the AccountNotConfigured screen can read to show a user-facing error message.
2. **Enable retry after bootstrap failure** — Expose a `retryBootstrap` function in the context so AccountNotConfigured can offer a "Try Again" button. Reset `bootstrapAttempted` ref and re-run `fetchUserData`.

## Acceptance Criteria
- [ ] Bootstrap RPC errors surface via context state (not just console)
- [ ] `retryBootstrap()` function exposed in AuthContext
- [ ] Retry resets the `bootstrapAttempted` flag and re-fetches user data
- [ ] No infinite loops — retry is manual, not automatic
- [ ] Existing happy-path behavior unchanged
