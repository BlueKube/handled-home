# Batch B2 — New Market Launch Module (R3)

> **Size:** M
> **Review:** Senior Editor + Fact Checker + Synthesis (3 lanes)

---

## Deliverables

### 1. New file: `src/constants/academy/market-launch.ts`

Export `marketLaunchSections: TrainingSection[]` with these sections:

**Overview** — What this module covers and why it matters. Bridge from "managing the admin console" to "launching and growing a market." This is the strategic companion to the tactical modules.

**Provider Targeting — Who to Recruit First** (type: text)
- Three provider archetypes: A (mid-career, 15-25 customers, primary target), B (new, 0-5 customers, backup), C (established 40+, don't target at launch)
- Where to find Archetype A providers: Thumbtack/Angi listings (4-4.5 stars, not 5), Google Maps reviews, Nextdoor, trade associations, Facebook groups
- Generalize from Austin — make the sourcing channels market-agnostic

**The Pitch — Value Prop and Objection Handling** (type: text)
- The value proposition script (adapted from playbook, senior-operator voice)
- 4 key objection handlers: "why give you a cut", "steal my customers", "already have enough", "how much do I get paid"
- BYOC as the entry point that removes risk

**Pilot Launch Checklist** (type: walkthrough)
- Pre-launch (30 days before): 8 pre-screened providers, 50-customer waitlist, SKU calibration, pricing set, capacity blocked
- Soft launch (weeks 1-2): activate waitlist, cap at 75% capacity, find operational issues, get NPS above 40
- Go-live graduation: NPS >40, issue rate <8%, 8+ active providers, utilization 60-80%
- Scaling: 12-week timeline with milestones, generalized from playbook Phase 4

**Success Metrics — What to Measure and When** (type: text)
- 5 data points at 12 weeks: BYOC activation rate, 60-day retention, provider utilization, issue rate, unit economics
- Target values for each with context on why that threshold matters

**Pro Tips** — Recruitment-specific wisdom

**Watch-Outs** — Common launch mistakes

**Automation** — What's automated vs. what needs human judgment in a launch

### 2. Register in `academy-modules.ts`

- Import `marketLaunchSections` from `./academy/market-launch`
- Add module entry with id "market-launch", appropriate icon (Rocket from lucide-react), category "setup" or "onboarding"
- Estimated 30 minutes

---

## Acceptance Criteria

- [ ] market-launch.ts exports valid TrainingSection[]
- [ ] Module registered in academy-modules.ts with correct import and icon
- [ ] Cross-references from B1 (SKU Catalog, Zones & Markets) now point to an existing module
- [ ] Content generalized from Austin — no city-specific details
- [ ] Voice matches senior-operator mentoring tone
- [ ] No type errors, build passes
