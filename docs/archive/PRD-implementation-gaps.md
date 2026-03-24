# PRD: Handled Home — Remaining Implementation Gaps

**Date**: 2026-03-24
**Status**: Ready for implementation
**Target**: Complete spec compliance for all autoresearch findings
**Repo**: BlueKube/home-handled (main branch)

---

## Overview

PR #40 implemented the majority of items from `docs/IMPLEMENTATION-HANDOFF.md`. An audit found 5 MISSING items and 9 PARTIAL items remaining. This PRD provides exact, actionable specs for each gap so Claude Code can implement them without further clarification. All changes are frontend-only where possible — no new Supabase migrations or edge functions. Mock data should be used for metrics that would require new backend queries.

---

## Implementation Batches

### Batch A: UX Polish & Verification Gaps

Quick wins — P3 items plus Section 2 gaps. All are small, isolated changes with no cross-dependencies.

---

#### P3-1: Help Tooltips

**Status**: MISSING
**Priority**: P3
**Spec reference**: Section 3, P3-1 in IMPLEMENTATION-HANDOFF.md; Flow 7, 8.1, 9.1, 11.2, 13.1, 15, 25.1 in screen-flows.md

**Current state**: `HelpTip` component exists at `src/components/ui/help-tip.tsx`. Props: `text` (string, required), `className` (optional). Renders HelpCircle icon (3.5×3.5) inside a Tooltip with mobile-friendly tap toggle, max-width 240px, 44px min touch target. Currently used in only 4 provider-side files:
1. `src/components/StatCard.tsx` — conditional with `helpText` prop
2. `src/pages/provider/Earnings.tsx`
3. `src/pages/provider/Performance.tsx` — conditional with `helpText` prop
4. `src/pages/provider/QualityScore.tsx` — multiple hardcoded texts

Zero usage on any customer or admin screen.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/customer/Dashboard.tsx` | MODIFY | Add `<HelpTip text="Handles are your service allowances — each handle equals one visit of a service per cycle. Your balance shows how many you have left this period." />` next to the Handle Balance bar/section header |
| `src/pages/customer/Routine.tsx` | MODIFY | Add `<HelpTip text="How it works — add services, set frequency, and we'll build your schedule. Changes take effect next cycle." />` next to the Routine Builder page title or header |
| `src/pages/customer/ServiceDay.tsx` | MODIFY | Add `<HelpTip text="Your recommended day is optimized for route efficiency — choosing it helps your provider serve your neighborhood faster." />` next to the recommended day indicator |
| `src/pages/customer/Activity.tsx` | MODIFY | Add `<HelpTip text="Every visit includes a photo receipt and checklist verification — this is the cumulative value your membership has delivered." />` next to the Activity Value Card or total value display |
| `src/pages/customer/Plans.tsx` | MODIFY | Add `<HelpTip text="Plans set how many handles you get each cycle. Higher tiers include more services and priority scheduling." />` next to the Plans page title |
| `src/pages/customer/Billing.tsx` | MODIFY | Add `<HelpTip text="Your billing cycle renews automatically. You can pause, change plans, or cancel anytime from this page." />` next to the Billing page title |
| `src/pages/customer/Subscription.tsx` | MODIFY | Add `<HelpTip text="Your subscription controls your plan tier, billing cycle, and service schedule. Changes take effect at the start of your next cycle." />` next to Subscription header |
| `src/pages/customer/Referrals.tsx` | MODIFY | Add `<HelpTip text="Share your code with neighbors. When they subscribe, you both earn a $30 credit toward your next cycle." />` next to the referral code section |
| `src/pages/customer/Property.tsx` | MODIFY | Add `<HelpTip text="Your property details help providers prepare for visits — accurate info means better service." />` next to the Property page title |
| `src/pages/customer/Support.tsx` | MODIFY | Add `<HelpTip text="Submit a ticket and we'll respond within 24 hours. For urgent issues, call the number below." />` near the support page header |
| `src/pages/customer/Settings.tsx` | MODIFY | Add `<HelpTip text="Update your profile, notification preferences, and security settings here." />` next to Settings page title |
| `src/pages/customer/Schedule.tsx` | MODIFY | Add `<HelpTip text="Your schedule shows upcoming and past visits. Tap any visit for details, photos, and checklists." />` near the schedule header |
| `src/pages/customer/RecommendProvider.tsx` | MODIFY | Add `<HelpTip text="Know a great service provider? Recommend them to our network and earn a $30 credit if they're accepted." />` near the form header |
| `src/pages/customer/VisitDetail.tsx` | MODIFY | Add `<HelpTip text="This is your visit receipt — it includes photos, checklists, and provider notes for this service." />` near the visit detail header |
| `src/pages/admin/Dashboard.tsx` | MODIFY | Add `<HelpTip text="Admin dashboard shows key metrics across all zones. Data updates in real-time as customers and providers interact." />` next to the admin dashboard title |
| `src/pages/admin/OpsCockpit.tsx` | MODIFY | Add `<HelpTip text="The Ops Cockpit surfaces the metrics that need attention right now. Red = act today, yellow = watch this week." />` next to the cockpit title |
| `src/pages/admin/Growth.tsx` | MODIFY | Add `<HelpTip text="Growth Console tracks viral loop performance — BYOC activations, referral conversions, and BYOP recommendations." />` next to the Growth page title |
| `src/pages/admin/Reports.tsx` | MODIFY | Add `<HelpTip text="Reports provide historical views of revenue, subscriptions, operations, and zone performance." />` next to the Reports page title |

**Implementation notes**:
- Import `HelpTip` from `@/components/ui/help-tip` (same import path used by existing provider files)
- Place `<HelpTip>` inline next to the relevant heading/label, typically: `<h2 className="...">Title <HelpTip text="..." /></h2>` or as a sibling `<span>` — follow the pattern in `QualityScore.tsx` for inline placement
- Do NOT create a new `HelpTooltip.tsx` or `src/components/HelpTooltip.tsx` — reuse the existing `help-tip.tsx`
- If a page heading is inside a `CardTitle` or similar, place the HelpTip inside that same element

**Acceptance criteria**:
- [ ] HelpTip appears on all 18+ screens listed above
- [ ] Each tooltip displays the exact copy specified
- [ ] Tooltip is tappable on mobile (existing component behavior)
- [ ] No new component files created — existing `help-tip.tsx` reused everywhere
- [ ] HelpTip does not break layout or overflow containers (max-width 240px is handled by component)

---

#### P3-3: Sign Out Confirmation

**Status**: MISSING
**Priority**: P3
**Spec reference**: Section 3, P3-3; Flow 16.1, item 5

**Current state**: `src/components/MoreMenu.tsx` calls `await signOut()` directly on click, then `navigate("/auth")`. No confirmation prompt. Current code:
```tsx
const handleSignOut = async () => {
  await signOut();
  navigate("/auth");
};

<button onClick={handleSignOut} className="...text-destructive...">
  <LogOut className="h-5 w-5" />
  <span className="font-medium">Sign Out</span>
</button>
```

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/components/MoreMenu.tsx` | MODIFY | Wrap the sign-out button in an AlertDialog. Replace the `<button onClick={handleSignOut}>` with `<AlertDialog>` + `<AlertDialogTrigger asChild>` wrapping the same button (minus the `onClick`). Add `<AlertDialogContent>` with title "Sign out?", description "You'll need to sign in again to access your account.", Cancel button and destructive "Sign Out" confirm button. |

**Implementation notes**:
- Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`
- The AlertDialog component already exists at `src/components/ui/alert-dialog.tsx`
- Keep the destructive styling on the confirm button: `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`
- Move the `handleSignOut` function to the `<AlertDialogAction onClick={handleSignOut}>` element
- The trigger button should look identical to the current sign-out button (LogOut icon + "Sign Out" text + destructive text color)

**Exact code pattern**:
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button className="flex items-center gap-3 w-full px-3 py-2 text-destructive hover:bg-muted rounded-lg">
      <LogOut className="h-5 w-5" />
      <span className="font-medium">Sign Out</span>
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sign out?</AlertDialogTitle>
      <AlertDialogDescription>
        You'll need to sign in again to access your account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleSignOut}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Sign Out
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Acceptance criteria**:
- [ ] Tapping "Sign Out" in More menu opens a confirmation dialog
- [ ] Dialog shows "Sign out?" title and descriptive text
- [ ] "Cancel" dismisses dialog without signing out
- [ ] "Sign Out" (destructive button) executes `signOut()` and navigates to `/auth`
- [ ] Dialog uses existing AlertDialog component from `@/components/ui/alert-dialog`

---

#### P3-2: Skip Options — Provider Onboarding

**Status**: PARTIAL
**Priority**: P3
**Spec reference**: Section 3, P3-2; Flow 17 provider onboarding

**Current state**: Provider onboarding at `src/pages/provider/Onboarding.tsx` has 6 mandatory steps with NO skip buttons anywhere. The 6 step files are:
1. `OnboardingOrg.tsx` — Org name (required) + accountability checkbox (required) + phone/website/ZIP (optional fields)
2. `OnboardingCoverage.tsx` — Zone selection (≥1 required)
3. `OnboardingCapabilities.tsx` — Service capabilities (≥1 required)
4. `OnboardingCompliance.tsx` — Dynamic compliance based on selected services
5. `OnboardingAgreement.tsx` — All clauses must be individually accepted
6. `OnboardingReview.tsx` — Final review, all sections must pass validation

Customer onboarding wizards already have "Skip for now" ghost buttons — follow that exact pattern.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/provider/OnboardingOrg.tsx` | MODIFY | Add a "Skip for now" ghost button below the primary "Continue" button. When tapped, advance to step 2 without saving optional fields (phone, website, ZIP). Org name and accountability checkbox remain required — if those are filled, skip saves them; if not, skip is disabled. |
| `src/pages/provider/OnboardingCompliance.tsx` | MODIFY | Add a "Skip for now" ghost button below the primary "Continue" button. When tapped, advance to step 5 (Agreement). Only show skip if no compliance items are strictly required for the selected services. If all compliance items are mandatory, hide the skip button. |

**Implementation notes**:
- Look at how customer `OnboardingWizard.tsx` implements its skip buttons — replicate the same visual pattern (ghost/outline variant button, muted text, below the primary CTA)
- Skip button pattern: `<Button variant="ghost" className="text-muted-foreground" onClick={handleSkip}>Skip for now</Button>`
- Steps 2 (Coverage), 3 (Capabilities), 5 (Agreement), and 6 (Review) are genuinely required and should NOT get skip buttons
- On skip, the parent `Onboarding.tsx` should advance the step index the same way it does on "Continue" — check how step progression works and call the same `nextStep()` or `setStep()` function
- Skipped data should remain empty/null — the Review step (step 6) should indicate what was skipped so the provider can come back

**Acceptance criteria**:
- [ ] Step 1 (OnboardingOrg) shows "Skip for now" below Continue
- [ ] Step 4 (OnboardingCompliance) shows "Skip for now" below Continue (only when compliance items are not strictly required)
- [ ] Tapping "Skip for now" advances to the next step without saving optional data
- [ ] Steps 2, 3, 5, 6 do NOT show a skip button
- [ ] Skip button styling matches customer onboarding wizard pattern (ghost variant, muted text)
- [ ] Review step (6) shows indication of any skipped steps

---

#### 2.1: Empty States

**Status**: PARTIAL
**Priority**: P3
**Spec reference**: Section 2.1 in IMPLEMENTATION-HANDOFF.md

**Current state**: Shared `EmptyState` component exists at `src/components/ui/empty-state.tsx` with this API:
```typescript
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  ctaDisabled?: boolean;
  ctaVariant?: "default" | "outline";
  secondaryLabel?: string;
  secondaryAction?: () => void;
  compact?: boolean;
  className?: string;
}
```
Used in ~24 files. However, two key pages are missing:
- `Billing.tsx` — shows inline text "No plan", "No invoices", "No method on file" instead of EmptyState
- `admin/Dashboard.tsx` — empty sections silently disappear with no empty state

Note: `BillingHistory.tsx` and `BillingMethods.tsx` DO use EmptyState properly.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/customer/Billing.tsx` | MODIFY | When no subscription/invoices exist, render `<EmptyState icon={CreditCard} title="No billing activity yet" body="Your first invoice will appear here once your membership begins." ctaLabel="View Plans" ctaAction={() => navigate("/customer/plans")} />` instead of the current inline "No plan" / "No invoices" / "No method on file" text fragments. Import `EmptyState` from `@/components/ui/empty-state` and `CreditCard` from `lucide-react`. |
| `src/pages/admin/Dashboard.tsx` | MODIFY | When no data is available (no customers, no providers onboarded), render `<EmptyState icon={BarChart3} title="No data yet" body="Metrics will populate as customers and providers onboard." />` instead of silently hiding sections. Import `EmptyState` from `@/components/ui/empty-state` and `BarChart3` from `lucide-react`. |

**Implementation notes**:
- `Billing.tsx`: Identify the conditional renders that currently show inline "No plan" text. Replace each with EmptyState. There may be multiple empty conditions (no subscription, no invoices, no payment method) — use one combined EmptyState when there's no subscription at all, and keep more specific empty states for sub-sections (invoices, payment methods) if they render independently.
- `admin/Dashboard.tsx`: Find where metric sections are conditionally rendered (likely `{data && <MetricSection />}` patterns). Add an else branch with EmptyState. The EmptyState should wrap the entire dashboard content area, not each individual metric card.
- Follow the pattern in `BillingHistory.tsx` for reference — check how it renders EmptyState

**Acceptance criteria**:
- [ ] `Billing.tsx` shows EmptyState with CreditCard icon when no subscription exists
- [ ] EmptyState copy reads exactly: "No billing activity yet" / "Your first invoice will appear here once your membership begins."
- [ ] `admin/Dashboard.tsx` shows EmptyState with BarChart3 icon when no data exists
- [ ] EmptyState copy reads exactly: "No data yet" / "Metrics will populate as customers and providers onboard."
- [ ] Both use the shared `EmptyState` component from `@/components/ui/empty-state`
- [ ] CTA on Billing empty state navigates to plans page

---

#### 2.3: Back Buttons

**Status**: PARTIAL
**Priority**: P3
**Spec reference**: Section 2.3 in IMPLEMENTATION-HANDOFF.md

**Current state**: `AppHeader.tsx` provides branding ("HandledHome") + NotificationBell only — no back navigation. Two inconsistent back-navigation patterns exist on sub-pages:
1. ArrowLeft + "Back" text — detail/flow pages (`PlanDetail`, `Subscribe`, `RoutineReview`, `RoutineConfirm`) using `navigate(-1)`
2. ChevronLeft icon only — sub-pages (`BillingHistory`, `BillingMethods`, `BillingReceipt`, `PhotoTimeline`) using `navigate(-1)` or specific routes

The spec calls for "ChevronLeft back → More menu" on section-level pages accessed from the More menu. These pages currently have no back navigation at all.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/customer/Plans.tsx` | MODIFY | Add a back button at the top of the page: `<button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-4"><ChevronLeft className="h-4 w-4" /><span className="text-sm">More</span></button>`. Import `ChevronLeft` from `lucide-react` and `useNavigate` from `react-router-dom`. |
| `src/pages/customer/Billing.tsx` | MODIFY | Same back button pattern → navigates to `/customer/more` with label "More" |
| `src/pages/customer/Referrals.tsx` | MODIFY | Same back button pattern → navigates to `/customer/more` with label "More" |
| `src/pages/customer/Property.tsx` | MODIFY | Same back button pattern → navigates to `/customer/more` with label "More" |
| `src/pages/customer/Support.tsx` | MODIFY | Same back button pattern → navigates to `/customer/more` with label "More" |
| `src/pages/customer/Settings.tsx` | MODIFY | Same back button pattern → navigates to `/customer/more` with label "More" |
| `src/pages/provider/ByocCenter.tsx` | MODIFY | Same back button pattern → navigates to `/provider/more` with label "More" |
| `src/pages/provider/Earnings.tsx` | MODIFY | Same back button pattern → navigates to `/provider/earn` or `/provider/more` with label "Back" (Earnings may be accessed from Earn tab) |

**Implementation notes**:
- Standardize on the ChevronLeft + muted label pattern (matches spec: "ChevronLeft back → More menu")
- Place the back button at the very top of the page content, above the page title
- Use `text-muted-foreground` for the label, `h-4 w-4` for the icon
- Check if `useNavigate` is already imported in each file — it likely is
- Check each file for the correct More menu route path — customer pages use `/customer/more` or similar, provider pages use `/provider/more`
- If the exact More menu route is different (e.g., MoreMenu is a tab and not a route), use `navigate(-1)` as fallback
- Do NOT modify `AppHeader.tsx` — add the back button inline at the top of each page component instead

**Exact back button pattern** (reuse across all files):
```tsx
<button
  onClick={() => navigate("/customer/more")}
  className="flex items-center gap-1 text-muted-foreground mb-4 hover:text-foreground transition-colors"
>
  <ChevronLeft className="h-4 w-4" />
  <span className="text-sm">More</span>
</button>
```

**Acceptance criteria**:
- [ ] All 8 pages listed above have a ChevronLeft + label back button at the top
- [ ] Back button navigates to the correct parent route (More menu or relevant tab)
- [ ] Back button uses consistent styling: `text-muted-foreground`, `text-sm` label, `h-4 w-4` icon
- [ ] Back button appears above the page title
- [ ] Existing sub-page back buttons (PlanDetail, BillingHistory, etc.) are NOT changed

---

#### 2.5: Status Badges

**Status**: PARTIAL
**Priority**: P3
**Spec reference**: Section 2.5 in IMPLEMENTATION-HANDOFF.md

**Current state**: `StatusBadge` at `src/components/StatusBadge.tsx` supports 46 statuses across 5 style groups (primary/blue, success/green, destructive/red, warning/orange, secondary/gray, outlined). Used in 26 files. However:
- NOT used on `PlanCard` — plan cards use generic `Badge` for tier names
- `SubscriptionStatusPanel` does use StatusBadge correctly

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/components/StatusBadge.tsx` | MODIFY | Add `"recommended"` to the primary (blue) status group alongside `assigned`, `en_route`, `scheduled`, etc. The label should render as "Recommended". |
| `src/pages/customer/Plans.tsx` (or the PlanCard component used within it) | MODIFY | On the recommended plan card, add `<StatusBadge status="recommended" />` — likely in the card header area. Identify which plan is marked as recommended (look for `isRecommended`, `recommended`, or `featured` prop/flag on plan data) and conditionally render the badge. |
| `src/pages/provider/ByocCenter.tsx` | MODIFY | Replace any plain `Badge` + icon combinations used for BYOC invite link status with `<StatusBadge status={link.status} />`. Check the current rendering of link statuses — if they use `<Badge variant="...">` with inline icons, switch to StatusBadge which already handles status-to-style mapping. |

**Implementation notes**:
- For the `recommended` status addition in `StatusBadge.tsx`: find the status-to-style mapping object/switch and add `recommended` to the primary group. The label formatting logic likely already handles converting snake_case to Title Case.
- For PlanCard: search for how the recommended plan is identified — it may be a `recommended` boolean field on the plan object, or a specific plan ID comparison. The badge should appear in the top-right corner or next to the plan name.
- For ByocCenter: search for `Badge` imports and usage within the BYOC link list rendering. Replace with StatusBadge where the badge represents a status (active, expired, used, etc.)

**Acceptance criteria**:
- [ ] `StatusBadge` supports `"recommended"` status with primary/blue styling
- [ ] Recommended plan card displays a "Recommended" StatusBadge
- [ ] BYOC invite link statuses use StatusBadge instead of plain Badge + icons
- [ ] No visual regression on existing StatusBadge usage (46 existing statuses unchanged)

---

#### 2.6: Validation

**Status**: PARTIAL
**Priority**: P3
**Spec reference**: Section 2.6 in IMPLEMENTATION-HANDOFF.md

**Current state**:
- `SupportNew.tsx`: Max 500 chars (enforced via `.slice(0, 500)`), required via `.trim()` check + disabled button, character counter displayed. **No minimum length, no inline error messages.**
- `ProfileForm.tsx`: Full Name has no validation (accepts empty). Phone has no validation (accepts anything). No required indicators, no inline errors, only server-side toast on failure.
- `ChangePasswordForm.tsx`: Min 8 chars + confirmation match but toast-only errors (not inline). — Leave this as-is for now (out of scope).
- `Property.tsx` has the best validation pattern in the codebase: `validateProperty()` function + inline error messages + `aria-describedby`. Follow this pattern.
- `react-hook-form` (v7.61.1) and `zod` (v3.25.76) are installed but unused.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/customer/SupportNew.tsx` | MODIFY | Add minimum 10 character validation on the description field. Show inline error message "Description must be at least 10 characters" below the textarea when the user tries to submit with < 10 chars. Add `aria-describedby` linking the error to the textarea. Keep existing max 500 char enforcement and character counter. |
| `src/components/settings/ProfileForm.tsx` | MODIFY | Add required validation on Full Name field — show "Full name is required" inline error when empty on submit. Add US phone format validation on phone field — show "Enter a valid phone number (e.g., (555) 123-4567)" inline error for invalid format. Add red asterisk `*` required indicators next to "Full Name" and "Phone" labels. |

**Implementation notes**:
- Follow the `Property.tsx` validation pattern (manual validation, NOT react-hook-form/zod):
  1. Create a `validateForm()` function that returns an errors object
  2. Store errors in component state: `const [errors, setErrors] = useState<Record<string, string>>({})`
  3. Call `validateForm()` on submit, before the API call
  4. Render inline error: `{errors.fieldName && <p id="fieldName-error" className="text-sm text-destructive mt-1" role="alert">{errors.fieldName}</p>}`
  5. Add `aria-describedby="fieldName-error"` to the input element
  6. Clear field-specific error on field change: `onChange={(e) => { setFieldValue(e.target.value); setErrors(prev => ({...prev, fieldName: ""})); }}`

- Phone validation regex for US numbers: `/^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/` — accepts formats like `(555) 123-4567`, `555-123-4567`, `5551234567`, `555.123.4567`
- For `SupportNew.tsx`: the submit handler likely already has a `note.trim()` check — add `note.trim().length < 10` check alongside it
- Disable the submit button while errors exist (match existing disabled button pattern)

**SupportNew.tsx validation logic**:
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = () => {
  const newErrors: Record<string, string> = {};
  if (note.trim().length < 10) {
    newErrors.description = "Description must be at least 10 characters";
  }
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  // ... existing submit logic
};
```

**ProfileForm.tsx validation logic**:
```tsx
const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

const validateProfile = () => {
  const newErrors: Record<string, string> = {};
  if (!fullName.trim()) {
    newErrors.fullName = "Full name is required";
  }
  if (phone && !phoneRegex.test(phone.trim())) {
    newErrors.phone = "Enter a valid phone number (e.g., (555) 123-4567)";
  }
  return newErrors;
};
```

**Acceptance criteria**:
- [ ] `SupportNew.tsx`: Submitting with < 10 chars shows inline error "Description must be at least 10 characters"
- [ ] `SupportNew.tsx`: Error clears when user types past 10 characters
- [ ] `SupportNew.tsx`: Existing 500 char max and character counter still work
- [ ] `ProfileForm.tsx`: Submitting with empty Full Name shows "Full name is required"
- [ ] `ProfileForm.tsx`: Submitting with invalid phone shows "Enter a valid phone number (e.g., (555) 123-4567)"
- [ ] `ProfileForm.tsx`: Valid US phone formats accepted: `(555) 123-4567`, `555-123-4567`, `5551234567`
- [ ] `ProfileForm.tsx`: Required fields have red `*` indicator next to labels
- [ ] Both forms use `aria-describedby` linking errors to inputs
- [ ] Both forms follow the manual validation pattern from `Property.tsx` (not react-hook-form/zod)

---

### Batch B: Backend Rules & Edge Cases

P2 items — billing logic, fraud prevention, and BYOP provider decline handling. These affect correctness.

---

#### P2-1: Operational Exception Handling (Pause/Dunning/Payment)

**Status**: PARTIAL
**Priority**: P2
**Spec reference**: Section 3, P2-1; Section 4.1 items 3 and 4 in IMPLEMENTATION-HANDOFF.md

**Current state**:

**PausePanel.tsx** (`src/components/plans/PausePanel.tsx`):
- Hardcoded dropdown with options: 1, 2, 3, or 4 weeks only
- Shows pause status with auto-resume date
- Warning styling when paused
- Missing: No custom duration up to 60 days, no visual timeline, no auto-cancel warning

**useDunningEvents.ts** (`src/hooks/useDunningEvents.ts`):
- `DunningEvent` interface: step, action, result, explain_customer, explain_admin, metadata, created_at
- Admin hook: fetch with optional subscription filter
- Customer hook: last 20 events only
- Missing: No predefined step/action enums, no timeline computation, no retry countdown

**FixPaymentPanel.tsx** (`src/components/plans/FixPaymentPanel.tsx`):
- Minimal UI: alert triangle icon + static text + "Fix Payment" button
- Opens Stripe customer portal in new tab
- Missing: No timeline, no retry history, no grace period countdown, no dunning event integration

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/components/plans/PausePanel.tsx` | MODIFY | (1) Change dropdown from 1-4 weeks to a range supporting up to 60 days: options of 1, 2, 3, 4, 6, and 8 weeks (8 weeks ≈ 56 days, closest to 60-day max). (2) Add a visual timeline bar below the dropdown showing the pause period with start date, resume date, and 60-day auto-cancel boundary. (3) Add warning text when selected duration approaches 60 days: "Subscriptions paused longer than 60 days are automatically canceled." (4) When paused and within 7 days of the 60-day limit, show a critical warning: "Your subscription will be automatically canceled on {date} if not resumed." |
| `src/hooks/useDunningEvents.ts` | MODIFY | (1) Add a `DunningStep` enum/const: `"retry_1" \| "retry_2" \| "retry_3" \| "grace_start" \| "grace_end" \| "suspended" \| "canceled"`. (2) Add a `DUNNING_TIMELINE` constant mapping each step to its day offset: `{ retry_1: 3, retry_2: 7, retry_3: 10, grace_start: 0, grace_end: 14, suspended: 14, canceled: 30 }`. (3) Add a `computeDunningTimeline(failureDate: Date)` function that returns an array of `{ step: DunningStep, date: Date, label: string, isPast: boolean }` for visualization. (4) Export the enum, constant, and function. |
| `src/components/plans/FixPaymentPanel.tsx` | MODIFY | (1) Import and call `useDunningEvents` to fetch dunning events for the current subscription. (2) Import `computeDunningTimeline` from `useDunningEvents.ts`. (3) Render a dunning timeline below the existing alert: show retry dates (day 3, 7, 10) with checkmarks for completed retries and upcoming dots for future ones. (4) Show grace period countdown: "Grace period: X days remaining" with a progress bar (14 days total). (5) Show service suspension warning when past day 14: "Service suspended — update your payment method to restore service." (6) If `explain_customer` is available from the latest dunning event, display it as the failure reason. (7) Keep the existing "Fix Payment" button → Stripe portal. |

**Implementation notes**:
- For PausePanel timeline: use a simple horizontal bar with markers. Tailwind classes: `relative h-2 bg-muted rounded-full` for the bar, absolute-positioned dots for dates. Match the visual style of any existing progress indicators in the app.
- For FixPaymentPanel dunning timeline: render as a vertical step list (similar to a stepper component). Each step shows: icon (CheckCircle for past, Circle for upcoming, AlertCircle for current), date, and label. Use `text-muted-foreground` for past steps, `text-foreground` for current, `text-destructive` for warning steps.
- The `computeDunningTimeline` function should be pure (no hooks) — it takes a failure date and returns the timeline array. The hook provides the actual events; the function provides the expected schedule.
- For the grace period countdown: calculate days remaining as `14 - daysSinceFailure` (clamped to 0). Render as a small progress bar.

**Acceptance criteria**:
- [ ] PausePanel offers durations up to 8 weeks (≈60 days max)
- [ ] PausePanel shows a visual timeline with start, resume, and auto-cancel dates
- [ ] Warning text appears for long pause durations (near 60 days)
- [ ] Critical warning appears within 7 days of auto-cancel
- [ ] `useDunningEvents.ts` exports `DunningStep` type, `DUNNING_TIMELINE` constant, and `computeDunningTimeline()` function
- [ ] FixPaymentPanel shows retry timeline (day 3, 7, 10) with past/upcoming status
- [ ] FixPaymentPanel shows grace period countdown (14 days)
- [ ] FixPaymentPanel shows service suspension warning after day 14
- [ ] FixPaymentPanel displays failure reason from dunning events when available
- [ ] Existing "Fix Payment" → Stripe portal button still works

---

#### P2-2: BYOP Provider Decline

**Status**: MISSING
**Priority**: P2
**Spec reference**: Section 3, P2-2 in IMPLEMENTATION-HANDOFF.md

**Current state**:
- `ByopStatus` union type: `"received" | "under_review" | "accepted" | "not_a_fit" | "provider_unavailable"`
- `RecommendProviderStatus.tsx` renders all 5 statuses including `provider_unavailable` with destructive badge, UserX icon, and reassignment messaging
- `useByopRecommendation` hook has submit mutation and totalCredits
- Growth funnel (`useByopFunnelStats` in `useGrowthEvents.ts`) does NOT track `provider_unavailable` count — only tracks submitted/underReview/accepted/notAFit
- No proactive customer notification for BYOP provider decline
- No admin workflow for marking a recommendation as "provider declined"

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useGrowthEvents.ts` | MODIFY | In the `useByopFunnelStats` hook/function, add `providerUnavailable` count to the returned stats. Query/filter recommendations with status `"provider_unavailable"` alongside the existing submitted/underReview/accepted/notAFit counts. Return shape should include: `{ submitted: number, underReview: number, accepted: number, notAFit: number, providerUnavailable: number }`. |
| `src/pages/admin/Growth.tsx` | MODIFY | (1) In the BYOP Recommendation Tracker section, add a "Provider Declined" count card/stat using the new `providerUnavailable` from `useByopFunnelStats`. (2) Add an admin action button on individual BYOP recommendations to mark them as "provider declined". This should be a dropdown or button that calls a mutation to update the recommendation status to `"provider_unavailable"`. Render the button only for recommendations in `"under_review"` or `"accepted"` status. |
| `src/hooks/useByopRecommendation.ts` | MODIFY | Add a `declineRecommendation(id: string)` mutation that updates a recommendation's status to `"provider_unavailable"`. This will be called by the admin Growth page action. Follow the same mutation pattern as the existing submit mutation. |
| `src/components/customer/ByopDeclineNotification.tsx` | CREATE | Create a notification component that renders when a customer's BYOP recommendation is declined before provider assignment. Props: `providerName: string`, `recommendationId: string`. Content: Alert-style card (warning variant) with UserX icon, title "Provider Update", body "{providerName} is unable to join the Handled network at this time. We'll match you with a verified provider from our existing network — no action needed on your end.", and a "View My Routine" CTA button linking to `/customer/routine`. |
| `src/pages/customer/RecommendProviderStatus.tsx` | MODIFY | Import and render `ByopDeclineNotification` when the recommendation status is `"provider_unavailable"` AND the customer has not yet been reassigned. Check if this is already partially handled by the existing STATUS_CONFIG for `provider_unavailable` — if so, enhance with the notification component rather than duplicating. |

**Implementation notes**:
- The distinction between `not_a_fit` and `provider_unavailable` is important: `not_a_fit` means Handled reviewed and rejected the provider; `provider_unavailable` means the provider themselves declined or became unavailable. Keep both statuses separate.
- For the admin action, follow the pattern of other admin actions in `Growth.tsx` — look for existing action buttons/dropdowns on recommendation items.
- The `ByopDeclineNotification` component should follow the same Card/Alert pattern used elsewhere in the app. Check `src/components/ui/alert.tsx` for the alert component API.
- For the customer notification, this should appear on the Status tracker page. If there's a notifications system (`useNotifications` or similar), also consider adding a notification entry — but the minimum viable implementation is the status page update.

**Acceptance criteria**:
- [ ] `useByopFunnelStats` returns `providerUnavailable` count
- [ ] Admin Growth page displays "Provider Declined" count in the BYOP funnel
- [ ] Admin can mark a BYOP recommendation as "provider declined" from the Growth page
- [ ] `declineRecommendation` mutation exists in `useByopRecommendation.ts`
- [ ] Customer sees decline notification on the Status tracker page when their recommendation is `provider_unavailable`
- [ ] Notification includes provider name, explanation, and "View My Routine" CTA
- [ ] `provider_unavailable` is tracked separately from `not_a_fit` in all funnels

---

#### P2-4: Referral Fraud Prevention

**Status**: PARTIAL
**Priority**: P2
**Spec reference**: Section 3, P2-4 in IMPLEMENTATION-HANDOFF.md

**Current state**: DB already handles self-referral blocking (`attribute_referral_signup()` checks `v_code.user_id = auth.uid()`) and duplicate detection (unique constraint `referrals_first_touch`). Schema includes `max_rewards_per_referrer_per_week` and `max_reward_dollars_per_referrer_per_4weeks` fields. Admin tools exist (`useReferralAdmin`: voidReward, releaseHold, applyReward, overrideAttribution, reviewFlag). Risk flag system exists (`referral_risk_flags` table with flag_type, status, admin audit trail). However:
- Velocity cap enforcement logic not implemented in hooks (schema fields only)
- Flag types are freetext — no predefined fraud categories

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useReferralCodes.ts` | MODIFY | Add velocity cap enforcement before allowing share/referral redemption. Before generating or sharing a referral code, check the `max_rewards_per_referrer_per_week` limit by querying recent referral activity for the current user. If the limit is reached, return an error state and message: "You've reached your weekly referral limit. Try again next week." Expose a `isRateLimited: boolean` and `rateLimitMessage: string \| null` from the hook. |
| `src/hooks/useReferralAdmin.ts` | MODIFY | Add predefined fraud flag categories as a typed constant and use it instead of freetext flag_type. Define: `const FRAUD_FLAG_CATEGORIES = ["velocity_cap", "suspicious_ip", "same_household", "self_referral", "rapid_redemption"] as const;` Export `type FraudFlagCategory = typeof FRAUD_FLAG_CATEGORIES[number]`. Update the `reviewFlag` / flag creation functions to use this type instead of freetext string. Add a dropdown/select for flag category in admin UI if flag creation exists. |
| `src/pages/customer/Referrals.tsx` | MODIFY | When `isRateLimited` is true from `useReferralCodes`, show a rate limit message on the share section: banner/alert with "You've reached your weekly referral limit. Try again next week." and disable the share button. |

**Implementation notes**:
- For velocity cap checking in `useReferralCodes.ts`: the simplest approach is to count referrals attributed to the current user in the past 7 days and compare against the program's `max_rewards_per_referrer_per_week` config value. If the count ≥ limit, set `isRateLimited = true`.
- The velocity check can be done client-side by querying referrals for the current user with a date filter, or by calling an RPC that returns the check result. Prefer whatever pattern the existing hook uses for data fetching.
- For fraud flag categories: find where `flag_type` is set in `useReferralAdmin.ts` — it's likely in a `createFlag` or similar function. Change the parameter type from `string` to `FraudFlagCategory`.
- If there's an admin UI for creating flags (in `admin/OpsGrowth.tsx` or similar), update the input from a text field to a select/dropdown using the `FRAUD_FLAG_CATEGORIES` array.

**Acceptance criteria**:
- [ ] `useReferralCodes` checks velocity cap before allowing share
- [ ] When rate limited, hook exposes `isRateLimited: true` and `rateLimitMessage` string
- [ ] Referrals page shows rate limit banner and disables share button when limit reached
- [ ] Rate limit message reads: "You've reached your weekly referral limit. Try again next week."
- [ ] `useReferralAdmin.ts` exports `FRAUD_FLAG_CATEGORIES` constant and `FraudFlagCategory` type
- [ ] Categories include: `velocity_cap`, `suspicious_ip`, `same_household`, `self_referral`, `rapid_redemption`
- [ ] Flag creation/review functions use `FraudFlagCategory` type instead of freetext string
- [ ] No changes to DB-level fraud prevention (self-referral block, duplicate detection, hold period remain as-is)

---

### Batch C: Admin Metrics & Monitoring

Section 4 items plus P2-5 and P2-6 — adding monitoring gauges and reporting to admin dashboards.

---

#### P2-5: Loss Leader Review

**Status**: MISSING
**Priority**: P2
**Spec reference**: Section 3, P2-5; Section 4.1 in IMPLEMENTATION-HANDOFF.md

**Current state**: `admin/Reports.tsx` has 4 tabs (Revenue, Subscriptions, Operations, By Zone) with 4 KPI cards (Est. MRR, Active Subs, Churn Rate, Total Revenue). Hooks: `useAdminSubscriptions`, `useAdminBilling`, `useOpsMetrics`, `useZones`. Zero loss leader tracking anywhere in the codebase. No attach rate cohort tracking. No per-plan profitability view.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useLossLeaderMetrics.ts` | CREATE | Create a new hook that provides loss leader metrics. Since no backend query exists yet, use mock/computed data from existing hooks. Return: `{ planProfitability: PlanProfitability[], cohortAttachRates: CohortAttachRate[], exitAlerts: ExitAlert[] }`. Types: `PlanProfitability = { planId: string, planName: string, tier: string, revenue: number, estimatedCost: number, margin: number, marginPercent: number, subscriberCount: number }`. `CohortAttachRate = { cohortLabel: string, daysRange: [number, number], householdCount: number, attachRate: number, target: number }` with 30d, 60d, 90d, 120d buckets. `ExitAlert = { planName: string, cohortLabel: string, attachRate: number, threshold: number, action: string }` for plans where attach < 30% at 90d or < 15% at 120d. Use mock data initially with a `// TODO: Replace with Supabase query` comment. |
| `src/pages/admin/Reports.tsx` | MODIFY | Add a 5th tab: "Loss Leaders". Tab content: (1) Per-plan profitability table with columns: Plan, Tier, Subscribers, Revenue, Est. Cost, Margin, Margin %. Highlight rows where margin < 0 in destructive color. (2) Cohort attach rates section: 4 cards showing attach rate for 30d, 60d, 90d, 120d cohorts, each with a target indicator and warning color when below target. (3) Exit criteria alerts: a list of alerts for plans meeting exit criteria (attach < 30% at 90d, or < 15% at 120d). Each alert shows plan name, cohort, current attach rate, threshold, and recommended action. |

**Implementation notes**:
- Tab pattern: look at how the existing 4 tabs are implemented in `Reports.tsx` — likely using a Tabs component from `@/components/ui/tabs`. Add the 5th tab following the same pattern.
- For the profitability table: use the same table styling as existing tables in Reports. If they use a custom table component or `<table>` with Tailwind classes, follow that pattern.
- For cohort attach rate cards: follow the KPI card pattern already used at the top of Reports (Est. MRR, Active Subs, etc.). Each card shows the rate, a target line, and conditional coloring.
- For exit alerts: use a pattern similar to `RiskAlertsCard.tsx` in the admin section — check that component for the alert/warning card pattern.
- Mock data for `useLossLeaderMetrics`:
  - 3-4 plans with varying margins (one negative to demonstrate the alert)
  - 4 cohort buckets with realistic attach rates
  - 1-2 exit alerts showing plans that meet exit criteria
- Mark all mock data clearly with `// MOCK DATA — TODO: Replace with Supabase query`

**Acceptance criteria**:
- [ ] Reports page has a 5th "Loss Leaders" tab
- [ ] Per-plan profitability table shows revenue, cost, margin for each plan
- [ ] Negative-margin plans are highlighted in destructive color
- [ ] Cohort attach rates show 30d, 60d, 90d, 120d buckets with targets
- [ ] Exit criteria alerts surface plans where attach < 30% at 90d or < 15% at 120d
- [ ] `useLossLeaderMetrics.ts` hook is created with typed interfaces
- [ ] Mock data is clearly marked with TODO comments for backend replacement

---

#### P2-6: Payout Review Cadence

**Status**: MISSING
**Priority**: P2
**Spec reference**: Section 3, P2-6; Section 4.2 in IMPLEMENTATION-HANDOFF.md

**Current state**: OpsCockpit has 4-column layout: NOW (Reliability), MONEY (Profit Pulse), QUALITY (Service Health), MARKETS (Growth). MONEY column shows: Paid Today, Credits Issued (7d), Past Due, Add-on Rev (7d). Payout pages exist separately: `admin/Payouts.tsx`, `admin/ControlPayouts.tsx`, `admin/ProviderLedger.tsx`. No payout review reminder anywhere.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/pages/admin/OpsCockpit.tsx` | MODIFY | Add a "Payout Review" card to the MONEY column, after existing stat cards. The card should show: (1) "Payout Review" title with a Calendar icon, (2) "Last reviewed: {date}" or "Never reviewed" if no review date exists, (3) "Next review due: {date}" (last review + 90 days), (4) Status indicator: green if < 60 days since last review, yellow if 60-89 days, red if ≥ 90 days (overdue), (5) Link to `admin/Payouts.tsx`: "Go to Payouts →". |

**Implementation notes**:
- Follow the StatCard pattern used elsewhere in OpsCockpit for visual consistency. The existing MONEY column uses stat cards with icons, values, and labels.
- For the review date: since there's no backend tracking of review dates yet, store the last review date in local state or mock it. Add a `// TODO: Store last_payout_review_date in admin_settings table` comment. For now, use a hardcoded mock date or `null` (never reviewed).
- The warning state logic:
  ```tsx
  const daysSinceReview = lastReviewDate
    ? Math.floor((Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  const status = daysSinceReview < 60 ? "healthy" : daysSinceReview < 90 ? "warning" : "overdue";
  ```
- Color coding: healthy = `text-green-600`, warning = `text-yellow-600`, overdue = `text-destructive`
- Check the exact route for the Payouts page and use the correct path for the link
- Render as a Card component with compact styling to fit within the MONEY column alongside existing cards

**Acceptance criteria**:
- [ ] MONEY column in OpsCockpit shows a "Payout Review" card
- [ ] Card shows last review date (or "Never reviewed")
- [ ] Card shows next review due date (last review + 90 days)
- [ ] Card is green when recent, yellow when approaching due, red when overdue
- [ ] Card links to the admin Payouts page
- [ ] Mock data is clearly marked with TODO comment

---

#### 4.3: Bundle Flywheel — Cohort Filtering

**Status**: PARTIAL
**Priority**: P2
**Spec reference**: Section 4.3 in IMPLEMENTATION-HANDOFF.md

**Current state**: `useBusinessHealth.ts` (`src/hooks/useBusinessHealth.ts`) computes attach rate as `totalActiveSKUs / activeHouseholds` (rounded to 2 decimals) with thresholds: target ≥ 2.0, warning at ≥ 1.5. `RiskAlertsCard.tsx` generates alerts: critical if < 1.5 ("target is ≥ 1.5 at 90 days"), warning if 1.5–2.0 ("target is ≥ 2.0"). Alert text mentions "90 days" but no actual cohort calculation exists — attach rate includes ALL households regardless of tenure.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useBusinessHealth.ts` | MODIFY | (1) Add cohort-aware attach rate calculations alongside the existing global rate. Add fields to the return value: `attachRate90d: number` (households active ≤ 90 days), `attachRate180d: number` (households active ≤ 180 days), `attachRateGlobal: number` (existing, renamed for clarity). (2) To compute cohort rates: filter `activeHouseholds` by their `created_at` or activation date. If household data includes a creation date, filter to those within 90/180 days. If not available, add a `// TODO: Need household activation date to compute cohort attach rate` comment and use mock data with realistic values. (3) Add `flywheelHealthy: boolean` computed as `attachRate180d >= 1.5` (the "6-month flywheel breakpoint" from the spec). |
| `src/components/admin/BusinessHealthCard.tsx` | MODIFY | (1) Show both global and cohort attach rates. Add a sub-section below the existing attach rate display: "90-day cohort: {attachRate90d}" and "6-month cohort: {attachRate180d}" with their respective target indicators. (2) If `flywheelHealthy` is false, show a warning: "Flywheel alert: 6-month attach rate below 1.5 — cross-sell is not self-funding." Use warning/destructive styling. (3) Keep the existing global attach rate as the primary display. |
| `src/components/admin/RiskAlertsCard.tsx` | MODIFY | Update the attach rate alerts to use cohort-specific rates instead of (or in addition to) the global rate. The "target is ≥ 1.5 at 90 days" alert should use `attachRate90d`, and a new "6-month flywheel breakpoint" alert should use `attachRate180d < 1.5`. |

**Implementation notes**:
- The key insight is that the current attach rate includes old households who've had years to add services. The 90-day cohort rate shows how well new households are adopting — this is the real health metric.
- For computing cohort rates: check what data `useBusinessHealth` currently queries. If it has access to household-level data with dates, filter by date. If it only has aggregate counts, the cohort calculation will need mock data until a backend query is added.
- Mock cohort data pattern:
  ```tsx
  // TODO: Replace with actual cohort query
  const attachRate90d = attachRateGlobal * 0.7; // New households typically have lower attach
  const attachRate180d = attachRateGlobal * 0.85;
  ```
- The flywheel breakpoint from the spec: "If attach rate < 1.5 SKUs/household by month 6, the flywheel does not self-fund"

**Acceptance criteria**:
- [ ] `useBusinessHealth` returns `attachRate90d`, `attachRate180d`, and `attachRateGlobal`
- [ ] `useBusinessHealth` returns `flywheelHealthy` boolean
- [ ] BusinessHealthCard shows global and cohort attach rates
- [ ] BusinessHealthCard shows flywheel warning when `flywheelHealthy` is false
- [ ] RiskAlertsCard uses 90-day cohort rate for the "90 days" alert
- [ ] RiskAlertsCard includes a 6-month flywheel breakpoint alert
- [ ] Mock data (if used) is clearly marked with TODO comments

---

#### 4.4: Success Metrics — Missing Gauges

**Status**: PARTIAL
**Priority**: P2
**Spec reference**: Section 4.4 in IMPLEMENTATION-HANDOFF.md

**Current state**: OpsCockpit has 4 columns with various stat cards. MONEY column has revenue metrics but no cost/margin calculation. No provider utilization metric anywhere. `BusinessHealthCard` has a gauge pattern (target line, warning threshold, color coding) that can be followed.

**Required changes**:

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useOperationalMetrics.ts` | CREATE | Create a new hook that provides gross margin and provider utilization metrics. Return: `{ grossMargin: { value: number, target: number, status: "healthy" \| "warning" \| "critical" }, providerUtilization: { value: number, target: number, status: "healthy" \| "warning" \| "critical" }, isLoading: boolean }`. Gross margin computed as `(revenue - payouts) / revenue` per zone (use data from existing `useAdminBilling` + payout data if available, otherwise mock). Target: ≥ 25%. Warning: 15-25%. Critical: < 15%. Provider utilization computed as `actual_jobs / available_slots`. Target: ≥ 80%. Warning: 60-80%. Critical: < 60%. Use mock data initially: `// TODO: Replace with Supabase queries for revenue, payout, and job capacity data`. |
| `src/pages/admin/OpsCockpit.tsx` | MODIFY | (1) Add a "Gross Margin" gauge card to the MONEY column. Display: percentage value (large), target indicator "Target: ≥25%", colored status dot (green/yellow/red based on status), and a small gauge/progress bar showing value vs target. (2) Add a "Provider Utilization" gauge card to the NOW column. Display: percentage value (large), target indicator "Target: ≥80%", colored status dot, and gauge/progress bar. |

**Implementation notes**:
- Follow the `BusinessHealthCard` gauge pattern for visual consistency. Check how it renders the attach rate gauge (target line, warning threshold, color coding) and replicate.
- If BusinessHealthCard uses a specific gauge sub-component, reuse it. If it's inline rendering, follow the same inline pattern.
- For the gauge/progress bar:
  ```tsx
  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
    <div
      className={cn("h-full rounded-full", statusColorClass)}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
    {/* Target line */}
    <div
      className="absolute top-0 h-full w-0.5 bg-foreground/50"
      style={{ left: `${target}%` }}
    />
  </div>
  ```
- Color classes: healthy = `bg-green-500`, warning = `bg-yellow-500`, critical = `bg-destructive`
- Mock data for `useOperationalMetrics`:
  ```tsx
  // MOCK DATA — TODO: Replace with Supabase queries
  const grossMargin = { value: 22, target: 25, status: "warning" as const };
  const providerUtilization = { value: 74, target: 80, status: "warning" as const };
  ```
- Position in columns: Gross Margin goes in MONEY (Profit Pulse) column after existing cards. Provider Utilization goes in NOW (Reliability) column after existing cards.

**Acceptance criteria**:
- [ ] `useOperationalMetrics.ts` hook is created with typed return value
- [ ] Gross Margin gauge appears in MONEY column with percentage, target, and status coloring
- [ ] Provider Utilization gauge appears in NOW column with percentage, target, and status coloring
- [ ] Gauges follow BusinessHealthCard visual pattern (target line, warning threshold, color coding)
- [ ] Gross margin: green ≥ 25%, yellow 15-25%, red < 15%
- [ ] Provider utilization: green ≥ 80%, yellow 60-80%, red < 60%
- [ ] Mock data is clearly marked with TODO comments
- [ ] Both gauges render correctly within the existing 4-column layout

---

## Non-Goals

- No new Supabase migrations or edge functions (frontend-only changes where possible; mock data for metrics that need new backend queries)
- No changes to existing test files unless validation changes break them
- No redesign of existing working components — only additions and enhancements
- No changes to files covered by Section 7 of IMPLEMENTATION-HANDOFF.md ("What NOT to Change"): cosmetic spec refinements, section reordering, design token documentation, cross-document references, purpose/intent rewording, operating model prose changes
- No IP/device fingerprinting or geographic velocity checks for referral fraud (out of scope — DB-level fraud prevention is sufficient for now)
- No new Supabase scheduled jobs or cron jobs — use client-side computation or mock data

## Recommended Implementation Order

**Batch A → Batch B → Batch C** (quick wins first, then correctness, then monitoring)

Within each batch, implement in the order listed — items are ordered by dependency:

**Batch A** (8 items, ~18 files modified, 0 created):
1. P3-3: Sign Out Confirmation — single file, 5 minutes
2. 2.1: Empty States — 2 files, 15 minutes
3. 2.5: Status Badges — 3 files, 15 minutes
4. 2.6: Validation — 2 files, 20 minutes
5. 2.3: Back Buttons — 8 files, 20 minutes
6. P3-2: Skip Options — 2 files, 15 minutes
7. P3-1: Help Tooltips — 18 files, 30 minutes (many small changes)

**Batch B** (3 items, ~8 files modified, 1 created):
1. P2-4: Referral Fraud Prevention — 3 files, 20 minutes
2. P2-2: BYOP Provider Decline — 4 files modified + 1 created, 30 minutes
3. P2-1: Operational Exception Handling — 3 files, 40 minutes

**Batch C** (4 items, ~6 files modified, 2 created):
1. P2-6: Payout Review Cadence — 1 file, 15 minutes
2. 4.3: Bundle Flywheel Cohort Filtering — 3 files, 25 minutes
3. 4.4: Success Metrics Gauges — 1 file modified + 1 created, 25 minutes
4. P2-5: Loss Leader Review — 1 file modified + 1 created, 30 minutes
