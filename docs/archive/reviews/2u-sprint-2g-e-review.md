# Sprint 2G-E Review — SOPs & Polish (Playbooks + Dispatcher Keyboard Shortcuts)

**Status:** PASS — no HIGH or MEDIUM findings. 5 LOW findings (content gaps + minor spec divergences).

---

## 2G-E1 — Playbooks Page (`Playbooks.tsx`, 356 lines)

### Architecture
Content is hardcoded as a `PLAYBOOKS: Playbook[]` TypeScript array (not loaded from markdown at runtime). Each playbook has `id`, `title`, `allowedRoles`, `checklist`, and structured `steps[]` with optional `links` and `subSteps`.

### Role filtering
Two-layer filtering:
1. Server-side: `useAdminMembership().adminRole` filters playbooks the user's own role can see
2. Client-side tab: All / Dispatcher / Ops / Superuser tab further narrows display

This means a `dispatcher` logged in will only see dispatcher-tagged playbooks, and can further filter by tab — correct behavior per spec §9.2.

### UI
- Expandable card per playbook (click header to toggle)
- Numbered steps with links (React Router `<Link to={url}>`)
- Role badges on each card
- Checklist summary line at top of each card
- Empty state when no playbooks match filter

### Spec §8.1 compliance

| Requirement | Spec | Built |
|-------------|------|-------|
| 5–12 steps per playbook | Yes | Partial — "Missing Proof" has 4 steps (below minimum) |
| Links to admin screens | Yes | Yes (internal React Router links) |
| Common failure modes section | Yes | **No** — markdown SOPs have this, but TypeScript data omits it (E-F2) |
| Escalation conditions | Yes | **No** — same: exists in markdown, not in UI (E-F2) |
| One-line checklist at top | Yes | Yes |

### Spec §8.2 core playbooks

| Playbook | Spec | Built |
|----------|------|-------|
| EOD Reconciliation (dispatcher) | Yes | Yes — 6 steps |
| Missing Proof (dispatcher) | Yes | Yes — 4 steps |
| No-show escalation (dispatcher) | Yes | Yes — 6 steps |
| Provider probation ladder (ops) | Yes | Yes — 5 steps |
| Coverage exception approvals (ops) | Yes | **No** |
| Zone pause workflow (ops) | Yes | Yes — 5 steps |
| Launch new zone in 72h (growth) | Yes | **No** |
| BYOC close checklist (growth) | Yes | **No** |
| Emergency pricing override (superuser) | Yes | Yes — 5 steps |
| Payout/hold escalation (superuser) | Yes | **No** |

6 of 10 spec-listed playbooks built. All 4 missing are growth_manager (2) and one each from ops and superuser. The `growth_manager` role has zero playbooks.

---

## 2G-E2 — SOP Markdown Files (`docs/sops/*.md`)

6 files exist, each with YAML frontmatter (`title`, `allowed_roles`, `checklist`) and structured markdown content:

| File | Steps | Roles | Quality |
|------|-------|-------|---------|
| `end-of-day-reconciliation.md` | 7 | dispatcher, ops, superuser | Has "When to escalate" section |
| `missing-proof-handling.md` | 5 | dispatcher, ops, superuser | Has "Payout impact" section |
| `no-show-escalation.md` | 6 | dispatcher, ops, superuser | Has "Escalation path" section |
| `provider-probation-ladder.md` | 6 | ops, superuser | Has "Quality score factors" section |
| `zone-pause-workflow.md` | 6 | ops, superuser | Has "Authorization" section |
| `emergency-pricing-override.md` | 6 | superuser | Has "Authorization" + "Rollback" sections |

**Key observation:** The markdown files are **richer** than the TypeScript hardcoded data. They contain escalation paths, failure modes, payout impact info, quality score formulas, and authorization rules that are NOT rendered in the UI. The markdown files serve as standalone documentation but spec §9.1 says "Store SOP markdown in repo `docs/sops/*.md` **and render them in-app**." Currently, the in-app rendering uses separately maintained TypeScript data, not the markdown files.

---

## 2G-E3 — Dispatcher Keyboard Shortcuts (`DispatcherQueues.tsx`, 443 lines)

### Keyboard shortcut implementation
Global `keydown` listener in `useEffect`, with input element guard (skips if target is `<input>`, `<textarea>`, or `<select>`).

| Shortcut | Spec §4.4 | Implemented |
|----------|-----------|-------------|
| J — next item | Yes | Yes |
| K — previous item | Yes | Yes |
| Enter — open selected | Yes | Yes |
| A — assign/action | Yes | Yes (opens `DispatcherActionsDialog`) |
| E — escalate | Yes | **No** (E-F3) |
| N — note | Yes | **No** (E-F3) |
| R — refresh | No (bonus) | Yes |
| ←→ — switch tabs | No (bonus) | Yes |

Keyboard hint tooltip on the Keyboard icon button in header — good discoverability.

### Selected item tracking
- `selectedIndex` state tracks current position in list
- J/K adjusts index with bounds clamping (`Math.min`/`Math.max`)
- Visual: `bg-primary/10 ring-1 ring-primary/30` highlight on selected row
- Index resets to 0 on tab change — correct

---

## 2G-E4 — Saved Views + Dense Tables

### Saved views
- `localStorage` persistence of active tab key (`hh_dispatcher_saved_tab`)
- Loaded on mount via `loadSavedTab()` with fallback to `"atRisk"`
- Saved on every tab change via `saveSavedTab()`
- Safe: `try/catch` around both read and write (handles private browsing)

### Dense table styling (spec §4.3 / §5.2)

| Requirement | Spec | Built |
|-------------|------|-------|
| Compact row height | Yes | Yes — `py-1.5` (was standard padding before) |
| Sticky headers | Yes | Yes — `sticky top-0 z-10 bg-background` on TabsList |
| Hover actions | Yes | Yes — `opacity-0 group-hover:opacity-100` on Action button + chevron |
| Row click opens detail | Yes | Partial — click selects, double-click navigates (E-F4) |
| Saved views per role | Yes | Partial — saved tab (not full filter state), not per-role |
| Bulk actions | Yes | No (not applicable for dispatcher queues — actions are per-job) |

---

## 2G-E5 — Routes & Navigation

- `/admin/ops/dispatch` → `DispatcherQueues` — wired in App.tsx ✓
- `/admin/playbooks` → `Playbooks` — wired in App.tsx ✓
- AdminShell nav: "Dispatcher Queues" under Cockpit, "SOPs" under Playbooks ✓

All 6 queue tabs present per spec §6.1: at_risk_today, missing_proof, unassigned, coverage_gaps, recent_customer_issues, provider_incidents ✓

---

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| E-F1 | LOW | **4 of 10 spec-listed playbooks not built.** Missing: coverage exception approvals (ops), zone launch in 72h (growth), BYOC close checklist (growth), payout/hold escalation (superuser). The `growth_manager` role has zero playbooks. Content gap — no code fix needed, just more SOP content. |
| E-F2 | LOW | **Playbooks missing "Common failure modes" and "Escalation conditions" sections.** Spec §8.1 requires these. The markdown SOP files contain this information (escalation paths, payout impact, authorization rules), but the TypeScript `PLAYBOOKS` data that powers the UI omits it. Either render the markdown files directly, or add `escalation` and `failureModes` fields to the TypeScript data. |
| E-F3 | LOW | **Keyboard shortcuts `E` (escalate) and `N` (note) not implemented.** Spec §4.4 lists "A assign, E escalate, N note" as dispatcher shortcuts. Only `A` is implemented (opens action dialog). `R` (refresh) and `←→` (tab switch) are good bonus additions. |
| E-F4 | LOW | **Row click selects instead of opening detail.** Spec §4.3: "Every row clickable to open detail drawer/pane." Current: single-click selects (highlight ring), double-click navigates. This is actually a reasonable UX choice for keyboard-driven workflows — selection is needed for J/K + Enter to work — but diverges from spec. |
| E-F5 | LOW | **SOP markdown files not rendered from source.** Spec §9.1: "Store SOP markdown in `docs/sops/*.md` and render them in-app." The 6 markdown files exist and are well-written, but the UI renders separately hardcoded TypeScript data. The markdown has richer content (escalation paths, quality score formulas, rollback instructions) that isn't shown. Over time, the two sources will diverge. |

---

## What passed well

- Keyboard shortcut implementation is clean: proper input guard, bounds clamping, visual selection highlight, tooltip for discoverability
- localStorage saved tab is robust (try/catch for private browsing, fallback default)
- Dense row styling is appropriate: `py-1.5`, hover actions, compact badges
- Playbook role filtering is two-layered (server role + client tab) — correct
- SOP content quality is high: actionable steps, internal links to admin routes, time-based escalation tiers
- All 6 dispatcher queue views from spec §6.1 are present and wired
- Consistent UI patterns across all new pages (matches established admin page structure)

---

## Open findings tracker (cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| E05-F3 | LOW | OPEN | Tier modifier cosmetic for primary path |
| B-F3 | MEDIUM | OPEN | Search filter injection in `.or()` |
| B-F4 | MEDIUM | OPEN | Non-standard event types in job_events |
| B-F5 | LOW | OPEN | UUID regex too permissive |
| B-F6 | LOW | OPEN | Review file deletions |
| C-F1 | LOW | OPEN | Dead `'assigned'` value in auto_assign_job skip check |
| C-F2 | LOW | OPEN | `log_admin_action` accepts arbitrary user_id |
| C-F4 | LOW | OPEN | `entity_id` type mismatch (UUID column vs text RPC param) |
| C-F5 | LOW | OPEN | `DecisionTraceCard` only on Job detail |
| D-F6 | LOW | OPEN | Effective date scheduling not in UI |
| D-F7 | LOW | OPEN | "Last changed by" not shown (only timestamp) |
| D-F8 | LOW | OPEN | Bulk multiplier applies to all SKUs, not per category |
| D2-F3 | LOW | OPEN | `set_payout_overtime_rules` doesn't expire old rules |
| D2-F4 | LOW | OPEN | `PayoutBase` interface has phantom `currency` field |
| E-F1 | LOW | OPEN | 4 of 10 spec playbooks not built (growth_manager = 0) |
| E-F2 | LOW | OPEN | Playbooks missing failure modes + escalation sections |
| E-F3 | LOW | OPEN | Keyboard shortcuts E (escalate) and N (note) missing |
| E-F4 | LOW | OPEN | Row click selects vs opens detail (UX divergence) |
| E-F5 | LOW | OPEN | SOP markdown not rendered in-app (hardcoded TS data instead) |

**Round 2G complete.** All HIGH and MEDIUM findings from sprints A–E are closed. 19 LOW findings remain open (13 prior + 5 new from E + 1 from E05). 2 MEDIUM findings remain open from sprint B (B-F3, B-F4).
