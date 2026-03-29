# PRD-002: Frontend Performance & Observability

> **Execution mode:** Quality
> **Priority:** P1 — Foundation for all subsequent PRDs
> **Source:** gstack Eng Review (2026-03-29), Risks 3-5

---

## Problem Statement

The frontend loads all 142 pages synchronously (no code splitting), the QueryClient has no staleTime configuration (every navigation re-fetches everything), and scheduled Edge Functions have no failure alerting. These infrastructure gaps affect performance, database load, and operational visibility.

---

## Goals

1. Add React.lazy code splitting — reduce initial bundle by 60-70%
2. Configure QueryClient with sensible staleTime defaults
3. Add DEPLOYMENT.md pg_cron configuration guidance

---

## Non-Goals

- Refactoring component architecture
- Adding new pages or features
- Changing Edge Function business logic (covered in PRD-001)
- Full pg_cron migration (noted as future work)

---

## Scope

### Batch 1: React.lazy code splitting + QueryClient config
- Wrap all page imports in App.tsx with React.lazy()
- Add Suspense boundaries with loading fallbacks
- Configure QueryClient with staleTime: 60_000 (1 min default), gcTime: 300_000 (5 min)
- Group imports by role (customer, provider, admin) for natural chunk boundaries

### Batch 2: pg_cron documentation
- Update DEPLOYMENT.md with pg_cron SQL examples for all 11 scheduled functions
- Document that service role key must be used in Authorization header

---

## Acceptance Criteria
- [ ] All page imports use React.lazy()
- [ ] Suspense boundary wraps the Routes with a loading fallback
- [ ] QueryClient has staleTime and gcTime configured
- [ ] npm run build passes with reduced chunk warnings
- [ ] npx tsc --noEmit passes
- [ ] DEPLOYMENT.md has pg_cron configuration examples
