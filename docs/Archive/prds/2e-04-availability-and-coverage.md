# PRD — 2E-04 Provider Availability & Coverage

**Purpose:** Allow providers to take time off without harming customer reliability by automatically routing coverage to backups and maintaining quality guarantees.

---

## 1) Goals
- Provider sets days off / vacation blocks
- Assignment respects blocks
- Backup coverage is automatic and logged
- Quality does not drop during absence
- Admin intervenes only for exceptions

## 2) Non-goals
- Full workforce scheduling suite
- Live shift-swapping marketplace

---

## 3) Provider Flow
- Calendar view of upcoming service days
- Create availability block:
  - type: DAY_OFF / VACATION / LIMITED_CAPACITY
  - start/end
  - optional note
- Confirmation:
  - “Backup coverage will be used for affected customers.”
  - If too soon: warn reliability risk (optional admin approval)

---

## 4) System Behavior
- For blocked periods, assignment uses backups for affected jobs
- Preserve primary rights on return (policy-driven)
- All reassignments logged with reasons
- If backup pool insufficient:
  - trigger overflow handling + admin alert

---

## 5) Data Model
- `provider_availability_blocks` (provider_org_id, start_at, end_at, type, status)
- Optional `coverage_exceptions` queue for admin

---

## 6) Acceptance Criteria
- Vacation blocks prevent assignment to primary provider.
- Jobs reassign to backups without customer disruption.
- Admin sees coverage risks early.
