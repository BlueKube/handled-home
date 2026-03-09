# Handled Home — Master Plan (Bundle & Save Vision)

## 30-Second Elevator Pitch
The Handled Home app is **Bundle & Save for home services**.

We acquire a household once, then increase ARR per household through **one-click bundling**: customers add, remove, upgrade, and rearrange services with a tap—because we already have the hard stuff: address, access preferences, and payment. That means expansion happens with **near-zero incremental CAC**, just like adding items to a cart.

Handled Home wins by:
1) **One-click bundle expansion (primary engine):** more services per household → higher ARR → CAC amortized → margin headroom → better value and retention.  
2) **Operational control (enabler):** SKUs + Levels + proof receipts + zones/capacity keep delivery reliable and support costs low.  
3) **Density (amplifier):** as households stack in zones, routing efficiency improves unit economics and provider retention.

Core promise:
> **Your home is handled.**

---

## The Problem
Home upkeep is fragmented and reactive:
- homeowners juggle multiple vendors, schedules, and payment methods
- quality is inconsistent and hard to verify
- switching vendors is awkward, time-consuming, and risky
- providers lose margin to drive time, idle time, cancellations, and sales overhead

The “marketplace calendar” model creates chaos at scale: scope ambiguity → disputes → support costs → margin collapse.

---

## The Mission
Make home upkeep **automatic, predictable, provable, and easy to change**—without calendar chaos.

---

## What Handled Home Really Is (North Star)
Handled Home is a **household bundling engine** for home maintenance.

Most home service companies are single-service subscriptions (pool, pest, lawn). They struggle to cross-sell because:
- scheduling isn’t unified
- billing isn’t unified
- scope and quality standards aren’t standardized
- adding services means a new vendor relationship

Handled Home unifies the household into a single account so additional services become a **one-tap bundle decision**—with transparent Levels, standardized scope, and proof-of-work receipts to keep quality consistent.

Compounding economics:
- higher ARR per household
- lower blended CAC over time (no re-acquisition for each new service)
- higher retention as the home’s routine and history becomes embedded

---

## Target Customer
- busy suburban homeowners (time-starved, value reliability)
- households who want fewer decisions and fewer vendor relationships
- people who want control without confrontation (“firing” a landscaper, renegotiating scope)

### Customer psychology (what we sell)
- calm, predictability, trust, and “it’s handled”
- one place to manage everything
- easy upgrades/add-ons when the value is obvious

---

## Target Provider
- quality-focused local operators
- prefer predictable work and dense routes over random one-off jobs
- want clear scope, fewer disputes, and stable earnings

**Curation-first**, not “anyone can join” gig supply.

---

## Business Model
### Revenue
- household membership subscription (MRR)
- add-on handles consumption / bundle usage
- take-rate on provider payouts (range flexible; optimize later)
- optional future tiers: premium membership, white-glove levels, concierge switching

### The Primary Flywheel: Bundle Expansion (the Amazon-like engine)
1) Acquire household once (capture service or starter bundle)  
2) Capture durable context: address + access + preferences + payment  
3) Present relevant services (filtered, eligible, non-spammy)  
4) One-click add-ons + Level upgrades increase attach rate  
5) ARR per household rises; CAC amortizes; retention improves  
6) More margin headroom enables better value and better service reliability  
7) Reliability increases trust → expansion becomes easier → repeat

### The Secondary Flywheel: Density & Reliability (amplifier)
1) Membership creates predictable demand  
2) Zones + cycles + Service Day create routable schedules  
3) Higher stops/day reduces cost per stop  
4) Provider margin improves → provider retention improves  
5) Reliability improves → customer retention improves  
6) Retention compounds bundle expansion

**Key idea:** density strengthens unit economics; **bundle expansion drives growth velocity**.

---

## What We Optimize (Scoreboard)
### Growth / unit economics
- **ARR per household** (primary)
- **Attach rate** (active services per household per cycle)
- **Expansion velocity** (2nd service within 30/60/90 days)
- **Blended CAC** (should drop as attach rate rises)

### Reliability / scalability
- **Support minutes per job** (must stay low)
- **Proof compliance %** (photos + checklist)
- **Issues per 100 jobs**
- **On-time / completion rate**
- **Capacity utilization** per zone/service day
- **Stops per Service Day** and **minutes per stop** (density health)

---

## Core Product Principles
1) **OS feel, not marketplace feel**
   - no open calendar browsing
   - routine and cycle-based scheduling
   - app feels like your home is “in motion,” not “shopping for contractors”

2) **One-click expansion, not spam**
   - suggestions are relevant, limited, explainable
   - “hide / not interested” feedback is respected

3) **Levels standardize scope + time + proof**
   - every meaningful SKU has Levels (variants) defining:
     - inclusions/exclusions
     - planned minutes
     - proof requirements
     - handles cost
   - providers can recommend correct Level next time
   - courtesy upgrade protects quality today, corrects next cycle

4) **Proof-of-work is a premium artifact**
   - every job produces a “Handled Receipt”
   - receipts reduce disputes and create a sticky home history
   - receipts are also the most tasteful upsell moment (“keep this standard next time”)

5) **Constraints-first scaling**
   - zones/caps prevent overselling
   - curated providers protect brand trust
   - ops cockpit keeps the machine healthy

---

## The Product, End-to-End

### Customer
- auth + roles
- property profiles + access notes
- **Home Setup signals**
  - coverage map (self / have someone / none / NA)
  - sizing tiers (sqft, yard, windows, stories)
- membership selection (bundle model)
- routine builder (draft → activate)
- assigned Service Day with controlled alternatives
- Add Service Drawer (one-tap add, Undo, smart defaults)
- Level selection + micro-questions (0–3) where needed
- Handled Receipts (photos + checklist proof + next-time actions)
- Switch Kit (safe, scheduled transition from incumbents)

### Provider
- curated onboarding + approval
- job list optimized for “today → next”
- job detail includes: Level, scope, time target, proof requirements
- completion includes: proof enforcement + “level sufficient?” feedback + courtesy upgrade (guardrails)
- simple issue reporting

### Admin / Ops
- zones, capacity, Service Day patterns
- SKU governance + Levels editor
- provider coverage mapping (primary/backup)
- support/disputes with evidence spine
- Ops Cockpit:
  - capacity, proof compliance, issues/100
  - level mismatch signals (recommendations + courtesy upgrades)
  - attach-rate signals (as instrumentation matures)
  - next-best actions (simple threshold rules)

---

## Strategic Bets (Updated)
1) **Wallet share is the growth engine**
   - Acquire once → expand the bundle → no recurring CAC for each added service.

2) **Levels prevent scope drift**
   - Standardization beats negotiation; quality becomes enforceable.

3) **Receipts are the trust moat**
   - Proof artifacts reduce disputes and make the product “real.”

4) **Switching must be painless**
   - Capture with low-incumbent services first; convert incumbents with Switch Kit.

5) **Curated launch beats “liquidity first”**
   - Start constrained; expand category-by-category with standards.

---

## Risks & Mitigations
- **Marketplace entropy (quality/support blowup)**  
  → Constraints-first: SKUs + Levels + proof + zone/capacity, curated providers

- **Spammy upsells degrade premium brand**  
  → 2–4 suggestions max, relevance rules, suppression/hide feedback, post-visit recommendations only when justified

- **Provider abuse of courtesy upgrades**  
  → rate limits + reason codes + proof required + ops review + disable per provider/org

- **Switching creates schedule chaos**  
  → next-cycle start default, “switch pending” state, waitlist when capacity constrained

- **Too many services too soon**  
  → curated “Always-On” set + seasonal rotation + staged rollouts

---

## Documentation System (How to keep docs accurate)
You should **not** keep a single giant document for everything. It will rot quickly and exceed AI context windows.

Use a layered “source-of-truth” model:
1. `docs/masterplan.md` → strategy, flywheels, business model, non-negotiable principles.
2. `docs/global-system-architecture.md` → canonical states, schema spine, cross-module invariants.
3. `docs/feature-list.md` + `docs/feature-list-by-role.md` → implementation inventory.
4. `docs/tasks.md` → execution status and sequencing.
5. `docs/ai-context-pack.md` → compact handoff brief for new AI sessions.

Rule of thumb: if a detail changes weekly, it should not live only in the master plan.

### Documentation update cadence
- Per PR: update impacted feature/task docs.
- Weekly: refresh scorecard metrics + top risks in context pack.
- Monthly: revisit master plan assumptions and strategic bets.
- Quarterly: archive stale specs/reviews and rebaseline priorities.

### Documentation quality gates
Every meaningful PR should include:
- changed feature IDs,
- changed tests,
- changed KPIs or expectations,
- changed runbooks/fallbacks (if operational behavior changed).

---

## Roadmap: Round 3 Sprints (Current Direction)
### 3A — Levels (SKU Variants)
- scope/time/proof/handles buckets
- provider recommendation next time
- courtesy upgrade + guardrails

### 3B — Coverage Map + Property Signals
- what’s already handled + not applicable
- sizing tiers (sqft/yard/windows/stories)
- feeds smart defaults + relevance

### 3C — Growth Surfaces + Add Service Drawer + Home Restructure
- Home becomes action-first and calm
- Add Service Drawer enables one-tap expansion + Undo
- suggestion throttling + suppression

### 3D — Switch Kit + Ops Cockpit v1
- safe scheduled switching from incumbents
- operator control tower with drilldowns and actions

### 3E — Handled Receipts (Proof-of-Work Artifact)
- premium receipt per visit (photos + checklist + notes)
- tasteful post-visit actions:
  - update Level going forward
  - add adjacent service next cycle

---

## What Success Looks Like
A customer shifts from:
> “I need to find someone for X…”

to:
> “I’ll just add that.”

Handled Home becomes the default “Bundle & Save” layer for home maintenance: one account, one routine, one history, endless one-tap expansion—delivered reliably through constraints, proof, and operator-grade control.
