# Bootstrap a New App with the PRD-to-Production Workflow

*From a single masterplan to a fully instrumented repo — ready for autonomous batch execution.*

---

## Overview

This guide walks you through setting up a new application from scratch using the PRD-to-Production workflow. You start with one document (the masterplan), and each subsequent document is derived from the ones before it — creating a domino chain where AI generates 90% of the scaffolding and humans review and tune.

**End state:** A repo with 6 north star documents, a working folder structure, the portable workflow skill, and a first PRD queued — ready to start shipping batches.

## The Domino Chain

```
masterplan.md (human writes this)
    |
    v
CLAUDE.md + project scaffold
    |
    v
design-guidelines.md (derived from masterplan)
    |
    v
app-flow-pages-and-roles.md (derived from masterplan)
    |
    v
screen-flows.md (derived from app-flow + design guidelines)
    |
    v
feature-list.md (extracted from masterplan + screen-flows)
    |
    v
operating-model.md (derived from masterplan)
    |
    v
prd-to-production-workflow.md (copied — this is portable)
    |
    v
First PRD --> docs/upcoming/001-xxx.md
    |
    v
Ready to run.
```

## The Dependency Graph

```
                    masterplan.md (human)
                         |
              +----------+----------+
              v          v          v
         CLAUDE.md   operating-   app-flow-
              |      model.md    pages-roles.md
              v                      |
        design-                      |
      guidelines.md                  |
              |          +-----------+
              v          v
          screen-flows.md
              |
              v
         feature-list.md
```

---

## Step 0: Write the Masterplan

**HUMAN** — This is the one document AI cannot write for you.

**File:** `docs/masterplan.md`

Your masterplan needs to cover:

- **Problem statement** — What pain exists? Who feels it?
- **Target users** — Who are the primary personas?
- **Value proposition** — Why would someone choose this over alternatives?
- **User roles** — What distinct roles exist in the system?
- **Business model** — How does money flow in?
- **Core features** — Even a rough list is fine
- **Tech stack preferences** — Framework, styling, database, hosting
- **Growth strategy** — Acquisition channels, flywheels

> **Quality bar:** It doesn't need to be polished. It needs to be specific enough that AI can decompose it into phases and derive the other documents from it.

---

## Step 1: Scaffold the Repo

**HUMAN** — Run a few CLI commands to create the project.

```bash
mkdir my-app && cd my-app
git init
npm create vite@latest . -- --template react-ts
# Install your stack (tailwind, shadcn, supabase, etc.)
```

Create the document folder structure:

```
docs/
  masterplan.md          <-- your document from Step 0
  skills/
  upcoming/
  working/
    batch-specs/
  archive/
```

---

## Step 2: AI Generates `CLAUDE.md`

**AI** — The project instruction file — Claude's operating manual for this repo.

**Prompt to Claude:**

> Read `docs/masterplan.md`. Generate a `CLAUDE.md` project guide covering: project overview, tech stack, project structure (anticipated), design system tokens (derive from the product's personality — premium? playful? clinical?), UX principles, git workflow, conventions, and commands.

**Why AI can do this:** The masterplan describes the product, users, and tone. That's enough to derive sensible defaults for design tokens, folder structure, and conventions. You'll tune it later — but the first draft is 80% right.

**What the human does:** Review for ~10 minutes. Adjust colors, fonts, or conventions to taste.

---

## Step 3: AI Generates `docs/design-guidelines.md`

**AI** — The full design system — how the product looks and feels.

**Prompt to Claude:**

> Read `docs/masterplan.md` and `CLAUDE.md`. Generate `docs/design-guidelines.md` — the full design system. Derive: color palette (from the product's personality and target audience), typography scale, spacing system, component specs (buttons, inputs, cards, badges), icon system, animation patterns, mobile/desktop rules, accessibility standards. Reference the tech stack in CLAUDE.md for implementation details (e.g., Tailwind classes, CSS custom properties).

**Why this works:** A "managed home services platform for homeowners" implies trustworthy (navy/blue), clean (white space), premium but approachable. A "gaming social network for teens" would produce completely different tokens. The masterplan's *who* and *what* drive the *how it looks*.

---

## Step 4: AI Generates `docs/app-flow-pages-and-roles.md`

**AI** — The structural map — every route, page, and access gate.

**Prompt to Claude:**

> Read `docs/masterplan.md`. Generate `docs/app-flow-pages-and-roles.md`. Extract every user role. For each role, define: their route tree (every page they'd need), role gates, and primary user journeys (numbered steps with route paths). Include auth pages, onboarding, settings, and error pages.

**Why this works:** The masterplan lists roles and features. Roles + features = pages. Pages + roles = route tree + access control. This is mechanical derivation.

---

## Step 5: AI Generates `docs/screen-flows.md`

**AI** — What every screen contains — layouts, components, states.

**Prompt to Claude:**

> Read `docs/masterplan.md`, `docs/app-flow-pages-and-roles.md`, and `docs/design-guidelines.md`. Generate `docs/screen-flows.md`. For every page in the app-flow doc, describe: layout (header, content sections, action bars), which components it uses, navigation behavior, empty state, loading state. Group by role. Use the component specs from design-guidelines.md.

**Why this comes after app-flow:** You need the page inventory before you can describe each page. And you need design guidelines to know *what components exist* to reference.

---

## Step 6: AI Generates `docs/feature-list.md`

**AI** — The capability ledger — every feature, numbered and tagged.

**Prompt to Claude:**

> Read `docs/masterplan.md` and `docs/screen-flows.md`. Generate `docs/feature-list.md`. Extract every feature (numbered), mark all as PLANNED, tag each with a strategic category (growth-driver, retention, trust-builder, margin-lever, table-stakes). Group by functional area.

**Why this is late in the chain:** Screen-flows often surface features the masterplan implied but didn't explicitly list (e.g., "the settings page needs notification preferences" — that's a feature). Doing this after screen-flows gives a more complete inventory.

---

## Step 7: AI Generates `docs/operating-model.md`

**AI** — The business math — revenue, costs, thresholds, rules.

**Prompt to Claude:**

> Read `docs/masterplan.md`. Generate `docs/operating-model.md`. Define: revenue model (specific pricing if stated, placeholder ranges if not), cost structure, unit economics framework, margin targets, success metric thresholds (churn, retention, conversion — use industry benchmarks for the vertical if specifics aren't in the masterplan), risk triggers, and operational rules (payment retry, dunning, suspension policies).

**Why AI can do this:** Industry benchmarks exist for most verticals. A home services subscription platform has known churn ranges (5-8% monthly), known conversion benchmarks, known margin structures. AI fills in reasonable defaults; the human tunes the numbers.

---

## Step 8: Copy the Workflow Doc

**HUMAN** — One file copy — this document is portable across projects.

```bash
cp reference/prd-to-production-workflow.md docs/skills/prd-to-production-workflow.md
```

Adapt the review lane descriptions if your project has unique concerns (security-heavy, i18n, etc.), but the structure is project-agnostic.

---

## Step 9: Write the First PRD

**HUMAN or AI** — Your first implementation target.

```
docs/upcoming/001-core-scaffold-and-auth.md
```

The first PRD is typically: project scaffold, auth flow, role routing, and the shell pages for each role. The human can write this, or ask AI to draft it from the masterplan's priority ordering.

---

## Step 10: Start the Loop

```bash
cp docs/upcoming/001-core-scaffold-and-auth.md docs/working/prd.md
```

You're now in **Phase 1** of the PRD-to-Production workflow: PRD → Plan → Batches → Ship.

From here, the workflow runs on its own — either manually, via Claude Code Scheduled Tasks, or via the Agent SDK on a VPS.

---

## Summary: What the Human Actually Does

| Step | Who | Human Effort |
|------|-----|-------------|
| 0. Masterplan | Human | **Write it** (the real work) |
| 1. Scaffold | Human | Run 3-4 CLI commands |
| 2. CLAUDE.md | AI → Human | Review and tune (~10 min) |
| 3. Design guidelines | AI → Human | Review and tune (~10 min) |
| 4. App flow & roles | AI → Human | Review and tune (~10 min) |
| 5. Screen flows | AI → Human | Review and tune (~10 min) |
| 6. Feature list | AI → Human | Review and tune (~10 min) |
| 7. Operating model | AI → Human | Review and tune (~10 min) |
| 8. Workflow doc | Human | Copy one file |
| 9. First PRD | Human or AI | Write or review the draft |
| 10. Start | Human | One copy command, then the loop runs |

**Total human effort:** Writing the masterplan + ~1 hour reviewing 6 AI-generated docs + writing the first PRD. Everything else is derived.

---

## Final Repo Structure

```
my-app/
  CLAUDE.md
  docs/
    masterplan.md
    operating-model.md
    screen-flows.md
    design-guidelines.md
    app-flow-pages-and-roles.md
    feature-list.md
    skills/
      prd-to-production-workflow.md
    upcoming/
      001-core-scaffold-and-auth.md
    working/
      batch-specs/
    archive/
  src/
    ... (scaffolded by Vite + your stack)
```
