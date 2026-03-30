# Batch 1 — Content Gap Fixes

> **Review:** Quality (Lane A: Senior Editor + Lane B: Fact Checker + Lane C: Synthesis)
> **Size:** Small
> **Files:** `src/constants/academy/growth-incentives.ts`, `src/constants/academy/jobs-scheduling.ts`

---

## R1.1 — Expand BYOP funnel in growth-incentives.ts

**Problem:** The BYOP (Bring Your Own Provider) funnel gets one sentence ("track recommendations per month") while BYOC and Referral funnels each get full health benchmarks and operational guidance. BYOP is described as one of three growth engines but receives disproportionately thin coverage.

**Fix:** Add operational content to the existing `funnels` section (id: "funnels") covering:
- What happens when a BYOP recommendation arrives (where it appears, who reviews it)
- How long review typically takes (weeks, not days — already noted)
- What the rejection criteria are (geographic mismatch, over-saturated zone, unverifiable credentials)
- What a healthy BYOP pipeline looks like (recommendations per month, contact success rate)
- How BYOP differs operationally from BYOC (BYOC is provider-initiated with existing customers; BYOP is customer-initiated recommending a new provider)

**Acceptance criteria:**
- BYOP section is at least 4-5 sentences with specific operational guidance
- Health benchmarks provided (even if approximate)
- Consistent voice with the BYOC and Referral funnel descriptions above it

---

## R1.2 — Add Window Templates to jobs-scheduling.ts

**Problem:** A pro tip references "the Window Templates page" as "quietly one of the most powerful tools" but it's never introduced as a concept anywhere in the module. An operator reading the tip has no context for what Window Templates are or how to use them.

**Fix:** Add a brief text section (or expand the scheduling-policy section) explaining:
- What Window Templates are (pre-configured appointment window patterns per SKU or zone)
- Where to find them in the admin UI
- When you'd create or modify a template (e.g., different window patterns for different service types)
- One concrete example (e.g., "Lawn care uses a 4-hour morning window; pest treatment uses a 2-hour precise window because the homeowner must be present")

**Acceptance criteria:**
- Window Templates concept is introduced before the pro tip that references it
- Explanation includes at least one concrete example
- New section or expanded section has an appropriate id and title
