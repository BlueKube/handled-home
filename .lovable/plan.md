

## Documentation Audit — Findings & Recommendations

### 1. `claude-implementation-notes.md` is a stale copy of the OLD `tasks.md`

This is the biggest issue. `claude-implementation-notes.md` (921 lines) is an outdated snapshot of a previous version of `tasks.md` — it still lists Phase 0/1/2/3/4/5/6/7 structure, references `PlaceholderPage` as current state, and says "Push Notifications: Not implemented." Meanwhile, the actual `tasks.md` has been rewritten into Round 2A–2I format and tracks 56/152 tasks complete.

**Action:** Rewrite `claude-implementation-notes.md` to serve its intended purpose — tactical, file-level implementation guidance (which files implement what, hook→page mappings, common patterns, edge function inventory). Remove all roadmap content since `tasks.md` owns that.

---

### 2. `masterplan.md` — Roadmap section is stale

Lines 190–207 say Module 12 is "Current Focus" and Modules 13–14 are "Remaining." All 14 modules are complete. The Roadmap section needs updating to reflect Round 2 as the current phase.

**Action:** Update the Roadmap section to show all 14 modules complete and Round 2C as current focus.

---

### 3. `implementation-plan.md` — Redundant with `tasks.md`

This 58-line file just lists completed modules and launch criteria. `tasks.md` already tracks this more comprehensively (Progress Tracking table at bottom). This file adds no unique information.

**Action:** Either delete it or convert it into a brief "status dashboard" that auto-summarizes from `tasks.md`. Recommend deletion — one source of truth is better than two.

---

### 4. `global-system-architecture.md` — Schema spine is outdated

Section 6 (Canonical schema spine) is missing tables added in Round 2B/2C:
- `notification_events`, `notifications` (enhanced), `notification_delivery`, `user_notification_preferences`, `user_device_tokens`, `notification_rate_limits`, `notification_templates`
- `weather_events`, `holiday_calendar`, `dunning_events`
- `provider_sla_status`, `zone_category_providers`, `job_assignment_log`
- `expansion_suggestions`, `waitlist_entries`
- `growth_events`, `growth_surface_config`, `market_zone_category_state`, `market_health_snapshots`
- `cron_run_log`

Section 5 (Global enums) is also missing notification-related enums (`PENDING | PROCESSING | PROCESSED | FAILED | DEADLETTER`, priority tiers, etc.).

**Action:** Add a "Round 2B+ additions" subsection to sections 5 and 6 with the new tables and enums.

---

### 5. `app-flow-pages-and-roles.md` — Missing pages

Missing pages that were added in Round 2:
- `/shared/notifications` (notification inbox)
- Provider Insights + Insights History
- Admin Ops Cockpit sub-pages (OpsZoneDetail, OpsBilling, OpsJobs, etc.)
- Customer SupportHome, SupportNew, SupportTickets, SupportTicketDetail
- Share landing, Invite landing pages

**Action:** Update with complete route list matching `App.tsx`.

---

### 6. `tasks.md` — Progress table is slightly stale

The table says "2C — Notifications | 26 | 9 | 35%" but counting the actual checkboxes, Sprint C0 has 9 done + Sprint C1 has 3 done = 12 done (not 9). The total count of 26 also doesn't match the actual items listed. Minor but should be accurate.

**Action:** Recount and correct the progress table.

---

### 7. Module specs (01–14) — No completion status markers

The 14 module spec files in `docs/modules/` were written as build specs. Now that they're all implemented, there's no indication of what was built as-spec vs. what diverged. When you expand tasks in future rounds, you may reference these specs and find they don't match reality.

**Action:** Add a brief "Implementation Status" header to each module file noting: "Implemented in Round 1. Key divergences from spec: [none / list]." This takes 1 line per file and prevents confusion.

---

### 8. Duplicate Module 10 specs

There are two Module 10 files:
- `10-customer-dashboard-and-proof.md`
- `10-visit-tracking-photos.md`

These likely cover overlapping scope (customer visit photos/proof).

**Action:** Review both, merge if redundant, or clarify which is canonical.

---

### 9. `round-2b-expanded-spec.md` — Should be marked complete

All Round 2B tasks are done (31/31). This spec is still written in future tense ("Objective: ..."). No harm, but adding a "STATUS: COMPLETE" header would prevent re-reading it as pending work.

**Action:** Add completion status header to both `round-2b-expanded-spec.md` and `round-2c-expanded-spec.md` (noting which sprints are done).

---

### 10. Missing doc: Edge Function inventory

There are 16+ edge functions deployed but no single document listing them, their triggers (cron vs webhook vs manual), required secrets, and current status.

**Action:** Create `docs/edge-function-inventory.md` — a simple table: function name, trigger type, schedule, required secrets, status.

---

### Summary — Recommended changes in priority order

| # | Action | Effort |
|---|--------|--------|
| 1 | Rewrite `claude-implementation-notes.md` to actual implementation notes | M |
| 2 | Update `masterplan.md` roadmap section | S |
| 3 | Delete `implementation-plan.md` (redundant) | S |
| 4 | Update `global-system-architecture.md` schema spine + enums | M |
| 5 | Update `app-flow-pages-and-roles.md` with all current routes | S |
| 6 | Fix `tasks.md` progress table counts | S |
| 7 | Add 1-line status headers to each module spec | S |
| 8 | Resolve duplicate Module 10 files | S |
| 9 | Add completion status to expanded spec docs | S |
| 10 | Create `docs/edge-function-inventory.md` | S |

