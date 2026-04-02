# Round 14: Property Profiles Polish

> **Round:** 14 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe` (continuing on same branch)
> **Phase:** Single phase — Property Profiles (Features 9–16)
> **Execution mode:** Quality

---

## Features in Scope

9. Property profile (address, access notes, gate codes, pets, parking)
10. Real-time zone coverage indicator
11. Property gate for new customers
12. Coverage Map (10-category self-assessment)
13. Property Sizing Tiers (sqft, yard, windows, stories)
14. Progressive "Complete Home Setup" card
15. `get_property_profile_context` RPC
16. Personalization event logging

---

## Audit Findings

### Issues Found (Actionable in Polish Round)

| # | Issue | Severity | File | Feature |
|---|-------|----------|------|---------|
| 1 | Property.tsx is 456 lines — over 300 threshold | MUST-FIX | Property.tsx | F9 |
| 2 | HomeSetupCard returns null when complete — no success state | SHOULD-FIX | HomeSetupCard.tsx | F14 |
| 3 | HomeSetupCard returns null while loading — should show skeleton | SHOULD-FIX | HomeSetupCard.tsx | F14 |
| 4 | CustomerPropertyGate silently catches errors — no error state | SHOULD-FIX | CustomerPropertyGate.tsx | F11 |
| 5 | SVG progress ring in HomeSetupCard missing aria progressbar role | SHOULD-FIX | HomeSetupCard.tsx | F14 |

### Out of Scope (Per Polish Round Rules)

- Semantic HTML refactoring (radio buttons instead of divs) — working pattern
- Adding retry logic to hooks — new feature
- Event logging improvements — new feature
- ARIA roles on all form elements — too broad, working pattern refactor
- Return URL validation — already validated with startsWith("/")

### Already Solid

- Property form validation with touched state ✓
- Zone coverage debounced lookup ✓
- Coverage Map save/load with upsert ✓
- Property Sizing save/load ✓
- RPC with VOLATILE flag fix ✓
- Personalization event logging on save ✓
- Dark mode colors across all components ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Property.tsx decomposition (456→345 + 2 extracted) | M | 3 files | ✅ | ~22% |
| B2 | HomeSetupCard + CustomerPropertyGate polish | S | 2 files | ✅ | ~24% |

### Review Results
- **B1:** Pending background review
- **B2:** Pending background review

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** B2 (Round 14 complete)
- **Next up:** Round 14 complete — ready for Round 15
- **Context at exit:** ~24%
- **Blockers:** None
- **Round progress:** Phase 1 of 1 complete ✅
