

# Module 12: Support and Disputes — Implementation Plan

## Context

The uploaded FINAL document was the prompt used to generate the PRD. It's useful background but the PRD itself contains everything needed. In the future, you can skip uploading the guide doc — it adds volume without new information.

The PRD will replace the existing `docs/modules/12-support-and-disputes.md`.

## Implementation Phases

This is a large module with 8 database tables, a policy engine, 3 role experiences, and AI integration. To keep things manageable and testable, the build is split into 4 phases.

---

### Phase 1: Database + PRD File + Core Hooks

**Database migration** — Create all 8 tables with RLS:

| Table | Purpose |
|-------|---------|
| `support_tickets` | Core ticket record with type, severity, status, policy trail, AI fields, partner attribution |
| `support_ticket_offers` | Append-only offers shown to user (credit tiers, redo, addon, refund, review) |
| `support_ticket_events` | Append-only audit log (every action recorded) |
| `support_attachments` | Photos/files uploaded by customer or provider |
| `support_policy_scopes` | Links scope (global/zone/category/SKU/provider) to active policy version |
| `support_policies` | Versioned, immutable policy rules (JSON blob of dials) |
| `support_macros` | Named policy patches for quick apply |
| `ai_inference_runs` | Audit trail for AI classification/scoring |

**RLS policies:**
- Customers: read/insert own tickets, offers, attachments, events
- Providers: read tickets tied to their org's jobs, insert evidence/events
- Admins: full CRUD on all tables

**Hooks created:**
- `useSupportTickets` — list tickets by role (customer sees own, provider sees org's, admin sees all with queue filters)
- `useSupportTicketDetail` — single ticket with offers, events, attachments
- `useCreateTicket` — guided resolver mutation
- `useTicketActions` — accept offer, add info, provider acknowledge/dispute, admin resolve
- `useSupportPolicies` — list/create/rollback policies
- `useSupportMacros` — CRUD macros

**File update:** Replace `docs/modules/12-support-and-disputes.md` with the uploaded PRD content.

---

### Phase 2: Customer Experience

**Pages:**

| Route | Component | Description |
|-------|-----------|-------------|
| `/customer/support` | `CustomerSupportHome` | "Resolve something now" CTA, recent visits with "Report an issue", active tickets list, quick-resolve tiles |
| `/customer/support/new` | `CustomerSupportNew` | Guided resolver: category tiles -> anchor to job/invoice -> clarifying questions -> instant resolution offer(s) -> confirm |
| `/customer/support/tickets` | `CustomerSupportTickets` | Filterable ticket list (Open / Resolved / All) |
| `/customer/support/tickets/:ticketId` | `CustomerSupportTicketDetail` | Status chip, "What we decided", credit/redo details, evidence gallery, bounded "Add info" |

**Components:**
- `SupportCategoryTile` — tile selector for issue type (quality, missed, damage, billing, safety, routine change)
- `EvidenceReplay` — before/after photos, checklist items, time-on-site from job data
- `ResolutionOfferCard` — displays an offer (credit amount, redo intent, addon, etc.) with accept/reject
- `TicketStatusChip` — styled status badge for ticket states

**Key behaviors:**
- Receipt-first entry: "Report an issue" from visit detail creates ticket pre-anchored to job_id
- Guided resolver always shows at least one immediate option
- No free-form chat, no date picking
- Character-limited note field (500 chars max)

---

### Phase 3: Provider + Admin Experience

**Provider pages:**

| Route | Component | Description |
|-------|-----------|-------------|
| `/provider/support` | `ProviderSupportHome` | Today's blockers, holds/payout status summary, disputes needing input |
| `/provider/support/tickets/:ticketId` | `ProviderSupportTicketDetail` | Structured claim view, evidence, acknowledge/upload/request review/statement |

**Provider actions (bounded, no chat):**
- Acknowledge claim
- Upload evidence (photos)
- Request review (from reason list)
- Short statement (character-limited, 300 chars)

**Admin pages:**

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/support` | `AdminSupportDashboard` | Queue tabs: Needs review, Damage/safety, Chargeback risk, Provider dispute, Fraud/repeat, SLA breach. Each row shows type, severity, zone, provider, AI summary, recommended action, one-tap buttons |
| `/admin/support/tickets/:ticketId` | `AdminSupportTicketDetail` | Full timeline, all evidence, approve/apply resolution, issue credit/refund, create redo intent, flag risk, apply/release hold. Reason code required for every action |
| `/admin/support/policies` | `AdminSupportPolicies` | Policy list with versions, diff view, publish/rollback, change reason. Policy preview simulator |
| `/admin/support/macros` | `AdminSupportMacros` | CRUD macros, preview effect, apply to scope |

---

### Phase 4: Policy Engine + AI Assist

**Policy engine (the "dials"):**
- Scope precedence resolver: provider -> SKU -> category -> zone -> global
- Returns: matched policy version, scope chain, allowed offers, caps, evidence requirements
- Adjustable dials per scope: outcomes allowed, credit tiers, redo controls, evidence rules, abuse controls, SLAs, generosity slider
- Policy preview simulator: input scenario parameters, see what offers would appear, cost estimate, scope chain explanation

**AI assist (edge function):**
- Classify ticket type and severity
- Summarize evidence and history
- Compute evidence score and risk score
- Recommend resolution tier (policy decides final outcome)
- Detect duplicates and repeat patterns
- Uses Lovable AI (gemini-2.5-flash) — no API key needed

**Automations:**
- Evidence replay: auto-select best photos, show checklist + timestamps
- Chargeback intercept: show proof + offer cheaper off-ramps before escalation
- Duplicate suppression: detect and link to existing open ticket
- SLA timers: auto-escalate or auto-close based on policy

---

## Route Changes in App.tsx

Add these new routes:

```text
Customer:
  /customer/support/new
  /customer/support/tickets
  /customer/support/tickets/:ticketId

Provider:
  /provider/support
  /provider/support/tickets/:ticketId

Admin:
  /admin/support/tickets/:ticketId
  /admin/support/policies
  /admin/support/macros
```

The existing `/customer/support` and `/admin/support` routes already exist but will point to new components replacing the placeholders.

---

## Files Summary

| Category | Files |
|----------|-------|
| Doc update | `docs/modules/12-support-and-disputes.md` |
| Database | 1 SQL migration (8 tables + RLS + enums) |
| Hooks | `useSupportTickets`, `useSupportTicketDetail`, `useCreateTicket`, `useTicketActions`, `useSupportPolicies`, `useSupportMacros` |
| Customer pages | `SupportHome`, `SupportNew`, `SupportTickets`, `SupportTicketDetail` |
| Customer components | `SupportCategoryTile`, `EvidenceReplay`, `ResolutionOfferCard`, `TicketStatusChip` |
| Provider pages | `ProviderSupportHome`, `ProviderSupportTicketDetail` |
| Admin pages | `AdminSupportDashboard`, `AdminSupportTicketDetail`, `AdminSupportPolicies`, `AdminSupportMacros` |
| Edge function | `support-ai-classify` (ticket classification + evidence scoring) |
| App.tsx | New route registrations |

## Build Order

Phase 1 first (database + hooks), then Phase 2 (customer UI) since that's the highest-value user flow. Phase 3 (provider + admin) next. Phase 4 (policy engine + AI) last since the UI can work with sensible defaults before the full engine is wired up.

