# 12-support-and-disputes.md
> **Implementation Status:** ✅ Implemented in Round 1. AI classification, macros, resolution offers all built.

**Handled Home — Module 12 PRD (Support, Disputes, Policy Engine, Partner-Driven Growth)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized, operationally usable  

**Primary Customer Routes:**  
- `/customer/support`  
- `/customer/support/new`  
- `/customer/support/tickets`  
- `/customer/support/tickets/:ticket_id`  
- `/customer/support/policies` (optional)  

**Primary Provider Routes:**  
- `/provider/support`  
- `/provider/support/tickets/:ticket_id`  
- `/provider/support/performance` (optional coaching)  

**Primary Admin Routes:**  
- `/admin/support` (queues + dashboard)  
- `/admin/support/tickets/:ticket_id`  
- `/admin/support/policies` (policy engine + simulator)  
- `/admin/support/macros` (presets + templates)  
- `/admin/support/risk` (optional: fraud & repeat patterns)  
- `/admin/partners/health` (optional: partner quality + dispute trends)  

**Last updated:** 2026-02-22  

> This PRD is written using the attached guide as the source-of-truth for intent, scope, and constraints. fileciteturn1file0  

---

## 0) Executive strategy context (must inform decisions)

Handled Home is a **subscription + density engine**. Support can destroy margins if it becomes:
- chat-heavy  
- negotiation-heavy  
- scheduling-heavy  
- inconsistent across agents  

Launch reality:
- thin network liquidity (capacity + coverage changing)  
- provider onboarding variability  
- incentives/referrals create fraud vectors  

### 0.1 GTM reality (Anchor + Affiliate)
Support/disputes must be compatible with:
- **Anchor partners (Founding Partners)** per zone/category  
- **Provider-led customer conversion (affiliate referrals)**  
- **Selective book-of-business deals** for “slam dunk” routes  

Implications:
- strong promise-control (no overpromises)  
- fair dispute rights for providers  
- strict anti-fraud controls tied to attribution cohorts  

---

## 1) Why this module exists

Support must feel “supportless”: most issues should resolve instantly, fairly, and consistently.

Module 12 exists to:
- maximize customer satisfaction via fast outcomes  
- keep ops touch low through structured paths  
- preserve provider trust (transparent, disputable, non-punitive by default)  
- prevent chargebacks with proof-first resolution  
- stay configurable while pricing/categories evolve  

---

## 2) North Star outcomes (Definition of Done)

Target metrics (configurable, tracked):
1) **Self-resolution rate:** ≥ 80% of customer issues resolved without human involvement  
2) **Median time-to-resolution:** < 2 minutes for self-resolved tickets  
3) **Support minutes per job:** trends toward near zero at scale  
4) **Chargeback prevention:** measurable reduction via “chargeback intercept” flow  
5) **Provider trust:** holds are explainable and disputable; clawbacks avoided in v1  
6) **No chat threads:** disputes do not become negotiations  

---

## 3) Product principles (non-negotiable)

1) **Proof-first:** receipts (Module 10) + checklist/photos/timestamps (Module 09) are primary artifacts  
2) **Bounded choices:** structured forms > free-form text  
3) **Outcomes, not negotiation:** system offers resolutions; user selects; done  
4) **AI suggests, policy decides:** AI cannot issue money or promises  
5) **No scheduling creep:** redo is an *intent* routed through Service Day engine; no date picking  
6) **Generosity with guardrails:** instant goodwill exists, but capped + fraud-resistant  
7) **Provider fairness:** conservative holds; v1 avoids clawbacks  

---

## 4) Roles & permissions (tiny launch team)

### 4.1 Admin vs Dispatcher (recommended)
**Admin-only**
- hard caps (max $ per ticket, per customer per 4 weeks)  
- enabling refunds globally  
- fraud threshold edits + risk tier rules  
- payout hold system rules (Module 11)  
- partner incentive gates (delayed payouts, eligibility)  

**Dispatcher / Ops**
- approve recommended outcomes on individual tickets  
- request bounded extra evidence (1–2 questions)  
- apply macros to zone/category/provider  
- adjust “Generosity Slider” within admin-set bounds  
- manage SLAs within allowed policy  

### 4.2 Guardrails (must-have)
- policy preview simulator before publishing  
- diff view + change reason required  
- versioned policies + rollback  

---

## 5) High-level strategy: three machines, one experience

### Machine A — Quality & missed work (high volume)
Resolve most “not done / low quality” claims instantly with evidence replay + bounded outcomes.

### Machine B — Damage (high severity)
Empathetic intake + strict evidence + deterministic triage and SLA.

### Machine C — Billing & chargebacks (high financial risk)
Deflect chargebacks with proof + cheaper off-ramps (credits, plan changes) before escalation.

All three share the same pattern:
**Select issue → attach evidence → see offer(s) → accept → done.**

---

## 6) Customer experience

### 6.1 Support Home — `/customer/support`
Sections:
1) **Resolve something now** (primary CTA)  
2) **Your recent visits** (last 3 receipts, each with “Report an issue”)  
3) **Active tickets**  
4) **Common quick resolves** tiles:
   - Quality / Missed item  
   - Damage  
   - Billing  
   - Safety/behavior  
   - Pause/Cancel/Change routine (deep links to Modules 05/07)

Tone: calm, confident, premium: “We’ll take care of it.”

### 6.2 Receipt-first entry points (critical)
From every receipt (Module 10):
- “Report an issue” → ticket anchored to `job_id`  
- “Billing help” → anchored to invoice/charge  

### 6.3 Guided Resolver — `/customer/support/new`
Flow:
1) Choose category (tiles)  
2) Anchor to visit/job or invoice/line item  
3) Answer bounded clarifying questions (dynamic)  
4) See **Instant Resolution Offer(s)** (policy-driven)  
5) Confirm → Apply outcome → Close ticket  

Hard requirement:
- customer almost always sees at least one immediate option (even if “review by tomorrow 5pm” is also offered).

### 6.4 Customer Ticket List — `/customer/support/tickets`
- filters: Open / Resolved / All  
- row: type, status, created date, linked visit/billing reference  

### 6.5 Ticket Detail — `/customer/support/tickets/:ticket_id`
Shows:
- status chip  
- “What we decided”  
- credit/redo details  
- evidence replay + customer uploads  
- bounded “Add info” (no chat)

---

## 7) Provider experience

### 7.1 Provider Support Home — `/provider/support`
Sections:
- Today’s blockers (tickets tied to jobs)  
- Holds & payout status summary (Module 11)  
- Disputes needing input (time-boxed)

### 7.2 Provider Ticket View — `/provider/support/tickets/:ticket_id`
Provider sees:
- structured claim + evidence  
Provider actions:
- Acknowledge  
- Upload evidence  
- Request review (reason list)  
- Short statement (character-limited)

No provider ↔ customer messaging.

---

## 8) Admin console (Support Ops)

### 8.1 Queues dashboard — `/admin/support`
Tabs:
- Needs human review  
- Damage / safety  
- Chargeback risk  
- Provider dispute  
- Fraud / repeat claims  
- SLA breach risk  

Row shows:
- type, severity, zone, provider  
- AI summary + escalation reason  
- recommended resolution  
- one-tap actions

### 8.2 Ticket detail — `/admin/support/tickets/:ticket_id`
Actions (reason required + audited):
- approve/apply resolution outcome  
- issue credit/refund (if allowed)  
- create redo intent (if allowed)  
- flag risk  
- apply/release payout hold (Module 11 integration)  
- apply macros

---

## 9) Policy engine (the “dials”)

### 9.1 Policy resolution precedence
1) Provider override (optional)  
2) SKU override  
3) Category override  
4) Zone override  
5) Global default  

Resolver must return:
- policy_version  
- scope_chain used  
- offers allowed + caps + evidence requirements

### 9.2 Adjustable dials (MVP)
- Outcomes allowed (credit/redo/addon/refund/escalate)  
- Credit tiering (fixed $, bounded % of line item)  
- Redo controls (eligibility window, caps, routing mode, provider response window)  
- Evidence rules (photo required after repeats/always; always show evidence replay)  
- Abuse controls (max auto credits per 4 weeks; risk tiers; referral gates)  
- SLAs (due_by timers; auto-close/escalate)  
- Generosity slider presets within hard caps

### 9.3 Policy preview simulator — `/admin/support/policies`
Must include:
- scenario inputs (ticket type, zone, SKU/category, risk tier, evidence score, acquisition source)  
- preview offers shown  
- cost impact estimate  
- matched scope chain explanation  
- versioned publish, diff, change reason, rollback

---

## 10) AI & automation (suggests; policy decides)

AI may:
- classify severity/type  
- summarize evidence and history  
- select best photos for evidence replay  
- detect duplicates/repeat patterns  
- compute evidence score and soft fraud risk score  
- recommend tier (policy chooses)

AI may not:
- issue money or promises  
- schedule dates/times  
- override caps  
- create conversations

Must-have automations:
- Evidence replay (before/after + checklist + time-on-site)  
- Expectation cards (pool/pest)  
- Chargeback intercept (offers before escalation)  
- Duplicate suppression (link to existing ticket)  
- “Suggested next actions” for admins (one-click, within caps)

---

## 11) Category nuances (launch set)
- Dog poop: subjective; redo rare; small credit/add-on; photo required after repeats  
- Pool: separate “not performed” vs “outcome”; proof strict; redo controlled; refunds rare  
- Pest: expectation cards; controlled follow-up; stricter evidence after repeats  
- Windows/power washing: proof-heavy; redo window strict; credits can be bounded %  

---

## 12) Partner-driven growth compatibility

Required attribution fields on customers and tickets:
- `acquisition_source` (`provider_referred|handled_marketing|route_acquired`)  
- `referring_provider_org_id`  
- `partner_tier`  

Fraud controls:
- delayed/gated referral payouts  
- cohort anomaly detection  
- probation policy for new/referred cohorts  

Promise control:
- shareable onboarding links with inclusions/exclusions  
- “Expectation mismatch / provider promised X” ticket type → templated resolution + partner coaching record

Optional `/admin/partners/health`:
- dispute rate, credits per 100 jobs, redo intents per 100 jobs, retention, chargeback flags

---

## 13) Data model (Supabase)

### 13.1 Tables
- `support_tickets`  
- `support_ticket_offers`  
- `support_ticket_events` (append-only)  
- `support_attachments`  
- `support_policy_scopes`  
- `support_policies` (versioned, immutable)  
- `support_macros`  
- `ai_inference_runs`

(Use the exact field list from the guide; keep offers and events append-only.) fileciteturn1file0  

---

## 14) Integrations (Modules 05–11)

- Module 10 receipt → ticket creation with evidence attached  
- Module 11 credits/refunds ↔ ticket linkage + ledger events  
- Module 09 provider issue types can auto-open customer-impact tickets  
- Module 06 redo intent routed through service day engine only  
- Modules 05/07 deep links for plan/routine changes (no scheduling in support)

---

## 15) RLS & security

- Customers: only their tickets/offers/attachments/events  
- Providers: only tickets tied to their jobs/provider_org  
- Dispatchers: queue access within role permissions  
- Admins: full access + policy management  
- All actions logged in `support_ticket_events`  

No free-form chat tables.

---

## 16) Acceptance tests (must pass)

1) Receipt → missed item → evidence replay + Tier 1 credit → accept → resolved; credit applies next invoice.  
2) Duplicate suppression: second ticket attempt links to existing ticket.  
3) Chargeback intercept: “charge wrong” shows proof + offers; accept creates ledger event and resolves.  
4) Damage flow escalates with SLA; provider evidence request; admin queue shows AI summary + recommended action.  
5) Policy versioning: publish new version, tickets follow it; rollback restores prior behavior; audit preserved.  
6) Partner gating: referred customer in probation gets stricter offers and evidence requirements.  
7) No chat and no date picking anywhere in support flows.

---

## 17) Risks & mitigations

- Credit farming → caps + risk tiers + evidence gating + cohort monitoring  
- Redo becomes scheduling → redo intent only; routed through Module 06  
- Damage fraud → strict intake + triage + human decision  
- Provider churn → fair dispute rights + conservative holds + no clawbacks v1  
- AI inconsistency → AI suggests only; policy decides; templates enforce consistency  
- Overpromising → expectation pages + onboarding links + promise mismatch ticket type  

---

## 18) Definition of done

Module 12 delivers a policy-driven, evidence-first support system that:
- resolves most issues instantly with bounded outcomes  
- protects margin via caps, risk tiers, and chargeback intercept  
- preserves provider trust with disputable, non-chat workflows  
- prevents support from becoming scheduling  
- remains configurable, auditable, and partner-compatible as the network scales  
