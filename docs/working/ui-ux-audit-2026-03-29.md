# Handled Home — Unified UI/UX Audit Report

> **Date:** 2026-03-29
> **Scope:** 106 screenshots across Customer (16), Provider (15), Admin (19), Public/BYOC screens
> **Audit types:** Creative Director (per-role), Growth & Platform Lock-in
> **Method:** 4 parallel analysis agents reviewing actual authenticated screenshots against product rules, screen-flows spec, and growth model

---

## Executive Summary

| Role | Grade | Top Issue |
|------|-------|-----------|
| **Customer** | B- | Proof surfaces broken (Photos empty, Activity bare), Services catalog violates "no marketplace" rule |
| **Provider** | C+ | Systemic empty-state CTA gaps — 5 screens strand users with no next action |
| **Admin** | B- | Identity masking on Subscriptions/Payouts makes them operationally unusable |
| **Growth** | B- | BYOC loop architecture is strong but execution is broken at critical moments |

**The product has strong architectural bones and genuine strategic differentiation (BYOC, handles currency, routine builder, zone-density model). The issues are execution gaps, not design direction problems.** The same team that built the excellent Notifications, Billing, and Founding Partner screens can fix the weaker screens — the quality bar is already established internally.

---

## Critical Findings (Fix Before Launch)

These are the findings that scored highest across multiple audit lanes. Cross-lane agreement increases confidence.

### 1. Photo Timeline Shows Empty Gray Boxes (Customer)
**Score: 95 | Lanes: Creative Director + Growth**

The core proof surface — the thing that makes subscriptions feel worth paying for — renders as gray placeholder tiles with no message, no loading state, and no explanation. This is the direct opposite of the "proof before narrative" product rule.

**Fix:** Implement proper empty state ("Photos from your service visits will appear here"), loading skeletons, and before/after labels on loaded tiles.

### 2. Services Catalog Violates "No Marketplace Feel" Rule (Customer)
**Score: 90 | Lanes: Creative Director + Growth**

The services page is a dense photo-tile grid with no plan context, no CTAs, and no differentiation between included/add-on/unavailable services. It looks like Angi or Thumbtack — exactly what the product positioning rejects.

**Fix:** Remove the standalone marketplace grid. Surface services contextually within the Routine Builder ("+ Add Services" sheet) with plan context badges ("Included" / "Add-on" / "Not in zone").

### 3. Provider Empty States Have No CTAs (Provider)
**Score: 90 | Lanes: Creative Director**

Five provider screens (Organization, Support, My Jobs, Job History, and Performance) show empty states with no forward action. A new BYOC provider onboarding for the first time hits a wall of "nothing here" screens with no path forward. This is where providers decide whether to invest in adopting the platform.

**Fix:** Every empty state needs a CTA. Organization → "Complete Onboarding" button. Support → "Get Help" button. My Jobs → "Set up your work profile" link. Job History → "View upcoming jobs" link. Performance → "View Available Jobs" button.

### 4. BYOC Flow Has Critical Breaks (Growth)
**Score: 88 | Lanes: Growth**

The primary growth loop (Provider invites customer via BYOC) is architecturally brilliant but broken at execution:
- BYOC link creation shows "No enabled categories found" — link generation fails silently
- SMS Scripts section is empty ("No scripts available yet") at the moment a provider is ready to send
- BYOC Center is a gate screen with no next step for unapproved providers
- Payout account setup warning has no inline CTA, sitting upstream of invite motivation

**Fix:** Fix BYOC link creation (unblock the primary loop). Write and deploy SMS scripts. Add "Set Up Now" button to payout warning.

### 5. Activity Screen Missing Spec-Required Components (Customer)
**Score: 85 | Lanes: Creative Director**

The Activity tab is a bare text timeline missing its entire top section: stats summary pills (total services / photos / member months), value card ("Your home has received X services since [date]"), and recent receipt highlight with photo thumbnail. This is the primary subscription value reinforcement surface.

**Fix:** Rebuild from spec with stats pills, value card, receipt highlight, and richer timeline rows (photo thumbnails, service badges).

### 6. Admin Subscriptions/Payouts Show Truncated UUIDs (Admin)
**Score: 85 | Lanes: Creative Director**

Every row on the Subscriptions screen shows "Customer T38c6fda..." — a truncated UUID with no readable name. The Payouts screen shows dollar amounts with no provider identity. These screens are operationally unusable for daily admin work.

**Fix:** Surface real customer/provider names as primary row labels. Add plan name, next billing date, and sortable columns to Subscriptions. Add provider name, zone, and job reference to Payouts.

---

## Major Findings (Fix in First Sprint)

### 7. Subscription Cancel Button Too Prominent (Customer)
Full-width bright red button draws the eye before Pause or Change Plan options. Spec calls for `ghost/destructive` style. The Pause flow has no visible confirm action. Change Plan section has no CTA.

**Fix:** Demote Cancel to ghost/destructive style at bottom. Add "Confirm Pause" button. Add "Change Plan" button or make the section tappable.

### 8. Dashboard Calendar Creep (Customer)
"25 Upcoming" and "72 Completed" stat counters make the managed service feel like a scheduling app. "Get the app" banner shows on mobile — logically incoherent.

**Fix:** Replace "25 Upcoming" with "Next Service: [Day, Date]". Replace cumulative counts with the spec's Handle Balance Bar (credits used this cycle). Remove app banner on mobile.

### 9. Provider Performance Screen Has Desktop Density (Provider)
Seven competing metric areas on one mobile screen. No CTA. SLA Status ("Good Standing") — the most positive item — is buried at the bottom. Mixed null representations (0 vs —).

**Fix:** Lead with SLA Status. Consolidate metrics into one scrollable section. Add a primary CTA. Unify null representation.

### 10. Provider Dashboard Has Competing CTAs (Provider)
Four zero-state stat tiles, a capacity warning with no action, and a BYOC invite card all compete for attention. Email used as greeting.

**Fix:** Collapse zero-state tiles into a single "nothing scheduled" card. Give capacity warning a CTA ("Adjust Availability"). Personalize greeting with name. Make BYOC card the sole primary CTA.

### 11. Admin Exceptions Screen Is Empty (Admin)
Just a title and a party emoji. No filters, no history, no ability to view resolved exceptions.

**Fix:** Add exception categories with last-checked timestamps. Add "Resolved" historical tab. Remove the party emoji from an ops tool.

### 12. Provider Support Has No Way to Get Support (Provider)
A support screen with no "Submit Ticket," "Contact Support," or "Report Issue" button. The empty state says "keep up the great work!" but provides no action path if a provider has a real problem.

**Fix:** Add persistent "Get Help" button regardless of ticket state. Add secondary contact option (phone/email/chat).

---

## Growth-Specific Findings

### Missing Growth Surfaces (Top 5)

| Priority | Surface | Impact |
|----------|---------|--------|
| 1 | **SMS Scripts for BYOC invites** — empty at the highest-intent moment | Unblocks the primary growth loop |
| 2 | **Referral code auto-fill on auth screen** — currently generic form | Makes referral attribution visible and social |
| 3 | **"X neighbors in your area" social proof** — not shown anywhere | Most powerful trust signal for home services |
| 4 | **Provider tier ladder on Score screen** — no visible aspiration tier | Gamification loop for quality + retention |
| 5 | **"Gift a plan" on Plans screen** — best value-clarity page, zero viral surface | Turns highest-converting page into acquisition channel |

### Viral Loop Health

| Loop | Health | Issue |
|------|--------|-------|
| **BYOC** (Provider → Customer) | YELLOW | Structurally sound, execution broken (link creation fails, scripts empty) |
| **Customer Referral** (Customer → Neighbor) | YELLOW | Mechanics present, cold start wall unaddressed ($0/$0 everywhere) |
| **Provider Referral** (Provider → Provider) | RED | Does not exist in the product |

### Platform Lock-in Scores

| Role | Score | Strongest Asset | Biggest Gap |
|------|-------|----------------|-------------|
| Customer | 6/10 | Routine Builder (genuinely painful to replicate elsewhere) | No loyalty tiers, no integrations |
| Provider | 5/10 | BYOC relationship management (customers mediated by platform) | No visible reputational capital at zero state |

**Monopoly Moat Score: 6.5/10** — Architecture is genuinely differentiated (BYOC, handles currency, zone density). Moat is not yet actualized due to broken execution and invisible network effects.

---

## Cross-Screen Consistency Issues

These patterns recur across multiple roles and should be fixed as design system updates, not per-screen patches.

| Issue | Where | Fix |
|-------|-------|-----|
| **Empty states have no CTA** | Provider (5 screens), Customer (Activity, Photos) | Create a shared empty-state component with icon + message + CTA slot |
| **Destructive buttons are oversized** | Customer (Cancel Sub, Sign Out), Provider (Sign Out) | Standardize to `ghost/destructive` per spec — small, bottom-positioned |
| **Multiple save buttons on one page** | Customer Settings, Provider Settings | Single sticky "Save" covering all sections |
| **Tab filter styles are inconsistent** | Admin (3 different tab treatments across screens) | Pick one tab pattern and standardize |
| **Null state representation mixed** | Provider Performance (0 vs —), Admin (varies) | Use "—" for no data, "0" for genuine zero counts |
| **Back navigation inconsistent** | Some screens have back arrow, some don't | All drill-down pages get back arrow; tab-level pages don't |

---

## Priority Roadmap

### Quick Wins (< 1 day each)
- Add CTAs to 5 provider empty states
- Demote Cancel/Sign Out buttons to ghost/destructive
- Remove "Get the app" banner on mobile
- Write SMS scripts for BYOC invite flow
- Add provider names to Admin Subscriptions/Payouts rows
- Remove party emoji from Admin Exceptions
- Fix "25 Upcoming" → "Next Service: [Date]" on dashboard

### Medium Lift (1-3 days each)
- Rebuild Activity screen from spec (stats pills, value card, receipt highlight)
- Fix Photo Timeline empty/loading states
- Redesign Provider Dashboard zero-state (collapse tiles, single CTA)
- Redesign Provider Performance screen for mobile density
- Add social proof counter to auth screen and dashboard
- Fix BYOC link creation ("No enabled categories" error)
- Add Reporting/Growth/Health screens to Admin sidebar nav

### Larger Redesigns (3-5 days each)
- Remove standalone Services catalog; rebuild as contextual surfaces within Routine Builder
- Implement provider tier ladder (Standard → Preferred → Elite)
- Build provider-refers-provider growth loop
- Rebuild Admin Cron Health to match Notification Health layout
- Add milestone celebration moments with shareable cards

---

## Methodology Notes

Four parallel analysis agents reviewed the 106 screenshots:
1. **Customer Creative Director** — 16 screens scored on clarity, trust, friction, consistency, compliance
2. **Provider Creative Director** — 15 screens scored on same dimensions
3. **Admin Creative Director** — 19 screens scored on hierarchy, nav, density, consistency, actionability
4. **Growth Strategist** — 15 key screens scored on viral trigger, value clarity, network effect, switching cost

Findings were cross-validated: issues flagged by multiple agents received higher confidence scores. The priority roadmap reflects cross-lane agreement — items at the top were flagged independently by 2+ agents.
