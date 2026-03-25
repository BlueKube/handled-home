# Spec Builder — Screen Flows

## Auth Pages

### Login (`/login`)

**Layout:**
- Centered card (max-width 400px) on background
- Logo + app name at top
- Email input + password input
- "Log in" button (accent, xl)
- "Forgot password?" link below
- Divider with "or"
- "Sign in with GitHub" button (outline, xl)
- "Don't have an account? Sign up" link at bottom

**States:**
- Default: Empty form
- Loading: Button shows spinner, inputs disabled
- Error: Inline error message below form (red text)

### Signup (`/signup`)

**Layout:**
- Same centered card pattern as login
- Full name + email + password + confirm password inputs
- "Create account" button (accent, xl)
- GitHub OAuth option
- "Already have an account? Log in" link

### Forgot Password (`/forgot-password`)

**Layout:**
- Centered card
- "Reset your password" heading
- Email input
- "Send reset link" button
- Back to login link

**States:**
- Default: Empty form
- Success: "Check your email" message with envelope icon

### Reset Password (`/reset-password`)

**Layout:**
- Centered card
- New password + confirm password inputs
- "Reset password" button
- Auto-redirect to login on success

---

## Dashboard

### Project List (`/dashboard`)

**Layout:**
- Top bar: "Your Projects" heading (h1) + "New Project" button (accent, right-aligned)
- Grid of project cards (responsive: 1 col → 2 col → 3 col)
- Each project card shows:
  - Project name (h3)
  - Description (1 line, truncated)
  - Document chain health bar (colored segments: green/amber/gray)
  - Last edited timestamp
  - Team member avatars (stacked, max 4 + "+N")
  - Click → `/project/:id`

**Empty state:**
- `FolderOpen` icon (48px, muted)
- "No projects yet"
- "Create your first project to start building specs"
- "New Project" button (accent)

### Create Project (`/dashboard/new`)

**Layout:**
- Centered form card (max-width 560px)
- Step 1: Project name (input) + description (textarea)
- Step 2: Tech stack selection (multi-select chips: React, Vue, Next.js, etc.)
- Step 3: Which documents to start with (checkboxes, masterplan pre-checked)
- "Create Project" button
- Back to dashboard link

---

## Project Workspace

### Big Picture View (`/project/:id`)

**Layout:**
- **Left sidebar:** Document chain navigation (see app-flow doc for structure)
- **Main area:** Document dependency graph (React Flow)
  - Each document is a node with: icon + name + status badge
  - Arrows show derivation dependencies
  - Node colors: green (up to date), amber (stale), gray (not created), blue-dashed (pending changes)
  - Clicking a node navigates to that document's editor
- **Right panel** (1440px+ only, collapsible):
  - Recent persona suggestions (top 3–5)
  - Pending diffs summary (count per document)
  - "Generate All" button for initial setup
  - Quick stats: documents synced, pending changes, PRDs in queue

**Empty state (new project):**
- Graph shows all 7 nodes as gray "Not created"
- Masterplan node is highlighted with a pulsing blue border
- Center message: "Start with your masterplan — everything else derives from it"
- Arrow pointing to masterplan node

**Stale state (after upstream edit):**
- Upstream document shows green with checkmark
- Affected downstream documents show amber with warning icon
- Arrows between stale pairs pulse with amber color
- Floating action: "Sync N documents" button

### Document Editor (`/project/:id/document/:docType`)

**Layout:**
- **Top bar:** Document title + status badge + "Generate" button (if dependencies exist) + "History" button + "Diff" button
- **Editor area:** Full-width Tiptap rich editor (centered, max-width 800px)
  - Markdown shortcuts supported
  - Toolbar: headings, bold, italic, code, lists, links, tables
  - If pending AI suggestions exist, they appear inline as dashed-border blocks with accept/reject controls
- **Bottom bar:** Save status ("Saved" / "Saving..." / "Unsaved changes"), word count

**States:**
- Editing: Full editor with toolbar
- Read-only (Viewer role): Editor disabled, no toolbar, "Read only" badge
- Generating: Skeleton shimmer over editor, "Generating..." status in top bar
- With suggestions: Inline suggestion blocks (persona-colored left border)

### Document Diff View (`/project/:id/document/:docType/diff`)

**Layout:**
- **Top bar:** Document title + "Unified" / "Split" toggle + "Accept All" / "Reject All" buttons
- **Diff area:**
  - **Unified mode:** Single column, additions in green bg, deletions in red bg with strikethrough
  - **Split mode:** Two columns — left (original), right (proposed) — with line-by-line alignment
  - Line numbers in gutter (monospace, muted)
  - Unchanged lines shown as context (3 lines above/below, collapsible)
  - Each change chunk has Accept / Reject buttons in the gutter
- **Bottom bar:** "N additions, M deletions" summary

### Persona Suggestions Feed (`/project/:id/personas`)

**Layout:**
- **Top bar:** "AI Advisors" heading + persona toggle switches (one per persona, with persona icon + color)
- **Filter bar:** All | Visionary | Engineer | PM | Auditor tabs
- **Suggestion list:** Vertical feed of suggestion cards
  - Each card: persona avatar (colored circle + icon) + persona name + suggestion type tag
  - Body: 2–4 sentence suggestion
  - Footer: which document it relates to (linked) + timestamp
  - Actions: "Accept" (success ghost) | "Reject" (ghost) | "Edit" (ghost) | "Create PRD" (accent ghost) | "Save for later" (ghost)
- **Backlog section:** Collapsed accordion at bottom with saved-for-later suggestions

**Empty state:**
- `Sparkles` icon
- "No suggestions yet"
- "Suggestions appear as you create and edit documents. Make sure at least one persona is enabled."

### PRD Queue (`/project/:id/prds`)

**Layout:**
- **Top bar:** "PRDs" heading + "Generate PRD from changes" button (accent)
- **Change summary panel:** Compact view of accumulated diffs since last PRD (count of changes per document, expandable)
- **PRD list:** Vertical list of PRD cards
  - Each card: PRD title + status badge (DRAFT/QUEUED/IN PROGRESS/COMPLETE) + created date
  - Drag handle for reordering (Owner/Editor only)
  - Click → PRD editor
- **Status filter:** All | Draft | Queued | In Progress | Complete tabs

**Empty state:**
- `FileText` icon
- "No PRDs yet"
- "Generate a PRD from your accumulated document changes, or create one manually"
- "Generate PRD" button

### PRD Editor (`/project/:id/prds/:prdId`)

**Layout:**
- **Top bar:** PRD title (editable) + status dropdown + "Export" button (accent)
- **Structured sections** (each collapsible):
  - Problem Statement (textarea)
  - Goals (textarea)
  - Scope — inclusions and exclusions (two-column textarea)
  - User Stories (list editor)
  - Acceptance Criteria (checklist editor)
  - Phases (ordered list with drag reorder)
  - Constraints (textarea)
  - Priority (High / Medium / Low selector)
- **Right sidebar** (collapsible):
  - PM persona suggestions for this PRD
  - Referenced documents (linked)
  - Export preview (markdown rendering)

### Project History (`/project/:id/history`)

**Layout:**
- **Top bar:** "History" heading + document filter dropdown
- **Timeline:** Vertical timeline of all changes
  - Each entry: timestamp + user avatar + action description + document link
  - Actions: "Edited masterplan", "Generated design-guidelines", "Accepted Visionary suggestion", "Exported PRD #3"
  - Expandable to show the diff for that change

### Project Settings (`/project/:id/settings`) — Owner only

**Layout:**
- **Section: General** — Project name, description, tech stack (editable)
- **Section: Personas** — Enable/disable each persona, customize trigger sensitivity
- **Section: Team** — Member list with role badges, invite button, remove member
- **Section: Danger Zone** — Archive project, delete project (with confirmation modal)

---

## Account Settings

### Account Settings (`/settings`)

- Profile section: name, email, avatar upload
- Password change
- Connected accounts (GitHub OAuth)
- Session management

### Team Management (`/settings/team`) — Owner only

- Team member list with roles
- Invite by email
- Change roles
- Remove members

### Billing (`/settings/billing`) — Owner only

- Current plan display
- Usage stats (AI generations this month, projects, team size)
- Upgrade/downgrade plan
- Payment method management
- Invoice history
