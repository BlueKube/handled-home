# Handled Home — Complete Feature List

> **"Your home is handled."**
>
> This document catalogs every feature built into Handled Home — a managed home-maintenance platform that replaces fragmented vendor relationships with a single, intelligent, density-optimized operating system for your home. Every item below is implemented and deployed.
>
> **Value-prop tags**: Each section is tagged with the strategic value propositions it serves (see `operating-model.md`):
> - `mental-load-reduction` — reduces customer coordination burden
> - `provider-value` — improves provider business operations
> - `density-driver` — improves zone economics and route efficiency
> - `trust-builder` — proof, transparency, quality
> - `margin-lever` — directly impacts subscription spread or unit economics

---

## I. Authentication & Identity `mental-load-reduction`

1. Email/password signup and login with secure session persistence across app restarts — DONE
2. Automatic profile creation and default customer role assignment on signup — DONE
3. Multi-role support: users can hold customer, provider, and admin roles simultaneously — DONE
4. One-tap role switching without logout for multi-role users — DONE
5. Admin Preview Mode: admins can view the app as any role without needing that role in the database — DONE
6. "Account Not Configured" safety screen for users with no assigned roles — DONE
7. Role-based route protection preventing cross-role access (typing `/admin` as a customer always redirects) — DONE
8. Bootstrap RPC that repairs partial signups on next login (idempotent, never leaves orphaned accounts) — DONE

---

## II. Property Profiles & Home Intelligence `mental-load-reduction` `density-driver`

9. Single-screen property profile with structured address, access notes, gate codes, parking, and pet info — DONE
10. Real-time zone coverage indicator as the customer types their ZIP code — DONE
11. Property gate: new customers are guided to add their home before accessing any other feature — DONE
12. Coverage Map: 10-category self-assessment (Self / Have Someone / None / N/A) with switch intent tracking — DONE
13. Property Sizing Tiers: sqft, yard, windows, and stories — used to auto-select correct service levels — DONE
14. Progressive "Complete Home Setup" card on dashboard that tracks coverage + sizing completion — DONE
15. `get_property_profile_context` RPC: returns computed eligibility, switch candidates, and high-confidence upsells — DONE
16. Personalization event logging for every setup completion and update — DONE

---

## III. Zones, Regions & Capacity Governance `density-driver`

17. Region hierarchy for organizational grouping (e.g., "Los Angeles County") — DONE
18. ZIP-code-based zone definitions with instant coverage lookups — DONE
19. Per-zone capacity settings: max homes/day, max minutes/day, buffer percentage — DONE
20. Zone Health Score: Green / Yellow / Red advisory based on utilization ratio — DONE
21. Smart adjacent-ZIP suggestions when creating zones (prefix-matching heuristic) — DONE
22. Expansion Signal Dashboard: non-serviced ZIP demand ranked by signup count — DONE
23. Primary + Backup provider model per zone and category (franchise-style territory) — DONE
24. Zone launch lifecycle: planning → recruiting → soft_launch → live → paused — DONE
25. Market zone category state: open / waitlist_only / closed / provider_recruiting per category — DONE
26. Founding Partner slot tracking per zone and category — DONE

---

## IV. Service Catalog (SKU System) `trust-builder` `margin-lever`

27. Standardized Service SKUs with inclusions, exclusions, duration, and edge-case notes — DONE
28. Fulfillment mode governance: same_day_preferred / same_week_allowed / independent_cadence — DONE
29. Structured proof requirements per SKU: labeled photo slots (before/after/both) with counts — DONE
30. Checklist templates per SKU with required/optional flags — DONE
31. SKU lifecycle: draft → active → paused → archived (never hard-deleted) — DONE
32. Visual service catalog with hero images, featured flags, and category grouping — DONE
33. Customer-facing catalog with horizontal featured scroll, category groups, and search — DONE
34. Admin duplicate-SKU action for safe scope changes — DONE
35. Weather sensitivity flag per SKU — DONE

---

## V. SKU Levels (Service Variants) `trust-builder` `margin-lever`

36. Multi-level variants per SKU (e.g., Maintenance / Standard / Deep) with different scope, time, and cost — DONE
37. Side-by-side level comparison UI with handle delta display — DONE
38. Guidance questions (0–3 per SKU) for logic-based level selection — DONE
39. Smart level defaults based on property sizing signals (sqft, yard, windows, stories) — DONE
40. Provider level sufficiency prompt at job completion — DONE
41. Level recommendation system with reason codes for providers to suggest the correct level — DONE
42. Courtesy upgrade: provider performs a higher level for free, once per property/SKU/6 months — DONE
43. Admin analytics: recommendation + courtesy upgrade counts, mismatch detection by zone — DONE

---

## VI. Subscription Engine `margin-lever` `mental-load-reduction`

44. Membership-first tiered plans: Essential / Plus / Premium — DONE
45. 28-day billing cycles ("Billed every 4 weeks") for predictability without calendar-month complexity — DONE
46. Dual-clock model: billing cadence (28-day) + operational rhythm (weekly service weeks) — DONE
47. Stripe integration as payment rail; entitlements owned by Supabase (not Stripe-derived) — DONE
48. Soft onboarding: browse plans, preview SKUs, build draft routine — all before paying — DONE
49. Plan zone availability: plans can be enabled/disabled per zone — DONE
50. Entitlement versioning: plan entitlement rules are version-tracked and immutable — DONE
51. No-rollover policy: unused service weeks expire at billing cycle end — DONE

---

## VII. Handles Currency System `margin-lever`

52. Handles as the internal unit of value — simple "Used / Remaining" bar for customers — DONE
53. Handle transaction ledger: grant / spend / expire / rollover / refund — append-only, reconcilable — DONE
54. Cached balance on subscription with `recalc_handles_balance()` RPC for reconciliation — DONE
55. Per-SKU handle cost display ("Costs 3 handles") at point of selection — DONE
56. Rollover with configurable cap and expiry days per plan — DONE
57. Refund handles preserving original expiry date on system/provider cancellations — DONE
58. Idempotency key indexing on handle transactions to prevent duplicate grants — DONE

---

## VIII. Service Day System `density-driver` `mental-load-reduction`

59. System-assigned recurring Service Day based on zone, capacity, and route optimization — DONE
60. Customer confirm/reject flow with exactly one rejection token — DONE
61. 2–3 controlled alternative day offers on rejection (never infinite cycling) — DONE
62. Atomic capacity reservation: capacity is reserved when an offer is created, moved on alternative selection — DONE
63. "System Recommended" badge with efficiency-framed reason text — DONE
64. "Must be home" toggle with time window selector (morning/afternoon) — DONE
65. "Try to align days" preference toggle with tradeoff messaging — DONE
66. Admin utilization view: Mon–Sun assignment counts per zone with stability indicators — DONE
67. Admin override with mandatory reason, capacity warnings, and full audit logging — DONE

---

## IX. Routine & Bundle Builder `mental-load-reduction` `margin-lever`

68. 3-step progressive flow: Build Routine → Review Scope + Proof → Confirm Lock — DONE
69. Per-SKU cadence picker: weekly / biweekly / every 4 weeks / independent — DONE
70. Live 4-week preview timeline that updates instantly on every change — DONE
71. Entitlement-aware guardrails: routine demand vs. plan allowance with calm warning panel — DONE
72. "Auto-fit to my plan" one-tap automation that adjusts cadences to fit entitlements — DONE
73. Biweekly pattern optimizer (Weeks 1&3 vs 2&4) based on zone load + geo clustering — DONE
74. Bounded "Swap pattern" option for biweekly items with feasibility check — DONE
75. Confusion detector: inline help when a customer changes cadence 3+ times — DONE
76. Versioned routine locking with effective date policy (next billing cycle start) — DONE
77. Review step: per-service scope + proof expectations to prevent disputes — DONE

---

## X. Guided Customer Onboarding `mental-load-reduction`

78. 6-step onboarding wizard: Property → ZIP/Zone Check → Plan Selection → Subscribe → Service Day → Build Routine — DONE
79. Zone availability check with automatic waitlist signup if no zone covers the ZIP — DONE
80. Onboarding progress persistence: auto-resumes at the exact step on return — DONE
81. Checkout success polling with auto-advance when subscription appears — DONE
82. Property gate distinguishes truly new users from churned customers returning — DONE

---

## XI. Job Execution & Provider Workflow `provider-value` `trust-builder`

83. Provider daily job list optimized for "today → next" with route-ordered stops — DONE
84. Job detail with Level, scope bullets, access notes, proof requirements, and planned minutes — DONE
85. Guided checklist completion: required items must end in Done or Not-Done-With-Reason — DONE
86. Photo proof capture with offline/poor-signal resilience: queue uploads automatically — DONE
87. Server-validated atomic job completion: `complete_job` RPC validates all proof before marking done — DONE
88. Structured issue reporting with type, severity, and evidence — no chat threads — DONE
89. Admin override completion with mandatory reason and audit logging — DONE
90. Job event timeline: append-only log of every state change (started, arrived, departed, completed) — DONE

---

## XII. Provider Day Command Center `provider-value` `density-driver`

91. Route plan locking: "Start Route" freezes route order and computes projected earnings — DONE
92. Projected earnings banner based on completed + (historical avg × remaining stops) — DONE
93. Estimated drive and work time stats on provider dashboard — DONE
94. Route reorder controls disabled when route is locked — DONE

---

## XIII. Route Optimization `density-driver` `provider-value`

95. Nearest-neighbor route optimization using geohash/lat-lng from properties — DONE
96. Provider manual reorder with up/down controls and audit logging — DONE
97. Minimum-jobs guard: skip optimization for routes with < 3 stops — DONE
98. IN_PROGRESS freeze: in-progress jobs are pinned and excluded from reorder — DONE

---

## XIV. Photo Proof & Visit Receipts `trust-builder`

99. Before/after comparison slider with pointer-drag interaction — DONE
100. Photo timeline: chronological gallery of all visit photos per property — DONE
101. Photo quality validation edge function: sharpness, brightness, duplicate hash, orientation — DONE
102. Canvas-based image compression for upload performance — DONE
103. Signed URL display for secure photo viewing — DONE
104. "Handled Receipt" per visit: photos + timestamps + checklist + provider summary — DONE

---

## XV. Billing & Payments `margin-lever`

105. Tokenized payment method management with add/remove/default — DONE
106. Subscription autopay with 28-day cycle invoicing — DONE
107. Invoice line items: plan, add-ons, credits, taxes/fees — DONE
108. Receipt view with cycle period, payment status, and method (masked) — DONE
109. Billing health states: Healthy / Action Required / Past Due / Service Paused — DONE
110. Customer credits with fixed tiers ($10/$25/$50/custom) and auto-application to next invoice — DONE
111. Idempotent invoice generation via idempotency keys — DONE

---

## XVI. Provider Payouts `provider-value` `margin-lever`

112. Provider payout onboarding via Stripe Connect Express — DONE
113. Weekly automated payout runs with minimum threshold enforcement — DONE
114. Per-job earnings detail: base pay + modifiers + hold status + net — DONE
115. "At current pace" monthly earnings projection — DONE
116. Hold reasons with explicit explanations and expected release countdown — DONE
117. Severity-based earning holds: LOW (no hold), MED (24–48h soft), HIGH (hard hold + exception) — DONE
118. Payout webhook confirmation: earnings only marked PAID on processor confirmation — DONE

---

## XVII. Dunning & Payment Recovery `margin-lever`

119. 5-step automated dunning sequence: +1d, +3d, +5d retry with escalating notifications — DONE
120. Calm in-app banner: "We couldn't process your payment. Update your card." — DONE
121. Auto-pause subscription scheduling after N failures (preserves receipt/history access) — DONE
122. Auto-apply earned referral credits to offset failed payments — DONE
123. Auto-release provider earning holds on schedule — DONE

---

## XVIII. Plan Self-Service `mental-load-reduction` `margin-lever`

124. Plan upgrade/downgrade with next-cycle default and direction detection — DONE
125. Pending plan change banner with effective date — DONE
126. Cancel pending plan change — DONE
127. Cancellation flow: reason survey → 5-handle retention offer → confirm — DONE
128. Subscription pause (1–4 weeks) with frozen handles messaging — DONE

---

## XIX. Add-ons & Contextual Services `margin-lever` `mental-load-reduction`

129. SKUs flagged as add-ons with contextual surfacing triggers (season, weather, time-since-last) — DONE
130. One-tap add-on purchase: deduct handles or charge card — DONE
131. Add-on gate: only surfaced after first completed visit or user-initiated browse — DONE
132. Refund hooks for system/provider cancellations — DONE
133. Add-on orders table with status tracking and payment method — DONE

---

## XX. Home Assistant Category `margin-lever` `mental-load-reduction`

134. Time-boxed SKUs: 30 / 60 / 90-minute sessions with clear boundaries — DONE
135. Customer prep requirements and privacy-safe proof rules — DONE
136. Members-only gate with trust banner — DONE
137. Constrained booking: "next available 2–3 windows" (not Uber-style dispatch) — DONE
138. 5 starter SKUs: Kitchen Reset, Laundry Folding Sprint, Quick Tidy Sprint, Post-Party Reset, Bed + Bath Reset — DONE

---

## XXI. Support & Disputes `trust-builder` `mental-load-reduction`

139. Self-resolution target: ≥80% of issues resolved without human involvement — DONE
140. Receipt-anchored issue reporting: every receipt has "Report an issue" — DONE
141. Guided Resolver: structured category → evidence → instant resolution offer → accept → done — DONE
142. Policy engine with 5-level precedence: provider → SKU → category → zone → global — DONE
143. AI-powered ticket classification with severity, evidence scoring, and risk scoring — DONE
144. Evidence replay: before/after photos + checklist + time-on-site presented to customer — DONE
145. Chargeback intercept: proof + cheaper off-ramps (credits, plan changes) before escalation — DONE
146. Duplicate ticket suppression: second attempt links to existing ticket — DONE
147. Response macros for admin one-click resolutions — DONE
148. Policy preview simulator: test scenario inputs and see what offers would be shown — DONE
149. No chat threads anywhere — all disputes are structured, bounded, and auditable — DONE

---

## XXII. Notifications & Messaging `mental-load-reduction`

150. Event bus architecture: `notification_events` → processor → inbox + push + email — DONE
151. 3-tier priority model: Critical (always delivered), Service (default on), Marketing (default off) — DONE
152. Quiet hours (9pm–8am default) with Critical override — DONE
153. Rate limits per priority tier per day/hour — DONE
154. 19 seeded notification templates with premium concierge copy — DONE
155. In-app notification center with unread badge, priority tabs, and CTA deep links — DONE
156. Push notification pipeline via Capacitor + FCM/APNs — DONE
157. Email delivery via Resend integration — DONE
158. Device token registration with automatic cleanup on logout — DONE
159. User notification preferences: per-tier toggles + quiet hours + timezone — DONE
160. Digest infrastructure for batching non-critical notifications — DONE
161. PII scrubber utility: regex-based phone/email/URL detection + replacement — DONE
162. Admin notification health dashboard: delivery stats, deadletters, processing latency — DONE

---

## XXIII. Customer Feedback & Provider Quality `trust-builder`

163. Immediate satisfaction check on receipt view: "How did today's visit go?" (< 5 seconds) — DONE
164. Delayed private provider review: 7–21 day randomized delay, "Providers won't know it's you" — DONE
165. Confidential notes: admin-only field never shared with providers — DONE
166. Weekly provider feedback rollups with minimum aggregation threshold (N_min=5) to prevent source deduction — DONE
167. Provider Quality Score: rolling 28-day composite (rating 35%, issues 25%, photos 20%, on-time 20%) — DONE
168. Quality Score bands: GREEN (85–100), YELLOW (70–84), ORANGE (55–69), RED (<55) — DONE
169. Provider Quality Score page with coaching themes and "improve next week" targets — DONE
170. Admin feedback transparency page with full quick feedback + private ratings + confidential notes — DONE

---

## XXIV. Ratings & Reviews `trust-builder`

171. Post-visit 1–5 star rating anchored to receipt view (not immediate post-job) — DONE
172. Smart rating suppression: first visit or if issue already reported — DONE
173. Provider rating summary view for admin with avg rating, total reviews, positive/negative counts — DONE

---

## XXV. Property Health Score `mental-load-reduction` `trust-builder`

174. Composite health score (0–100): regularity 40%, coverage 25%, seasonal 15%, issues 20% — DONE
175. Dashboard widget with SVG score ring, color-coded labels, and trend arrow — DONE
176. Auto-compute on load if stale >24 hours — DONE
177. Health score drop notification nudge via event bus — DONE

---

## XXVI. Referrals & Attribution `density-driver` `margin-lever`

178. First-touch deterministic attribution via referral link or code — DONE
179. Milestone-based reward system: signup → subscribe → first visit → paid cycle — DONE
180. Idempotent reward creation: unique per (program, user, milestone, type) — DONE
181. Customer credits and provider bonuses flow through Module 11 ledgers — DONE
182. Fraud controls: hold-until-milestone, caps per referrer, risk flags, admin exception queue — DONE
183. Admin end-to-end audit: referral → milestones → reward → ledger → invoice/payout — DONE

---

## XXVII. Founding Partner & BYOC (Bring Your Own Customers) `density-driver` `provider-value`

184. Provider application funnel with category/ZIP intake and opportunity banners (5 variants) — DONE
185. 12-clause legal agreement with per-clause acceptance tracking and timestamps — DONE
186. Compliance document upload system (GL insurance, COI, background checks, licenses) — DONE
187. Category requirements config: risk tiers 0–3 with per-category compliance rules — DONE
188. BYOC invite link generation with token-based customer activation — DONE
189. BYOC attribution tracking: invited → installed → subscribed → first visit → bonus window — DONE
190. BYOC bonus ledger: weekly batch computation with per-attribution progress tracking — DONE
191. Admin provider application review queue with approve/reject/conditional RPC — DONE
192. Automatic `provider_orgs` + `provider_members` bootstrap on application approval — DONE

---

## XXVIII. Growth Autopilot & Market Launch `density-driver`

193. Market health snapshots per zone — DONE
194. Growth event bus for viral surface tracking — DONE
195. Growth surface configuration: share link expiry, prompt frequency caps, surface weights per zone — DONE
196. Waitlist system: public signup with zone auto-match, admin notify on launch — DONE
197. Zone expansion suggestions: capacity utilization, waitlist pressure, ticket rate analysis — DONE

---

## XXVIII-B. BYOP (Bring Your Own Provider) `density-driver` `trust-builder`

198b. Customer provider recommendation form (name, category, phone/email, note) — DONE
198c. Recommendation confirmation screen with status tracking — DONE
198d. BYOP recommendation tracker page showing all submissions with status badges — DONE
198e. Admin BYOP funnel metrics on Growth Console (submitted → under review → accepted) — DONE
198f. Provider Growth Hub cross-navigation (BYOC Center ↔ Referrals) — DONE
198g. Viral loop wiring: referral cards on JobComplete + customer Receipt — DONE
198h. Admin Growth Console with 4 funnels (BYOC, Referral, BYOP, K-factor summary) — DONE

---

## XXIX. Seasonal Services `margin-lever` `mental-load-reduction`

198. Seasonal service templates per zone with time windows — DONE
199. Customer seasonal selections with window preference tracking — DONE
200. Seasonal plan card on customer dashboard — DONE

---

## XXX. AI Intelligence Layer `margin-lever` `mental-load-reduction`

201. Predictive service recommendations via Gemini AI: property signals → SKU predictions with confidence scores — DONE
202. "AI Picks for You" section in Add Service Drawer with brain icon badge — DONE
203. Smart dispute resolution: AI classifies severity, scores evidence, suggests credits — DONE
204. Auto-resolve disputes meeting guard criteria (evidence ≥75, risk <30, credit ≤$50) — DONE
205. AI photo analysis: signed URL multimodal analysis of job + issue photos — DONE
206. Stale prediction cleanup: automated weekly purge of expired predictions — DONE

---

## XXXI. Ops Cockpit & Admin Analytics `density-driver` `trust-builder`

207. Real-time ops dashboard: today's jobs, capacity pressure, quality metrics, revenue, growth — DONE
208. Zone health drilldowns: capacity, demand, quality, provider coverage, actions — DONE
209. Service Day health: offer backlog, rejection rate, overrides, capacity exceptions — DONE
210. Jobs & proof health: search + filter by status, missing proof, zone, provider, date range — DONE
211. Billing health: past due, failed payments, credits, refunds, disputes — DONE
212. Support health: open tickets, SLA breach risk, self-resolve rate, median time-to-resolution — DONE
213. Growth health: referrals, provider invites, applications, fraud holds — DONE
214. KPI definitions page with formulas, time windows, data sources, and caveats — DONE
215. Daily snapshot rollup via `snapshot-rollup` edge function — DONE
216. Business Health gauges on Ops Cockpit: attach rate, household churn, provider churn, zone density bands — green/amber/red threshold indicators from operating model — DONE
217. Risk Alerts card on Ops Cockpit: operating model threshold violations surfaced as actionable alerts with severity (warning/critical) and deep links to resolution pages — DONE

---

## XXXII. Provider Insights `provider-value` `trust-builder`

216. Provider performance page: jobs completed, proof compliance %, issue rate, avg time on site — DONE
217. Template-based coaching cues: "Add more after photos to improve proof score" — DONE
218. Weekly trend history — DONE

---

## XXXIII. Admin Controls & Governance `margin-lever` `trust-builder`

219. Pricing & payout engine with zone multipliers and SKU-specific overrides — DONE
220. Governance audit trail: every money, access, scheduling, and policy change is logged — DONE
221. Admin system config table with 18+ configurable parameters (dunning steps, bonus caps, thresholds) — DONE
222. Admin change request system with requester/reviewer workflow — DONE
223. Admin adjustment records for manual financial corrections — DONE

---

## XXXIV. Automation Engine `provider-value` `density-driver`

224. Auto-assign jobs to providers: Primary-first → Backup fallback with explainability — DONE
225. Provider no-show detection (hourly) with auto-reassign and calm customer notification — DONE
226. SLA enforcement automation: daily evaluation, 4-level threshold ladder, auto-generate actions — DONE
227. Auto-flag and suspend low-quality providers after sustained RED status — DONE
228. Auto-promote highest-performing backup when primary is suspended — DONE
229. Weather mode: auto-detection via WeatherAPI.com, admin approval, job rescheduling — DONE
230. Holiday calendar: pre-seeded US federal holidays 2026–2027, job skip support — DONE
231. Provider availability blocks: day-off/vacation with auto-skip in job assignment — DONE
232. Lead-time warnings for availability blocks starting within 48 hours — DONE

---

## XXXV. Billing Automation `margin-lever`

233. Automated invoice generation with cycle-based idempotency — DONE
234. Automated dunning with 5-step escalation ladder — DONE
235. Auto-apply referral credits to invoices — DONE
236. Auto-release provider earning holds nightly — DONE
237. Weekly payout runs with threshold enforcement and rollover — DONE

---

## XXXVI. Exception Management `trust-builder`

238. Unified exception queue: failed payments, disputes, payout failures, held earnings, reconciliation mismatches — DONE
239. Per-exception "next best action" CTA with audit trail link — DONE
240. Severity-sorted display with one-tap resolution actions — DONE

---

## XXXVII. Edge Functions & Scheduled Automation `density-driver` `margin-lever`

241. 20+ deployed edge functions covering assignment, billing, weather, payouts, notifications, AI — DONE
242. Cron-based orchestrator (`run-scheduled-jobs`) with per-sub-job idempotency keys — DONE
243. `cron_run_log` for full observability of every automated run — DONE

---

## XXXVIII. Standard Operating Procedures `trust-builder` `provider-value`

244. Emergency pricing override SOP with rollback capability — DONE
245. End-of-day reconciliation SOP — DONE
246. Missing proof handling SOP — DONE
247. No-show escalation SOP — DONE
248. Provider probation ladder SOP — DONE
249. Zone pause workflow SOP — DONE

---

## XXXIX. Platform & Infrastructure `trust-builder`

250. Native iOS + Android via Capacitor — DONE
251. Supabase backend: Auth + Postgres + Storage + Edge Functions — DONE
252. Row-Level Security on every table with default-deny posture — DONE
253. Append-only event logs for all state changes (jobs, tickets, ledgers, notifications) — DONE
254. Signed URLs for all media access — DONE
255. WCAG AA accessible: semantic headings, visible focus states, proper contrast ratios — DONE
256. HSL-based design token system with light + dark mode — DONE
257. 8pt grid spacing system with 44px minimum tap targets — DONE
258. Glassmorphism bottom tab bar with active teal dot indicators — DONE
259. Shimmer skeleton loading states across all data-driven pages — DONE
260. Premium "calm concierge" copy voice throughout — DONE

---

## XL. Routing & Scheduling Engine (PRD-300) `density-driver` `provider-value`

### Sprint 1 — Foundations

261. Visit and task bundling data model supporting multi-category services per stop — DONE
262. Scheduling state machine (Draft → Locked → Dispatched → In Progress → Complete → Exception Pending) — DONE
263. Provider work profile with home base location, service categories, equipment kits, working hours, and capacity limits — DONE
264. Property and provider geo-coordinate indexing for spatial queries — DONE
265. Admin scheduling policy dials (appointment window length, ETA range display, arrival notification minutes) — DONE
266. Customer-facing upcoming visits with status labels (Planning, Scheduled, Today, In Progress, Completed) — DONE

### Sprint 2 — Zone Builder v1

267. H3 hex-grid geo cell infrastructure for scalable zone partitioning — DONE
268. Automated zone generation from region boundaries with configurable dials — DONE
269. Zone metrics computation (demand density, supply capacity, compactness, drive-time proxy) — DONE
270. Cell scoring and seed selection strategies (demand-first, provider-first, auto-hybrid) — DONE
271. Constrained region-growing algorithm with cost function optimization — DONE
272. Admin Zone Builder wizard (select region → settings → preview → edit → commit) — DONE
273. Property-to-zone resolution via H3 cell lookup with fallback ring expansion — DONE

### Sprint 3 — Market/Zone Category States Integration

274. Zone × Category state matrix (Closed, Waitlist Only, Provider Recruiting, Soft Launch, Open, Protect Quality) — DONE
275. State-based customer catalog gating and subscribe eligibility enforcement — DONE
276. Category-level waitlist system with zone-specific demand capture — DONE
277. Provider opportunity surfaces responding to recruiting states — DONE
278. Nightly recommendation engine with hysteresis thresholds and anti-flap rules — DONE
279. Admin approval-gated state transitions with confidence scoring — DONE
280. Minimum time-in-state guardrails to prevent state thrashing — DONE

### Sprint 4 — Rolling Horizon Planner

281. 14-day rolling planning horizon with 7-day LOCKED freeze window — DONE
282. Nightly planning boundary for schedule promotion and state change application — DONE
283. Customer routine changes effective only in DRAFT window (≥8 days out) — DONE
284. Cadence-based task scheduling (weekly, biweekly, every 4 weeks) with stable offsets — DONE
285. Visit bundling rules merging same-property tasks into single stops — DONE
286. Stability rules minimizing DRAFT plan changes unless constraints change — DONE
287. Admin planner health dashboard with run summaries and conflict flagging — DONE

### Sprint 5 — Provider Assignment v1

288. Candidate selection with feasibility filters (skills, equipment, working hours, capacity, proximity) — DONE
289. Assignment solver with objective function (minimize travel, balance workload, reward familiarity) — DONE
290. Primary + Backup provider assignment per visit — DONE
291. Familiarity scoring with configurable cap to balance relationship vs efficiency — DONE
292. Assignment stability rules with freeze-window extra protection — DONE
293. Explainability with confidence levels and top reasons per assignment — DONE
294. Admin exceptions inbox with unassigned/fragile visit prioritization and manual override tools — DONE

### Sprint 6 — Route Sequencing v1 + Equipment Manifest

295. Ordered daily route per provider using nearest-neighbor + 2-opt optimization — DONE
296. Coarse customer-facing ETA ranges derived from stop sequence — DONE
297. Daily equipment manifest generation per provider route — DONE
298. Same-property task bundling with setup discount calculation — DONE
299. Provider blocked windows and legacy commitment support with segment-based planning — DONE
300. Provider pre-Start-Day route reorder with feasibility guardrails — DONE
301. Running-late notification when predicted arrival exceeds ETA window end — DONE

### Sprint 7 — Appointment Windows v1 (Home-Required Services)

302. Scheduling profiles per SKU (Appointment Window, Day Commit, Service Week) — DONE
303. Customer availability capture with 3–6 feasible window offers — DONE
304. Time-window constraint enforcement in route sequencing (VRPTW feasibility) — DONE
305. Mixed-profile bundle piggybacking with duration guardrails — DONE
306. Service-week flexible work with due-soon/overdue queue and week-end deadlines — DONE
307. Provider-placed flexible work via drag/drop with feasibility checks — DONE
308. Window-at-risk exception flagging with local repair attempts — DONE

### Sprint 8 — Exceptions, Reschedules, and Ops Control v1

309. Unified exceptions queue with severity/SLA/escalation timers — DONE
310. Predictive exceptions from nightly planning (window-at-risk, service-week-at-risk, coverage break) — DONE
311. Reactive exceptions from day-of events (provider unavailable, access failure, weather stop) — DONE
312. Ops repair actions (reorder, move day, swap provider, cancel/credit) with feasibility checks — DONE
313. Break-freeze policy with explicit requirements (reason code, customer notification, audit) — DONE
314. Customer self-serve reschedules inside freeze from feasible options — DONE
315. Access failure auto-hold with priority reschedule and soft hold expiration — DONE
316. Ops action idempotency and undo support with reversal transactions — DONE
317. Provider fairness rules (no-blame access failure, show-up credits) — DONE

### Sprint 9 — Ops User Manual

318. Autopilot health indicators (GREEN/YELLOW/RED) based on configurable thresholds — DONE
319. Provider-first self-healing with approve/notify/deny/escalate decision framework — DONE
320. Daily and weekly ops rhythm checklists — DONE
321. SKU discovery and continuous tuning workflow with provider interviews — DONE
322. Launch SKU templates for Pool, Windows, and Pest categories — DONE
323. Ops dashboard requirements with KPI tiles and zone health table — DONE
324. Standard procedures for zone launch, category opening, planner runs, and call-outs — DONE
325. Exception playbooks with severity levels and repair strategies — DONE

---

## XLI. BYOC Onboarding Wizard (PRD-301) — 2-Step Flow `density-driver` `provider-value`

> **Note:** Wizard was simplified from a 7-screen flow to a streamlined 2-step flow (Batch 2 rewrite). Core functionality preserved; steps consolidated for faster onboarding.

326. Streamlined 2-step provider-referred customer onboarding flow (under 60 seconds) — DONE
327. Provider recognition screen preserving existing relationship trust — DONE
328. Confirm existing service screen with editable cadence — DONE
329. Property creation with address and home type — DONE
330. Home setup with property signals (pool, trees, pets, garden, windows) — DONE
331. Connecting provider spinner with activate-byoc-invite call — DONE
332. Other services screen with zone-available categories (skip-friendly) — DONE
333. Conditional Home Plan screen for bundled service pricing — DONE
334. Success screen with provider connection summary — DONE
335. Dashboard "Your Home Team" card showing connected providers and next visits — DONE
336. Referral state handling (Existing Provider First Touch, future: Not First Touch, Cold Referral) — DONE
337. Invite validation with fallback screen for expired/revoked/inactive tokens — DONE
338. Already-activated 409 handling with dashboard redirect — DONE
339. BYOC attribution tracking preserved separate from provider-customer relationship — DONE
340. BYOC rate limits: max 10 active links per provider, max 10 new links per day — DONE
341. Referral one-code-per-customer enforcement with DB re-check — DONE
342. Cryptographically secure token generation (crypto.getRandomValues) — DONE

---

## XLII. E2E Testing & Synthetic UX Review (Playwright) `trust-builder`

340. Playwright E2E test harness with Chromium mobile browser emulation — DONE
341. Auth setup project saving storage state for authenticated tests — DONE
342. BYOC happy-path test validating full wizard flow with milestone screenshots — DONE
343. BYOC invalid-invite test validating fallback UI for bad tokens — DONE
344. BYOC refresh-resilience test validating wizard state preservation on reload — DONE
345. GitHub Actions CI workflow with artifact upload (reports, screenshots, traces) — DONE
346. AI-powered synthetic UX review using 6 persona prompts and Claude Sonnet vision — DONE
347. Per-screen/per-persona evaluation with clarity/trust/friction scores — DONE
348. Aggregate UX summary report with top 5 friction points and fixes — DONE

---

## XLIII. Simplicity by Design `mental-load-reduction`

349. No calendar browsing anywhere — scheduling is automatic and routine-based — DONE
350. One-tap "Add to routine" from any suggestion surface with 10-second undo — DONE
351. Smart defaults everywhere: level auto-selected from property size, pattern auto-optimized — DONE
352. Suggestion throttling: max 2–4 suggestions, "hide / not interested" feedback respected — DONE
353. One primary CTA per screen — never overwhelm — DONE
354. Three-tap issue resolution: category → evidence → accept offer → done — DONE
355. Provider job completion in under 2 minutes: checklist + photos + submit — DONE
356. Admin can launch a new city in under 10 minutes — DONE
357. Customer can add a new service in under 5 seconds — DONE
358. Zero-configuration payout setup: processor-hosted onboarding with one CTA — DONE

---

## XLIV. UX Value Proposition & Conversion `margin-lever` `trust-builder`

359. Bundle Savings Calculator on Plans page and onboarding: compares monthly subscription cost vs. hiring separate vendors with per-service breakdown — DONE
360. First Service Celebration: full-screen animated overlay after first completed service with share CTA and receipt link — DONE
361. Provider Profile Sheet: bottom drawer showing provider name, avatar, rating, trust badges (Verified, Insured), and specialties — DONE
362. Provider Earnings Projection Card: two variants (onboarding zone estimate + dashboard capacity growth meter) showing income potential — DONE
363. Home Timeline page (`/customer/timeline`): chronological service history grouped by month with stats (total services, photos, membership duration) — DONE
364. Trust Bar: compact social proof strip (insured providers, satisfaction guarantee, cancel anytime) shown in onboarding zone check and plan selection — DONE
365. BYOC Banner on provider dashboard: prominent call-to-action for bringing own customers with activation count — DONE
366. Referral Milestones: tiered reward system (Starter $30 credit at 3 referrals, Ambassador free month at 5, Champion VIP at 10) with progress bars — DONE

---

*Total features: 366 | Last updated: 2026-03-13 | Value-prop tags added per section*
