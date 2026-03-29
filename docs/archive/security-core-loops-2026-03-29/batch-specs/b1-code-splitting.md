# Batch 1: React.lazy Code Splitting + QueryClient Config

## Phase
Phase 2 — Frontend Performance & Observability

## Review: Quality

## Why it matters
All 142 pages load synchronously on first request. On mobile LTE, this produces unacceptable first-load times. QueryClient with no staleTime means every navigation re-fetches all data.

## Scope
- Convert all page imports in App.tsx to React.lazy()
- Add Suspense boundary with loading fallback
- Configure QueryClient with staleTime: 60_000, gcTime: 300_000
- Keep non-page imports (components, contexts) as static imports

## Non-goals
- Per-route loading states (a single Suspense boundary is sufficient)
- Changing route definitions
- Adding new pages

## File targets
| Action | File |
|--------|------|
| Modify | src/App.tsx |

## Acceptance criteria
- [ ] All page imports use React.lazy(() => import(...))
- [ ] Suspense boundary wraps Routes with a loading fallback
- [ ] QueryClient configured with staleTime and gcTime
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes

## Regression risks
- React.lazy requires default exports on all page components. Verify all pages use `export default`.
- Suspense fallback must not flash on fast navigations — a minimal spinner or null is appropriate.
