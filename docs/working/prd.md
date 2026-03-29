# PRD-003: BYOC Flow End-to-End Fix

> **Execution mode:** Quality
> **Priority:** P1 — Primary growth engine
> **Source:** gstack Growth Audit + UI/UX Audit (2026-03-29)

---

## Problem Statement

The BYOC loop is the company's primary growth engine but has execution breaks at critical moments: "No enabled categories found" when creating invite links (data state, not bug — needs better UX), empty SMS scripts, provider empty states with no forward CTAs, and a BYOC Center pre-approval gate that's a dead end.

---

## Goals

1. Fix BYOC link creation UX when categories are empty (link to capability setup)
2. Seed SMS invite scripts in the database
3. Add forward-action CTAs to provider empty states (Jobs, History, Organization)
4. Improve BYOC Center pre-approval waiting state
5. Improve auth page with invite context (show provider name when arriving via BYOC)

---

## Scope

### Batch 1: BYOC link creation + SMS scripts
- In ByocCreateLink.tsx: Replace "No enabled categories found" with a helpful message and CTA linking to capability setup (/provider/onboarding/capabilities or /provider/coverage)
- Create a migration to seed 3 invite scripts in the `invite_scripts` table (casual, professional, brief tones)

### Batch 2: Provider empty state CTAs
- Jobs.tsx: Add "Set up your work profile" or "Invite your first customer" CTA in empty state
- History.tsx: Add "View upcoming jobs" link in empty state
- Organization.tsx: Add "Complete Onboarding" button linking to /provider/onboarding

### Batch 3: BYOC Center pre-approval + Auth page invite context
- ByocCenter.tsx: Improve pre-approval gate with progress indicator, estimated timeline, and "Check Application Status" link
- AuthPage.tsx: When arriving via BYOC invite redirect (?redirect=/byoc/activate/TOKEN), show provider context ("You were invited by [Provider Name]")

---

## Acceptance Criteria
- [ ] ByocCreateLink shows helpful CTA when no categories enabled (not just an error message)
- [ ] 3 SMS invite scripts are seeded and visible on BYOC Center
- [ ] Jobs, History, Organization empty states each have a forward-action CTA
- [ ] BYOC Center pre-approval gate shows progress and next steps
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes
