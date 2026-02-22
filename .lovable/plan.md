

# Module 13.1 — Referral & Attribution Core

## Overview

Build the "accounting-grade" referral rails: programs, codes, attribution, milestones, rewards, fraud holds, and ledger hooks. UI is intentionally thin (13.2 adds the polish). Also create the doc files for the 3-part split.

---

## Phase 1: Documentation + Database Migration

### 1A. Create doc files

Create three new files in `docs/modules/`:
- `13.1-referral-attribution-core.md` (from uploaded spec)
- `13.2-founding-partner-provider-growth.md` (from uploaded spec)
- `13.3-growth-autopilot-market-launch-os.md` (from uploaded spec)

Update `docs/modules/13-referrals-and-incentives.md` to become a lightweight index pointing to the three sub-modules.

### 1B. Database migration (single file)

**Enums:**
- `referral_program_status` (draft, active, paused, archived)
- `referral_milestone_type` (installed, subscribed, first_visit, paid_cycle, provider_ready, provider_first_job)
- `referral_reward_type` (customer_credit, provider_bonus)
- `referral_reward_status` (pending, on_hold, earned, applied, paid, voided)
- `referral_risk_flag_status` (open, reviewed, dismissed)

**Tables (7):**

| Table | Purpose |
|-------|---------|
| `referral_programs` | Rules: who can refer, milestones, reward amounts, caps, hold policy, status |
| `referral_codes` | Per-user code/link. FK to program + user. Unique code. Usage counter. |
| `referrals` | Referrer-to-referred relationship. FK to program, code, referrer, referred user. First-touch enforced via UNIQUE on (program_id, referred_user_id). |
| `referral_milestones` | Milestone events. UNIQUE on (referral_id, milestone) for idempotency. |
| `referral_rewards` | Reward lifecycle. UNIQUE on (program_id, referred_user_id, milestone, reward_type) for idempotency. Holds, amounts, ledger refs. |
| `referral_risk_flags` | Fraud flags tied to referral or reward. Admin review queue. |
| `market_cohorts` | Lightweight cohort reference (zone, label, status). Used more in 13.3 but referenced here. |

**RLS policies:**
- Customers: SELECT own codes, referrals, rewards
- Providers: SELECT rewards tied to their org
- Admins: full access on all tables

**RPC functions (SECURITY DEFINER):**
- `record_referral_milestone(p_referral_id, p_milestone)` -- idempotent milestone + reward creation
- `apply_referral_reward(p_reward_id)` -- moves reward to applied/paid, writes to customer_ledger_events or provider_ledger_events
- `void_referral_reward(p_reward_id, p_reason)` -- admin void with audit
- `release_referral_hold(p_reward_id, p_reason)` -- admin release hold
- `override_referral_attribution(p_referral_id, p_new_referrer_id, p_reason)` -- admin override with audit

---

## Phase 2: Hooks

| Hook | Purpose |
|------|---------|
| `useReferralPrograms` | Admin CRUD for programs |
| `useReferralCodes` | Generate/fetch codes for current user |
| `useReferrals` | List referrals (customer: own, admin: all) |
| `useReferralRewards` | List rewards with status filters |
| `useReferralAdmin` | Admin actions: void, release hold, override attribution |

---

## Phase 3: Customer UI

**`/customer/referrals`** (replace placeholder):
- Share link/code section (copy button)
- Referral statuses list (who signed up, milestone progress)
- Earned/pending credits summary card

---

## Phase 4: Provider UI

**`/provider/referrals`** (new page + route):
- Bonus summary (earned, on hold, paid)
- Reward list with hold reasons
- Minimal -- 13.2 adds the full growth hub

---

## Phase 5: Admin UI

**`/admin/incentives`** (replace placeholder):
- Tabs: Programs | Rewards | Risk Flags
- **Programs tab**: list/create/edit programs with milestone config, reward amounts, caps, hold policy
- **Rewards tab**: filterable list (status, program), click-through audit view showing: program, referral, milestones, reward status, hold reason, ledger reference
- **Risk flags tab**: queue with review/dismiss actions

Admin actions on reward detail:
- Release hold (with reason)
- Void reward (with reason)
- Override attribution (with reason)

---

## Technical Details

### Migration SQL structure

```text
1. Create 5 enums
2. Create 7 tables with proper FKs, indexes, UNIQUE constraints
3. Enable RLS on all tables
4. Create RLS policies (customer/provider/admin)
5. Create 5 SECURITY DEFINER RPCs
6. Grant EXECUTE on RPCs to authenticated
```

### Key design decisions

- First-touch attribution enforced by UNIQUE(program_id, referred_user_id) on `referrals`
- Milestone idempotency via UNIQUE(referral_id, milestone) on `referral_milestones`
- Reward idempotency via UNIQUE(program_id, referred_user_id, milestone, reward_type) on `referral_rewards`
- All reward mutations are server-side RPCs (no direct client UPDATE)
- Ledger integration: `apply_referral_reward` inserts into `customer_ledger_events` or `provider_ledger_events`
- `referral_codes.code` has a UNIQUE constraint for lookup

### Files created/modified

| File | Action |
|------|--------|
| `docs/modules/13.1-referral-attribution-core.md` | Create (from upload) |
| `docs/modules/13.2-founding-partner-provider-growth.md` | Create (from upload) |
| `docs/modules/13.3-growth-autopilot-market-launch-os.md` | Create (from upload) |
| `docs/modules/13-referrals-and-incentives.md` | Update to index |
| Migration SQL | Create (7 tables, 5 enums, RLS, 5 RPCs) |
| `src/hooks/useReferralPrograms.ts` | Create |
| `src/hooks/useReferralCodes.ts` | Create |
| `src/hooks/useReferrals.ts` | Create |
| `src/hooks/useReferralRewards.ts` | Create |
| `src/hooks/useReferralAdmin.ts` | Create |
| `src/pages/customer/Referrals.tsx` | Replace placeholder |
| `src/pages/provider/Referrals.tsx` | Create |
| `src/pages/admin/Incentives.tsx` | Replace placeholder |
| `src/App.tsx` | Add provider referrals route |
| `src/components/AppSidebar.tsx` | Add provider Referrals nav |
| `src/components/MoreMenu.tsx` | Add provider Referrals entry |

