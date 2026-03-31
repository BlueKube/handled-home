# README — Using this Repo Workflow with AI Agents

This repo uses a spec-first development methodology. Define the product clearly before writing a line of code, use structured documents as the canonical source of truth, and let AI agents execute against those documents. The better the upstream spec, the better the downstream code.

## The Core Idea

Don't start building from vague ideas, scattered chats, or half-formed assumptions.

Define the product first. Write the right documents. Use those documents as canonical truth. Then plan and build.

This process improves product clarity, team alignment, AI coding performance, scope control, and iteration speed.

## Key Terms

| Term | What it means |
|------|--------------|
| **Round** | One complete execution of a `FULL-IMPLEMENTATION-PLAN.md` — a top-to-bottom build or refresh of the app. Round 1 builds the foundation. Subsequent rounds polish, harden, add features, and improve. Large-scope: runs for hours or days. |
| **Phase** | A logical group of related work within a round. Each phase is a self-contained PRD (problem, goals, scope, deliverables) written as a section in the implementation plan. |
| **Batch** | The smallest unit of work. 1 theme, 1-3 files. Gets a spec written before coding, an implementation, and a review cycle. |
| **Step** | A procedure in `WORKFLOW.md` (Step 0-8). Describes *how* to execute, not *what* to build. |

## What's In This Repo

| File | Purpose | Customize? |
|------|---------|-----------|
| `CLAUDE.md` | Universal AI agent instructions — review process, session management, invariants | Sections 12-13 only |
| `WORKFLOW.md` | Implementation plan to production execution procedure | No |
| `lessons-learned.md` | Accumulated learnings and rules from past sessions | Append only |
| `DEPLOYMENT.md` | Deployment guide template (Supabase + Lovable) | Yes — fill in per project |
| `.claude/settings.json` | Hook configuration for automated enforcement | Adjust checks as needed |
| `.claude/hooks/stop-check.sh` | Stop hook — checks for API keys, stale files, oversized components | Adjust thresholds as needed |
| `docs/working/` | Active plan and batch specs (empty — ready for first phase) | Created during execution |
| `docs/upcoming/TODO.md` | Human action items template | Fill in during execution |
| `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` | Round scope — phases (PRDs) + deliverables | Fill in per round |

## How It Works at a Glance

### 1. Define
Create the three core product-definition documents outside the repo, using a Define Agent. These capture strategy, capabilities, and user flows before any implementation work begins.

### 2. Plan a Round
Write a `FULL-IMPLEMENTATION-PLAN.md` that scopes the entire round. Break it into phase sections, where each phase is a self-contained PRD with problem, goals, scope, and deliverables. Place it at `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`.

### 3. Build
An Implementation Agent works through each phase, decomposing it into batches. For each batch: write a spec before touching code, implement, run code review agents, fix findings, push. Repeat until the phase is done, then move to the next phase.

### 4. Iterate (Next Round)
When the round is complete, review what was built. Identify features that need polish, hardening, new capabilities, or updates. Write a new `FULL-IMPLEMENTATION-PLAN.md` for the next round. Each round is a full top-to-bottom refresh that builds on the previous round's work.

## The Three Core Documents

These live in `docs/` and are required before implementation begins.

### docs/masterplan.md — Product Blueprint
The top-level strategic definition of the product.

**Include:** Product thesis and vision, Target users and core roles, Major workflows and feature areas, Business model and monetization, Permission and governance model, Constraints, risks, success metrics

**Don't Include:** Detailed feature-by-feature behavior, Full screen inventories, Implementation plans, Deep technical architecture

### docs/feature-list.md — Capability Inventory
The canonical list of what the product can do, organized by category and priority.

**Include:** Feature taxonomy and status model, Feature table (ID, name, category, status, role, summary, related flows), MVP feature set, Feature dependencies and prioritization

**Don't Include:** Full implementation detail, Acceptance criteria for every feature, Deep rule logic, Detailed UX flow definitions

### docs/screen-flows.md — User Flows
The canonical map of how users move through the product.

**Include:** Flow catalog with descriptions, Detailed flow definitions with steps, Screen inventory within each flow, Alternate and failure paths, MVP flow set, UX risks and gaps

**Don't Include:** High-fidelity visual design spec, Engineering state machine logic, Detailed implementation requirements

## The Five AI Agent Roles

| Role | Model | Responsibility |
|------|-------|---------------|
| Define Agent | GPT or Claude | Brainstorms and builds the three core docs |
| Planning Agent | Claude Code (Opus) | Reads core docs + phase section, produces plan.md with batches |
| Implementation Agent | Claude Code (Opus) | Executes the plan batch by batch |
| Review Agents | Sonnet (1-5 agents) | Code review after each batch, tiered by size (Micro/Small/Medium/Large) |
| Orchestration Agent | Human + periodic AI | Maintains quality and directs the system |

## Getting Started

1. **Start with an idea.** Write a rough description of the app.
2. **Use the Define Agent** to build the three core docs (Draft, Critique, Revise cycle).
3. **Review and tighten them** as a human.
4. **Set up this repo structure.** Clone the starter kit.
5. **Write your first implementation plan.** Create `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` with phase sections scoping the full Round 1 build. Or ask Claude Code to help brainstorm it based on the 3 core documents.
6. **Hand off to Claude Code.** The agent decomposes the first phase into batches in `plan.md`, then begins batch execution.
7. **After the round is complete,** review what was done, what worked, and what can improve. Write a new `FULL-IMPLEMENTATION-PLAN.md` for the next round.

## The Round Cycle

```
Round 1: Build the foundation
  Phase 1 → Phase 2 → ... → Phase N → Round Cleanup → PR

Round 2: Polish, harden, add features
  Phase 1 → Phase 2 → ... → Phase N → Round Cleanup → PR

Round 3: Scale, optimize, expand
  Phase 1 → Phase 2 → ... → Phase N → Round Cleanup → PR
```

Each round gets better because `lessons-learned.md` accumulates what worked and what didn't. The workflow documents (`CLAUDE.md`, `WORKFLOW.md`) evolve based on real execution data.

## Common Mistakes

1. Starting implementation before the docs are ready
2. Letting masterplan.md absorb everything
3. Treating feature-list.md like a brainstorm dump
4. Making screen-flows.md too vague
5. Duplicating truth across documents
6. Trusting AI output without critique

## Per-Project Customization

### Must customize
- **CLAUDE.md Section 12 (Commands)** — replace with your project's dev/build/test commands
- **CLAUDE.md Section 13 (Conventions)** — replace with your project's file structure and patterns
- **DEPLOYMENT.md** — fill in project-specific migrations, env vars, verification steps
- **README.md** — replace this file with your project's README

### Keep universal
- Everything else in CLAUDE.md (Sections 1-11, 14+)
- WORKFLOW.md (entire file)
- lessons-learned.md (append new learnings, never delete old ones)
- .claude/settings.json and hooks (adjust thresholds, don't remove checks)

### First session in a new project
After copying these files, tell the agent:
> Read CLAUDE.md, WORKFLOW.md, and lessons-learned.md. This is a new project. Create the three core documents (masterplan.md, feature-list.md, screen-flows.md), then we'll brainstorm the first round.
