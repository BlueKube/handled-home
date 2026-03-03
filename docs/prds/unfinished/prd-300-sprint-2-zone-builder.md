# Sprint 2 PRD — Zone Builder v1: Automated Zones from Geo Cells (Non-Prescriptive)

## Executive summary
Sprint 2 builds **Zone Builder v1**: an automated system that creates operational service zones that reduce drive time and support scalable market rollout. Zones are **not** hand-drawn ZIP-code blobs. They are computed from a geo grid (recommended: H3-style hex cells) and built to be:
- **routeable** (compact, low drive dispersion)
- **capacity-aware** (supply vs demand is measurable)
- **launchable** (easy to turn on/off by category later)
- **nationwide-repeatable** (same method works in any city)

This sprint does **not** finalize routing. It creates the “map of work” that routing and market states rely on.

---

## Strategic intent (why this sprint matters)
If you want Uber-speed expansion, you can’t require humans to:
- decide zone boundaries by gut,
- constantly redraw them as demand shifts,
- discover too late that a zone is unprofitable due to long drives.

Zone Builder v1 makes scaling possible because it provides:
1) **A repeatable market bootstrap process**: ingest region → auto-create zones → measure supply/demand → launch.
2) **Better unit economics**: smaller, compact zones reduce drive time variance and enable predictable capacity controls.
3) **Clear control surfaces for ops**: later sprints can gate by zone/category states and pricing adjustments.

---

## Locked decisions (scope constraints)
- Zones are an **ops control surface**, not hard routing walls.
- **Overlap is allowed** for assignment optimization.
  - Practical interpretation for v1: zones can be non-overlapping for customer clarity, while providers/assignment may cross zone boundaries and “coverage footprints” may overlap.
- The system must support automated rollout with minimal ops effort.

---

## Sprint goals (what “done” means)
### G1 — Automatic zone generation for a pilot region
Given a market boundary (e.g., a metro polygon), the system can generate a set of zones automatically.

### G2 — Zones are compact and measurable
Each generated zone has measurable characteristics that strongly correlate with route efficiency:
- compactness / spread
- demand density
- supply capacity
- predicted drive burden (proxy)

### G3 — Admin can preview, accept, and minimally edit
Ops can:
- run the zone builder
- preview zones on a map
- see warnings (too sparse, too large, not enough supply)
- accept zones into the system
- optionally merge/split a zone with minimal tooling

### G4 — Downstream compatibility
Generated zones can be referenced later by:
- zone/category market states (Sprint 3)
- rolling planner and routing engine (Sprints 4–8)

---

## Non-goals (explicitly not in Sprint 2)
- Not a full routing optimizer.
- Not the final “perfect zone” algorithm.
- Not dynamic re-zoning in production (that comes later once markets mature).
- Not customer-facing zone selection.

---

## Core concept
A **zone** is a collection of geo cells chosen to make provider routes efficient:
- bounded travel dispersion
- sufficient density for back-to-back stops
- capacity and staffing reality visible

The zone builder should create zones that are:
- **small enough** that “capacity pressure” is meaningful,
- **large enough** to avoid too many tiny administrative units.

---

## Inputs and outputs

### Inputs
- **Market boundary**: polygon defining the rollout area.
- **Geo grid resolution** (dial): cell size used for partitioning.
- **Demand signals** (v1 can be simple):
  - existing subscribed customers / planned visits
  - waitlist density
  - projected demand (optional)
- **Supply signals**:
  - active providers and their home base locations
  - provider capacity (max jobs/day, working hours)
- **Operational targets (dials)**:
  - target zone workload range (service minutes/week)
  - max zone spread (drive-time proxy threshold)
  - min density threshold

### Outputs
- A set of zones with:
  - geometry for map display
  - included geo cells
  - computed metrics (below)
  - neighbor adjacency graph (zones that touch)
  - zone label suggestions (auto) + editable name

---

## Default dial recommendations (v1)
These defaults are designed to be **conservative, stable, and scalable** (fewer tighter zones first; refine later). They incorporate current assumptions:
- Average service duration: **20–30 minutes**
- Desired initial zone spread: **~10–20 minutes drive-time** to the zone edge

### Dial 1 — Seed strategy (default)
**Default: AUTO (hybrid)**
- AUTO selects seeds using a blended cell score, then adapts locally:
  - If provider capacity is sparse → bias toward provider-first
  - If demand/waitlist is dense → bias toward demand-first

**SeedScore(cell) = 0.55·Demand(cell) + 0.35·Supply(cell) + 0.10·Waitlist(cell)**

Admin options:
- AUTO (recommended)
- Demand-first
- Provider-first

### Dial 2 — Cell resolution (default)
**Default: coarse-first.**
- Start with coarser cells to avoid “too many tiny zones.”
- Add a controlled refinement path later (“split by density”).

### Dial 3 — Target zone workload (default)
**Default target:** zones sized around **~3–6 provider-days/week** worth of workload.
- This usually corresponds to something like **~25–60 visits/week** depending on observed travel + service time.
- Use a dial expressed in “provider-days/week” and show the implied visits/week estimate as a helper (not a hard promise).

### Dial 4 — Max spread threshold (default)
**Default max spread:** a zone should be compact enough that the farthest cell is typically **~10–20 minutes drive-time** from a zone center/medoid.
- Default setting suggestion: **15 minutes** (with presets for dense vs suburban).

### Dial 5 — Safety behavior (default)
- Prefer **stable, compact zones** over perfectly balanced zones.
- If a zone fails constraints, flag it (don’t silently produce ugly zones).

---

## Metrics (what we compute per zone)
These metrics enable automation and sanity checks:

1) **Demand minutes/week** (overall + by category)
2) **Supply minutes/week** (overall + by category capability)
3) **Supply/Demand ratio** (capacity pressure index)
4) **Density**: demand minutes per area (or per cell)
5) **Compactness** / **spread proxy**:
   - average distance from zone center/medoid to its cells
   - max distance (radius) proxy
6) **Drive burden proxy**:
   - estimated intra-zone travel cost using a travel-time approximation (details below)

---

## Algorithm (math must be explicit)

### Step 0 — Represent the world as cells
- Convert all properties and provider home bases to **geo cells**.
- Aggregate demand and supply onto cells.

> Recommendation: use an H3-style hex grid. Hexes reduce edge artifacts vs square grids and are standard for scalable geo aggregation.

### Step 1 — Score each cell
For each cell `c`, compute:
- `demand(c)` = expected weekly service minutes (sum across customers/tasks)
- `supply(c)` = expected weekly provider capacity minutes (providers whose home base is in/near the cell)
- `category_supply(c,k)` = supply for category `k`

### Step 2 — Choose zone seeds
Seeds are starting points for building zones. Provide two seed strategies (ops selectable, but default can be automatic):

**Seed strategy A (Demand-first):** pick top demand cells as seeds (good when demand clusters are strong).

**Seed strategy B (Provider-first):** pick provider hub cells as seeds (good when staffing drives rollout).

### Step 3 — Grow zones by constrained region-growing
This is the core math. Grow each zone by adding neighboring cells until targets are met.

At each step, pick the next best cell to add based on a **cost function** that trades off compactness and capacity.

#### Zone growth cost function (v1)
For zone `Z` and candidate neighbor cell `c`:

`score(Z, c) = w1 * compactness_penalty(Z ∪ c)
             + w2 * drive_proxy_penalty(Z ∪ c)
             + w3 * imbalance_penalty(Z ∪ c)
             + w4 * boundary_smoothness_penalty(Z ∪ c)
             - w5 * demand_gain(Z ∪ c)`

Where:
- `compactness_penalty` increases if the zone becomes “sprawly”
- `drive_proxy_penalty` increases if added cell increases travel-time dispersion
- `imbalance_penalty` increases if demand greatly exceeds estimated supply
- `boundary_smoothness_penalty` discourages “spiky” zones
- `demand_gain` rewards absorbing nearby demand pockets

Stop growing when:
- zone demand minutes is within target range, AND
- spread proxy under max threshold (or best achievable), OR
- you hit boundary/sparsity constraints.

### Step 4 — Enforce feasibility constraints
Zones that fail constraints should be flagged:
- “too sparse” (high spread, low density)
- “overloaded” (demand >> supply)
- “category mismatch” (demand in category exists but near-zero provider capability)

These flags drive later states like WAITLIST/RECRUITING (Sprint 3), but Sprint 2 should surface the diagnostics.

### Step 5 — Optional refinement pass (fast)
Run a refinement pass to improve compactness:
- boundary cell swapping between neighboring zones if it reduces total spread
- merge tiny zones with neighbor
- split zones that are too large (if demand is high)

This does not need to be perfect in v1; it needs to be stable and explainable.

---

## Drive-time proxy (how we approximate travel cost)
We need a travel-time model for compactness that is better than straight-line distance.

Provide **two modes**, so you can start simple and evolve:

### Mode 1 (Pilot-fast): distance proxy
- Use geo distance with a city-specific multiplier.
- Good enough to build initial zones but not perfect.

### Mode 2 (Production-ready): travel-time API sampling
- Use a routing/time API to estimate travel time between cell centroids.
- Compute a “zone spread proxy” using:
  - travel time from zone medoid to farthest cell
  - average travel time to all cells

**Important:** this does not require full many-to-many matrices yet; sample-based proxies can work.

---

## Overlap policy (how overlap works without confusing users)
We want overlap for optimization, but we also want customers to have a clear answer to “am I covered?”

**Recommended v1 approach:**
- Each customer/property has a **primary zone** used for:
  - catalog availability presentation
  - market state control
  - reporting
- Providers can have **coverage footprints** that overlap zones (later sprints use this for assignment).
- The routing engine may assign across zone borders when profitable and feasible.

This preserves operational flexibility without confusing the customer.

---

## Admin UX: Zone Builder Wizard (suggested flow)
Lovable should implement a clear, low-error flow. Suggested UX:

### Screen 1 — Select Region
- Map with boundary selection:
  - choose existing market boundary
  - or draw/enter polygon (pilot-friendly)

### Screen 2 — Choose Zone Generation Settings
- Dials (with sensible defaults):
  - cell resolution (coarse → fine)
  - target zone workload range
  - max spread threshold (drive proxy)
  - seed strategy (Demand-first default)

**UX component suggestion:** show “What this changes” microcopy under each dial.

### Screen 3 — Preview Zones
- Map visualization of generated zones
- Zone list with metrics + warnings
- Hovering a zone highlights cells and shows a “zone score” summary:
  - compactness
  - demand/supply
  - expected drive burden (proxy)

### Screen 4 — Minimal Editing Tools (v1)
Keep tools constrained:
- Rename zone
- Merge zone with neighbor
- Split zone (simple: pick two seed points and regenerate within that zone)
- Exclude areas (no-service polygons)

### Screen 5 — Commit
- Confirm:
  - number of zones
  - zones with warnings
  - “effective date” for activation
- Commit writes zones into the operational model.

---

## Customer/Provider UX (light touch in Sprint 2)
Sprint 2 doesn’t expose zones directly, but it should support debug surfaces:

- Admin can search a property address and see:
  - assigned primary zone
  - underlying cell
  - zone metrics + warnings

This is critical for fast ops troubleshooting during pilot.

---

## Functional requirements (non-prescriptive)

### FR1 — Generate zones from a region boundary
- Admin can run zone generation and receive a deterministic set of zones (same inputs → same result).

### FR2 — Store and query zones
- Zones can be displayed on a map.
- Property-to-zone assignment works.

### FR3 — Compute zone metrics
- The system computes and displays the core metrics and flags.

### FR4 — Minimal editing controls
- Admin can merge/split/rename with guardrails.

### FR5 — Diagnostics and warnings
- The system surfaces warnings that later map to market state decisions.

---

## Acceptance criteria
1) Admin can generate zones for a pilot region and preview them on a map.
2) Each zone shows a metrics summary and any warnings.
3) A property can be resolved to a primary zone deterministically.
4) Admin can rename zones and perform at least merge operations safely.
5) The system supports a drive-time proxy mode that is explicitly configured (distance proxy vs travel-time sampling).

---

## Testing expectations
- Determinism test: same input boundary + settings yields identical zone set.
- Property resolution test: point-in-zone works consistently.
- Metrics sanity tests: demand/supply aggregation matches raw totals.
- UI QA: wizard flow is understandable; warnings are visible and not hidden.

---

## Suggested rollout plan
1) Enable Zone Builder in pilot market only.
2) Generate zones with conservative settings (coarser resolution first).
3) Validate:
   - density and spread look sane
   - high-warning zones align with intuition
4) Commit zones.
5) Proceed to Sprint 3 to wire zone/category states.

---

## Notes to Lovable (explicit algorithm clarity, non-prescriptive implementation)
- The math steps above must be implemented explicitly: cell aggregation → seed selection → constrained region-growing → metric computation → preview.
- Choose appropriate geo tooling for the codebase:
  - GIS-enabled storage/querying is strongly recommended.
  - If GIS is not available in the pilot environment, implement an interim representation but keep the interface so it can be upgraded.
- Keep the UI constrained: Zone Builder is powerful; guardrails prevent accidental destructive edits.

---

## Open questions (safe to answer during implementation)
1) What should be the default cell resolution for the pilot market?
2) What are initial target ranges for zone workload and spread thresholds (based on provider day structure)?
3) Which travel-time source will be used for Mode 2 sampling (if enabled in pilot)?

