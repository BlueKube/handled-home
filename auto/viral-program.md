# autoresearch-viral — Handled Home Viral Growth Loop Optimization

Autonomous viral growth readiness optimization using the [Karpathy autoresearch](https://github.com/karpathy/autoresearch) pattern. The agent edits viral-related flows in `screen-flows.md` in a loop, runs `evaluate-viral.py`, and keeps or discards changes based on whether `viral_score` improves.

Tone: **calm, competent concierge.** Share CTAs should feel helpful and natural, not pushy. The Handled Home brand is a high-end hotel front desk, not a growth-hacker's dashboard. Every share moment should feel like a thoughtful suggestion, not a demand.

---

## Setup

To begin a new experiment run, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar23-viral`). The branch `autoresearch-viral/<tag>` must not already exist — this is a fresh run.
2. **Create the branch**: `git checkout -b autoresearch-viral/<tag>` from current master.
3. **Read the reference files** — full context before touching anything:
   - `docs/screen-flows.md` — **the only file you modify.** All screen specs and viral flow definitions.
   - `docs/masterplan.md` — frozen reference. BYOC/BYOP strategy, flywheels, brand voice. DO NOT MODIFY.
   - `docs/operating-model.md` — frozen reference. BYOC transition economics, incentive structure, pricing rules. DO NOT MODIFY.
   - `docs/ai-growth-operating-plan.md` — frozen reference. Program D (Network Effects), Program F (UX Value Prop). DO NOT MODIFY.
   - `auto/evaluate-viral.py` — frozen evaluation harness. DO NOT MODIFY.
4. **Run the baseline**: `python auto/evaluate-viral.py docs/screen-flows.md --verbose > auto/viral-run.log 2>&1` and record the score.
5. **Initialize results.tsv**: Create `auto/viral-results.tsv` with the header row (see Logging section below).
6. **Commit results.tsv**: Unlike intermediate run logs, results.tsv must be committed after each experiment so the history is preserved. Do NOT keep it local.
7. **Confirm and go**: Confirm setup looks good, then kick off the experiment loop.

---

## The Files

| File | Role | Mutable? |
|------|------|----------|
| `docs/screen-flows.md` | Viral UX spec — the **only** file you edit | YES (viral flows only) |
| `auto/evaluate-viral.py` | The 10-dimension viral scoring harness | NO |
| `auto/viral-program.md` | This file — your operating instructions | NO (human-edited only) |

Frozen reference files (never modify):

| File | Role |
|------|------|
| `docs/masterplan.md` | Strategy, BYOC/BYOP vision, flywheels, brand voice |
| `docs/operating-model.md` | BYOC transition economics, pricing exceptions, BYOP payout rules |
| `docs/ai-growth-operating-plan.md` | Program D (Network Effects) and Program F (UX Value Prop) deliverables |

---

## What You CAN Modify

You may only touch **viral-related flows and screens** in `docs/screen-flows.md`:

### Modifiable flows

| Flow | Description | Key viral role |
|------|-------------|----------------|
| Flow 2 | BYOC Activation (invite landing) | Loop 1 entry point |
| Flow 3 | Referral Invite Landing | Loop 3 entry point |
| Flow 4 | Share Landing (Receipt Proof) | Loop 4 destination |
| Flow 6 | BYOC Customer Onboarding | Loop 1 activation |
| Flow 15 | Customer Referrals Hub | Loop 3 management |
| Flow 20 | Provider BYOC Center | Loop 1 management |
| Flow 32 | First Service Celebration | Loop 5 trigger |
| Flow 37 | Referral Milestones | Loop 3 retention |
| Screen 11.3 | Visit Detail (Receipt) | Loop 4 trigger (share CTA) |
| Screen 18.1 / Flow 35 | BYOC Banner on Provider Dashboard | Loop 1 trigger |

### What you're allowed to do

- **Add the missing BYOP loop** (highest priority): Create a new Flow 2B or dedicated BYOP section. The flow should cover: customer recommends provider → platform acknowledgment → review status → provider onboards → customer/provider reconnect. See `masterplan.md` → BYOP section for the strategy.
- **Reduce friction**: Simplify steps in existing viral flows. Fewer taps between trigger and activation = higher V2 score.
- **Add share CTAs** to completion and satisfaction screens where they're missing or weak.
- **Add cross-loop connections**: Receipt page → referral code; Celebration → referral program; BYOC flow → referral program.
- **Improve invite landing clarity**: Make sure invited/referred users see WHO invited them, WHAT they're getting, and WHY they should care — all before the sign-up CTA.
- **Strengthen share artifacts**: The shared receipt (Flow 4), referral invite (Flow 3), and BYOC invite (Flow 2) should be compelling standalone artifacts with proof, context, and clear CTAs.
- **Add measurement surfaces**: Stats grids, funnel views, K-factor components (invites sent, conversion rate per loop).
- **Add multi-loop synergy**: Receipt page referral cross-sell, celebration overlay → referral CTA, growth hub co-location.
- **Add BYOP incentive language**: Why would a customer recommend their provider? What do they get? (Ground in `operating-model.md` BYOP economics.)
- **Add anti-abuse guards**: Referral fraud detection language, BYOC rate limiting, duplicate invite prevention.
- **Improve network effect articulation**: Add density/neighborhood language to viral surfaces where appropriate.

---

## What You CANNOT Do

- Modify `auto/evaluate-viral.py`, `docs/masterplan.md`, `docs/operating-model.md`, or `docs/ai-growth-operating-plan.md`
- Modify non-viral flows (don't touch: dashboard layout, billing flows, settings, provider job execution, admin ops structure, plan management, etc.)
- Add speculative viral features not grounded in `masterplan.md` or `operating-model.md` — if the strategy doc doesn't describe it, don't invent it
- Expose per-handle economics to customers in any viral surface (per `operating-model.md` → Key Pricing Principles)
- Expose customer pricing to providers in any viral surface (same)
- Use aggressive, hype-heavy, or pushy share copy — this is a calm, competent brand
- Add share CTAs to non-completion screens (settings, billing, password, navigation)
- Promise permanent pricing in BYOC invite scripts (per `operating-model.md` → BYOC compliance)
- Remove existing viral screens or flows
- Break navigation structure

---

## The 5 Viral Loops

Reference these when identifying what to improve:

### Loop 1: BYOC — Bring Your Own Customer
```
Provider creates invite link (Flow 20.2)
  → Customer receives link
  → Customer lands on BYOC invite page (Flow 2.1) — sees provider + service details + benefits
  → Customer signs up + BYOC onboarding (Flow 6)
  → Customer activates service
  → Provider sees activation stats (Flow 20.1 stats grid)
```
**Current state**: Mostly specced. Flow 6 is a stub.

### Loop 2: BYOP — Bring Your Own Provider (MISSING)
```
Customer recommends trusted provider (TBD — no screen exists)
  → Platform acknowledges recommendation
  → Ops reviews provider
  → Provider onboards (Flow 17)
  → Customer and provider reconnect on platform
  → Customer sees their recommended provider in their home team
```
**Current state**: Strategy in masterplan.md, zero UX screens. This is the biggest gap.

### Loop 3: Customer Referrals
```
Customer gets referral code (Flow 15.1)
  → Customer shares code with friend
  → Friend lands on referral page (Flow 3.1) — sees value + offer
  → Friend signs up
  → Customer earns credits (Flow 15.1 credits summary)
  → Milestone rewards drive continued sharing (Flow 37.1)
```
**Current state**: Well specced. Reward amounts need anchoring in operating-model.md.

### Loop 4: Shareable Receipts
```
Service is completed
  → Customer sees receipt with photos + checklist (Screen 11.3)
  → Customer taps share CTA (Screen 11.3 share CTA → ShareCardSheet)
  → Recipient receives link
  → Recipient lands on share page (Flow 4.1) — sees proof, brand stamp, CTA
  → Recipient signs up ("Get Handled Home" CTA)
```
**Current state**: Mostly specced. Missing: celebration → Flow 4 linkage; receipt cross-sell to referrals.

### Loop 5: First Service Celebration
```
First service completed
  → Full-screen celebration overlay (Flow 32.1) — aha moment
  → Customer taps "Share the News"
  → Recipient sees shared content (→ Flow 4 or dedicated share page)
  → Recipient signs up
```
**Current state**: Celebration exists but share destination is unspecified; no referral connection.

---

## Scoring Dimensions Reference

| # | Dimension | Weight | What moves it |
|---|-----------|--------|---------------|
| V1 | Loop Completeness | 1.3 | Add BYOP flow; flesh out Flow 6 stub |
| V2 | Friction Per Loop | 1.2 | Simplify steps in Flows 3, 4, 6; define BYOP journey |
| V3 | Invite Clarity | 1.1 | Add reward/offer to Flow 3 landing; BYOP landing page |
| V4 | Share Artifacts | 1.1 | Link celebration share → Flow 4; strengthen Flow 3 value |
| V5 | Incentive Structure | 1.0 | BYOP incentive; BYOC bonus amounts; celebration share incentive |
| V6 | Trigger Placement | 1.0 | Already strong — maintain |
| V7 | Measurement | 0.9 | Program D funnel dashboard; BYOP conversion tracking |
| V8 | Network Effects | 0.9 | BYOP switching-friction narrative; density language |
| V9 | Anti-Spam / Trust | 0.8 | Rate limiting on invites; BYOP trust signals |
| V10 | Multi-Loop Synergy | 0.8 | Receipt → referral code; celebration → referral; growth hub |

---

## Focus Strategy (priority order based on baseline gaps)

1. **BYOP loop (V1, V2, V3, V5, V8, V10)** — The single biggest gap. Adds credit to 6 dimensions at once. Create a minimal but complete BYOP spec: customer-facing recommend-a-provider screen, platform acknowledgment, and customer/provider reconnect confirmation. Ground every detail in `masterplan.md` → BYOP section and `operating-model.md` → BYOP transition economics.

2. **Multi-loop synergy (V10)** — Quick wins available:
   - Add referral code cross-sell card to Screen 11.3 (receipt page growth surface)
   - Connect Flow 32 celebration "Share the News" to both Flow 4 (receipt) and referral program
   - Add referral mention to Flow 20 BYOC Center

3. **Measurement completeness (V7)** — Add the missing Program D deliverable: provider-import conversion funnel view. Cross-reference `ai-growth-operating-plan.md` Program D deliverables.

4. **Share artifact tightening (V4, V5)** — Link the celebration overlay share action to a specific destination (Flow 4 or dedicated celebration share page). Add a share incentive to Flow 32.

5. **Flow 6 stub expansion (V1, V2)** — The BYOC customer onboarding is currently a one-line stub. Add the 3-5 key screens (provider context confirmation, address check, plan selection, activation confirmation).

6. **BYOC bonus amounts (V5)** — Specify BYOC bonus mechanics in Flow 20 (e.g., "earn $X per activated customer" — must match or reference operating-model.md).

7. **Rate limiting (V9)** — Add invite rate-limiting language to Flow 20 (Create BYOC Link) and Flow 15 (referral hub).

---

## The Experiment Loop

LOOP FOREVER:

1. **Read the current state**: Check latest commit, review current `viral_score` and per-dimension breakdown.
2. **Identify the weakest dimension**: Focus on the dimension with the lowest weighted contribution (weight × score).
3. **Form a hypothesis**: Decide on a specific, grounded change. Examples:
   - "Adding BYOP recommend-a-provider screen should improve V1 and V10"
   - "Adding referral cross-sell card to Screen 11.3 should improve V10 synergy"
   - "Fleshing out Flow 6 BYOC onboarding steps should reduce friction in V2"
   - "Linking Flow 32 share action to Flow 4 should fix the missing artifact destination"
4. **Make the edit**: Modify only the allowed flows in `docs/screen-flows.md`.
5. **git commit**: Use a descriptive message referencing the dimension targeted.
6. **Run evaluation**: `python auto/evaluate-viral.py docs/screen-flows.md > auto/viral-run.log 2>&1`
7. **Read results**: `grep "^viral_score:\|^v[0-9].*:\|^gaming_penalty:\|^total_friction:\|^loops_" auto/viral-run.log`
8. **Log to viral-results.tsv** and **commit results.tsv** immediately.
9. **Keep or discard**:
   - `viral_score` improved → keep the commit
   - `viral_score` equal or worse → `git reset --hard HEAD~1`
10. **Repeat**.

---

## Anti-Gaming Rules

The harness detects and penalizes these shortcuts:

- **Share CTAs on non-completion screens** (settings, billing, password pages) → penalty per instance
- **Incentive amounts not anchored to operating-model.md or masterplan.md** → penalty if many novel amounts appear
- **Pushy share copy** ("Share now!", "Go viral!", "Tell everyone!") → penalty per instance; doesn't match calm brand voice
- **Speculative viral features** (viral coefficient display, leaderboard, k-factor widget) not mentioned in strategy docs → penalty

The harness rewards:
- **Adding the missing BYOP loop** → simplicity bonus
- **Reducing friction** in existing loops (fewer steps) → V2 score improvement
- **Tightening existing flows** over adding speculative new ones

**Every piece of copy must be specific to the screen's context and grounded in the Handled Home brand voice.**

Good: `"Your provider is moving their service management to Handled Home — same great service, easier for both of you."`
Bad: `"Share now to earn rewards! 🎉"`

Good: `"Tell us about a provider you already trust — we'll reach out to see if they'd be a good fit for the Handled Home network."`
Bad: `"Invite your providers to join!"`

---

## Brand Voice Reference

**Tone**: Calm concierge — confident, kind, predictable. High-end hotel front desk.

**For viral moments specifically:**
- Share CTAs should feel like a natural "oh, by the way" — not a campaign
- Invite pages should feel welcoming and informative, not like a sales funnel
- Referral mechanics should feel like a thank-you, not a gamification trap
- BYOC should feel like "bring your home into a better system" — not "sign up for our platform"
- BYOP should feel like "we'd love to meet your provider" — not "replace them with ours"

**DO**: `"Share the after photo"` / `"Your home is handled — let your neighbors know."` / `"Invite your provider to the network."`

**DON'T**: `"Share now!"` / `"Don't miss out!"` / `"Refer a friend and get rewarded!"` (too transactional)

---

## Logging Results

TSV format (tab-separated), 6 columns. **Commit results.tsv after every experiment — do not keep it local.**

```
commit\tviral_score\tfriction\tdimension_targeted\tstatus\tdescription
```

Example:
```
commit	viral_score	friction	dimension_targeted	status	description
a1b2c3d	52.00	121	baseline	keep	baseline score
b2c3d4e	55.30	115	V1_byop_loop	keep	added BYOP recommend-a-provider screen (Flow 2B) and acknowledgment flow
c3d4e5f	57.80	112	V10_synergy	keep	added referral cross-sell card to Screen 11.3 receipt page
d4e5f6g	57.40	115	V10_synergy	discard	celebration → referral connection caused gaming penalty
e5f6g7h	59.10	108	V2_friction	keep	simplified Flow 6 BYOC onboarding from 5 steps to 3
f6g7h8i	58.80	110	V7_measurement	discard	added funnel dashboard stub but no score improvement
g7h8i9j	61.20	103	V5_incentives	keep	added BYOC bonus amount to Flow 20, grounded in operating-model.md
```

Commit command: `git add auto/viral-results.tsv && git commit -m "results: update viral-results.tsv after <dimension> experiment"`

---

## BYOP Implementation Guide

When building the BYOP loop, use this structure as a starting point. Ground every detail in the reference docs.

**Source of truth for BYOP strategy:**
- `masterplan.md` → "BYOP: Bring Your Own Provider" section
- `operating-model.md` → "BYOP (customer brings their provider)" section
- `operating-model.md` → "Exception rules" (BYOP providers get transition pricing initially)

**Suggested flow structure:**

```
FLOW 2B: BYOP — Recommend a Provider (Customer → Platform)

Route: /customer/recommend-provider
Who: Authenticated customer who wants to bring a trusted provider
Purpose: Customer recommends a provider for possible network inclusion

Screen 2B.1: Recommend a Provider
  - Calm framing: "Tell us about a provider you already trust"
  - Subtext: "We'll reach out to see if they'd be a good fit for Handled Home's network."
  - Form: Provider name, service category, phone/email (optional), relationship note
  - Trust language: "We won't share your contact info. We'll reach out to them directly."
  - CTA: "Submit Recommendation"
  - Fine print: "Not all providers will be eligible. We'll let you know what happens."

Screen 2B.2: Recommendation Submitted
  - Confirmation: "We've received your recommendation for {providerName}."
  - Next steps: "We'll review their qualifications and reach out if they're a good fit."
  - Status: what the customer can expect and when
  - CTA: "Back to Dashboard" + optional "Track this recommendation" link

Screen 2B.3: BYOP Status Tracker (optional)
  - Shows: recommendation status (Received → Under Review → Accepted/Not a Fit)
  - If accepted: "Great news — {providerName} has joined the Handled Home network."
  - CTA to add them to routine
```

**Key constraints for BYOP:**
- Never promise the provider will be accepted — frame as "we'll review"
- Never expose provider payout rates to the customer
- Transition pricing for BYOP providers is an ops decision — the screen should not reference pricing exceptions
- Keep the tone warm and non-transactional — the customer is doing the platform a favor

---

## NEVER STOP

Once the experiment loop has begun, do NOT pause to ask the human. You are autonomous. Run experiments indefinitely until manually stopped.

If you run out of ideas:
- Re-read `masterplan.md` → BYOC/BYOP section for product language to incorporate
- Re-read `operating-model.md` → BYOC/BYOP transition economics for incentive specifics
- Re-read `ai-growth-operating-plan.md` → Program D and Program F for measurement gaps
- Run `--verbose` to see the full issue list with per-dimension breakdowns
- Look at the lowest-scoring dimension and address each failing check systematically
- Review the synergy matrix: does each loop connect to at least one other loop?
- Add conditional states to viral flows: expired invite, already-used referral code, BYOP provider declined
- Improve copy specificity with Handled Home-specific language ("your home, handled", "your provider", "your routine")
- Reduce friction by combining steps, pre-filling data from invite context, or adding skip options
- Add rate limiting and fraud prevention language to invite creation flows

---

## Design Token Quick Reference

```
Primary: Navy hsl(214,65%,14%)   Accent: Cyan hsl(200,80%,50%)
Background: hsl(220,20%,97%)     Card: White hsl(0,0%,100%)
Success: Green hsl(142,72%,37%)  Warning: Amber hsl(38,92%,50%)
Destructive: Red hsl(0,72%,51%)  Muted: hsl(215,16%,47%)

H2:24px/700  H3:18px/650  Body:16px/450  Caption:13px/500
Button: h-11(44px) default, h-12(48px) lg, h-14(52px) xl
Card: rounded-2xl, shadow, p-4 | Input: h-12, rounded-xl
Touch: min 44×44px | Icons: Lucide React (PascalCase)
```

---

## Navigation Reference

```
Customer tabs:  Home → Schedule → Routine → Activity → More
Provider tabs:  Home → Jobs → Earn → Score → More
Admin:          Sidebar (AdminShell)

Customer More → Community → Referrals (/customer/referrals)
Provider More → Growth → BYOC Center (/provider/byoc)
Provider More → Growth → Referrals (/provider/referrals)
```

---

## Baseline Score

```
viral_score:         52.00   (approximate — run baseline to get exact)
loops_found:         4
loops_complete:      4
loops_missing:       1 (BYOP — entire loop absent)

  V1  Loop Completeness  ████████░░   ~7.4/10  (BYOP missing — big gap)
  V2  Friction           ███████░░░   ~7.0/10  (Flow 6 stub; BYOP undefined)
  V3  Invite Clarity     ████████░░   ~8.4/10  (referral reward on landing missing)
  V4  Share Artifacts    █████████░   ~8.7/10  (celebration share destination undefined)
  V5  Incentives         █████████░   ~8.6/10  (BYOP incentive missing; BYOC amount vague)
  V6  Trigger Placement  ██████████  10.0/10  (strong — maintain)
  V7  Measurement        █████████░   ~9.3/10  (Program D funnel gap)
  V8  Network Effects    █████████░   ~9.2/10  (BYOP switching-friction narrative missing)
  V9  Anti-Spam          █████████░   ~8.6/10  (no rate limiting on invites)
  V10 Multi-Loop Synergy ██████░░░░   ~6.6/10  (biggest gap after BYOP)
```
