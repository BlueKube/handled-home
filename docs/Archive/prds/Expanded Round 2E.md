Below is a **thorough Round 2E PRD** that replaces/expands your existing 2E list, and ties directly into what you already built in 2B (assignment/routing) and the new “provider-anonymous feedback / quality score” system.

One important detail you flagged: **app store fees.** For **physical services**, Apple/Google generally don’t require in-app purchase (IAP) like they do for digital goods, so you can use Stripe/external payments for service bookings in most cases; Apple’s post-ruling guideline updates also changed what you can link to in the US storefront. ([Apple Developer](https://developer.apple.com/app-store/review/guidelines/?utm_source=chatgpt.com))

---

# **PRD — Round 2E Provider Experience Polish & Supply Retention**

**North Star:** Make it economically irrational for high-quality providers to leave, while keeping the platform’s right to reassign customers to protect quality and reliability.

## **1\) Strategy and positioning**

### **Provider promise**

1. **Demand provided:** jobs are fed to them (no door knocking, no ads, no selling).  
2. **Time efficiency:** their day is pre-built: route, times, tasks, proof, receipts.  
3. **Meritocracy:** quality score drives more/better work (and stability).  
4. **Higher monthly income:** lower per-job pay offset by higher utilization \+ less dead time.  
5. **Admin offload:** payments, collections, reminders, customer comms, bookkeeping summaries.

### **The platform’s non-negotiables**

* Customers belong to the **platform**, not the provider.  
* Providers can earn “primary rights,” but those rights are **revocable** for quality, availability, safety, fraud, or customer request.  
* Vacation coverage is expected; reliability must remain high.

## **2\) Core product concepts**

### **A) “Primary Rights, not ownership”**

* Provider can be **Primary** for a zone+category (franchise-like)  
* Customers can request change; platform can change provider for disqualifying events or performance drops  
* When a provider takes vacation, customers are temporarily served by backups; primary rights resume if quality remains high

### **B) The “Daily Plan” is the product**

When provider opens the app each morning:

* today’s job list  
* route order \+ map  
* time windows \+ expected duration  
* one-tap navigation  
* job status flow \+ proof checklist  
* earnings forecast \+ “what you’ll make today”

## **3\) Scope**

### **In-scope for Round 2E**

* Provider day execution “command center”  
* Real-time-ish job state transitions (not live GPS streaming)  
* Earnings transparency \+ projections  
* Quality score and tiering tied to assignment priority  
* Availability/vacation blocks that the assignment engine respects  
* Provider onboarding/training gates for SKUs (lightweight)  
* BYOC (bring-your-own-customers) flows & rules (Founding Partner-compatible)  
* Provider retention levers: faster payout, reduced holds, priority routing, territory stability

### **Out-of-scope**

* Public provider marketplace profiles  
* Provider leaderboards (high drama, low ROI)  
* Complex badge gamification  
* Fully automated tax filing (you can generate summaries/exports)

## **4\) Provider experience: key screens**

### **4.1 Provider Home: “Today”**

**Goal:** one screen to run the day.

Must include:

* “Today’s plan” summary  
  * stops count, total expected work time, estimated drive time  
  * projected earnings today  
* Route map toggle (list ↔ map)  
* “Start route” action (locks route order unless exceptions)  
* Quick alerts: schedule changes, reassigned jobs, SLA warnings

Acceptance criteria:

* Provider can complete a full day without needing admin help  
* Any exceptions are explained in one sentence (“job moved due to weather mode”, “reassigned due to capacity”)

### **4.2 Job Detail: execution \+ proof**

Status flow UI:

* EN\_ROUTE → ARRIVED → IN\_PROGRESS → COMPLETED  
* timestamps are recorded; “arrived” requires GPS timestamp capture (coarse) but no live tracking

Must include:

* checklist of tasks per SKU  
* proof photo capture guidance  
* “issues” button (flags admin immediately)

### **4.3 Provider Earnings**

Must include:

* daily/weekly/monthly totals  
* per-job earning breakdown with modifiers:  
  * quality bonus  
  * rush/extra handles job  
  * hold reason / released hold countdown  
* “At current pace” projection (based on scheduled jobs)  
* payout schedule visibility and bank account status

### **4.4 Provider Quality & Tier**

Provider sees:

* rolling 28-day Quality Score band (Green/Yellow/Orange/Red)  
* weekly rollup insights (anonymous to provider)  
* “how to improve next week” checklist  
* “what this affects” (assignment priority, overflow eligibility, hold periods)

Provider does NOT see:

* which customer gave feedback  
* visit-level ratings or timestamps that can be deduced

### **4.5 Availability / Vacation**

Provider can set:

* days off  
* vacation blocks  
* (optional) max stops/day preferences

System behavior:

* assignment engine automatically routes coverage to backups  
* if vacation block would break minimum coverage, system warns and requests lead time

## **5\) Economic model and incentives**

### **5.1 Make leaving irrational**

Give high performers:

* more stable routes / more dense stops  
* fewer empty days  
* faster payout / fewer holds  
* “primary rights” stability  
* priority access to new zones as they open

### **5.2 BYOC without breaking the platform**

Providers can bring customers, but:

* customers pay through app  
* provider gets credit for acquisition (bonus handles, reduced fees, or higher share for a period)  
* customer can still request a different provider  
* platform can reassign for quality/availability/safety

## **6\) Payments and app store fee reality (important)**

* For **physical services**, platforms generally treat these as not requiring in-app purchase systems (unlike digital subscriptions/items), so Stripe/external payments are commonly used for service marketplaces. ([Android Developers](https://developer.android.com/google/play/billing?utm_source=chatgpt.com))  
* Apple’s US guideline changes around external links/purchases have also evolved post-ruling. ([Apple Developer](https://developer.apple.com/news/?id=9txfddzf&utm_source=chatgpt.com))

Practical implication:

* You can keep payments through Stripe (card on file) without a 15–30% IAP haircut in typical “physical services” setups, but you should still treat store policy as something to re-check at launch per region/storefront. ([Apple Developer](https://developer.apple.com/app-store/review/guidelines/?utm_source=chatgpt.com))

## **7\) Pricing engine \+ provider pay engine (tie-in)**

You’re right: this becomes a major “autopilot” system.

### **7.1 Inputs**

* zone demand (waitlist, conversion rate)  
* zone capacity (available provider hours/stops)  
* issue rates (quality risk)  
* route efficiency metrics (drive minutes per stop)  
* seasonality, weather events, holiday shifts  
* target profit margin per region

### **7.2 Outputs**

* customer pricing per SKU/handles cost per region  
* provider pay rates per SKU (and modifiers)  
* “starter zone incentives” (temporary)  
* auto adjustments within guardrails

### **7.3 Admin controls**

* set target margin bands by region  
* set max weekly change limits  
* emergency override with audit log  
* “protect quality mode” toggles (ties to 2B market states)

Acceptance criteria:

* system can run without humans day-to-day  
* admin can intervene safely with guardrails \+ rollback

## **8\) Data model (high level)**

You already have a lot of tables. Add/ensure:

* provider\_availability\_blocks (provider\_org\_id, start/end, type)  
* provider\_quality\_score\_snapshots (rolling 28d)  
* provider\_tier\_history (tier changes \+ reasons)  
* provider\_earnings\_summary (cached)  
* provider\_route\_plan (date, ordered job ids, locked\_at)  
* provider\_byoc\_attribution (provider\_org\_id, customer\_id, start/end, terms)

## **9\) Automation and enforcement**

### **SLA enforcement ladder (from 2B, now provider-visible)**

* Green: normal  
* Yellow: warnings \+ coaching tasks  
* Orange: restricted assignments \+ mandatory training refresh  
* Red: suspension \+ replacement workflow

Provider must see:

* what happened  
* what to do next  
* what they lose/gain

## **10\) Updated Round 2E task list (recommended)**

Replace your current list with this structure:

### **E0 — Provider Day Command Center (P0)**

* E0-01 Today screen \+ route lock \+ map/list toggle  
* E0-02 Job detail status flow \+ proof \+ timestamps  
* E0-03 Customer “on the way / in progress” uses state changes only (no GPS stream)

### **E1 — Earnings & Payout Trust (P0)**

* E1-01 Earnings dashboard (day/week/month \+ per-job)  
* E1-02 Projections based on scheduled jobs  
* E1-03 Modifier transparency (bonus/hold/rush)

### **E2 — Quality & Tier (P0)**

* E2-01 Provider quality score (rolling 28d) \+ weekly rollups display  
* E2-02 Tier system tied to assignment priority \+ hold periods  
* E2-03 Coaching checklist \+ required training gates for certain SKUs

### **E3 — Availability \+ Coverage (P1)**

* E3-01 Vacation blocks respected by assignment engine  
* E3-02 Coverage continuity rules (backup pool activation)  
* E3-03 “request days off” policy with lead time guidance

### **E4 — BYOC (P1)**

* E4-01 Provider invite flow for their customers (Founding Partner)  
* E4-02 Attribution \+ temporary incentives  
* E4-03 Reassignment rules \+ customer request provider change flow

### **E5 — Pricing/Pay Engine Admin Controls (P1–P2 depending how deep)**

* E5-01 Region margin targets \+ guardrails  
* E5-02 Starter-zone incentive tool  
* E5-03 Pricing/Pay simulation and audit logs

## **11\) Success metrics**

* Provider retention (90-day, 180-day)  
* Utilization (work minutes / available minutes)  
* Drive minutes per stop  
* On-time rate, redo rate, issue rate  
* % jobs completed without admin intervention  
* Provider NPS-equivalent (optional), but better: “weekly active providers” \+ churn reasons

---

## **My opinionated call**

Cut leaderboards and streak badges from 2E. They create drama and don’t materially improve supply retention. Providers care about:

* money  
* predictability  
* fairness  
* respect  
* time

If you nail “Today plan \+ earnings trust \+ quality tiers,” you’ll win supply.

---

Brandon — do you want BYOC incentives to be **time-limited** (e.g., “higher share for 90 days per brought customer”) or **permanent** (provider keeps a small override forever)?

