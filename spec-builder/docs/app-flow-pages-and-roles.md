# Spec Builder — App Flow, Pages & Roles

## Page Count Summary

| Section | Pages |
|---------|-------|
| Auth | 4 |
| Dashboard | 2 |
| Project Workspace | 8 |
| Settings | 4 |
| **Total** | **18** |

---

## User Roles & Access

| Route Pattern | Owner | Editor | Viewer | Unauth |
|---|---|---|---|---|
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | — | — | — | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/new` | ✅ | ❌ | ❌ | ❌ |
| `/project/:id` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/document/:docType` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/document/:docType/diff` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/personas` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/prds` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/prds/:prdId` | ✅ | ✅ | ✅ (read-only) | ❌ |
| `/project/:id/history` | ✅ | ✅ | ✅ | ❌ |
| `/project/:id/settings` | ✅ | ❌ | ❌ | ❌ |
| `/settings` | ✅ | ✅ | ✅ | ❌ |
| `/settings/team` | ✅ | ❌ | ❌ | ❌ |
| `/settings/billing` | ✅ | ❌ | ❌ | ❌ |

---

## Route Tree

```
/
├── /login
├── /signup
├── /forgot-password
├── /reset-password
├── /dashboard                          # Project list
│   └── /dashboard/new                  # Create new project (Owner only)
├── /project/:id                        # Project workspace — Big Picture View
│   ├── /project/:id/document/:docType  # Document editor
│   │   └── /project/:id/document/:docType/diff  # Diff view for a document
│   ├── /project/:id/personas           # Persona suggestions feed
│   ├── /project/:id/prds               # PRD queue
│   │   └── /project/:id/prds/:prdId    # PRD editor/viewer
│   ├── /project/:id/history            # Project-wide change history
│   └── /project/:id/settings           # Project settings (Owner only)
└── /settings                           # Account settings
    ├── /settings/team                   # Team management (Owner only)
    └── /settings/billing                # Billing (Owner only)
```

### Document types (`:docType` parameter)

| docType slug | Document |
|---|---|
| `masterplan` | Masterplan |
| `claude-md` | CLAUDE.md |
| `design-guidelines` | Design Guidelines |
| `app-flow` | App Flow, Pages & Roles |
| `screen-flows` | Screen Flows |
| `feature-list` | Feature List |
| `operating-model` | Operating Model |

---

## User Journeys

### Journey 1: New Project Setup (Owner)

1. User lands on `/dashboard`
2. Clicks "New Project" → `/dashboard/new`
3. Enters project name, description, tech stack preferences
4. Redirected to `/project/:id` — Big Picture View (empty state)
5. Clicks on "Masterplan" node in the document chain → `/project/:id/document/masterplan`
6. Writes or pastes the masterplan content
7. Saves → returns to Big Picture View
8. Sees downstream documents now show "Ready to generate" status
9. Clicks "Generate All" or generates one at a time
10. Each generation creates a document with a "Pending review" diff
11. Reviews and accepts diffs for each document
12. Project is now fully scaffolded with 7 living documents

### Journey 2: Edit a Document and See Cascade (Editor)

1. User is on `/project/:id` — Big Picture View
2. Sees all documents in the chain with green "Up to date" badges
3. Clicks on "Masterplan" → `/project/:id/document/masterplan`
4. Edits a section (e.g., adds a new user role)
5. Saves → returns to Big Picture View
6. Documents downstream of masterplan now show amber "Stale" badges
7. Clicks "Sync downstream" → AI generates update suggestions for affected docs
8. Each affected doc shows a pending diff (green/red highlights)
9. User clicks into each doc's diff view → `/project/:id/document/:docType/diff`
10. Reviews, accepts/rejects/edits each change
11. All badges return to green "Up to date"

### Journey 3: Review Persona Suggestions (Editor)

1. User is on `/project/:id` — Big Picture View
2. Notification badge shows "4 new suggestions" on the Personas tab
3. Clicks Personas → `/project/:id/personas`
4. Sees suggestion cards sorted by persona, each with a colored left border
5. Reads a Visionary suggestion: "What if we added a template marketplace?"
6. Clicks "Accept" → suggestion is incorporated as a pending diff in the relevant document
7. Reads an Engineer suggestion: "Adding real-time collab will require a CRDT library — significant complexity"
8. Clicks "Save for later" → moves to backlog
9. Reads an Auditor suggestion: "The feature list shows 'push notifications' as DONE but there's no notification settings page in screen-flows"
10. Clicks "Create PRD" → opens PRD editor pre-filled with the gap description

### Journey 4: Generate and Export a PRD (Editor)

1. User navigates to `/project/:id/prds`
2. Sees accumulated diffs since last PRD (change summary)
3. Clicks "Generate PRD from changes"
4. AI drafts a PRD with scope, acceptance criteria, phases — referencing all relevant documents
5. User refines in the PRD editor → `/project/:id/prds/:prdId`
6. PM persona offers sequencing suggestions inline
7. User finalizes and clicks "Export"
8. PRD is exported as a markdown file, ready for `docs/upcoming/` in the target repo
9. PRD status changes from DRAFT to QUEUED

### Journey 5: View Project as Viewer

1. Viewer lands on `/dashboard`, sees shared projects
2. Clicks a project → `/project/:id`
3. Sees Big Picture View with all document statuses
4. Can click into any document to read it (read-only mode, no edit controls)
5. Can view diffs and history but cannot accept/reject changes
6. Can view persona suggestions but cannot act on them

---

## Navigation Structure

### Sidebar (within project workspace)

```
[Project Name]
──────────────
📋 Big Picture          → /project/:id
──────────────
📖 Masterplan           → /project/:id/document/masterplan
📝 CLAUDE.md            → /project/:id/document/claude-md
🎨 Design Guidelines    → /project/:id/document/design-guidelines
🔀 App Flow             → /project/:id/document/app-flow
📱 Screen Flows         → /project/:id/document/screen-flows
✅ Feature List         → /project/:id/document/feature-list
💰 Operating Model      → /project/:id/document/operating-model
──────────────
✨ Personas             → /project/:id/personas
📄 PRDs                 → /project/:id/prds
📜 History              → /project/:id/history
⚙️ Settings             → /project/:id/settings
```

Each document entry shows a status indicator dot (green/amber/gray) inline.

### Top Bar

- Left: Back to dashboard (logo/home icon)
- Center: Current page breadcrumb (Project > Document > Diff)
- Right: User avatar, account dropdown
