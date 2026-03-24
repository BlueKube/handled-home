# Implementation Handoff: Autoresearch → Code

Generated: 2026-03-23

---

## 1. Executive Summary

Three autoresearch optimization runs improved Handled Home's documentation:

| Run | File | Metric | Before → After | Experiments |
|-----|------|--------|----------------|-------------|
| UX | screen-flows.md | Nielsen's 10 Heuristics | 45.77 → 85.65 | 39 |
| Ops | operating-model.md | Business logic completeness | 80.58 → 100.00 | 6 |
| Viral | screen-flows.md (viral flows) | K-factor readiness | 80.36 → 95.13 | 7 |

The documentation now describes capabilities that exceed what the codebase implements. The spec added:
- **721 lines** to screen-flows.md (94 removed) — net +627 lines
- **91 lines** to operating-model.md (57 removed) — net +34 lines

**What changed, in summary:**
1. **UX run**: Added empty states, loading skeletons, error states, validation rules, back buttons, skip options, explainer help text, and status badges to nearly every screen.
2. **Ops run**: Added 11 edge-case handlers (Operational Exception Handling table), a Risk Acknowledgment table, bundle expansion flywheel, loss leader exit criteria, and payout review cadence.
3. **Viral run**: Added BYOP Flow 2B (3 new screens), expanded Flow 6 BYOC Onboarding from a stub to a full 2-screen spec, added referral cards to celebration/receipt flows, added referral fraud prevention rules, and cross-linked BYOC Center ↔ Referrals.

**Total scope estimate**: ~15–20 implementation batches. Mix of verify-only items (~40%), new features (~20%), wiring changes (~15%), backend rules (~15%), and UX polish (~10%).

---

## 2. Changes Already Implemented (Verify Only)

The UX run added documentation for states the code likely already handles. Before building anything, verify these exist and match the spec.

### 2.1 Empty States

The codebase has `src/components/customer/CustomerEmptyState.tsx`. Verify it's used in:

| Screen | Spec says | Likely file | Verify |
|--------|-----------|-------------|--------|
| Flow 7 Dashboard | "Welcome to your home dashboard — your next service and routine status will appear here once set up." | `src/pages/customer/Dashboard.tsx` | Empty state renders when no subscription or upcoming visits |
| Flow 11.1 Schedule | "No completed services yet" + "Your service history will build here over time." | `src/pages/customer/Schedule.tsx` | Empty calendar when no visits scheduled |
| Flow 13.1 Billing | "No billing activity yet — your first invoice will appear here once your membership begins." | `src/pages/customer/Billing.tsx` | Empty state when no subscription/invoices |
| Flow 13.3 Billing History | "No invoices yet — your billing history will appear here once your membership cycle starts." | `src/pages/customer/BillingHistory.tsx` | Empty state when no invoices exist |
| Flow 14.1 Support | "No issues yet — that's great!" (existing) | `src/pages/customer/Support.tsx` | Already specified in original; verify rendering |
| Flow 14.3 Ticket List | "No support tickets — your home is on track." | `src/pages/customer/SupportTickets.tsx` | Empty list state |
| Flow 16.3 Notifications | "No notifications yet — we'll let you know when there's activity on your home." | `src/pages/shared/Notifications.tsx` | Empty notification list |
| Flow 18 Provider Dashboard jobs | "No jobs scheduled for today — your next assignment will appear here when ready." | `src/pages/provider/Dashboard.tsx` | Changed copy from "Check upcoming jobs or enjoy the day off" |
| Flow 19.1 Provider Jobs | "No jobs scheduled for today — your next assignment will appear here once dispatched." | `src/pages/provider/Jobs.tsx` | Empty job list |
| Flow 22.1 Quality Score | "Your score will appear after your first three completed jobs." | `src/pages/provider/QualityScore.tsx` | Empty state before 3 jobs |
| Flow 25.1 Admin Dashboard | "No data yet — metrics will populate as customers and providers onboard." | `src/pages/admin/Dashboard.tsx` | Empty admin dashboard |

### 2.2 Loading Skeletons

The codebase has `src/components/PageSkeleton.tsx` and `src/components/ui/skeleton.tsx`. Verify skeleton usage on:

| Screen | Spec says | Likely file |
|--------|-----------|-------------|
| Flow 5.2 (Onboarding Step 1) | "Skeleton form fields" | `src/pages/customer/OnboardingWizard.tsx` |
| Flow 7 Dashboard | Skeleton sections | `src/pages/customer/Dashboard.tsx` |
| Flow 8.1 Plans | "3 skeleton cards" (existed in original) | `src/pages/customer/Plans.tsx` |
| Flow 9.1 Routine Builder | "Skeleton blocks" (existed in original) | `src/pages/customer/Routine.tsx` |
| Flow 11.1 Schedule | "Skeleton calendar grid and placeholder visit cards" | `src/pages/customer/Schedule.tsx` |
| Flow 11.2 Activity | "Skeleton stat pills and timeline placeholder cards" | `src/pages/customer/Activity.tsx` |
| Flow 13.1 Billing | "Skeleton plan card and payment method row" | `src/pages/customer/Billing.tsx` |
| Flow 15 Referrals | "Skeleton share card and credit summary grid" | `src/pages/customer/Referrals.tsx` |
| Flow 18 Provider Dashboard | "Skeleton greeting, stat grid placeholders, and job card shimmers" | `src/pages/provider/Dashboard.tsx` |
| Flow 21 Earnings | "Skeleton stats grid and earnings card placeholders" | `src/pages/provider/Earnings.tsx` |

### 2.3 Back Buttons

The spec added `ChevronLeft back → ...` to many screens. Likely handled by `src/components/AppHeader.tsx`. Verify:

| Screen | Navigation | File |
|--------|-----------|------|
| Flow 8.1 Plans | "ChevronLeft back → previous screen (More menu or onboarding)" | `src/pages/customer/Plans.tsx` |
| Flow 8.2 Plan Detail | "ChevronLeft + 'Plans' (muted)" | `src/pages/customer/PlanDetail.tsx` |
| Flow 8.3 Subscription | "ChevronLeft + 'Back'" | `src/pages/customer/Subscription.tsx` |
| Flow 12.1 Property | "ChevronLeft back → More menu" | `src/pages/customer/Property.tsx` |
| Flow 13.1 Billing | "ChevronLeft back → More menu" | `src/pages/customer/Billing.tsx` |
| Flow 14.1 Support | "ChevronLeft back → More menu" | `src/pages/customer/Support.tsx` |
| Flow 15 Referrals | "ChevronLeft back → More menu" | `src/pages/customer/Referrals.tsx` |
| Flow 16.2 Settings | "ChevronLeft back → More menu" | `src/pages/customer/Settings.tsx` |
| Flow 20.1 BYOC Center | "ChevronLeft back → More menu" | `src/pages/provider/ByocCenter.tsx` |
| Flow 21 Earnings | "ChevronLeft back → Earn tab" | `src/pages/provider/Earnings.tsx` |

### 2.4 Error Toasts

The spec added error states to almost every screen. The codebase has both `Toaster` and `Sonner` components (`src/components/ui/toaster.tsx`, `src/components/ui/sonner.tsx`). Verify that form submissions show appropriate error toasts. Spot-check:

- Auth page (`src/pages/AuthPage.tsx`): "Invalid email or password." toast exists
- Property page: "Property details saved." success toast
- Routine builder: "Service added to your routine." success toast
- Support new ticket: "Ticket submitted — we'll respond within 24 hours."

### 2.5 Status Badges

The codebase has `src/components/StatusBadge.tsx`. The spec added status badges to:
- Plan cards (recommended badge)
- Subscription status panel
- Referral milestones
- Provider job status
- BYOC invite link status

Verify `StatusBadge` is already imported and used on these screens.

### 2.6 Validation Rules

The spec added explicit validation rules. Most likely already exist in form handlers. Verify:

| Screen | Validation | File |
|--------|-----------|------|
| Flow 1 Auth | "Email must be valid format, password min 8 characters, confirm password must match" | `src/pages/AuthPage.tsx` |
| Flow 5.2 Property | "Street address required, zip must be 5 digits" | `src/pages/customer/OnboardingWizard.tsx` |
| Flow 12.1 Property | "Street address required, city required, state max 2 characters, zip 5 digits" | `src/pages/customer/Property.tsx` |
| Flow 14.2 New Ticket | "Issue category required, description min 10 characters" | `src/pages/customer/SupportNew.tsx` |
| Flow 16.2 Settings | "Full name required, phone must be valid, new password min 8 characters" | `src/pages/customer/Settings.tsx` |
| Flow 17.1 Provider Code | "Code required, format HANDLED-XXXX" | `src/pages/provider/Onboarding.tsx` |

---

## 3. New Features to Build (Ordered by Priority)

### P0 — New Flows (Need New Pages/Components)

#### P0-1: BYOP Flow 2B — Recommend a Provider (3 new screens)

**What**: Customer can recommend a trusted provider for network inclusion. Three screens: recommendation form, confirmation, and status tracker.

**Why**: Viral run — K-factor readiness. BYOP reduces switching friction for incumbent-loyal households. See `masterplan.md` → BYOP strategy.

**Spec reference**: Flow 2B, Screens 2B.1, 2B.2, 2B.3

**Files to create**:
| File | Purpose |
|------|---------|
| `src/pages/customer/RecommendProvider.tsx` | Screen 2B.1 — recommendation form |
| `src/pages/customer/RecommendProviderConfirm.tsx` | Screen 2B.2 — submitted confirmation |
| `src/pages/customer/RecommendProviderStatus.tsx` | Screen 2B.3 — recommendation tracker |
| `src/hooks/useByopRecommendation.ts` | Hook for CRUD on `byop_recommendations` table |

**Files to modify**:
| File | Change |
|------|--------|
| `src/App.tsx` | Add routes: `/customer/recommend-provider`, `/customer/recommend-provider/confirm`, `/customer/recommend-provider/status` |
| `src/components/MoreMenu.tsx` | Add "Recommend a Provider" (UserPlus icon) to Community section |

**Routes**:
- `/customer/recommend-provider` → Screen 2B.1
- `/customer/recommend-provider/confirm` → Screen 2B.2 (or inline state)
- `/customer/recommend-provider/status` → Screen 2B.3

**Dependencies**:
- New Supabase table: `byop_recommendations` (id, customer_id, provider_name, category, phone, email, note, status, created_at, reviewed_at)
- RPC function: `submit_byop_recommendation` with validation
- Admin view to manage recommendations (can be added to existing Growth Console at `/admin/growth`)

**Acceptance criteria**:
1. Customer can navigate More → Recommend a Provider
2. Form validates provider name + category required
3. Submission shows confirmation screen with timeline
4. Tracker page shows recommendation status (Received → Under Review → Accepted / Not a Fit)
5. BYOP Credits card shows $30/accepted recommendation
6. Empty state renders when no recommendations exist

---

#### P0-2: Flow 6 BYOC Onboarding Expansion (was stub → 2 full screens)

**What**: The original spec had a one-line stub: "Similar to Flow 5 but with provider context baked in." Now it's a full 2-step wizard with specific screens.

**Why**: UX run — reduced friction, clear progressive disclosure. Ops run — BYOC migration quality matters for churn tracking.

**Spec reference**: Flow 6, Screens 6.1 and 6.2

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/customer/ByocOnboardingWizard.tsx` | Rewrite to implement 2-step wizard: (1) Confirm Your Service (provider context card + address), (2) Choose Plan & Activate |
| `src/hooks/useByocOnboardingContext.ts` | Ensure hook provides provider name, category, cadence from invite token |

**Route**: `/customer/onboarding/byoc/:token` (already exists in App.tsx)

**Screen 6.1 — Confirm Your Service**:
- Provider Context Card: avatar + name + "Your provider" badge + category + cadence (pre-filled)
- Address Input: street, city, state, ZIP (pre-fill from auth if available)
- Validation: ZIP must match provider's coverage zone
- Skip option: "Skip for now — finish setup later"

**Screen 6.2 — Choose Plan & Activate**:
- 3 plan tier cards (Essential/Plus/Premium) with pre-selected tier from invite
- "Your provider's service is included in all plans."
- CTA: "Activate Service"
- Success: inline confirmation replaces form (CheckCircle + summary card + "Go to Dashboard")

**Dependencies**:
- `useByocOnboardingContext.ts` must return provider details from invite token
- Zone validation against provider's coverage (likely already in `useZoneLookup.ts`)

**Acceptance criteria**:
1. BYOC wizard is 2 steps (down from potentially 4+ if it was following Flow 5)
2. Provider context is pre-filled and visible on step 1
3. Address ZIP validates against provider's zone
4. Plan tier pre-selects based on invite context
5. Activation shows inline confirmation without navigation
6. All existing BYOC tests pass (`src/test/byocWizard.test.ts`, `src/hooks/__tests__/useByocOnboardingContext.test.ts`)

---

### P1 — Wiring Changes (Connecting Existing Things)

#### P1-1: Celebration (Flow 32) → Referral Program Connection

**What**: First Service Celebration screen now includes a Referral Card: "Know someone who'd love this?" with "Get Your Referral Code" button linking to Flow 15.

**Why**: Viral run — highest-intent moment for referral. K-factor readiness.

**Spec reference**: Flow 32, item 7 (new Referral Card)

**Files to modify**:
| File | Change |
|------|--------|
| `src/components/customer/FirstServiceCelebration.tsx` | Add Referral Card (Card, bg-accent/5, border-accent/20) between Secondary CTA and Dismiss. Users icon + "Know someone who'd love this?" + "Earn a $30 credit when a friend subscribes." + Button (accent, sm): "Get Your Referral Code" → `/customer/referrals` |

**Dependencies**: None — `CustomerReferrals` page already exists at `/customer/referrals`.

**Acceptance criteria**:
1. Celebration screen shows referral card after share CTA
2. Tapping "Get Your Referral Code" navigates to `/customer/referrals`
3. Card has accent styling (bg-accent/5, border-accent/20)

---

#### P1-2: Receipt (Flow 11.3) → Referral Cross-Sell CTA

**What**: Visit Detail receipt now includes a referral card (item 12) between Share CTA and Receipt Suggestions.

**Why**: Viral run — receipt-viewing is a high-satisfaction moment for cross-sell.

**Spec reference**: Flow 11.3, item 12 (new Referral Card)

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/customer/VisitDetail.tsx` | Add Referral Card between Share CTA (item 11) and Receipt Suggestions (item 13): Users icon + "Your neighbors would love this" + inline referral code display (monospace, copy button) + Button (accent, sm): "Share Code" → deep link to Flow 15 |
| `src/hooks/useReferralCodes.ts` | May need to import to get customer's referral code for inline display |

**Dependencies**: `useReferralCodes` hook already exists.

**Acceptance criteria**:
1. Visit detail shows referral card below share button
2. Referral code renders inline with copy button
3. "Share Code" links to referral hub

---

#### P1-3: BYOC Center (Flow 20) → Referral Program Cross-Reference

**What**: BYOC Center gets a new section (item 9): "Customer Referral Cross-Sell" card linking to customer referrals info.

**Why**: Viral run — providers should know their activated customers can also refer neighbors.

**Spec reference**: Flow 20, item 9

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/provider/ByocCenter.tsx` | Add Card after Inactive Links section: Users icon + "Your customers can refer their neighbors too" + "Activated customers get a referral code — more neighbors means denser routes and better earnings for you." + info tooltip link |

**Acceptance criteria**:
1. BYOC Center shows cross-sell card at bottom
2. Card explains referral benefit in provider terms (denser routes, better earnings)

---

#### P1-4: Provider Referrals (Flow 24.4) — BYOC Quick Link + Sections

**What**: Provider Referrals page gets structured sections: BYOC Quick Link card, Provider Referral Code, and Referral Activity list.

**Why**: Viral run — co-locate growth tools. The page exists but spec now defines explicit structure.

**Spec reference**: Flow 24.4, Screens 24.4 sections 1–3

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/provider/Referrals.tsx` | Add (1) BYOC Quick Link card (UserPlus icon + "BYOC Center" → `/provider/byoc`), (2) Provider referral code with copy button, (3) Referral activity list with status badges |

**Acceptance criteria**:
1. Provider referrals page shows BYOC quick-link card at top
2. Referral code is copyable
3. Activity list shows status badges per referral

---

#### P1-5: More Menu → "Recommend a Provider" Link

**What**: Customer More menu's Community section adds a "Recommend a Provider" item.

**Why**: BYOP Flow 2B needs a navigation entry point.

**Spec reference**: Flow 16.1, Community section

**Files to modify**:
| File | Change |
|------|--------|
| `src/components/MoreMenu.tsx` | Add `{ label: "Recommend a Provider", icon: UserPlus, path: "/customer/recommend-provider" }` to customerSections → Community items, after Referrals |

**Acceptance criteria**:
1. Customer More menu shows "Recommend a Provider" in Community section
2. Tapping navigates to `/customer/recommend-provider`

---

#### P1-6: Admin Growth Console — Expanded Sections

**What**: Growth Console at `/admin/growth` now specifies 4 funnel sections: BYOC Activation Funnel, Referral Conversion Funnel, BYOP Recommendation Tracker, K-factor Summary.

**Why**: Viral run — admin needs visibility into all viral loops.

**Spec reference**: Flow 30.5

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/admin/Growth.tsx` | Add 4 sections: (1) BYOC funnel (invites→views→signups→activated), (2) Referral funnel (codes→views→signups→subscribed→first visit), (3) BYOP tracker (submitted→review→accepted→onboarded), (4) K-factor summary card |
| `src/hooks/useGrowthEvents.ts` | May need new queries for BYOP funnel data |

**Acceptance criteria**:
1. Admin Growth page renders 4 distinct funnel sections
2. Each funnel shows conversion rates per step
3. BYOP section shows recommendation status breakdown

---

### P2 — Backend Rules (from operating-model.md changes)

#### P2-1: Operational Exception Handling (11 Edge Cases)

**What**: The ops run added a full "Operational Exception Handling" table with 11 scenarios, each with trigger, resolution, and owner.

**Why**: Ops run — business logic completeness (80.58 → 100.00).

**Spec reference**: operating-model-current.md → Operational Exception Handling table

Each scenario needs backend logic (Supabase edge functions, RPC functions, or cron jobs):

| # | Scenario | Owner | Implementation |
|---|----------|-------|----------------|
| 1 | **Customer downgrade mid-cycle** | Billing engine | Ensure `downgrade_subscription` RPC queues change for next cycle, not immediate. Verify current cycle fulfills at existing tier. |
| 2 | **Customer cancel mid-cycle** | Billing engine | Cancel effective at cycle end. Pro-rated refund only if Handled fails to deliver. Check `src/components/plans/CancellationFlow.tsx` handles this. |
| 3 | **Customer plan pause** | Billing engine | Pause up to 2 cycles (60 days max). Jobs cancel. Resume reactivates same tier. Auto-cancel if pause > 60 days. Check `src/components/plans/PausePanel.tsx`. |
| 4 | **Failed payment / dunning** | Billing engine | Retry day 3, 7, 10. Grace period 14 days. Service continues during grace. Past-due at day 14 → jobs suspend. Cancel at day 30. Check `src/hooks/useDunningEvents.ts` and `src/components/plans/FixPaymentPanel.tsx`. |
| 5 | **Provider leaves network** | Ops team | 14-day notice. Reassign all jobs to ACTIVE providers in zone. Notify affected households. Escalate if no replacement. |
| 6 | **Provider suspended (PROBATION → SUSPENDED)** | Ops team | 30-day PROBATION. If not remediated → SUSPENDED. All jobs reassign immediately. SUSPENDED cannot receive new assignments. |
| 7 | **Provider dispute / quality issue** | Ops team | Flag job. If quality score < 3.5/5 over 30 days → PROBATION. Customer gets service recovery credit. |
| 8 | **Zone coverage gap (< 2 active providers)** | Ops team | Trigger recruiting flag. New activations enter waitlist (`waitlist_entries` table). Existing customers get extended windows. 21-day recruiting target. 45+ days → offer refund/transfer. Check `src/hooks/useWaitlist.ts`. |
| 9 | **Zone never reaches density threshold** | Ops team | < 10 households for 6+ months → underperforming. If < 15 by month 9 → wind-down. Transfer/refund remaining households. Zone → INACTIVE. |
| 10 | **Zone oversaturated** | Ops team | Capacity cap enforced. New activations → waitlist. Trigger recruiting + zone split. Existing unaffected. |
| 11 | **BYOC customer churns within 90 days** | Ops team | Track BYOC cohort churn separately. If > 25% churn in 90 days → review originating provider's migration quality → adjust BYOC bonus eligibility. |

**Files likely involved**:
- `src/hooks/useDunningEvents.ts` — dunning logic (#4)
- `src/hooks/useWaitlist.ts` — waitlist entries (#8, #10)
- `src/hooks/useSubscription.ts` — pause/cancel/downgrade (#1, #2, #3)
- `src/components/plans/PausePanel.tsx` — pause UI (#3)
- `src/components/plans/CancellationFlow.tsx` — cancel UI (#2)
- `src/components/plans/FixPaymentPanel.tsx` — dunning UI (#4)
- Supabase edge functions (new) — provider exit reassignment (#5, #6), zone health monitoring (#8, #9, #10), BYOC churn tracking (#11)
- `src/hooks/useZoneHealth.ts` — zone undersupply/oversaturation (#8, #9, #10)

**Acceptance criteria per scenario**: Each scenario's trigger condition fires the resolution automatically (or flags for ops review) with no manual discretion needed.

---

#### P2-2: BYOP Provider Decline Handling

**What**: When a customer's BYOP provider leaves or becomes unavailable, transition customer to standard network provider within 7 days. Preserve pricing for 1 cycle.

**Why**: Ops run — edge case #11 in Operational Exception Handling.

**Spec reference**: operating-model-current.md → Operational Exception Handling → "BYOP provider declines or becomes unavailable"

**Dependencies**: BYOP Flow 2B tables must exist first.

---

#### P2-3: Rate Limiting on BYOC Invite Links

**What**: Max 10 active links per provider. Max 10 new links per provider per day.

**Why**: Viral run — prevent link spam, maintain quality.

**Spec reference**: Flow 20.2

**Files to modify**:
| File | Change |
|------|--------|
| `src/hooks/useByocInviteLinks.ts` | Add link count check before creation. Show "You've reached today's invite limit" or "You have 10 active links — deactivate an unused link before creating a new one." |
| `src/pages/provider/ByocCreateLink.tsx` | Display limit messages |

**Acceptance criteria**:
1. Provider cannot create >10 links/day
2. Provider cannot have >10 active links total
3. Error messages match spec copy

---

#### P2-4: Referral Fraud Prevention

**What**: One code per customer. Single-use per household. Self-referral blocked (same email/phone). Duplicate detection. Rate limit: 20 shares/day.

**Why**: Viral run — K-factor integrity.

**Spec reference**: Flow 15 → Fraud Prevention section

**Files to modify**:
| File | Change |
|------|--------|
| `src/hooks/useReferralCodes.ts` | Enforce one code per customer |
| `src/hooks/useReferrals.ts` | Block self-referral, duplicate detection |
| Supabase RPC/edge function | Server-side validation for all fraud rules |

**Acceptance criteria**:
1. Same email/phone cannot use own referral code
2. Already-used code shows "This code has already been redeemed."
3. Share rate limited to 20/day

---

#### P2-5: Loss Leader Quarterly Review Mechanism

**What**: Loss leaders have explicit exit criteria: kill if cohort attach rate < 30% at 90 days (min 50 households), or < 15% at 120 days. No loss leader runs > 2 quarters without meeting success metrics.

**Why**: Ops run — business logic completeness.

**Spec reference**: operating-model-current.md → Loss Leader Strategy

**Implementation**: Admin-side reporting. Add to Admin Reports (`src/pages/admin/Reports.tsx`) or a new Supabase scheduled job that flags loss leaders exceeding thresholds.

---

#### P2-6: Provider Payout Review Cadence

**What**: Payouts now explicitly "reviewed quarterly" (was "reviewed periodically"). Semi-annual review cadence mentioned in risk table.

**Why**: Ops run — specificity.

**Spec reference**: operating-model-current.md → Payout structure, Risk Acknowledgment table

**Implementation**: Admin dashboard flag or cron job that surfaces payout review reminders quarterly.

---

### P3 — UX Polish (from UX run — verify first, implement gaps)

These were added across nearly every screen. Most are documentation of existing behavior. After verifying Section 2, implement any that are missing:

#### P3-1: Explainer Help Text

The spec added "How it works" help text / info tooltips to ~25 screens. Examples:
- Dashboard: tooltip on Handle Balance bar explaining handles
- Routine Builder: "How it works — add services, set frequency, and we'll build your schedule."
- Service Day: tooltip on recommended day explaining route optimization
- Activity Value Card: tooltip explaining "every visit includes a photo receipt and checklist verification"

**Pattern**: Use a shared `HelpTooltip` or `Explainer` component. Check if one exists; if not, create one reusable component.

**Files to create** (if not exists):
- `src/components/HelpTooltip.tsx` — reusable info tooltip with "How it works" text

#### P3-2: Skip Options

The spec added "Skip for now" ghost buttons to optional onboarding steps:
- Flow 5 wizard: multiple steps now have skip
- Flow 6 BYOC: skip option on both steps
- Flow 17 provider onboarding: skip on steps 1–5

Verify `src/pages/customer/OnboardingWizard.tsx` and `src/pages/provider/Onboarding*.tsx` already have skip where the step is optional.

#### P3-3: Sign Out Confirmation Dialog

**Spec reference**: Flow 16.1, item 5 — "Sign Out with confirmation dialog"

**Files to modify**: `src/components/MoreMenu.tsx` — wrap sign out in confirmation dialog (AlertDialog component exists at `src/components/ui/alert-dialog.tsx`).

#### P3-4: Invite Landing Enhancements

**Spec reference**: Flow 3.1 — added Welcome Offer Card (Gift icon + referral credit info), Dismiss button with status badge, and expanded Fine Print.

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/InviteLanding.tsx` | Add Welcome Offer Card between features and CTA. Add "Dismiss" ghost button. Update fine print to "Free to join. Cancel anytime. No commitments." |

#### P3-5: BYOC Landing Enhancements

**Spec reference**: Flow 2, Screen 2.1 — added "Verified" status badge on provider card, explainer text in fine print, success toast, error state.

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/ByocActivate.tsx` | Add "Verified" badge to provider card. Add explainer line to fine print. Add success/error toasts. |

#### P3-6: Share Landing Enhancements

**Spec reference**: Flow 4, Screen 4.1 — added help text, close button, empty/success/error states.

**Files to modify**:
| File | Change |
|------|--------|
| `src/pages/ShareLanding.tsx` | Add help text + close button to footer. Add empty/success/error state handling. |

---

## 4. Operating Model Implementation Items

### 4.1: Operational Exception Handling (11 Edge Cases)

See P2-1 above for the full table. Summary of what needs backend logic:

**Billing engine items** (automated):
1. Customer downgrade mid-cycle → queue for next cycle
2. Customer cancel mid-cycle → effective at cycle end, pro-rate only on Handled failure
3. Customer plan pause → max 60 days, auto-cancel beyond
4. Failed payment dunning → retry schedule (day 3, 7, 10), grace 14 days, cancel at 30

**Ops team items** (need admin tooling + automation):
5. Provider exit → 14-day notice period, auto-reassign jobs
6. Provider suspension → PROBATION 30 days → SUSPENDED state transition
7. Quality dispute → auto-flag at quality score < 3.5
8. Zone coverage gap → auto-flag recruiting, waitlist new activations
9. Zone density failure → 6-month/9-month review triggers
10. Zone oversaturation → capacity cap enforcement
11. BYOC churn tracking → cohort analytics + bonus adjustment

### 4.2: Risk Acknowledgment Items

New risk table in operating-model-current.md defines 5 risks with mitigations:

| Risk | Backend need |
|------|-------------|
| BYOC/BYOP thin margin | Attach nudge sequence at weeks 4, 8, 12. Flag if attach < 1.5 at 90 days. Kill BYOC bonus if cohort attach < 1.0 at 120 days. |
| Margin compression | Zone-level margin floor 15%. Alert if below for 2 consecutive quarters. Cap annual payout increases at 5%. |
| Loss leader failure | 90-day cohort check. Kill trigger at specific thresholds. |
| Pricing exception abuse | All exceptions expire after 90 days or 1,000 jobs. Dashboard tracks exception ratio — flag if >10%. |
| Provider churn cascade | Monitor zone provider churn quarterly. Trigger retention review if >20% annualized. |

**Implementation**: Most of these are Supabase cron jobs or admin dashboard cards. The `src/pages/admin/OpsCockpit.tsx` and `src/pages/admin/OpsZoneDetail.tsx` pages are the right places for zone-level alerts.

### 4.3: Bundle Expansion Flywheel

New section in operating-model-current.md describes a 6-step flywheel with a breakpoint: "If attach rate < 1.5 SKUs/household by month 6, the flywheel does not self-fund."

**Implementation**: Add attach rate metric to admin dashboard. Create alert/flag when breakpoint condition is met. Likely a Supabase function that computes attach rate per cohort.

### 4.4: Success Metrics (New)

operating-model-current.md now defines target KPIs:
- Gross margin per zone ≥25% at scale (50+ households/zone)
- Attach rate ≥2.0 SKUs/household by month 6
- Monthly household churn <2%
- Provider utilization ≥80%

**Implementation**: Surface these as gauges/thresholds on `src/pages/admin/OpsCockpit.tsx`.

---

## 5. File Impact Map

| Item | Files to Create | Files to Modify |
|------|----------------|-----------------|
| **P0-1: BYOP Flow 2B** | `src/pages/customer/RecommendProvider.tsx`, `src/pages/customer/RecommendProviderConfirm.tsx`, `src/pages/customer/RecommendProviderStatus.tsx`, `src/hooks/useByopRecommendation.ts` | `src/App.tsx`, `src/components/MoreMenu.tsx` |
| **P0-2: Flow 6 BYOC expansion** | — | `src/pages/customer/ByocOnboardingWizard.tsx`, `src/hooks/useByocOnboardingContext.ts` |
| **P1-1: Celebration → Referral** | — | `src/components/customer/FirstServiceCelebration.tsx` |
| **P1-2: Receipt → Referral** | — | `src/pages/customer/VisitDetail.tsx` |
| **P1-3: BYOC → Referral cross-ref** | — | `src/pages/provider/ByocCenter.tsx` |
| **P1-4: Provider Referrals sections** | — | `src/pages/provider/Referrals.tsx` |
| **P1-5: More Menu BYOP link** | — | `src/components/MoreMenu.tsx` |
| **P1-6: Admin Growth funnels** | — | `src/pages/admin/Growth.tsx`, `src/hooks/useGrowthEvents.ts` |
| **P2-1: Exception handling (billing)** | Supabase edge functions / RPC | `src/hooks/useSubscription.ts`, `src/hooks/useDunningEvents.ts`, `src/components/plans/PausePanel.tsx`, `src/components/plans/CancellationFlow.tsx`, `src/components/plans/FixPaymentPanel.tsx` |
| **P2-1: Exception handling (ops)** | Supabase edge functions / cron | `src/hooks/useZoneHealth.ts`, `src/hooks/useWaitlist.ts`, `src/pages/admin/OpsCockpit.tsx` |
| **P2-3: BYOC rate limiting** | — | `src/hooks/useByocInviteLinks.ts`, `src/pages/provider/ByocCreateLink.tsx` |
| **P2-4: Referral fraud prevention** | — | `src/hooks/useReferralCodes.ts`, `src/hooks/useReferrals.ts` |
| **P3-1: Help tooltips** | `src/components/HelpTooltip.tsx` (if needed) | ~25 page files (add tooltips) |
| **P3-3: Sign out confirmation** | — | `src/components/MoreMenu.tsx` |
| **P3-4: Invite landing enhancements** | — | `src/pages/InviteLanding.tsx` |
| **P3-5: BYOC landing enhancements** | — | `src/pages/ByocActivate.tsx` |
| **P3-6: Share landing enhancements** | — | `src/pages/ShareLanding.tsx` |

---

## 6. Suggested Implementation Batches

Following the handled-redesign-workflow pattern: small batches, one theme per batch, spec → implement → review → validate.

### Batch 1: BYOP Flow 2B — Recommend a Provider
**Theme**: New customer viral loop  
**Scope**: 3 new pages + hook + routes + More Menu link  
**Maps to**: P0-1, P1-5  
**Files**: `RecommendProvider.tsx`, `RecommendProviderConfirm.tsx`, `RecommendProviderStatus.tsx`, `useByopRecommendation.ts`, `App.tsx`, `MoreMenu.tsx`  
**Depends on**: Supabase `byop_recommendations` table  
**Est. size**: Medium (3 screens)

### Batch 2: BYOC Onboarding Rewrite
**Theme**: BYOC conversion optimization  
**Scope**: Rewrite ByocOnboardingWizard to 2-step flow  
**Maps to**: P0-2  
**Files**: `ByocOnboardingWizard.tsx`, `useByocOnboardingContext.ts`  
**Depends on**: Nothing new  
**Est. size**: Medium (1 file rewrite, 2 screens)

### Batch 3: Viral Loop Wiring — Celebration + Receipt
**Theme**: Cross-sell referral at high-intent moments  
**Scope**: Add referral cards to celebration and receipt screens  
**Maps to**: P1-1, P1-2  
**Files**: `FirstServiceCelebration.tsx`, `VisitDetail.tsx`  
**Depends on**: `useReferralCodes.ts` (already exists)  
**Est. size**: Small (2 file edits)

### Batch 4: Viral Loop Wiring — Provider Growth Hub
**Theme**: Provider growth tool consolidation  
**Scope**: BYOC → Referral cross-reference, Provider Referrals structured sections  
**Maps to**: P1-3, P1-4  
**Files**: `ByocCenter.tsx`, `Referrals.tsx` (provider)  
**Depends on**: Nothing new  
**Est. size**: Small (2 file edits)

### Batch 5: Admin Growth Console Funnels
**Theme**: Admin visibility into viral loops  
**Scope**: 4 funnel sections on Growth page  
**Maps to**: P1-6  
**Files**: `Growth.tsx` (admin), `useGrowthEvents.ts`  
**Depends on**: BYOP table from Batch 1  
**Est. size**: Medium (1 page rework)

### Batch 6: BYOC Rate Limiting + Referral Fraud Prevention
**Theme**: Abuse prevention  
**Scope**: Rate limits on BYOC links, referral fraud rules  
**Maps to**: P2-3, P2-4  
**Files**: `useByocInviteLinks.ts`, `ByocCreateLink.tsx`, `useReferralCodes.ts`, `useReferrals.ts`  
**Depends on**: Nothing new  
**Est. size**: Small (4 file edits, mostly validation logic)

### Batch 7: Billing Edge Cases
**Theme**: Subscription lifecycle correctness  
**Scope**: Verify/implement downgrade, cancel, pause, dunning rules  
**Maps to**: P2-1 (items 1–4)  
**Files**: `useSubscription.ts`, `useDunningEvents.ts`, `PausePanel.tsx`, `CancellationFlow.tsx`, `FixPaymentPanel.tsx`  
**Depends on**: Supabase billing functions  
**Est. size**: Medium (mostly verification + gap filling)

### Batch 8: Provider/Zone Ops Edge Cases
**Theme**: Operational resilience  
**Scope**: Provider exit/suspension, zone coverage gaps, density thresholds  
**Maps to**: P2-1 (items 5–11)  
**Files**: `useZoneHealth.ts`, `useWaitlist.ts`, `OpsCockpit.tsx`, Supabase edge functions  
**Depends on**: Admin tooling  
**Est. size**: Large (new backend logic + admin UI)

### Batch 9: Landing Page Enhancements
**Theme**: Conversion funnel polish  
**Scope**: Invite, BYOC, and Share landing pages  
**Maps to**: P3-4, P3-5, P3-6  
**Files**: `InviteLanding.tsx`, `ByocActivate.tsx`, `ShareLanding.tsx`  
**Depends on**: Nothing  
**Est. size**: Small (3 file edits)

### Batch 10: UX Polish — Empty States + Help Text
**Theme**: Nielsen heuristic compliance  
**Scope**: Add any missing empty states, loading skeletons, help tooltips  
**Maps to**: P3-1, P3-2, P3-3 + Section 2 gaps  
**Files**: Potentially `HelpTooltip.tsx` (new), `MoreMenu.tsx` (sign out confirmation), plus ~20 pages for missing states  
**Depends on**: Section 2 audit results  
**Est. size**: Large (many small edits across codebase)

### Batch 11: Admin KPI Gauges + Risk Monitoring
**Theme**: Operating model visibility  
**Scope**: Success metric gauges, risk threshold alerts, loss leader review  
**Maps to**: P2-5, P2-6, Section 4.3, 4.4  
**Files**: `OpsCockpit.tsx`, `Reports.tsx`, new Supabase functions  
**Depends on**: Batch 8 zone health logic  
**Est. size**: Medium

**Recommended order**: 1 → 2 → 3 → 4 → 6 → 5 → 9 → 7 → 8 → 10 → 11

Rationale: Batches 1–4 deliver visible new features and viral loop wiring (highest user impact). Batch 6 adds safety rails before launch. Batch 5 gives admin visibility. Batches 7–8 are backend correctness. Batch 9–10 are polish. Batch 11 is operational monitoring.

---

## 7. What NOT to Change

The autoresearch runs made many spec-level changes that should **not** trigger code changes:

### 7.1 Cosmetic Spec Refinements (no code impact)
- **Capitalization of bullet points**: The ops run capitalized bullet list items throughout operating-model.md (e.g., "recurring subscription revenue" → "Recurring subscription revenue"). This is spec formatting only.
- **Period-ending bullet items**: Added periods to the end of bullet points. Spec-only.
- **Copy tightening**: Minor wording changes to existing descriptions (e.g., "Marketing page → Sign up" → "Show value proposition and feature benefits → convert to new account"). These describe intent, not UI copy changes.

### 7.2 Section Reordering (no code impact)
- Plan Detail (Screen 8.2): numbered list reformatting from loose references to structured bold labels. The UI already has these sections.
- Routine Review (Screen 9.2): added section numbers to what was an unstructured description. The screen already exists.
- Routine Confirm (Screen 9.3): expanded from 1 line to full section description. Verify existing implementation first.
- Provider Job execution screens (19.1–19.5): restructured from paragraph descriptions to numbered sections. The screens already exist.

### 7.3 Design Token Documentation (no code impact)
- Button style annotations (e.g., "Button (accent, xl, full-width)") are documenting existing design system usage, not requesting changes.
- Status badge annotations are documenting where `StatusBadge` is already used.
- Layout measurements (p-4, pb-24, etc.) are documenting existing spacing.

### 7.4 Cross-Document References (no code impact)
- Added "See `operating-model.md` → Plan Tier Structure" cross-references in screen-flows.md
- Added "See `masterplan.md` → BYOP" cross-references
- These are spec navigation aids, not code changes.

### 7.5 Purpose/Intent Rewording (no code impact)
- Activity screen: "The retention moat — cumulative value that makes leaving feel like losing a record" → "reinforces subscription value and confirms your membership is working." Same screen, different framing.
- Home Timeline: "creates switching costs" → "confirming your subscription value and membership benefits." Same screen, different framing.
- These reflect the autoresearch agent aligning spec language with Nielsen heuristics scoring criteria, not requesting copy changes in the actual UI.

### 7.6 Operating Model Prose Changes (no code impact)
- "a handle = one allowance of a service per cycle" — definition clarification, not a UI change.
- "Zones are grouped into regions" — already implemented in admin tooling.
- Tier design principle rewording — same meaning, tighter language.
- Provider payout "reviewed periodically" → "reviewed quarterly" — cadence change is operational, not code.
- Bundle expansion flywheel description — strategic documentation, not a feature.
