# PRD — Private Customer Feedback + Provider Quality Score (Replaces Sprint 2D D8)

**Module / Sprint Replacement:** Round 2D (Customer Experience Polish & Retention) — replaces Sprint D8 (2D-16 NPS, 2D-17 streaks, 2D-18 leaderboard).  
**Primary Outcome:** Capture high-quality, *honest* homeowner feedback, drive rapid recovery when something goes wrong, and enforce provider quality with **aggregated + delayed + anonymous** scoring for providers.

**Key Decisions Added (finalized):**
- Provider rollups are **WEEKLY**
- Provider Quality Score uses a **ROLLING 4-WEEK (28-day) WINDOW**
- Admin/system has **full transparency immediately**; providers never see visit-level source details
- Provider-facing insights are **aggregated + delayed + thresholded** to prevent deduction

---

## 1) Why this exists (Strategy)

Handled Home wins on trust and “set-it-and-forget-it.” The most scalable way to protect trust is:
- **Immediate, transparent admin visibility** when something goes wrong (fast recovery)
- **Honest customer feedback** without fear of retaliation or awkwardness
- **Provider accountability** via a clear Quality Score, but **without exposing which home said what**

This PRD creates a feedback system that is:
- **Provider-anonymous** (providers cannot deduce the source)
- **Admin-transparent** (admins see everything instantly)
- **Operationally actionable** (feeds SLA enforcement + coaching + replacement decisions)

---

## 2) Goals & Non-goals

### Goals
1. Increase feedback capture rate after visits (especially “something went wrong”).
2. Enable **immediate recovery** for bad experiences (credits/redos/supportless support).
3. Provide providers with a **delayed, aggregated Quality Score** that is:
   - understandable
   - motivating
   - hard to game
4. Feed Round 2B quality enforcement + assignment weighting with real signal.
5. Make customers feel safe giving critical feedback by explicitly guaranteeing **provider anonymity**.

### Non-goals (explicitly out of scope)
- Direct customer↔provider chat
- Public reviews visible to other customers (Yelp-style)
- Real-time per-customer provider rating visibility
- Complex gamification (streaks, leaderboards)
- Any provider-visible feedback that can be mapped to a specific home or visit

---

## 3) Key Product Decisions (Source of Truth)

### D1 — Two-channel feedback model
**A) Immediate Satisfaction Check (private to admin/system)**  
Collected right after receipt view (or job completion notification). Purpose: fast detection + recovery.

**B) Delayed Provider Review (anonymous to provider)**  
Collected later with randomized delay. Purpose: honest coaching + scoring, without source deduction.

### D2 — Privacy model (“provider-anonymous, admin-transparent”)
- Feedback is **NOT anonymous to admin/system**
- Feedback is **anonymous to providers**
- Admin can see visit-level details instantly with full context
- Provider sees only **aggregated rollups** and **themes**, not visit-level details

### D3 — Delay model (provider-facing only)
- Provider-facing rollups publish **weekly**
- Individual reviews are buffered and only included when aggregation thresholds are met
- Provider never sees timing granularity that enables inference

### D4 — Minimum aggregation threshold
To prevent providers from deducing sources:
- Do not publish provider rollups unless there are at least **N_min** reviews in the relevant window (default **5**)
- Do not show any free-text (even paraphrased) until **N_text** is met (default **10–20**)
- Before thresholds: show generic status (“More feedback needed to generate insights”)

### D5 — Score window (finalized)
- Provider Quality Score is computed on a **rolling 28-day window**
- Weekly rollups provide coaching insights, but the score is stabilized by the rolling window

---

## 4) User Flows

### 4.1 Customer Flow — Immediate Satisfaction Check (Fast)
**Trigger:** Customer views receipt OR receives “Receipt Ready” notification.

UI: A lightweight card at the top of the receipt screen:
- Prompt: **“How did today’s visit go?”**
- Options:
  - ✅ “All good”
  - ⚠️ “Something wasn’t right”

If “All good”:
- Optional one-tap tags (max 3): “On time”, “Great quality”, “Looks amazing”
- Done in < 5 seconds

If “Something wasn’t right”:
- Route into structured “Issue” flow (existing supportless support module) with:
  - issue type selection
  - optional photos
  - optional note
- **Immediate admin visibility** and automation triggers:
  - open issue ticket
  - alert admin (exception inbox)
  - optionally trigger automated recovery offers within policy caps

### 4.2 Customer Flow — Delayed Provider Review (Honest + Safe)
**Trigger:** Randomized delay after visit (default 7–21 days). Optional enhancement: send after *next* visit to blur attribution further.

UI must explicitly promise privacy:
- Title: **“Private feedback (providers won’t know it’s you)”**
- Copy:
  - “Providers see only combined, delayed feedback and never which home it came from.”
  - “Handled Home may use your feedback to coach providers and fix issues.”

Inputs:
- Rating (1–5 stars)
- Multi-select “What stood out?” tags
- Optional free-text (shared only in combined form after thresholds)
- Optional **Confidential note to Handled Home** (never shared)

### 4.3 Provider Flow — Quality Score & Coaching (Aggregated + Delayed)
**Cadence:** Weekly rollup published (e.g., Monday 9am local zone time)  
**Score window:** Rolling last 28 days

Provider sees:
- Quality Score (0–100) + band badge (GREEN/YELLOW/ORANGE/RED)
- “Last 28 days” summary stats:
  - Avg rating and review count (if thresholds met)
  - Redo rate
  - Photo compliance
  - On-time performance
- Weekly coaching rollup:
  - Top positive themes
  - Top improvement themes
  - “Improve next week” checklist with explicit targets

Provider does **NOT** see:
- job-level ratings
- customer identity
- exact timestamps linked to homes
- unbatched quotes or unique phrasing at low volume

### 4.4 Admin Flow — Full Transparency + Rapid Recovery
Admin sees immediately (no delay):
- Quick satisfaction outcomes, visit-level ratings (when submitted), and issue flags
- Full free-text (including confidential notes)
- Linked context: job_id, customer_id, provider_org_id, zone/category, photos/receipt, issue thread
- One-click actions:
  - credit/redo/partial refund (policy-limited)
  - message customer (system message)
  - provider coaching note (internal)
  - provider warning / restrict assignments / suspend (if warranted)
- Risk alerts when provider score drops to ORANGE/RED or “Something wasn’t right” spikes

---

## 5) Data Model (Proposed)

### 5.1 `visit_feedback_quick`
Immediate satisfaction check.
- id (uuid)
- job_id (uuid, indexed)
- customer_id (uuid, indexed)
- provider_org_id (uuid, indexed)
- zone_id (uuid, indexed, optional but recommended)
- category (text, indexed, optional but recommended)
- outcome (enum: GOOD / ISSUE)
- tags (jsonb) optional
- created_at

### 5.2 `visit_ratings_private`
Delayed provider review (source-visible to admin only).
- id (uuid)
- job_id (uuid, indexed)
- customer_id (uuid, indexed)
- provider_org_id (uuid, indexed)
- zone_id (uuid, indexed, optional)
- category (text, indexed, optional)
- rating (int 1–5)
- tags (jsonb) optional
- comment_private (text) optional (admin only; never shared)
- comment_public_candidate (text) optional (eligible for provider rollups after processing + thresholds)
- scheduled_release_at (timestamptz)  ← randomized request send time
- submitted_at (timestamptz)
- created_at

**Constraints:**
- unique(job_id, customer_id) — one rating per visit/customer
- scheduled_release_at must be >= job completion time

### 5.3 `provider_feedback_rollups`
Provider-visible aggregated insights (weekly).
- id
- provider_org_id (indexed)
- period_start / period_end (indexed)
- review_count
- avg_rating
- theme_counts (jsonb)
- summary_positive (text)  ← paraphrased, threshold-gated
- summary_improve (text)   ← paraphrased, threshold-gated
- published_at
- visibility_status (enum: HIDDEN_INSUFFICIENT_N / PUBLISHED)

**Anonymity note:** Start with org-level rollups only. Optionally add zone/category rollups later when volumes are high.

### 5.4 `provider_quality_score_snapshots`
Composite score used by provider UX + assignment weighting.
- id
- provider_org_id (indexed)
- score_window_days int default 28
- score (0–100)
- band (GREEN/YELLOW/ORANGE/RED)
- components (jsonb)  ← weights + metric values used
- computed_at (indexed)

### 5.5 Optional: `provider_quality_score_events`
Audit and explainability for score changes.
- id
- provider_org_id
- old_score
- new_score
- old_band
- new_band
- change_reasons (jsonb)
- created_at

---

## 6) Scoring Model (Finalized Defaults)

### 6.1 Composite Quality Score (rolling 28 days)
Recommended weights (v1):
- Customer rating — **35%** (only if review_count >= N_min)
- Issue/redo rate — **25%**
- Photo compliance + validation success — **20%**
- On-time performance — **20%**

**Bands (example):**
- Green: 85–100
- Yellow: 70–84
- Orange: 55–69
- Red: <55

### 6.2 Explainability requirements (provider)
Provider must see 1–3 bullets and 1 target:
- Bullets: rating (if allowed), redo rate, photo compliance, on-time
- Target: explicit “next week” goal

### 6.3 Low-feedback fallback
If review_count < N_min in last 28 days:
- Compute score from operational signals only
- Label: “Limited customer feedback this period”
- Do not show rating averages

---

## 7) Privacy, Delay, and Anti-Deduction Rules (Hard Requirements)

- Delay window: **7–21 days**
- Weekly publish cadence
- Thresholds: **N_min = 5**, **N_text = 10–20**
- Theme-first insights; text later
- One review per job/customer
- One reminder after 7 days, then stop

---

## 8) Notifications & Scheduling (Round 2C integration)

Emit:
- CUSTOMER_FEEDBACK_QUICK_REQUESTED
- CUSTOMER_PROVIDER_REVIEW_REQUESTED
- ADMIN_PROVIDER_RISK_ALERT
- PROVIDER_QUALITY_ROLLUP_PUBLISHED

---

## 9) Acceptance Criteria (Summary)
- Providers cannot deduce who left feedback
- Admin sees everything immediately
- Weekly rollups publish; score is rolling 28 days
- Score is explainable and influences assignments

---

## 10) Implementation Plan (Suggested)
- Sprint E-Prep: tables + receipt UI + admin feed + delayed review scheduling
- Sprint E-Score: weekly rollups + provider UI + rolling score snapshots + admin risk alerts

---

## 11) Final Defaults (approved)
- Rollups: **Weekly**
- Score window: **28 days**
- N_min: **5**
- N_text: **10–20**
- Delay: **7–21 days**
- Weights: **35/25/20/20**
