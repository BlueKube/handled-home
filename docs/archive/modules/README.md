# Handled Home — Module Development Guide

## How to Use This Folder

Each module file defines a self-contained feature area. When building a module:

1. **Read the module doc** to understand scope, tables, dependencies
2. **Read referenced docs** (`../masterplan.md`, `../design-guidelines.md`, etc.)
3. **Build tables first** (migration), then backend logic, then UI
4. **Test in isolation** before integrating

## Module Dependency Map

```
01-auth-and-roles ──────────────────────────────┐
02-property-profiles ──── requires 01 ──────────┤
03-zones-and-capacity ── requires 01 ───────────┤
04-sku-catalog ────────── requires 01, 03 ──────┤
05-subscription-engine ── requires 01, 04 ──────┤
06-service-day-system ─── requires 01–05 ───────┤
07-bundle-builder ─────── requires 04, 06 ──────┤
08-provider-onboarding ── requires 01, 03, 04 ──┤
09-job-execution ──────── requires 06–08 ───────┤
10-visit-tracking-photos ─ requires 09 ─────────┤
11-billing-and-payouts ── requires 05, 09 ──────┤
12-support-and-disputes ── requires 09–11 ──────┤
13-referrals-and-incentives ── requires 01, 05 ─┤
14-reporting-and-analytics ── requires all ──────┘
```

## Development Workflow

1. Pick the next unbuilt module (follow dependency order)
2. Open its doc — scope, tables, stories, acceptance criteria
3. Run the migration for its tables
4. Build backend (edge functions if needed)
5. Build UI pages (replace placeholders)
6. Test & verify
7. Move to next module
