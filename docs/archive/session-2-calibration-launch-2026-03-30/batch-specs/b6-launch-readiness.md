# Batch 6: Pre-Launch Checklist & Smoke Test (PRD-026)

## Phase
Phase 5 — Launch Readiness

## Review: Quality (Medium — 3 agents, Lane 3 skipped)

## Why it matters
Before launching a zone, operators need a single page showing green/red status for every prerequisite: Stripe webhooks, cron health, zones configured, SKUs calibrated, providers onboarded, BYOC links, email delivery. Without this, launch readiness is a manual checklist.

## Scope
- Create `/admin/launch-readiness` page with automated status checks
- Add nav item in AdminShell
- Register route in App.tsx
- Each check item shows green (pass) or red (fail) with description

## Non-goals
- Does NOT auto-fix failing checks
- Does NOT integrate with external monitoring (PagerDuty, etc.)
- Does NOT block zone activation on failing checks

## File targets
| Action | File |
|--------|------|
| Create | src/pages/admin/LaunchReadiness.tsx |
| Modify | src/components/admin/AdminShell.tsx |
| Modify | src/App.tsx |

## Acceptance criteria
- [ ] Page renders at /admin/launch-readiness
- [ ] Nav item visible in AdminShell under Governance or Markets group
- [ ] Shows status checks: zones configured, SKUs active, plans active, providers onboarded, cron health
- [ ] Each check shows green/red badge with description
- [ ] Loading skeleton while data fetches
- [ ] Build passes (npx tsc --noEmit && npm run build)

## Regression risks
- New lazy import in App.tsx could affect bundle splitting
- AdminShell nav item order should follow existing patterns
