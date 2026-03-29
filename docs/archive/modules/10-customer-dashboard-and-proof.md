# 10-customer-dashboard-and-proof.md
> **Implementation Status:** ✅ Implemented in Round 1. This is the canonical Module 10 spec. See also `10-visit-tracking-photos.md` (redirects here).

**Handled Home — Module 10 PRD (Customer Control Center + Proof)**  
**Mobile:** iOS + Android (Capacitor) — **Customer**  
**Admin Console:** Mobile-optimized, operationally usable  

**Primary Customer Routes:**  
- `/customer/dashboard`  
- `/customer/plan/preview` (optional expanded preview)  
- `/customer/visits`  
- `/customer/visits/:job_id`  
- `/customer/issues` (optional MVP)  
- `/customer/issues/:issue_id` (optional MVP)  

**Primary Admin Routes:**  
- `/admin/customers/:customer_id` (support view)  
- `/admin/properties/:property_id` (support view)  
- `/admin/jobs/:job_id` (from Module 09; deep link)  
- `/admin/issues` (optional MVP support queue)  

**Last updated:** 2026-02-22  

---

## 0) Why this module exists

Customers renew when they feel:
- service is predictable  
- quality is consistent  
- proof is obvious and easy to access  
- problems are handled without effort  

Module 10 is the customer’s **control center** and **visit receipt system**:
- a calm **4-week preview timeline** (read-only)  
- “what’s next” visibility without scheduling  
- premium transparency (bounded ETA band when enabled)  
- proof of work (photos + timestamps + checklist highlights)  
- structured issue flagging without chat or rescheduling UI  

---

## 1) North Star outcomes (Definition of Done)

1) Customer sees a clear **4-week plan preview** that makes service feel predictable.  
2) Customer always knows what’s next without scheduling anything.  
3) Every completed visit feels like a premium **Handled Receipt** with proof.  
4) Customer can flag issues quickly without negotiating with providers.  
5) Proof + transparency reduce support load and increase trust.  

---

## 2) Scope

### 2.1 In scope
- Customer dashboard (“Next Visit” + 4-week preview timeline)  
- Read-only expanded plan preview (optional)  
- Support for **multiple visits within a single week** (routine + add-ons/seasonals)  
- Visit history list  
- Visit receipt / proof hub:
  - photos (labeled)  
  - arrived/left/time on site  
  - brief summary  
  - checklist highlights + “not completed” reasons  
- Customer issue reporting from a receipt (structured)  
- ETA band display only when tracking is enabled and provider started “en route” (Module 09)  
- Optional lightweight issue center for customers  
- Optional admin support queue surface for issues  

### 2.2 Out of scope
- Customer date picking / rescheduling controls  
- Live moving-dot map tracking  
- Provider chat threads  
- Ratings/reviews (unless explicitly prioritized later)  
- Refunds/credits automation  

---

## 3) Product principles (non-negotiable)

- **Handled, not managed:** customer never feels like a scheduler.  
- **Preview is a plan, not appointments:** week-level preview; no weekday selection.  
- **No calendar app:** no drag/drop, no date picking, no “choose a time.”  
- **Truth banners:** tell the truth when something is pending or updated.  
- **Proof over promises:** photos + timestamps + checklist highlights are the product.  
- **Structured issues:** bounded intake routed to support; no negotiation UI.  

---

## 4) Customer dashboard UX  
Route: `/customer/dashboard`

### 4.1 Top card — “Next Visit”
Purpose: instant confidence in “what’s next.”

Shows:
- Next planned visit (routine or seasonal/add-on)  
- Status:
  - Planned  
  - En route (only if tracking enabled + started)  
  - In progress (arrived)  
  - Completed (tap to receipt)  
- Service summary (human readable)  
- CTA:
  - Planned → “View plan” (scroll to timeline or open preview)  
  - En route / In progress → “View details” (opens visit details sheet / preview)  
  - Completed → “View receipt”  

If En route:
- ETA band: “Estimated arrival: 12–20 min”  
- Helper: “Sharing ends when they arrive.”

If tracking not enabled/unavailable:
- “Your pro is on the way. ETA unavailable.”

Rules:
- No appointment language.  
- No precise countdowns.  

### 4.2 Truth banner (dashboard-level)
Shown only when needed:
- Service Day not confirmed → “Confirm your Service Day to activate your plan.” (deep link Module 06)  
- Routine not confirmed/effective → “Your routine updates take effect next cycle.” (deep link Module 07)  
- Plan changed → “Your plan was updated. Preview reflects next cycle.”  
- Zone paused / service disruption → calm, non-alarming message + support link

---

## 5) The 4-week Preview Timeline (signature WOW mechanism)

This replaces calendar anxiety with clarity.

### 5.1 Presentation (Weeks 1–4; week-level only)
On dashboard, show a timeline with **Week 1–4** containers:
- Each week contains **visit cards**  
- Must support **multiple visits per week** without clutter  

Default collapsed week behavior:
- Show the primary visit card for the week  
- If additional visits exist:
  - show “+1 more” / “+2 more” indicator  
- Tap week expands to show all visit cards for that week  

Each visit card shows:
- Badge: Routine / Seasonal / Add-on  
- Service summary (bundled SKUs in human language)  
- State:
  - Planned  
  - Route assignment pending  
  - Updated  
  - Completed (links to receipt)  
  - Issue (links to receipt/issue status)  
- If this is the active visit (today):
  - En route state + ETA band (if enabled)  
  - In progress state (arrived)

### 5.2 Read-only rules (critical)
- No date selection  
- No drag/drop  
- No provider/time selection  
- “Adjust plan” deep links to Module 07 (Bundle Builder) with clear “effective next cycle” language

### 5.3 Truth banners (reduces confusion)
When planned visit not yet assigned:
- Badge: “Planned — route assignment pending.”

When visit shifts due to ops:
- Badge: “Updated” + category label:
  - Weather  
  - Provider availability  
  - Routing optimization  
Tone: calm, non-technical, non-blaming.

### 5.4 Visit detail (tap behavior)
Tap a visit card → lightweight detail sheet (recommended) or route to `/customer/plan/preview`.

Detail shows:
- included services (bundled SKUs summarized)  
- what proof they’ll receive (photos + timestamps)  
- access notes they provided (read-only)  
- CTA: “Need to change something?” → Module 07  
- If visit maps to an actual job already created:
  - include “View receipt” when completed  
  - include “Tracking/ETA info” when en route  

**No reschedule controls.**

---

## 6) Bundling vs splitting (how visits appear)

Customer mental model:
- one visit can include multiple SKUs (routine + small add-ons)  
- splitting is rare and should be explained by label, not logistics

UI rules:
- If combined: single card listing multiple services.  
- If split: multiple visit cards within the same week, labeled clearly:
  - “Routine Visit”  
  - “Seasonal Boost (Specialist)”  
Never imply a specific weekday.

---

## 7) Visits list (history)  
Route: `/customer/visits`

List shows:
- Date  
- Routine/Seasonal/Add-on badge  
- Status:
  - Completed  
  - Issue under review  
  - Resolved  
- Thumbnail preview (best “after” if available)  
Tap opens receipt.

Performance:
- paginate / infinite scroll  
- thumbnails prioritized for speed  

Empty state:
- “Your visit receipts will appear here after your first handled visit.”

---

## 8) Visit detail — “Handled Receipt” (proof hub)  
Route: `/customer/visits/:job_id`

This is the core retention moment.

### 8.1 Required sections (in order)

1) **Header**
- Status pill: Completed / Issue under review / Resolved  
- Visit date  
- Human-readable service summary  
- Property label (if multi-property future)

2) **Presence proof**
- Arrived at  
- Left at  
- Time on site (computed)  
If missing due to override:
- show calm label: “Verified by support.”

3) **Photo proof gallery**
- Required photos first (grouped by slot labels if present)  
- Optional photos below  
- Full-screen viewer with labels  
- If receipt not ready (rare):
  - “Finalizing your receipt…” with refresh

4) **Work summary**
- Provider summary line (optional)  
- Checklist highlights (not every item by default):
  - show key completed items  
  - if items not completed due to issue:
    - show “Not completed” with reason label

5) **Issue / problem CTA**
- If no issue exists:
  - “Report a problem”  
- If issue exists:
  - show issue status + submitted date + “Under review”
  - show any resolution note when resolved

Tone: calm, confident, non-blaming.

---

## 9) Issue reporting (customer-facing, structured; not chat)

Entry:
- receipt → “Report a problem”

Optional:
- `/customer/issues` list and `/customer/issues/:issue_id` detail

### 9.1 Issue intake flow
Step 1: Choose reason
- Missed something  
- Damage concern  
- Not satisfied  
- Other  

Step 2: Details
- Short note required (max 500 chars)  
- Photo:
  - required for Damage concern  
  - strongly recommended otherwise  

Step 3: Submit
- Confirmation:
  - “Thanks — support will review and follow up.”
- Expectation line configurable by ops (avoid hard promises)

### 9.2 Customer-visible statuses
- Submitted  
- Under review  
- Resolved (with short resolution note)

Boundaries:
- No provider chat thread  
- No reschedule UI  
- Any redo/return handled by support later

Rate limits:
- default: one concern per visit  
- older visits: show “This visit was {X} days ago” and set expectations

---

## 10) Customer ETA experience (bounded and safe)

Only show ETA when:
- tracking is enabled and opted-in (Module 09 policy)  
- provider started “en route” for this job  

Display:
- Text-only band: “Estimated arrival: 12–20 min”  
- “Sharing ends when they arrive.”  
- If stale > 5 min:
  - widen band or show “Updating ETA”

Never show:
- map dot  
- exact countdown  
- promised appointment time  

---

## 11) Data requirements (consumes Modules 07 + 09 artifacts)

### 11.1 Read models
Reads (customer-scoped):
- `jobs`  
- `job_photos` (signed URLs)  
- `job_checklist_items` (summarized)  
- `job_tracking_state` (ETA band + arrived/left)  
- `job_issues` (customer-safe fields)  
- Plan preview model (Week 1–4) derived from:
  - routine versions (Module 07)  
  - service day (Module 06)  
  - plus actual jobs when created (Module 09)

### 11.2 Optional supporting tables
- `customer_notification_log` (dedupe; in-app “recent updates” list)  
- `customer_visit_preview` (materialized read model; optional for performance)

---

## 12) RLS & security

- Customers can read only their jobs and related proof artifacts.  
- Photos must be served via short-lived signed URLs; never public.  
- Customers can create issues only for their own jobs.  
- Customers cannot modify proof artifacts, tracking state, or job status.  
- Admins can read all for support.

Provider privacy:
- avoid exposing provider personal identity by default; show “Your pro” unless policy allows.

---

## 13) Notifications & deep linking

- Completion push → deep link to `/customer/visits/:job_id`  
- Optional “On the way” push when `EN_ROUTE_STARTED` fires:
  - rate-limited: max 1 per job  
- If receipt not ready:
  - open receipt route and show “Finalizing…” state

---

## 14) Edge cases

1) Multiple visits in a week:
- default collapsed view shows primary + “+N more”  
- expanding shows each clearly labeled  

2) Missing proof due to admin override:
- receipt shows “Verified by support” and displays available evidence  

3) ETA stale or tracking disabled:
- calm fallback; no error surfaces  

4) Old visit issues:
- allow reporting but adjust expectation copy  

5) Multi-property customers (future):
- dashboard and timeline label property on cards  
- add simple property switcher if needed

---

## 15) Acceptance tests (explicit)

1) Dashboard shows Next Visit and a 4-week preview timeline.  
2) Preview remains read-only (no date picking/rescheduling).  
3) Multiple visits in a week render correctly (collapsed + expanded).  
4) En route state shows ETA band only when enabled and active.  
5) Receipt shows photos, arrived/left, time on site, and summary.  
6) Customer can report an issue; it is created and status is visible.  
7) RLS prevents cross-customer access, including photo access.  
8) Notifications deep link to the correct receipt reliably.  

---

## 16) Deliverables

- Customer dashboard UI with 4-week preview timeline (read-only)  
- Optional expanded plan preview route  
- Visit history list + receipt detail UI  
- Structured issue reporting flow + optional issue center  
- Integration to Module 07 preview model and Module 09 proof artifacts  
- RLS policies for customer read + issue creation  
- Notification deep link handling (completion + optional en route)  
