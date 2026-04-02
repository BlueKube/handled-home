# Round 12: Authentication & Identity Polish

> **Round:** 12 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — Auth & Identity (Features 1–8)
> **Execution mode:** Quality

---

## Features in Scope

1. Email/password signup and login with session persistence
2. Automatic profile creation and default customer role assignment
3. Multi-role support (customer, provider, admin simultaneously)
4. One-tap role switching without logout
5. Admin Preview Mode (view as any role)
6. "Account Not Configured" safety screen
7. Role-based route protection
8. Bootstrap RPC that repairs partial signups

---

## Audit Findings

### Issues Found

| # | Issue | Severity | File | Feature |
|---|-------|----------|------|---------|
| 1 | Hardcoded inline HSL colors bypass dark mode | MUST-FIX | AuthPage.tsx:124-125 | F1 |
| 2 | Bootstrap errors only console.logged, no user-facing message | SHOULD-FIX | AuthContext.tsx:98 | F8 |
| 3 | After bootstrap failure, user stuck at AccountNotConfigured with no retry | SHOULD-FIX | AuthContext.tsx + AccountNotConfigured.tsx | F6/F8 |
| 4 | AccountNotConfigured shows no user email for support | SHOULD-FIX | AccountNotConfigured.tsx | F6 |
| 5 | No visual indicator for admin preview mode | SHOULD-FIX | PreviewAsCard.tsx / layout | F5 |
| 6 | No loading feedback on role switch click | MINOR | RoleSwitcher.tsx | F4 |

### Already Solid (No Changes Needed)

- Session persistence via Supabase `onAuthStateChange` ✓
- Open redirect prevention on login redirect ✓
- Profile creation trigger with COALESCE fallback ✓
- RLS policies on auth tables ✓
- ProtectedRoute loading/auth/role checks ✓
- Bootstrap idempotency (ON CONFLICT DO NOTHING) ✓
- `bootstrapAttempted` useRef prevents retry loops ✓
- Preview mode clears on logout ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | AuthPage polish — dark mode + error UX | S | AuthPage.tsx | ✅ | ~15% |
| B2 | AuthContext + Bootstrap — error UX, retry | S | AuthContext.tsx | ✅ | ~18% |
| B3 | AccountNotConfigured + PreviewAsCard + RoleSwitcher | S | 3 files | ✅ | ~22% |

### Review Results
- **B1:** Clean — no issues. Dark mode HSL→Tailwind swap verified against CSS vars.
- **B2:** Clean — 1 low SHOULD-FIX (bootstrapError name slightly overloaded for general fetch errors; acceptable since user message is generic). No action needed.
- **B3:** Clean — all acceptance criteria verified. No issues found.

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** B3 (Round 12 complete)
- **Next up:** Round 12 complete — ready for Round 13 or PR
- **Context at exit:** ~22%
- **Blockers:** None
- **Round progress:** Phase 1 of 1 complete ✅
