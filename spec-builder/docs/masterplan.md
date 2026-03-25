# Spec Builder — Masterplan

## Problem Statement

Building software with AI coding agents (Claude Code, Cursor, Copilot Workspace) is fast — but only when the agent knows *what* to build. The bottleneck has shifted from implementation to specification. Teams that feed AI agents vague instructions get vague code. Teams that feed them precise, structured documentation — masterplans, design systems, screen flows, feature lists, operating models — get production-quality code in hours instead of weeks.

The problem: **creating and maintaining that documentation is manual, tedious, and fragile.** Today's workflow looks like this:

1. Someone writes a masterplan in a markdown file
2. They manually prompt an AI to derive each downstream document (design guidelines, app flow, screen flows, feature list, operating model) one at a time
3. Documents drift out of sync as the codebase evolves
4. Nobody knows which document a change impacts — so updates get skipped
5. PRDs are written ad-hoc, disconnected from the living documentation
6. By the time the third PRD ships, the docs describe a different product than what was built

This creates a death spiral: stale docs → bad AI context → wrong code → more drift → worse docs.

**Spec Builder solves this by making the documentation layer a first-class product** — a living, AI-assisted workspace where specs are authored, derived, kept in sync, and turned into implementation-ready PRDs that feed directly into coding agents.

---

## Target Users

### Primary: Small Dev Teams Using AI Coding Agents

- 1–10 person teams building products with Claude Code, Cursor, or similar AI-assisted development tools
- Already experiencing the "garbage in, garbage out" problem with AI code generation
- Know they need better specs but don't have time to maintain 6+ markdown files manually
- Value speed but have been burned by shipping incomplete or inconsistent features

### Secondary: Solo Developers / Indie Hackers

- Building multiple apps simultaneously (the "app-a-week" crowd)
- Need a repeatable system to go from idea → structured docs → shipping code
- Currently copy-pasting CLAUDE.md files between projects and losing track of what's current

### Tertiary: Technical Product Managers

- Responsible for writing specs that developers (human or AI) implement
- Want a structured authoring environment instead of Google Docs or Notion
- Need visibility into how specs connect to each other and to the codebase

---

## Value Proposition

**"Your ideas, structured. Your docs, alive. Your agents, informed."**

Spec Builder is the documentation IDE for AI-native development teams. Write your masterplan once — Spec Builder derives the rest, keeps everything in sync, and generates PRDs your coding agents can execute.

### Why this wins over alternatives

| Alternative | Limitation | Spec Builder advantage |
|---|---|---|
| Manual markdown files | Drift, no derivation chain, no sync | Automated derivation + living sync |
| Notion / Google Docs | No document dependency graph, no AI derivation, no PRD pipeline | Purpose-built for the spec → PRD → code workflow |
| AI chat (just prompting) | Stateless, no persistence, no cross-document awareness | Persistent workspace with full project context |
| Cursor / Claude Code alone | Great at coding, bad at maintaining specs | Spec Builder feeds *into* coding agents — complementary, not competing |

---

## User Roles

### 1. Owner
- Creates projects, invites team members
- Full read/write access to all documents and settings
- Manages AI persona preferences and project configuration
- Can archive projects and manage billing

### 2. Editor
- Full read/write access to all documents
- Can generate AI derivations and create PRDs
- Can accept/reject AI suggestions
- Cannot manage project settings or billing

### 3. Viewer
- Read-only access to all documents
- Can view diffs, history, and AI suggestions
- Cannot edit or generate content
- Useful for stakeholders who need visibility without edit access

---

## Core Concepts

### The Document Chain (Domino Chain)

Every project has a set of **living documents** organized in a dependency graph. Changes cascade downstream:

```
masterplan.md (human writes this)
    ↓
CLAUDE.md + project scaffold instructions
    ↓
design-guidelines.md (derived from masterplan)
    ↓
app-flow-pages-and-roles.md (derived from masterplan)
    ↓
screen-flows.md (derived from app-flow + design guidelines)
    ↓
feature-list.md (extracted from masterplan + screen-flows)
    ↓
operating-model.md (derived from masterplan)
```

When a user edits the masterplan, Spec Builder identifies which downstream documents are affected and suggests updates — with diffs showing exactly what changed.

### The Big Picture View

A project-level dashboard that shows the entire document chain at a glance:
- Which documents are up to date vs. stale
- A dependency graph visualization showing how documents connect
- Pending diffs (green/red, IDE-style) for suggested changes
- One-click to drill into any document

This is the "control room" — the user never needs to know *which* document a change impacts. They make a change, and Spec Builder shows them everywhere it ripples.

### AI Personas

Four distinct AI advisory personas that offer different perspectives on the documentation. Each can be toggled on/off per project. They surface suggestions in a visual feed that can be selected and incorporated into documents with one click.

#### The Visionary (default: on)
- **Personality:** An excited co-founder who sees possibilities everywhere
- **Focus:** New features, growth opportunities, "what if we also..." ideas
- **Tone:** Enthusiastic, ambitious, forward-looking
- **Trigger:** Activates when documents are created or updated — brainstorms adjacent features, expansion opportunities, and "wouldn't it be cool if..." ideas
- **Risk:** Can encourage scope creep — that's why the other personas exist as counterweights

#### The Engineer (default: on)
- **Personality:** A pragmatic senior engineer who's seen projects go sideways
- **Focus:** Technical feasibility, implementation complexity, architectural risks
- **Tone:** Careful, specific, grounded in reality
- **Trigger:** Activates when features are added or scope changes — flags complexity cliffs, architectural concerns, and "this sounds simple but requires rebuilding X" warnings
- **Catchphrase energy:** "Before we change the business model, let's talk about what that means for the 47 components that depend on the current pricing structure."

#### The Project Manager (default: on)
- **Personality:** An organized, timeline-conscious PM who keeps things shipping
- **Focus:** Prioritization, sequencing, scope management, "what ships first"
- **Tone:** Pragmatic, organized, delivery-focused
- **Trigger:** Activates when features accumulate or PRDs are created — suggests ordering, batching, what to defer, what to ship now
- **Catchphrase energy:** "Love the idea. Let's put it in the backlog and ship what we have first."

#### The Auditor (default: on)
- **Personality:** A detail-oriented QA lead who looks backward at what exists
- **Focus:** Gaps between documentation and codebase, missing user flows, dead ends, inconsistencies
- **Tone:** Thorough, specific, evidence-based
- **Trigger:** Activates when codebase analysis is available — compares docs against what's actually built and flags discrepancies
- **Catchphrase energy:** "There's no way for the user to get to settings from the home page. We should make a PRD for that."
- **Requires:** Git repo connection or codebase snapshot to analyze

### Diff-Based Change Tracking

Every document change — whether human-authored or AI-suggested — is tracked with IDE-style diffs:
- **Green highlights:** Added content
- **Red highlights:** Removed content
- **Inline diffs** within the document editor
- **Cross-document diffs** in the big picture view showing cascade effects
- **Pending vs. accepted:** AI suggestions appear as pending diffs that can be accepted, rejected, or edited before committing
- **History timeline:** Full version history for every document with diff between any two versions

These diffs are also the **input to coding agents** — when it's time to create a PRD for implementation, the accumulated accepted diffs since the last PRD become the scope.

### PRD Generation Pipeline

The path from documentation changes to implementation-ready PRDs:

1. **Accumulate changes** — Edits and accepted suggestions create a growing diff
2. **Review scope** — User reviews accumulated changes in the diff view
3. **Generate PRD** — AI drafts a PRD from the accepted diffs, referencing the full document context
4. **Refine** — User (with persona assistance) refines the PRD scope, acceptance criteria, and priority
5. **Export** — PRD is exported as a markdown file ready for the `docs/upcoming/` queue in any project using the PRD-to-Production workflow
6. **Track** — PRD status is tracked: DRAFT → QUEUED → IN PROGRESS → COMPLETE → ARCHIVED

---

## Business Model

### Freemium SaaS

**Free tier:**
- 1 project
- 1 user
- Full document chain (all 7 document types)
- AI derivation (limited: 20 generations/month)
- No personas
- No codebase connection

**Pro tier — $29/user/month:**
- Unlimited projects
- AI derivation (unlimited)
- All 4 AI personas
- Diff tracking and history
- PRD generation pipeline
- Git repo connection (for Auditor persona)
- Export to markdown / GitHub

**Team tier — $49/user/month:**
- Everything in Pro
- Team collaboration (up to 25 users)
- Role-based access (Owner / Editor / Viewer)
- Project templates
- Shared persona configurations
- Priority support

**Enterprise — custom pricing:**
- SSO / SAML
- Audit logs
- Custom personas
- Self-hosted option
- Dedicated support

### Revenue drivers
- Per-seat pricing scales with team size
- AI persona feature is the primary upgrade trigger (free → Pro)
- Team collaboration is the Pro → Team upgrade trigger
- Stickiness comes from the living document graph — once your docs are in Spec Builder, switching costs are high

---

## Core Features

### Phase 1: Foundation
1. **Project creation** — Name, description, tech stack selection
2. **Masterplan editor** — Rich markdown editor for the foundational document
3. **AI document derivation** — Generate each downstream document from its dependencies in the chain
4. **Document chain visualization** — Dependency graph showing all 7 documents and their relationships
5. **Basic diff tracking** — Green/red inline diffs for all document changes

### Phase 2: Intelligence
6. **AI personas** — The four advisory personas with toggleable suggestions
7. **Suggestion feed** — Visual feed of persona suggestions with accept/reject/edit actions
8. **Cross-document impact analysis** — When a document changes, highlight which downstream documents are affected
9. **Smart sync** — AI-powered suggestions for updating downstream documents when upstream changes are accepted
10. **Version history** — Full timeline for every document with diff between any two versions

### Phase 3: PRD Pipeline
11. **Change accumulator** — Track accepted diffs since last PRD
12. **PRD generator** — AI drafts PRDs from accumulated changes + full project context
13. **PRD editor** — Structured editor for PRD refinement (scope, acceptance criteria, phases)
14. **PRD queue management** — Ordered backlog with drag-to-reorder
15. **Export to markdown** — One-click export for `docs/upcoming/` integration

### Phase 4: Codebase Connection
16. **Git repo linking** — Connect a GitHub repo to the project
17. **Codebase analysis** — AI reads the codebase to understand what's actually built
18. **Auditor persona activation** — Compare docs vs. code and surface gaps
19. **Implementation status sync** — Auto-update feature list status based on code analysis
20. **Bi-directional sync** — Pull codebase changes back into documentation updates

### Phase 5: Collaboration & Scale
21. **Team invitations** — Invite users with role-based access
22. **Real-time collaboration** — Multiple editors on the same document
23. **Comment threads** — Inline comments on any document section
24. **Project templates** — Start new projects from saved configurations
25. **Notification system** — Alerts for document changes, persona suggestions, PRD status changes

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React 18 + TypeScript + Vite | Fast builds, type safety, modern DX |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Rapid UI development, consistent design system |
| **State/Data** | TanStack React Query + Supabase | Real-time subscriptions, auth, DB, edge functions |
| **Routing** | React Router DOM 7 | Standard SPA routing |
| **Rich Editor** | Tiptap (ProseMirror) | Extensible markdown/rich-text editor with collaboration support |
| **Diff Rendering** | Monaco Editor (diff view) or custom diff component | IDE-grade diff visualization |
| **AI Integration** | Anthropic Claude API (via Supabase Edge Functions) | Best-in-class reasoning for document generation and personas |
| **Graph Visualization** | React Flow | Document dependency graph rendering |
| **Hosting** | Vercel | Easy deployment, edge functions, preview deployments |
| **Database** | Supabase (PostgreSQL + Auth + Realtime) | Already in use, real-time sync for collaboration |
| **Animation** | Framer Motion | Polished transitions and micro-interactions |
| **Icons** | Lucide React | Consistent icon set |

---

## Growth Strategy

### Acquisition Channels

1. **Developer content marketing** — Blog posts and videos showing the "before/after" of AI coding with and without structured specs. "Why your AI agent writes bad code (and how to fix it)."
2. **Open-source workflow docs** — The PRD-to-Production workflow and bootstrap guide are published as open-source templates. Spec Builder is the commercial tool that makes them effortless.
3. **Claude Code integration** — Deep integration with the Claude Code ecosystem. Spec Builder exports feed directly into Claude Code's `docs/upcoming/` queue.
4. **Template marketplace** — Pre-built document chains for common app types (SaaS, marketplace, mobile app, API). Lowers the barrier to starting.
5. **Word of mouth** — Teams that use Spec Builder ship faster and with fewer "wait, that's not what I meant" moments. That's the kind of result people share.

### Flywheels

1. **More docs → better AI suggestions → more docs accepted → richer project context → even better suggestions**
2. **More projects → more templates → easier onboarding → more projects**
3. **Team adoption → shared context → less rework → measurable time savings → team expansion**

### Long-term Vision

**Year 1:** Best-in-class documentation IDE for AI-native development. The tool every team uses *before* they open their coding agent.

**Year 3:** The standard "planning layer" for AI software development. Integrations with every major AI coding tool. Spec Builder becomes the Figma of software specs — where planning happens before building.

**At scale:** A platform where the full software lifecycle is managed through living documentation. Specs drive code, code informs specs, and the documentation is never stale because it's the control plane — not an afterthought.
