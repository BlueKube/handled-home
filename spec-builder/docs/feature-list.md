# Spec Builder — Feature List

## Summary

- **Total features:** 48
- **Status:** All PLANNED (greenfield project)

---

## Authentication & Accounts

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 1 | Email/password signup and login | PLANNED | table-stakes |
| 2 | Password reset flow | PLANNED | table-stakes |
| 3 | OAuth login (GitHub) | PLANNED | growth-driver |
| 4 | Session management | PLANNED | table-stakes |
| 5 | Account settings (name, email, avatar) | PLANNED | table-stakes |

## Project Management

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 6 | Create new project (name, description, tech stack) | PLANNED | table-stakes |
| 7 | Project dashboard (list all projects) | PLANNED | table-stakes |
| 8 | Delete/archive project | PLANNED | table-stakes |
| 9 | Project templates (start from saved configs) | PLANNED | growth-driver |
| 10 | Duplicate project | PLANNED | retention |

## Document Chain

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 11 | Document chain visualization (dependency graph) | PLANNED | trust-builder |
| 12 | Big Picture View — project-level dashboard | PLANNED | trust-builder |
| 13 | Document staleness detection | PLANNED | trust-builder |
| 14 | Upstream change → downstream impact highlighting | PLANNED | trust-builder |
| 15 | "Generate All" — derive all downstream docs at once | PLANNED | margin-lever |
| 16 | Individual document generation from dependencies | PLANNED | table-stakes |
| 17 | Document dependency resolution (correct generation order) | PLANNED | table-stakes |

## Document Editor

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 18 | Rich markdown editor (Tiptap) | PLANNED | table-stakes |
| 19 | Markdown preview / WYSIWYG toggle | PLANNED | table-stakes |
| 20 | Auto-save with debounce | PLANNED | table-stakes |
| 21 | Version history (full timeline) | PLANNED | trust-builder |
| 22 | Diff between any two versions | PLANNED | trust-builder |
| 23 | Inline diff view (green/red, IDE-style) | PLANNED | trust-builder |
| 24 | Split diff view (side-by-side) | PLANNED | retention |
| 25 | Character-level inline change highlights | PLANNED | retention |

## AI Document Generation

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 26 | Generate CLAUDE.md from masterplan | PLANNED | table-stakes |
| 27 | Generate design-guidelines from masterplan + CLAUDE.md | PLANNED | table-stakes |
| 28 | Generate app-flow from masterplan | PLANNED | table-stakes |
| 29 | Generate screen-flows from app-flow + design-guidelines | PLANNED | table-stakes |
| 30 | Generate feature-list from masterplan + screen-flows | PLANNED | table-stakes |
| 31 | Generate operating-model from masterplan | PLANNED | table-stakes |
| 32 | Re-generate (sync) downstream doc when upstream changes | PLANNED | margin-lever |
| 33 | Partial regeneration (update only affected sections) | PLANNED | margin-lever |

## AI Personas

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 34 | Visionary persona — feature and growth suggestions | PLANNED | growth-driver |
| 35 | Engineer persona — feasibility and complexity warnings | PLANNED | trust-builder |
| 36 | PM persona — prioritization and sequencing advice | PLANNED | retention |
| 37 | Auditor persona — doc-vs-code gap detection | PLANNED | trust-builder |
| 38 | Persona toggle (on/off per project) | PLANNED | retention |
| 39 | Persona suggestion feed (visual cards) | PLANNED | growth-driver |
| 40 | Accept/reject/edit suggestions with one click | PLANNED | retention |
| 41 | "Save for later" on suggestions (backlog) | PLANNED | retention |

## PRD Pipeline

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 42 | Change accumulator (track diffs since last PRD) | PLANNED | margin-lever |
| 43 | AI PRD generation from accumulated changes | PLANNED | margin-lever |
| 44 | PRD editor with structured sections | PLANNED | table-stakes |
| 45 | PRD queue with ordering | PLANNED | retention |
| 46 | Export PRD as markdown | PLANNED | table-stakes |
| 47 | PRD status tracking (DRAFT → QUEUED → IN PROGRESS → COMPLETE) | PLANNED | trust-builder |

## Collaboration & Team

| # | Feature | Status | Strategic Tag |
|---|---------|--------|---------------|
| 48 | Team invitations with role assignment | PLANNED | growth-driver |

---

## Future Features (not yet scoped)

- Real-time collaborative editing
- Comment threads on document sections
- Git repo linking for Auditor persona
- Implementation status sync from codebase
- Notification system (email/in-app)
- Custom persona creation
- Template marketplace
- API access for CI/CD integration
- SSO / SAML for enterprise
- Audit logs
