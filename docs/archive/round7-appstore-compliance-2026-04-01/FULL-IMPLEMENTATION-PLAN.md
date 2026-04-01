# Full Implementation Plan: Round 7 — App Store Compliance & Browse-First Growth

> **Created:** 2026-04-01
> **Purpose:** Fix all Apple App Store rejection blockers and build a browse-first experience that converts browsers into subscribers. The browse experience is not just compliance — it's a growth lever that gets potential customers attached to the vision of their home being handled before asking them to commit.

---

## Context

The app has two categories of issues blocking App Store approval:

**Compliance blockers** — missing privacy policy, no account deletion, no terms of service, "Coming soon" text, no privacy labels, no reviewer test account.

**Growth opportunity** — Apple requires the app to show value before login, but this is also the chance to build a world-class browse-first onboarding funnel. The best subscription apps (Calm, Headspace, Strava) let you explore deeply before asking for commitment. We'll do the same.

### The browse-first strategy

A potential customer should be able to:
1. **See the full service catalog** — every SKU with inclusions, photos, and handle costs
2. **Explore subscription plans** — see what Essential/Plus/Premium include and how handles work
3. **Build a draft routine** — pick services, set cadences, see the 4-week preview
4. **See their home's potential** — enter their ZIP to check coverage, see what services would look like on their property
5. **Hit the paywall only when they try to activate** — "Sign up to lock in your routine"

By the time they reach the signup prompt, they've already invested time configuring their plan. The sunk-cost effect drives conversion.

---

## Phase 1: Privacy, Terms & Legal Compliance

**Problem:** No privacy policy, no terms of service, no account deletion for customers. These are automatic App Store rejections.

**Goals:**
1. Create privacy policy page at `/privacy`
2. Create terms of service page at `/terms`
3. Add account deletion flow to customer Settings
4. Link privacy + terms in Settings pages, Auth page footer, and Info.plist
5. Add Supabase RPC for account data deletion/anonymization

**Scope:**
- `src/pages/Privacy.tsx` — full privacy policy covering data collection, usage, retention, third parties, rights
- `src/pages/Terms.tsx` — terms of service covering service description, subscriptions, provider relationships, liability
- Update `src/pages/customer/Settings.tsx` — add "Delete Account" section with confirmation dialog
- Create `delete_user_account` database function (anonymize PII, cancel subscription, retain anonymized service records for provider payment history)
- Update `src/App.tsx` — add public routes for `/privacy` and `/terms` (no ProtectedRoute)
- Update `ios/App/App/Info.plist` — add privacy policy URL
- Link privacy + terms in auth page footer and both Settings pages

**Estimated batches:** 3 (S-M)

---

## Phase 2: Browse-First Experience (Public Catalog & Plans)

**Problem:** Every page requires login. Apple requires value without signup. More importantly, showing the full catalog before signup drives higher conversion.

**Goals:**
1. Create a public landing/browse experience accessible without login
2. Show the service catalog with real SKU data (inclusions, handle costs, durations)
3. Show subscription plans with pricing and handle allocation comparison
4. Let visitors enter their ZIP to check coverage
5. Provide clear, enticing CTAs to sign up when they're ready

**Scope:**
- `src/pages/Browse.tsx` — public landing page with:
  - Hero section: "Your home, handled." value prop + coverage check (ZIP input)
  - Service catalog: cards for all active SKUs grouped by category, showing inclusions and handle costs
  - Plan comparison: Essential/Plus/Premium with pricing, handles, and feature comparison
  - How it works: 3-step visual (Set up your home → Pick your plan → We handle the rest)
  - Social proof section: "X services available in your area" (dynamic based on ZIP)
  - CTA: "Get Started" → redirects to `/auth` with `?redirect=/customer/onboarding`
- Update `src/App.tsx` — add `/browse` as a public route, redirect `/` to `/browse` for unauthenticated users
- Reuse existing `useSkus` hook for catalog data (public read via RLS)
- Reuse plan data from database or constants

**Key UX decisions:**
- Browse page uses the same dark theme as the rest of the app
- Service cards show real data from service_skus table
- Plan cards show real pricing (Essential $99, Plus $159, Premium $249)
- ZIP check uses existing zone coverage lookup
- No fake data, no lorem ipsum — everything is real

**Estimated batches:** 3-4 (M)

---

## Phase 3: UI Cleanup (Coming Soon, Placeholders, Timeouts)

**Problem:** "Coming soon" text in QR code section, password reset disabled with toast, "TBD" placeholder, subscription verification hangs forever. Apple rejects apps with visible incomplete features.

**Goals:**
1. Implement password reset flow (Supabase supports this natively)
2. Remove "Coming soon" QR code section
3. Replace "TBD" with proper empty state text
4. Add timeout to subscription verification with user-facing message
5. Clean up any other "coming soon" or placeholder text

**Scope:**
- `src/pages/AuthPage.tsx` — implement actual password reset via `supabase.auth.resetPasswordForEmail()`
- `src/pages/provider/InviteCustomers.tsx` — remove the "QR code coming soon" card entirely
- `src/pages/provider/Dashboard.tsx` — replace "TBD" with "Not yet scheduled"
- `src/pages/customer/OnboardingWizard.tsx` — add 15-second timeout on subscription verification with "Something went wrong. Please try again or contact support." message
- Grep for any remaining "coming soon", "TBD", "placeholder", "lorem" text in src/

**Estimated batches:** 2 (S)

---

## Phase 4: Apple Reviewer Preparation

**Problem:** Apple reviewers need a test account with pre-populated data to review the app. Without one, they'll create an account, hit a non-covered zone, and reject for "app doesn't work."

**Goals:**
1. Create a demo/test account with full data (property, subscription, routine, job history)
2. Document review credentials for App Store Connect submission
3. Prepare App Store metadata (description, screenshots, privacy labels)
4. Update TODO.md with remaining human-only submission steps

**Scope:**
- Create seed SQL for a test account with:
  - Property in a covered zone (Austin test zone)
  - Active Essential subscription
  - Routine with 3 services configured
  - 2-3 completed jobs with photos
  - Service day assignment
- Document in DEPLOYMENT.md: "Apple Review Credentials" section
- Update `docs/upcoming/TODO.md` with:
  - App Store privacy label declarations
  - App Store description text
  - Screenshot requirements (6.7" and 5.5" displays)
  - Review notes for Apple

**Estimated batches:** 2 (S)

---

## Phase 5: Doc Sync & Feature List Update

**Problem:** Standard end-of-round documentation sync.

**Goals:**
1. Update feature-list.md with all new features
2. Update lessons-learned.md
3. Archive working files
4. Update session handoff

**Estimated batches:** 1 (Micro)

---

## Execution Order

1. **Phase 1** (Legal) — must come first, unblocks App Store submission
2. **Phase 2** (Browse) — the big growth feature, builds on Phase 1 (privacy/terms links)
3. **Phase 3** (UI Cleanup) — removes all rejection triggers
4. **Phase 4** (Reviewer Prep) — final preparation for submission
5. **Phase 5** (Doc Sync) — close out the round

**Estimated total:** 11-12 batches across 5 phases

---

## Success Criteria

1. Privacy policy and terms of service accessible at public URLs
2. Customer account deletion works end-to-end
3. Unauthenticated users can browse full service catalog and plans
4. ZIP coverage check works without login
5. No "Coming soon", "TBD", or placeholder text visible in the app
6. Password reset flow works
7. Subscription verification has a timeout with user feedback
8. Apple reviewer test account exists with pre-populated data
9. All App Store compliance items documented in TODO.md
