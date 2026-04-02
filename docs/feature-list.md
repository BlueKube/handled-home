# Handled Home — Complete Feature List

> **"Your home is handled."**
>
> This document catalogs every feature built into Handled Home — a managed home-maintenance platform that replaces fragmented vendor relationships with a single, intelligent, density-optimized operating system for your home. Each item has a maturity rating (1-10): 10 = production-ready, 8-9 = functional with minor polish needed, 6-7 = core exists but needs work, 4-5 = partial, 2-3 = stub, 1 = does not exist.
>
> **Value-prop tags**: Each section is tagged with the strategic value propositions it serves (see `operating-model.md`):
> - `mental-load-reduction` — reduces customer coordination burden
> - `provider-value` — improves provider business operations
> - `density-driver` — improves zone economics and route efficiency
> - `trust-builder` — proof, transparency, quality
> - `margin-lever` — directly impacts subscription spread or unit economics

---

## I. Authentication & Identity `mental-load-reduction`

1. Email/password signup and login with secure session persistence across app restarts — 9/10
2. Automatic profile creation and default customer role assignment on signup — 9/10
3. Multi-role support: users can hold customer, provider, and admin roles simultaneously — 9/10
4. One-tap role switching without logout for multi-role users — 9/10
5. Admin Preview Mode: admins can view the app as any role without needing that role in the database; preview banner shows active preview state — 9/10
6. "Account Not Configured" safety screen with retry button, bootstrap error display, and user email for support reference — 9/10
7. Role-based route protection preventing cross-role access (typing `/admin` as a customer always redirects) — 9/10
8. Bootstrap RPC that repairs partial signups on next login (idempotent, surfaces errors to UI, manual retry available) — 9/10

---

## II. Property Profiles & Home Intelligence `mental-load-reduction` `density-driver`

9. Single-screen property profile with structured address, access notes, gate codes, parking, and pet info (decomposed: HomeSetupSection + ExpansionDialog extracted) — 9/10
10. Real-time zone coverage indicator as the customer types their ZIP code — 9/10
11. Property gate: new customers guided to add home; fails open on query error instead of silent false — 9/10
12. Coverage Map: 10-category self-assessment (Self / Have Someone / None / N/A) with switch intent tracking — 9/10
13. Property Sizing Tiers: sqft, yard, windows, and stories — used to auto-select correct service levels — 9/10
14. Progressive "Complete Home Setup" card with skeleton loading state and ARIA progressbar — 9/10
15. `get_property_profile_context` RPC: returns computed eligibility, switch candidates, and high-confidence upsells — 9/10
16. Personalization event logging for every setup completion and update — 9/10

---

## III. Zones, Regions & Capacity Governance `density-driver`

17. Region hierarchy for organizational grouping (e.g., "Los Angeles County") — 8/10
18. ZIP-code-based zone definitions with instant coverage lookups — 8/10
19. Per-zone capacity settings: max homes/day, max minutes/day, buffer percentage — 8/10
20. Zone Health Score: Green / Yellow / Red advisory based on utilization ratio — 8/10
21. Smart adjacent-ZIP suggestions when creating zones (prefix-matching heuristic) — 8/10
22. Expansion Signal Dashboard: non-serviced ZIP demand ranked by signup count — 8/10
23. Primary + Backup provider model per zone and category (franchise-style territory) — 8/10
24. Zone launch lifecycle: planning → recruiting → soft_launch → live → paused — 8/10
25. Market zone category state: open / waitlist_only / closed / provider_recruiting per category — 8/10
26. Founding Partner slot tracking per zone and category — 8/10

---

## IV. Service Catalog (SKU System) `trust-builder` `margin-lever`

27. Standardized Service SKUs with inclusions, exclusions, duration, and edge-case notes — 8/10
28. Fulfillment mode governance: same_day_preferred / same_week_allowed / independent_cadence — 8/10
29. Structured proof requirements per SKU: labeled photo slots (before/after/both) with counts — 8/10
30. Checklist templates per SKU with required/optional flags — 8/10
31. SKU lifecycle: draft → active → paused → archived (never hard-deleted) — 8/10
32. Visual service catalog with hero images, featured flags, and category grouping — 8/10
33. Customer-facing catalog with horizontal featured scroll, category groups, and search — 8/10
33b. Customer service cards show entitlement badges (Included / Extra Allowed / Blocked / Available) based on subscription plan context — 8/10
34. Admin duplicate-SKU action for safe scope changes — 8/10
35. Weather sensitivity flag per SKU — 8/10
35b. Admin SKU Calibration page: compare seed values vs. provider-reported durations/costs, delta highlighting, per-tier inputs, calibration export report — 8/10
35c. 23 SKUs fully calibrated with routing metadata (scheduling_profile, access_mode, fulfillment_mode, weather_sensitive), handle costs anchored to 7-handle standard mow model, and structured inclusions/exclusions — DONE
35d. 5 new SKUs added: Gutter Cleaning, Fall Prep, Trash Can Cleaning, Grill Cleaning, Dryer Vent Cleaning — DONE

---

## V. SKU Levels (Service Variants) `trust-builder` `margin-lever`

36. Multi-level variants per SKU (e.g., Maintenance / Standard / Deep) with different scope, time, and cost — 8/10
37. Side-by-side level comparison UI with handle delta display — 8/10
38. Guidance questions (0–3 per SKU) for logic-based level selection — 8/10
39. Smart level defaults based on property sizing signals (sqft, yard, windows, stories) — 8/10
40. Provider level sufficiency prompt at job completion — 8/10
41. Level recommendation system with reason codes for providers to suggest the correct level — 8/10
42. Courtesy upgrade: provider performs a higher level for free, once per property/SKU/6 months — 8/10
43. Admin analytics: recommendation + courtesy upgrade counts, mismatch detection by zone — 8/10
43b. 54 sku_levels seed data across 23 SKUs — research-calibrated handle costs, planned minutes, inclusions/exclusions, and proof checklists per level. Covers lawn care (4 SKUs), treatment/seasonal (5), specialty (5), new outdoor (4), and home assistant (5) — DONE
43c. Market simulator validation of handle economics — break-even at 72.2% utilization, 44.6% margin at 40% target utilization. All 54 SKU/levels verified consistent with 7-handle anchor model — DONE
43d. Comprehensive SKU calibration reasoning report (docs/sku-calibration-report.md) — per-SKU pricing rationale, licensed service premium analysis, tier progression logic, deferred service documentation, and database field recommendations — DONE
43e. Database schema enhancements — 9 new columns on sku_levels (presence_required, access_mode, weather_sensitive, provider_payout_hint_cents, property_size_tier) and service_skus (licensing_required, seasonal_availability, recommended_frequency, min_provider_rating). Level-specific overrides for Window Cleaning and Pest Control interior access. Licensing, seasonal, and frequency metadata seeded for all relevant SKUs — DONE
43f. Admin Market Simulator — full 12-month simulation dashboard at /admin/simulator with real-time sliders (zone, pricing, provider, BYOC, retention, overhead), 6 KPI metric cards, 4 charts (revenue vs pay, margin/utilization, active customers, acquisition sources), monthly projection table, 3 scenario presets (baseline/optimistic/conservative), 4 seasonal market profiles, localStorage save/load — DONE

---

## VI. Subscription Engine `margin-lever` `mental-load-reduction`

44. Membership-first tiered plans: Essential / Plus / Premium — 8/10
45. 28-day billing cycles ("Billed every 4 weeks") for predictability without calendar-month complexity — 8/10
46. Dual-clock model: billing cadence (28-day) + operational rhythm (weekly service weeks) — 8/10
47. Stripe integration as payment rail; entitlements owned by Supabase (not Stripe-derived) — 8/10
48. Soft onboarding: browse plans, preview SKUs, build draft routine — all before paying — 8/10
49. Plan zone availability: plans can be enabled/disabled per zone — 8/10
50. Entitlement versioning: plan entitlement rules are version-tracked and immutable — 8/10
51. No-rollover policy: unused service weeks expire at billing cycle end — 8/10

---

## VII. Handles Currency System `margin-lever`

52. Handles as the internal unit of value — simple "Used / Remaining" bar for customers — 8/10
53. Handle transaction ledger: grant / spend / expire / rollover / refund — append-only, reconcilable — 8/10
54. Cached balance on subscription with `recalc_handles_balance()` RPC for reconciliation — 8/10
55. Per-SKU handle cost display ("Costs 3 handles") at point of selection — 8/10
56. Rollover with configurable cap and expiry days per plan — 8/10
57. Refund handles preserving original expiry date on system/provider cancellations — 8/10
58. Idempotency key indexing on handle transactions to prevent duplicate grants — 8/10

---

## VIII. Service Day System `density-driver` `mental-load-reduction`

59. System-assigned recurring Service Day based on zone, capacity, and route optimization — 8/10
60. Customer confirm/reject flow with exactly one rejection token — 8/10
61. 2–3 controlled alternative day offers on rejection (never infinite cycling) — 8/10
62. Atomic capacity reservation: capacity is reserved when an offer is created, moved on alternative selection — 8/10
63. "System Recommended" badge with efficiency-framed reason text — 8/10
64. "Must be home" toggle with time window selector (morning/afternoon) — 8/10
65. "Try to align days" preference toggle with tradeoff messaging — 8/10
66. Admin utilization view: Mon–Sun assignment counts per zone with stability indicators — 8/10
67. Admin override with mandatory reason, capacity warnings, and full audit logging — 8/10

---

## IX. Routine & Bundle Builder `mental-load-reduction` `margin-lever`

68. 3-step progressive flow: Build Routine → Review Scope + Proof → Confirm Lock — 9/10
69. Per-SKU cadence picker: weekly / biweekly / every 4 weeks / independent — 9/10
70. Live 4-week preview timeline that updates instantly on every change — 9/10
71. Entitlement-aware guardrails: routine demand vs. plan allowance with calm warning panel — 8/10
72. "Auto-fit to my plan" one-tap automation that adjusts cadences to fit entitlements — 8/10
73. Biweekly pattern optimizer (Weeks 1&3 vs 2&4) based on zone load + geo clustering — 7/10
74. Bounded "Swap pattern" option for biweekly items with feasibility check — 7/10
75. Confusion detector: inline help when a customer changes cadence 3+ times — 1/10
76. Versioned routine locking with effective date policy (next billing cycle start) — 8/10
77. Review step: per-service scope + proof expectations to prevent disputes — 8/10

---

## X. Guided Customer Onboarding `mental-load-reduction`

78. 6-step onboarding wizard: Property → ZIP/Zone Check → Plan Selection → Subscribe → Service Day → Build Routine — 8/10
79. Zone availability check with automatic waitlist signup if no zone covers the ZIP — 8/10
80. Onboarding progress persistence: auto-resumes at the exact step on return — 8/10
81. Checkout success polling with auto-advance when subscription appears — 8/10
82. Property gate distinguishes truly new users from churned customers returning — 8/10

---

## XI. Job Execution & Provider Workflow `provider-value` `trust-builder`

83. Provider daily job list optimized for "today → next" with route-ordered stops — 8/10
84. Job detail with Level, scope bullets, access notes, proof requirements, and planned minutes — 8/10
85. Guided checklist completion: required items must end in Done or Not-Done-With-Reason — 8/10
86. Photo proof capture with offline/poor-signal resilience: queue uploads automatically — 8/10
87. Server-validated atomic job completion: `complete_job` RPC validates all proof before marking done — 8/10
88. Structured issue reporting with type, severity, and evidence — no chat threads — 8/10
89. Admin override completion with mandatory reason and audit logging — 8/10
90. Job event timeline: append-only log of every state change (started, arrived, departed, completed) — 8/10

---

## XII. Provider Day Command Center `provider-value` `density-driver`

91. Route plan locking: "Start Route" freezes route order and computes projected earnings — 8/10
92. Projected earnings banner based on completed + (historical avg × remaining stops) — 8/10
93. Estimated drive and work time stats on provider dashboard — 8/10
94. Route reorder controls disabled when route is locked — 8/10

---

## XIII. Route Optimization `density-driver` `provider-value`

95. Nearest-neighbor route optimization using geohash/lat-lng from properties — 8/10
96. Provider manual reorder with up/down controls and audit logging — 8/10
97. Minimum-jobs guard: skip optimization for routes with < 3 stops — 8/10
98. IN_PROGRESS freeze: in-progress jobs are pinned and excluded from reorder — 8/10

---

## XIV. Photo Proof & Visit Receipts `trust-builder`

99. Before/after comparison slider with pointer-drag interaction — 8/10
100. Photo timeline: chronological gallery of all visit photos per property — 9/10
101. Photo quality validation edge function: sharpness, brightness, duplicate hash, orientation — 7/10
102. Canvas-based image compression for upload performance — 8/10
103. Signed URL display for secure photo viewing — 8/10
104. "Handled Receipt" per visit: photos + timestamps + checklist + provider summary — 9/10

---

## XV. Billing & Payments `margin-lever`

105. Tokenized payment method management with add/remove/default — 8/10
106. Subscription autopay with 28-day cycle invoicing — 8/10
107. Invoice line items: plan, add-ons, credits, taxes/fees — 8/10
108. Receipt view with cycle period, payment status, and method (masked) — 8/10
109. Billing health states: Healthy / Action Required / Past Due / Service Paused — 8/10
110. Customer credits with fixed tiers ($10/$25/$50/custom) and auto-application to next invoice — 7/10
111. Idempotent invoice generation via idempotency keys — 8/10

---

## XVI. Provider Payouts `provider-value` `margin-lever`

112. Provider payout onboarding via Stripe Connect Express — 8/10
113. Weekly automated payout runs with minimum threshold enforcement — 8/10
114. Per-job earnings detail: base pay + modifiers + hold status + net — 8/10
115. "At current pace" monthly earnings projection — 8/10
116. Hold reasons with explicit explanations and expected release countdown — 8/10
117. Severity-based earning holds: LOW (no hold), MED (24–48h soft), HIGH (hard hold + exception) — 8/10
118. Payout webhook confirmation: earnings only marked PAID on processor confirmation — 8/10

---

## XVII. Dunning & Payment Recovery `margin-lever`

119. 5-step automated dunning sequence: +1d, +3d, +5d retry with escalating notifications — 8/10
120. Calm in-app banner: "We couldn't process your payment. Update your card." — 8/10
121. Auto-pause subscription scheduling after N failures (preserves receipt/history access) — 8/10
122. Auto-apply earned referral credits to offset failed payments — 8/10
122b. Dunning timeline UI: retry schedule visualization (day 3/7/10), grace period countdown, suspension warning — 8/10
122c. Fix Payment panel: failure reason display, retry history, Stripe portal integration — 8/10
123. Auto-release provider earning holds on schedule — 8/10

---

## XVIII. Plan Self-Service `mental-load-reduction` `margin-lever`

124. Plan upgrade/downgrade with next-cycle default and direction detection — 8/10
125. Pending plan change banner with effective date — 8/10
126. Cancel pending plan change — 8/10
127. Cancellation flow: reason survey → 5-handle retention offer → confirm — 8/10
128. Subscription pause (up to 8 weeks / 60 days) with visual timeline, auto-cancel warnings, and frozen handles messaging — 8/10

---

## XIX. Add-ons & Contextual Services `margin-lever` `mental-load-reduction`

129. SKUs flagged as add-ons with contextual surfacing triggers (season, weather, time-since-last) — 8/10
130. One-tap add-on purchase: deduct handles or charge card — 8/10
131. Add-on gate: only surfaced after first completed visit or user-initiated browse — 8/10
132. Refund hooks for system/provider cancellations — 8/10
133. Add-on orders table with status tracking and payment method — 8/10

---

## XX. Home Assistant Category `margin-lever` `mental-load-reduction`

134. Time-boxed SKUs: 30 / 60 / 90-minute sessions with clear boundaries — 8/10
135. Customer prep requirements and privacy-safe proof rules — 8/10
136. Members-only gate with trust banner — 8/10
137. Constrained booking: "next available 2–3 windows" (not Uber-style dispatch) — 8/10
138. 5 starter SKUs: Kitchen Reset, Laundry Folding Sprint, Quick Tidy Sprint, Post-Party Reset, Bed + Bath Reset — 8/10

---

## XXI. Support & Disputes `trust-builder` `mental-load-reduction`

139. Self-resolution target: ≥80% of issues resolved without human involvement — 7/10
140. Receipt-anchored issue reporting: every receipt has "Report an issue" — 8/10
141. Guided Resolver: structured category → evidence → instant resolution offer → accept → done — 7/10
142. Policy engine with 5-level precedence: provider → SKU → category → zone → global — 7/10
143. AI-powered ticket classification with severity, evidence scoring, and risk scoring — 9/10
144. Evidence replay: before/after photos + checklist + time-on-site presented to customer — 7/10
145. Chargeback intercept: proof + cheaper off-ramps (credits, plan changes) before escalation — 6/10
146. Duplicate ticket suppression: second attempt links to existing ticket — 7/10
147. Response macros for admin one-click resolutions — 8/10
148. Policy preview simulator: test scenario inputs (category, evidence score, risk score, customer history, job value) against active policy dials to see computed resolution offers — 7/10
149. No chat threads anywhere — all disputes are structured, bounded, and auditable — 8/10

---

## XXII. Notifications & Messaging `mental-load-reduction`

150. Event bus architecture: `notification_events` → processor → inbox + push + email — 9/10
151. 3-tier priority model: Critical (always delivered), Service (default on), Marketing (default off) — 9/10
152. Quiet hours (9pm–8am default) with Critical override — 9/10
153. Rate limits per priority tier per day/hour — 8/10
154. 19 seeded notification templates with premium concierge copy — 9/10
155. In-app notification center with unread badge, priority tabs, and CTA deep links — 9/10
156. Push notification pipeline via Capacitor + FCM/APNs — 7/10
157. Email delivery via Resend integration — 8/10
158. Device token registration with automatic cleanup on logout — 8/10
159. User notification preferences: per-tier toggles + quiet hours + timezone — 8/10
160. Digest infrastructure for batching non-critical notifications — 8/10
161. PII scrubber utility: regex-based phone/email/URL detection + replacement — 8/10
162. Admin notification health dashboard: delivery stats, deadletters, processing latency — 9/10

---

## XXIII. Customer Feedback & Provider Quality `trust-builder`

163. Immediate satisfaction check on receipt view: "How did today's visit go?" (< 5 seconds) — 8/10
164. Delayed private provider review: 7–21 day randomized delay, "Providers won't know it's you" — 8/10
165. Confidential notes: admin-only field never shared with providers — 8/10
166. Weekly provider feedback rollups with minimum aggregation threshold (N_min=5) to prevent source deduction — 8/10
167. Provider Quality Score: rolling 28-day composite (rating 35%, issues 25%, photos 20%, on-time 20%) — 7/10
168. Quality Score bands: GREEN (85–100), YELLOW (70–84), ORANGE (55–69), RED (<55) — 8/10
169. Provider Quality Score page with coaching themes and "improve next week" targets — 8/10
170. Admin feedback transparency page with full quick feedback + private ratings + confidential notes — 8/10

---

## XXIV. Ratings & Reviews `trust-builder`

171. Post-visit 1–5 star rating anchored to receipt view (not immediate post-job) — 8/10
172. Smart rating suppression: first visit or if issue already reported — 8/10
173. Provider rating summary view for admin with avg rating, total reviews, positive/negative counts — 8/10

---

## XXV. Property Health Score `mental-load-reduction` `trust-builder`

174. Composite health score (0–100): regularity 40%, coverage 25%, seasonal 15%, issues 20% — 8/10
175. Dashboard widget with SVG score ring, color-coded labels, and trend arrow — 9/10
176. Auto-compute on load if stale >24 hours — 8/10
177. Health score drop notification nudge via event bus — 8/10

---

## XXVI. Referrals & Attribution `density-driver` `margin-lever`

178. First-touch deterministic attribution via referral link or code — 8/10
179. Milestone-based reward system: signup → subscribe → first visit → paid cycle — 8/10
180. Idempotent reward creation: unique per (program, user, milestone, type) — 8/10
181. Customer credits and provider bonuses flow through Module 11 ledgers — 8/10
182. Fraud controls: hold-until-milestone, caps per referrer, velocity caps (time-windowed rate limits), typed fraud flag categories (velocity_cap, suspicious_ip, same_household, self_referral, rapid_redemption), risk flags, admin exception queue — 8/10
183. Admin end-to-end audit: referral → milestones → reward → ledger → invoice/payout — 8/10

---

## XXVII. Founding Partner & BYOC (Bring Your Own Customers) `density-driver` `provider-value`

184. Provider application funnel with category/ZIP intake and opportunity banners (5 variants) — 8/10
185. 12-clause legal agreement with per-clause acceptance tracking and timestamps — 8/10
186. Compliance document upload system (GL insurance, COI, background checks, licenses) — 8/10
187. Category requirements config: risk tiers 0–3 with per-category compliance rules — 8/10
188. BYOC invite link generation with token-based customer activation — 8/10
189. BYOC attribution tracking: invited → installed → subscribed → first visit → bonus window — 8/10
190. BYOC bonus ledger: weekly batch computation with per-attribution progress tracking — 8/10
191. Admin provider application review queue with approve/reject/conditional RPC — 8/10
192. Automatic `provider_orgs` + `provider_members` bootstrap on application approval — 8/10

---

## XXVIII. Growth Autopilot & Market Launch `density-driver`

193. Market health snapshots per zone — 8/10
194. Growth event bus for viral surface tracking — 8/10
195. Growth surface configuration: share link expiry, prompt frequency caps, surface weights per zone — 8/10
196. Waitlist system: public signup with zone auto-match, admin notify on launch — 8/10
197. Zone expansion suggestions: capacity utilization, waitlist pressure, ticket rate analysis — 8/10

---

## XXVIII-B. BYOP (Bring Your Own Provider) `density-driver` `trust-builder`

198b. Customer provider recommendation form (name, category, phone/email, note) — 8/10
198c. Recommendation confirmation screen with status tracking — 8/10
198d. BYOP recommendation tracker page showing all submissions with status badges — 8/10
198e. Admin BYOP funnel metrics on Growth Console (submitted → under review → accepted) — 8/10
198f. Provider Growth Hub cross-navigation (BYOC Center ↔ Referrals) — 8/10
198g. Viral loop wiring: referral cards on JobComplete + customer Receipt — 8/10
198h. Admin Growth Console with 4 funnels (BYOC, Referral, BYOP, K-factor summary) — 8/10
198i. BYOP provider decline: admin action to mark recommendations as provider_unavailable, customer decline notification, funnel tracking of provider declines — 8/10

---

## XXIX. Seasonal Services `margin-lever` `mental-load-reduction`

198. Seasonal service templates per zone with time windows — 9/10
199. Customer seasonal selections with window preference tracking — 9/10
200. Seasonal plan card on customer dashboard — 9/10

---

## XXX. AI Intelligence Layer `margin-lever` `mental-load-reduction`

201. Predictive service recommendations via Gemini AI: property signals → SKU predictions with confidence scores — 9/10
202. "AI Picks for You" section in Add Service Drawer with brain icon badge — 9/10
203. Smart dispute resolution: AI classifies severity, scores evidence, suggests credits — 9/10
204. Auto-resolve disputes meeting guard criteria (evidence ≥75, risk <30, credit ≤$50) — 9/10
205. AI photo analysis: signed URL multimodal analysis of job + issue photos — 9/10
206. Stale prediction cleanup: automated weekly purge of expired predictions — 9/10

---

## XXXI. Ops Cockpit & Admin Analytics `density-driver` `trust-builder`

207. Real-time ops dashboard: today's jobs, capacity pressure, quality metrics, revenue, growth — 9/10
208. Zone health drilldowns: capacity, demand, quality, provider coverage, actions — 8/10
209. Service Day health: offer backlog, rejection rate, overrides, capacity exceptions — 8/10
210. Jobs & proof health: search + filter by status, missing proof, zone, provider, date range — 8/10
211. Billing health: past due, failed payments, credits, refunds, disputes — 8/10
212. Support health: open tickets, SLA breach risk, self-resolve rate, median time-to-resolution — 8/10
213. Growth health: referrals, provider invites, applications, fraud holds — 8/10
214. KPI definitions page with 18 KPIs across 5 categories, formula cards, search, category filter, green/yellow/red threshold badges from operating model — 8/10
215. Daily snapshot rollup via `snapshot-rollup` edge function — 8/10
216. Business Health gauges on Ops Cockpit: attach rate (global, 90-day cohort, 6-month cohort), household churn, provider churn, zone density bands — green/amber/red threshold indicators from operating model, flywheel alert when 6-month attach rate < 1.5 — 7/10
216b. Gross Margin gauge on Ops Cockpit (MONEY column): percentage with target ≥25%, green/yellow/red status — 8/10
216c. Provider Utilization gauge on Ops Cockpit (NOW column): percentage with target ≥80%, green/yellow/red status — 8/10
216d. Payout Review cadence card on Ops Cockpit (MONEY column): last review date, next due, status indicator, link to Payouts page — 8/10
217. Risk Alerts card on Ops Cockpit: operating model threshold violations surfaced as actionable alerts with severity (warning/critical) and deep links to resolution pages — includes 90-day cohort attach rate alert and 6-month flywheel breakpoint alert — 7/10
217b. Loss Leader review tab on Admin Reports: per-plan profitability table, cohort attach rate cards (30d/60d/90d/120d), exit criteria alerts for plans below attach thresholds — 6/10

---

## XXXII. Provider Insights `provider-value` `trust-builder`

216. Provider performance page: jobs completed, proof compliance %, issue rate, avg time on site — 8/10
217. Template-based coaching cues: "Add more after photos to improve proof score" — 8/10
218. Weekly trend history — 8/10

---

## XXXIII. Admin Controls & Governance `margin-lever` `trust-builder`

219. Pricing & payout engine with zone multipliers and SKU-specific overrides — 8/10
220. Governance audit trail: every money, access, scheduling, and policy change is logged — 8/10
221. Admin system config table with 18+ configurable parameters (dunning steps, bonus caps, thresholds) — 8/10
222. Admin change request system with requester/reviewer workflow — 5/10
223. Admin adjustment records for manual financial corrections — 8/10
223b. Launch Readiness dashboard: 9 automated pre-launch checks (zones, SKUs, plans, Stripe pricing, providers, payouts, cron health, BYOC invites, entitlements) with green/red/amber status badges — 8/10

---

## XXXIV. Automation Engine `provider-value` `density-driver`

224. Auto-assign jobs to providers: Primary-first → Backup fallback with explainability — 7/10
225. Provider no-show detection (hourly) with auto-reassign and calm customer notification — 7/10
225b. Provider incident tracking system — no-show, quality issue, access failure, late arrival, proof missing incidents with severity, excused/unexcused classification, admin review queue, 60-day rolling window counts — 8/10
225c. Provider probation system — 4-status lifecycle (active/completed/failed/revoked), improvement targets with deadlines, admin resolve actions (improved/extend/suspend), provider-facing dashboard banner — 8/10
226. SLA enforcement automation: daily evaluation, 4-level threshold ladder, auto-generate actions — 7/10
227. Auto-flag and suspend low-quality providers after sustained RED status — 7/10
228. Auto-promote highest-performing backup when primary is suspended — 5/10
229. Weather mode: auto-detection via WeatherAPI.com, admin approval, job rescheduling — 5/10
230. Holiday calendar: pre-seeded US federal holidays 2026–2027, job skip support — 8/10
231. Provider availability blocks: day-off/vacation with auto-skip in job assignment — 8/10
232. Lead-time warnings for availability blocks starting within 48 hours — 8/10

---

## XXXV. Billing Automation `margin-lever`

233. Automated invoice generation with cycle-based idempotency — 7/10
234. Automated dunning with 5-step escalation ladder — 6/10
234b. Admin dunning step tracker — shows all subscriptions in dunning with step/stage, severity badges, timing, critical count for step 3+ — 8/10
235. Auto-apply referral credits to invoices — 8/10
236. Auto-release provider earning holds nightly — 8/10
237. Weekly payout runs with threshold enforcement and rollover — 6/10
237b. Admin payout rollover dashboard — shows providers below $25 threshold with accumulated earnings, count, and distance to threshold — 8/10

---

## XXXVI. Exception Management `trust-builder`

238. Unified exception queue: ops + billing exceptions in one queue with domain filter (All/Ops/Billing), 15 exception types, SLA tracking, severity-sorted — 8/10
239. Per-exception "next best action" CTA — structured repair actions per type with one-tap buttons that record actions with pre-filled type and reason codes — 8/10
240. Severity-sorted display with one-tap resolution actions — acknowledge, start work, escalate, record action, resolve — 8/10

---

## XXXVII. Edge Functions & Scheduled Automation `density-driver` `margin-lever`

241. 20+ deployed edge functions covering assignment, billing, weather, payouts, notifications, AI — 8/10
242. Cron-based orchestrator (`run-scheduled-jobs`) with per-sub-job idempotency keys — 8/10
243. `cron_run_log` for full observability of every automated run — 8/10
243b. Deno integration tests for billing edge functions: run-billing-automation, process-payout, run-dunning, create-checkout-session — CORS, auth guard, error shape coverage — 7/10

---

## XXXVIII. Standard Operating Procedures `trust-builder` `provider-value`

244. Emergency pricing override SOP with rollback capability — 3/10
245. End-of-day reconciliation SOP — 3/10
246. Missing proof handling SOP — 3/10
247. No-show escalation SOP — 3/10
248. Provider probation ladder SOP — 3/10
249. Zone pause workflow SOP — 3/10
249b. Interactive SOP execution system — "Execute SOP" mode converts static playbook cards into per-step checklists with checkboxes, progress tracking (% complete badge), completion detection, abandon support, and persistent sop_runs table for audit trail — 7/10

---

## XXXIX. Platform & Infrastructure `trust-builder`

250. Native iOS + Android via Capacitor — 8/10
251. Supabase backend: Auth + Postgres + Storage + Edge Functions — 8/10
252. Row-Level Security on every table with default-deny posture — 8/10
253. Append-only event logs for all state changes (jobs, tickets, ledgers, notifications) — 8/10
254. Signed URLs for all media access — 8/10
255. WCAG AA accessible: semantic headings, visible focus states, proper contrast ratios — 6/10
256. HSL-based design token system with light + dark mode — 8/10
257. 8pt grid spacing system with 44px minimum tap targets — 8/10
258. Glassmorphism bottom tab bar with active teal dot indicators — 8/10
259. Shimmer skeleton loading states across all data-driven pages — 8/10
260. Premium "calm concierge" copy voice throughout — 8/10
261. Privacy policy page at /privacy — comprehensive data collection, usage, retention, rights, security disclosures — DONE
262. Terms of service page at /terms — subscription terms, service delivery, provider relationships, liability, account deletion — DONE
263. Customer account deletion from Settings — confirmation dialog, anonymization RPC, subscription cancellation, accurate timing claims — 9/10
264. Browse-first public experience at /browse — hero, ZIP coverage check, full service catalog with real SKU data, plan comparison with pricing, how-it-works, trust signals, conversion CTAs — DONE
265. Password reset flow — Supabase resetPasswordForEmail with loading state and try/finally error handling — 9/10
266. Subscription verification timeout — 15-second timeout with error message instead of infinite spinner — DONE
267. Provider browse-first experience at /providers — earnings calculator, 6 key benefits, BYOC bonus math, how-it-works, service categories, lead capture form (email + ZIP + category multi-select → saves to provider_leads table), conversion CTAs. No zone status shown pre-application. — DONE

---

## XL. Routing & Scheduling Engine (PRD-300) `density-driver` `provider-value`

### Sprint 1 — Foundations

261. Visit and task bundling data model supporting multi-category services per stop — 8/10
262. Scheduling state machine (Draft → Locked → Dispatched → In Progress → Complete → Exception Pending) — 8/10
263. Provider work profile with home base location, service categories, equipment kits, working hours, and capacity limits — 8/10
264. Property and provider geo-coordinate indexing for spatial queries — 8/10
265. Admin scheduling policy dials (appointment window length, ETA range display, arrival notification minutes) — 8/10
266. Customer-facing upcoming visits with status labels (Planning, Scheduled, Today, In Progress, Completed) — 8/10

### Sprint 2 — Zone Builder v1

267. H3 hex-grid geo cell infrastructure for scalable zone partitioning — 8/10
268. Automated zone generation from region boundaries with configurable dials — 8/10
269. Zone metrics computation (demand density, supply capacity, compactness, drive-time proxy) — 8/10
270. Cell scoring and seed selection strategies (demand-first, provider-first, auto-hybrid) — 8/10
271. Constrained region-growing algorithm with cost function optimization — 8/10
272. Admin Zone Builder wizard (select region → settings → preview → edit → commit) — 8/10
273. Property-to-zone resolution via H3 cell lookup with fallback ring expansion — 8/10

### Sprint 3 — Market/Zone Category States Integration

274. Zone × Category state matrix (Closed, Waitlist Only, Provider Recruiting, Soft Launch, Open, Protect Quality) — 8/10
275. State-based customer catalog gating and subscribe eligibility enforcement — 8/10
276. Category-level waitlist system with zone-specific demand capture — 8/10
277. Provider opportunity surfaces responding to recruiting states — 8/10
278. Nightly recommendation engine with hysteresis thresholds and anti-flap rules — 8/10
279. Admin approval-gated state transitions with confidence scoring — 8/10
280. Minimum time-in-state guardrails to prevent state thrashing — 8/10

### Sprint 4 — Rolling Horizon Planner

281. 14-day rolling planning horizon with 7-day LOCKED freeze window — 8/10
282. Nightly planning boundary for schedule promotion and state change application — 8/10
283. Customer routine changes effective only in DRAFT window (≥8 days out) — 8/10
284. Cadence-based task scheduling (weekly, biweekly, every 4 weeks) with stable offsets — 8/10
285. Visit bundling rules merging same-property tasks into single stops — 8/10
286. Stability rules minimizing DRAFT plan changes unless constraints change — 8/10
287. Admin planner health dashboard with run summaries and conflict flagging — 8/10

### Sprint 5 — Provider Assignment v1

288. Candidate selection with feasibility filters (skills, equipment, working hours, capacity, proximity) — 8/10
289. Assignment solver with objective function (minimize travel, balance workload, reward familiarity) — 8/10
290. Primary + Backup provider assignment per visit — 8/10
291. Familiarity scoring with configurable cap to balance relationship vs efficiency — 8/10
292. Assignment stability rules with freeze-window extra protection — 8/10
293. Explainability with confidence levels and top reasons per assignment — 8/10
294. Admin exceptions inbox with unassigned/fragile visit prioritization and manual override tools — 8/10

### Sprint 6 — Route Sequencing v1 + Equipment Manifest

295. Ordered daily route per provider using nearest-neighbor + 2-opt optimization — 8/10
296. Coarse customer-facing ETA ranges derived from stop sequence — 8/10
297. Daily equipment manifest generation per provider route — 8/10
298. Same-property task bundling with setup discount calculation — 8/10
299. Provider blocked windows and legacy commitment support with segment-based planning — 8/10
300. Provider pre-Start-Day route reorder with feasibility guardrails — 8/10
301. Running-late notification when predicted arrival exceeds ETA window end — 8/10

### Sprint 7 — Appointment Windows v1 (Home-Required Services)

302. Scheduling profiles per SKU (Appointment Window, Day Commit, Service Week) — 8/10
303. Customer availability capture with 3–6 feasible window offers — 8/10
304. Time-window constraint enforcement in route sequencing (VRPTW feasibility) — 8/10
305. Mixed-profile bundle piggybacking with duration guardrails — 8/10
306. Service-week flexible work with due-soon/overdue queue and week-end deadlines — 8/10
307. Provider-placed flexible work via drag/drop with feasibility checks — 8/10
308. Window-at-risk exception flagging with local repair attempts — 8/10

### Sprint 8 — Exceptions, Reschedules, and Ops Control v1

309. Unified exceptions queue with severity/SLA/escalation timers — 8/10
310. Predictive exceptions from nightly planning (window-at-risk, service-week-at-risk, coverage break) — 8/10
311. Reactive exceptions from day-of events (provider unavailable, access failure, weather stop) — 8/10
312. Ops repair actions (reorder, move day, swap provider, cancel/credit) with feasibility checks — 8/10
313. Break-freeze policy with explicit requirements (reason code, customer notification, audit) — 8/10
314. Customer self-serve reschedules inside freeze from feasible options — 8/10
315. Access failure auto-hold with priority reschedule and soft hold expiration — 8/10
316. Ops action idempotency and undo support with reversal transactions — 8/10
317. Provider fairness rules (no-blame access failure, show-up credits) — 8/10

### Sprint 9 — Ops User Manual

318. Autopilot health indicators (GREEN/YELLOW/RED) based on configurable thresholds — 8/10
319. Provider-first self-healing with approve/notify/deny/escalate decision framework — 8/10
320. Daily and weekly ops rhythm checklists — 8/10
321. SKU discovery and continuous tuning workflow with provider interviews — 8/10
322. Launch SKU templates for Pool, Windows, and Pest categories — 8/10
323. Ops dashboard requirements with KPI tiles and zone health table — 8/10
324. Standard procedures for zone launch, category opening, planner runs, and call-outs — 8/10
325. Exception playbooks with severity levels and repair strategies — 8/10

---

## XLI. BYOC Onboarding Wizard (PRD-301) — 2-Step Flow `density-driver` `provider-value`

> **Note:** Wizard was simplified from a 7-screen flow to a streamlined 2-step flow (Batch 2 rewrite). Core functionality preserved; steps consolidated for faster onboarding.

326. Streamlined 2-step provider-referred customer onboarding flow (under 60 seconds) — 8/10
327. Provider recognition screen preserving existing relationship trust — 8/10
328. Confirm existing service screen with editable cadence — 8/10
329. Property creation with address and home type — 8/10
330. Home setup with property signals (pool, trees, pets, garden, windows) — 8/10
331. Connecting provider spinner with activate-byoc-invite call — 8/10
332. Other services screen with zone-available categories (skip-friendly) — 8/10
333. Conditional Home Plan screen for bundled service pricing — 8/10
334. Success screen with provider connection summary — 8/10
335. Dashboard "Your Home Team" card showing connected providers and next visits — 8/10
336. Referral state handling (Existing Provider First Touch, future: Not First Touch, Cold Referral) — 8/10
337. Invite validation with fallback screen for expired/revoked/inactive tokens — 8/10
338. Already-activated 409 handling with dashboard redirect — 8/10
339. BYOC attribution tracking preserved separate from provider-customer relationship — 8/10
340. BYOC rate limits: max 10 active links per provider, max 10 new links per day — 8/10
341. Referral one-code-per-customer enforcement with DB re-check — 8/10
342. Cryptographically secure token generation (crypto.getRandomValues) — 8/10

---

## XLII. E2E Testing & Synthetic UX Review (Playwright) `trust-builder`

340. Playwright E2E test harness with Chromium mobile browser emulation — 8/10
341. Auth setup project saving storage state for authenticated tests — 8/10
342. BYOC happy-path test validating full wizard flow with milestone screenshots — 8/10
343. BYOC invalid-invite test validating fallback UI for bad tokens — 8/10
344. BYOC refresh-resilience test validating wizard state preservation on reload — 8/10
345. GitHub Actions CI workflow with artifact upload (reports, screenshots, traces) — 8/10
346. AI-powered synthetic UX review using 6 persona prompts and Claude Sonnet vision — 8/10
347. Per-screen/per-persona evaluation with clarity/trust/friction scores — 8/10
348. Aggregate UX summary report with top 5 friction points and fixes — 8/10

---

## XLII-B. Market Simulation Tool (Standalone) `margin-lever` `density-driver`

348b. Zone-level market simulation engine: models subscription growth, churn, jobs, revenue, costs, and break-even across configurable time horizons — 8/10
348c. Multi-zone combined P&L with aggregate break-even detection and zone-by-zone detail tables — 8/10
348d. Seasonal revenue modeling: per-category 12-month multiplier arrays (lawn/pest/windows/pool) blended by service mix weights, with 5 market presets (Austin, Phoenix, Denver, Charlotte, None) — 8/10
348e. Interactive simulation UI: sliders for all model assumptions, real-time chart and table updates, seasonal curve visualization — 8/10

---

## XLIII. Simplicity by Design `mental-load-reduction`

349. No calendar browsing anywhere — scheduling is automatic and routine-based — 7/10
350. One-tap "Add to routine" from any suggestion surface with 10-second undo — 8/10
351. Smart defaults everywhere: level auto-selected from property size, pattern auto-optimized — 8/10
352. Suggestion throttling: max 2–4 suggestions, "hide / not interested" feedback respected — 8/10
353. One primary CTA per screen — never overwhelm — 7/10
354. Three-tap issue resolution: category → evidence → accept offer → done — 8/10
355. Provider job completion in under 2 minutes: checklist + photos + submit — 8/10
356. Admin can launch a new city in under 10 minutes — 6/10
357. Customer can add a new service in under 5 seconds — 8/10
358. Zero-configuration payout setup: processor-hosted onboarding with one CTA — 8/10

---

## XLIV. UX Value Proposition & Conversion `margin-lever` `trust-builder`

359. Bundle Savings Calculator on Plans page and onboarding: compares monthly subscription cost vs. hiring separate vendors with per-service breakdown — 8/10
360. First Service Celebration: full-screen animated overlay after first completed service with share CTA and receipt link — 8/10
361. Provider Profile Sheet: bottom drawer showing provider name, avatar, rating, trust badges (Verified, Insured), and specialties — 8/10
362. Provider Earnings Projection Card: two variants (onboarding zone estimate + dashboard capacity growth meter) showing income potential — 8/10
363. Home Timeline page (`/customer/timeline`): chronological service history grouped by month with stats (total services, photos, membership duration) — 8/10
364. Trust Bar: compact social proof strip (insured providers, satisfaction guarantee, cancel anytime) shown in onboarding zone check and plan selection — 8/10
365. BYOC Banner on provider dashboard: prominent call-to-action for bringing own customers with activation count — 8/10
366. Referral Milestones: tiered reward system (Starter $30 credit at 3 referrals, Ambassador free month at 5, Champion VIP at 10) with progress bars — 8/10

---

## Design System Conformance & Accessibility `trust-builder`

367. Motion system: CSS custom property easing curves (--ease-default, --ease-out-expo, --ease-in-out, --ease-spring) with prefers-reduced-motion support — 8/10
368. Skip-nav links on all layouts (customer/provider AppLayout, admin AdminShell) targeting #main-content — 8/10
369. Semantic landmarks: `<main>`, `<nav>`, `<aside>`, `<header>` on all layouts — 8/10
370. Focus-visible rings on all interactive components (buttons, cards, inputs, tabs, badges) — 8/10
371. Dark mode elevation model: increased shadow opacity, visible card borders, overlay opacity adjustment (bg-black/70) — 8/10
372. Component conformance: all 30+ UI components aligned to design guidelines (sizing, radius, spacing, typography) — 8/10
373. Page template conformance: all customer/provider pages use p-4 pb-24, animate-fade-in, text-h2 titles, semantic tokens — 8/10
374. Form validation accessibility: FormMessage uses conditional role="alert" for screen reader announcements — 8/10
375. Alert component: border-l-4 accent bar, warning + success variants added — 8/10

---

## XLVII. Automated Quality Scoring Harnesses `trust-builder`

376. Provider Experience Auto-Evaluator: 7-dimension scoring harness (earnings transparency, schedule control, fairness signals, onboarding friction, retention hooks, BYOC tools, cognitive walkthroughs) with 5 anti-gaming guards — 7/10

---

## Screen-Flows Gap Closure (March 2026) `trust-builder` `provider-value`

377. Provider Onboarding Visual Progress Bar: accent-filled progress bar with step counter and ChevronLeft back navigation across all 6 onboarding steps — 8/10
378. Shared MapboxZoneSelector Component: interactive zone card list with map placeholder (token-gated), used in onboarding coverage and provider settings — 8/10
379. Provider Coverage Settings Edit Mode: toggle-editable zone selection in provider settings using shared MapboxZoneSelector — 8/10
380. Start Next Job CTA: accent full-width button on provider Today tab navigating to first incomplete job — 8/10
381. Job Complete Earnings Breakdown: itemized base pay + modifier display with formatCents on job completion screen — 8/10
382. Notes Field Upgrade: expanded provider job notes from 240 to 500 chars per spec — 8/10
383. Set Up Payout Account Button: accent CTA on provider earnings page when payout account not configured — 8/10
384. Provider Support Ticket Creation: 6-category ticket creation flow with description validation (min 10 chars) and provider-aware database attribution — 8/10
385. Admin Provider Detail Earnings Tab: full earnings view with payout account status, summary stats, active holds with release, recent earnings, and payouts — 8/10
386. Admin Payout Schedule Section: schedule info card with pending count and link to payout control configuration — 8/10
387. Admin Ticket Assignment: claim-based ticket assignment with assigned badges and cache invalidation — 8/10
388. Admin Ticket Attachments: attachment display section with file type, description, upload info, and download link — 8/10
389. Bundle Savings Card Enhancements: dismiss button (localStorage persistence), "View Your Plan" CTA, loading skeleton, and empty state — 8/10
390. Error/Empty State Sweep: QueryErrorCard and EmptyState components added to 20+ critical pages across customer, provider, and admin flows — 8/10
391. Back Button Standardization: ArrowLeft → ChevronLeft icon replacement across 14 pages per project conventions — 8/10

---

## Admin Academy — Training Center `trust-builder` `provider-value`

392. Academy shell: module grid with search, category filtering, and module detail pages — 8/10
393. AnnotatedScreenshot component: CSS overlay annotation system with box, arrow, pulse, and step annotation types — 8/10
394. AcademySection renderer: 7 content types (overview, walkthrough, pro-tips, watch-outs, automation, real-world, text) — 8/10
395. Ops Cockpit & Daily Rhythm training module: morning check-in walkthrough, dispatcher queues, health gauges, real-world market data — 8/10
396. Jobs & Scheduling Operations training module: 14-day planner, assignment engine, weather mode, scheduling policy — 8/10
397. Exception Management training module: triage flow, common exception types, analytics guidance — 8/10
398. Provider Lifecycle training module: application evaluation, onboarding, performance metrics, probation process — 8/10
399. Customer Billing & Ledgers training module: subscription lifecycle, dunning ladder, credits/refunds, chargebacks — 8/10
400. Provider Payouts & Money training module: payout schedule, holds, Stripe Connect, failure investigation — 8/10
401. Zones, Capacity & Market Launch training module: zone design, health monitoring, capacity planning, launch process — 8/10
402. SKU Catalog Management training module: SKU design, duration calibration, proof requirements, real-world pricing — 8/10
403. Plans, Bundles & Entitlements training module: plan design, handle economy, entitlement versioning — 8/10
404. Support Operations training module: ticket triage, common ticket types, macro library, provider-side support — 8/10
405. Growth & Incentives training module: BYOC/BYOP/referral funnels, incentive management, fraud detection — 8/10
406. Governance & System Health training module: cron health, audit log, feature toggles, launch readiness — 8/10
407. Control Room (Superuser) training module: pricing hierarchy, payout rules, change requests — 8/10
408. SOPs & Playbooks training module: 8 standard operating procedures with decision branching, daily/weekly rhythms — 8/10
409. Your First Week onboarding module: 5-day structured plan (observe → shadow → do → own) — 8/10
410. Market Launch & Provider Recruitment training module: provider targeting (3 archetypes), value prop/objection handling, pilot launch checklist, 12-week milestone map, success metrics — 8/10

---

## XLIV. Provider Conversion Funnel & Lead Pipeline `density-driver` `provider-value`

411. `provider_leads` table with email, ZIP, categories, source, status tracking — anon insert + admin RLS — DONE
412. Provider browse page lead capture form saves to database with category multi-select, email validation, loading state — DONE
413. Admin Growth Console Funnels tab: Provider Leads Pipeline funnel card showing total/new/contacted/applied/declined counts — DONE
414. `provider_referrals` table for provider-to-provider referrals — anon insert + admin RLS — DONE
415. OpportunityBanner CLOSED variant replaced with HELP_LAUNCH — "Help us launch in your area" with recruitment messaging. No provider ever sees "closed" or "full" language — DONE
416. WAITLIST banner updated to encouraging "building momentum" messaging — DONE
417. Post-application status screen for waitlisted/submitted providers shows category gaps ("We need providers in these categories") and "Know someone?" referral form — DONE
418. Provider referral form: name, contact, category, ZIP — saves to provider_referrals with auth email as referrer — DONE
419. Zone status badges in application flow use friendly labels (CLOSED→"Building", SOFT_LAUNCH→"Launching soon", OPEN→"Active") — DONE
420. Admin Provider Leads pipeline page at /admin/provider-leads with filterable table, status management, summary stat cards — DONE
421. Provider Leads page: Leads tab with status/ZIP/category filters, inline status update dropdown, "Mark Contacted" quick action — DONE
422. Provider Leads page: By ZIP tab with ZIP aggregation (count per ZIP, category breakdown, sorted by volume) — DONE
423. Provider Leads page: Referrals tab showing provider_referrals with referrer, referred name/contact/category, status management — DONE
424. `notify-zone-leads` edge function: marks matching leads as "notified" when zone launches — queries zone ZIP codes, updates lead status — DONE
425. Admin zone notification trigger: zone selector + "Notify" button on By ZIP tab calls edge function, shows count of notified leads — DONE

## XLV. Provider Funnel Hardening & Automation `density-driver` `provider-value`

426. Unique email constraint on provider_leads with upsert — returning leads update categories/ZIP instead of duplicating — DONE
427. Lead-to-application linking: database trigger auto-matches applicant email to provider_leads, updates lead status to 'applied', sets provider_lead_id FK on application — DONE
428. `get_category_gaps` RPC: returns categories genuinely needing providers for given ZIP codes by querying market_zone_category_state (CLOSED/WAITLIST_ONLY/PROVIDER_RECRUITING) — DONE
429. Real category gap display on post-application screen: shows genuinely needed categories from zone data instead of naive "everything you didn't pick" — DONE
430. Automated zone launch notifications: database trigger on market_zone_category_state status change to SOFT_LAUNCH/OPEN auto-marks matching provider leads as notified with timestamp — DONE
431. `notified_at` timestamp column on provider_leads for notification tracking — DONE
432. Referral attribution trigger: on provider application insert, matches applicant email against provider_referrals.referred_contact and updates referral status to 'applied' — DONE
433. Referral progress card on post-application screen: shows referral count with progress bar toward 3-referral target for priority review status — DONE
434. Referral incentive messaging: "Refer X more providers to unlock priority review" with progress visualization — DONE
435. Progressive lead recognition: returning visitors to /providers see "Welcome back!" card with Apply Now CTA instead of generic form — localStorage-based, no auth required — DONE

## XLVI. Phone Identity Bridge `provider-value` `density-driver`

436. Phone column on provider_leads table — optional phone capture for leads — 9/10
437. Provider browse page lead capture form includes optional phone field with validation — 9/10
438. Admin Provider Leads table displays phone column (decomposed into extracted tab components) — 9/10
439. Lead-to-application linking trigger matches on phone OR email (from profiles table) — 9/10
440. Referral attribution trigger matches referred_contact against phone OR email (exact match) — 9/10
441. Provider application flow step 2 collects phone number with validation, saves to profiles.phone with error handling — 9/10

## XLVII. Household Members `mental-load-reduction` `trust-builder`

442. `household_members` table: links multiple auth users to one property with owner/member roles — DONE
443. Auto-insert trigger: creates 'owner' row when property is created, with backfill for existing properties — DONE
444. RLS with SECURITY DEFINER helper functions to prevent infinite recursion — DONE
445. `accept_household_invites` RPC: auto-accepts pending invites matching current user's email — DONE
446. `useHouseholdInvites` hook: runs once per session on customer page load to accept pending invites — DONE
447. CustomerPropertyGate extended: household members can access customer pages without owning a property — DONE
448. Settings page Household section: member list with role badges, email invite form, remove member action — DONE

## XLVIII. "I'm Moving" Wizard `mental-load-reduction` `density-driver`

449. `property_transitions` table: tracks moves with new address, ZIP coverage, new homeowner contact, keep-services toggle — DONE
450. `customer_leads` table: mirrors provider_leads for customer-side lead capture in uncovered zones (unique email) — DONE
451. 4-step moving wizard at /customer/moving: move date → new address + ZIP coverage check → coverage result → new homeowner referral — DONE
452. Zone coverage check: queries zones table for active zones containing the new ZIP code — DONE
453. Covered ZIP: "Great news — we'll transfer your plan!" messaging. Uncovered ZIP: saves customer_lead with notify_on_launch — DONE
454. New homeowner referral form: captures name, email, phone for warm handoff to new property owner — DONE
455. Cancel flow intercept: when customer selects "Moving" as cancel reason, redirects to moving wizard instead of cancellation — DONE
456. Settings page "I'm moving" card: entry point to moving wizard with Truck icon — DONE

## XLIX. Moving Pipeline Completion & Operational Automation `mental-load-reduction` `density-driver`

457. `process_move_date_transitions()` database function: auto-cancels subscriptions on move date (cancel_at_period_end + status='canceling'), marks transitions as 'completed' — DONE
458. `process-move-transitions` edge function: cron-callable wrapper with requireCronSecret auth for daily execution — DONE
459. Customer lead zone launch notification trigger: auto_notify_customer_leads() on market_zone_category_state change to SOFT_LAUNCH/OPEN, mirrors provider lead pattern — DONE
460. `notified_at` timestamp on customer_leads for notification tracking — DONE
461. `handoff_processed` flag on property_transitions for tracking new homeowner outreach — DONE
462. `process-new-homeowner-handoff` edge function: processes transitions with new homeowner info, creates customer_lead with source='referral', queries property context for personalization — DONE
463. Admin "Customers" tab on Provider Leads page: shows customer_leads with email, phone, ZIP, source, status dropdown, notified_at display — DONE

---

*Total features: 482 | Last updated: 2026-04-02 | Round 11: Moving Pipeline Completion & Operational Automation (7 features)*
