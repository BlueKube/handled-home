# Spec Builder — Design Guidelines

## Design Philosophy

Spec Builder is a **professional documentation IDE**. It should feel like VS Code meets Notion — powerful, information-dense, and polished. The target user is a developer or technical PM who spends hours in this tool. Every pixel should serve a purpose.

**Key principles:**
- Dense but not cluttered — power users want information, not whitespace
- IDE-familiar patterns — sidebars, tabs, diff views, command palettes
- AI suggestions should feel like teammate contributions, not system notifications
- The document chain is always visible — context is never lost

---

## Color System

### Core Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `hsl(234, 55%, 18%)` Deep Indigo | `hsl(234, 45%, 85%)` | Primary actions, active states, sidebar |
| `--primary-foreground` | `hsl(0, 0%, 100%)` White | `hsl(234, 55%, 18%)` | Text on primary backgrounds |
| `--accent` | `hsl(220, 90%, 56%)` Electric Blue | `hsl(220, 85%, 65%)` | Links, highlights, interactive elements |
| `--accent-foreground` | `hsl(0, 0%, 100%)` White | `hsl(0, 0%, 100%)` | Text on accent backgrounds |
| `--background` | `hsl(220, 14%, 96%)` Cool Gray | `hsl(220, 14%, 10%)` | Page background |
| `--foreground` | `hsl(220, 14%, 10%)` | `hsl(220, 14%, 96%)` | Primary text |
| `--card` | `hsl(0, 0%, 100%)` White | `hsl(220, 14%, 14%)` | Card backgrounds |
| `--card-foreground` | `hsl(220, 14%, 10%)` | `hsl(220, 14%, 90%)` | Text on cards |
| `--muted` | `hsl(220, 14%, 92%)` | `hsl(220, 14%, 18%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(220, 14%, 46%)` | `hsl(220, 14%, 60%)` | Secondary text |
| `--border` | `hsl(220, 14%, 88%)` | `hsl(220, 14%, 22%)` | Borders and dividers |
| `--input` | `hsl(220, 14%, 88%)` | `hsl(220, 14%, 22%)` | Input borders |
| `--ring` | `hsl(220, 90%, 56%)` | `hsl(220, 85%, 65%)` | Focus rings |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--success` | `hsl(152, 60%, 42%)` Emerald | `hsl(152, 55%, 55%)` | Diff additions, synced status, confirmations |
| `--success-foreground` | `hsl(0, 0%, 100%)` | `hsl(0, 0%, 100%)` | Text on success backgrounds |
| `--destructive` | `hsl(0, 72%, 51%)` Rose | `hsl(0, 65%, 60%)` | Diff deletions, errors, destructive actions |
| `--destructive-foreground` | `hsl(0, 0%, 100%)` | `hsl(0, 0%, 100%)` | Text on destructive backgrounds |
| `--warning` | `hsl(38, 92%, 50%)` Amber | `hsl(38, 85%, 55%)` | Stale documents, warnings, attention needed |
| `--warning-foreground` | `hsl(0, 0%, 10%)` | `hsl(0, 0%, 10%)` | Text on warning backgrounds |
| `--info` | `hsl(200, 80%, 50%)` Cyan | `hsl(200, 75%, 60%)` | Information, tips, neutral indicators |

### Persona Colors

| Persona | Token | Light Mode | Dark Mode |
|---------|-------|-----------|-----------|
| Visionary | `--persona-visionary` | `hsl(270, 70%, 55%)` Purple | `hsl(270, 65%, 65%)` |
| Engineer | `--persona-engineer` | `hsl(215, 20%, 45%)` Slate | `hsl(215, 20%, 60%)` |
| PM | `--persona-pm` | `hsl(180, 55%, 40%)` Teal | `hsl(180, 50%, 55%)` |
| Auditor | `--persona-auditor` | `hsl(38, 92%, 50%)` Amber | `hsl(38, 85%, 55%)` |

### Diff Colors

| Element | Background | Border | Text |
|---------|-----------|--------|------|
| Addition line | `success/10` | `border-l-2 border-success` | Normal foreground |
| Addition highlight (inline) | `success/20` | — | Normal foreground |
| Deletion line | `destructive/10` | `border-l-2 border-destructive` | `line-through` decoration |
| Deletion highlight (inline) | `destructive/20` | — | `line-through` decoration |
| Pending suggestion | `accent/5` | `border border-dashed border-accent/40` | Normal, `opacity-80` |

---

## Typography

### Font Families

- **UI text:** Inter (weights: 300 light, 400 regular, 500 medium, 600 semibold, 700 bold)
- **Code/monospace:** JetBrains Mono (weights: 400 regular, 500 medium, 700 bold)
- **Document content:** Inter — same as UI for consistency

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `text-h1` | 28px / 1.75rem | 700 | 1.2 | Page titles, project name |
| `text-h2` | 22px / 1.375rem | 600 | 1.3 | Section headers, document titles |
| `text-h3` | 18px / 1.125rem | 600 | 1.4 | Subsection headers |
| `text-h4` | 15px / 0.9375rem | 600 | 1.4 | Card titles, group labels |
| `text-body` | 14px / 0.875rem | 400 | 1.6 | Body text, editor content |
| `text-body-sm` | 13px / 0.8125rem | 400 | 1.5 | Secondary text, metadata |
| `text-caption` | 12px / 0.75rem | 400 | 1.4 | Captions, timestamps, labels |
| `text-code` | 13px / 0.8125rem | 400 (JetBrains Mono) | 1.5 | Code blocks, file paths, technical references |

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon-to-text, badge padding) |
| `space-2` | 8px | Default inline spacing |
| `space-3` | 12px | Card inner padding (compact) |
| `space-4` | 16px | Standard padding, section gaps |
| `space-5` | 20px | Card inner padding (standard) |
| `space-6` | 24px | Section separators |
| `space-8` | 32px | Major section gaps |
| `space-10` | 40px | Page-level padding |
| `space-12` | 48px | Large section separators |

### Page-level spacing

- **Sidebar width:** 280px (expanded), 64px (collapsed)
- **Main content padding:** 32px horizontal, 24px vertical
- **Document editor max-width:** 800px (centered in main area)
- **Panel gaps:** 16px between adjacent panels

---

## Component Specifications

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `default` | `primary` | `primary-foreground` | none | `primary/90` |
| `accent` | `accent` | `accent-foreground` | none | `accent/90` |
| `outline` | transparent | `foreground` | `border` | `muted` bg |
| `ghost` | transparent | `foreground` | none | `muted` bg |
| `destructive` | `destructive` | `destructive-foreground` | none | `destructive/90` |
| `secondary` | `muted` | `muted-foreground` | none | `muted/80` |
| `success` | `success` | `success-foreground` | none | `success/90` |

**Sizes:**
- `sm`: height 28px, padding 8px 12px, text-caption
- `default`: height 36px, padding 8px 16px, text-body-sm
- `lg`: height 40px, padding 8px 20px, text-body
- `xl`: height 44px, padding 8px 24px, text-body, font-medium
- All: `rounded-lg`, `font-medium`, transition 150ms

### Inputs

- Height: 40px
- Border: `border` color, `rounded-lg`
- Padding: 12px horizontal
- Font: text-body (14px)
- Focus: `ring-2 ring-ring ring-offset-2`
- Placeholder: `muted-foreground`

### Cards

- Background: `card`
- Border: `border` (1px)
- Border radius: `rounded-xl` (12px)
- Shadow: `0 1px 3px rgba(0,0,0,0.06)`
- Padding: 20px (standard), 16px (compact)
- Hover (interactive cards): `shadow-md`, border `accent/30`

### Document Status Badges

| Status | Background | Text | Icon |
|--------|-----------|------|------|
| Up to date | `success/10` | `success` | `CheckCircle2` |
| Stale | `warning/10` | `warning` | `AlertTriangle` |
| Pending changes | `accent/10` | `accent` | `Clock` |
| Draft | `muted` | `muted-foreground` | `FileEdit` |
| Not created | `muted` | `muted-foreground` | `FilePlus` |

### Persona Suggestion Cards

- Border-left: 3px solid persona color
- Background: persona color at 5% opacity
- Avatar: 32px circle with persona icon + persona color background
- Header: Persona name (bold) + suggestion type tag
- Body: Suggestion text (text-body)
- Actions: Accept (success ghost button), Reject (ghost button), Edit (ghost button)
- Hover: Slight elevation increase

### Sidebar

- Width: 280px (expanded), 64px (collapsed)
- Background: `primary` (dark mode: slightly lighter variant)
- Text: `primary-foreground`
- Active item: `accent` background with rounded-lg
- Hover: `primary-foreground/10` background
- Section dividers: `primary-foreground/20` border
- Collapse trigger: chevron icon at bottom

### Diff View

- **Split view:** Two columns — original (left) and modified (right)
- **Unified view:** Single column with additions and deletions inline
- **Line numbers:** `text-caption`, `muted-foreground`, right-aligned, monospace
- **Gutter:** 48px wide, contains +/- indicators
- **Changed line highlight:** Full-width background (green/red at 10% opacity)
- **Inline changes:** Character-level highlights at 20% opacity within changed lines
- **Unchanged context:** 3 lines above/below changes, collapsible
- **Toggle:** Split ↔ Unified view toggle in toolbar

---

## Icon System

- **Library:** Lucide React
- **Default size:** 16px (within text), 20px (standalone), 24px (page headers)
- **Stroke width:** 1.5 (default), 2 (emphasis)
- **Color:** Inherits from parent `currentColor` unless semantic (persona icons, status icons)

### Key Icons

| Concept | Icon |
|---------|------|
| Masterplan | `BookOpen` |
| Design Guidelines | `Palette` |
| App Flow | `GitBranch` |
| Screen Flows | `LayoutDashboard` |
| Feature List | `ListChecks` |
| Operating Model | `Calculator` |
| CLAUDE.md | `FileCode` |
| PRD | `FileText` |
| Document chain | `Link` |
| Sync/refresh | `RefreshCw` |
| Stale | `AlertTriangle` |
| AI generate | `Sparkles` |
| Diff | `GitCompare` |
| Accept | `Check` |
| Reject | `X` |
| Settings | `Settings` |

---

## Animation Patterns

- **Page transitions:** `animate-fade-in` (opacity 0→1, 200ms ease-out)
- **Card hover:** Scale 1.01, shadow increase, 150ms ease
- **Sidebar collapse:** Width transition 200ms ease-in-out
- **Suggestion appear:** Slide in from right + fade, 250ms ease-out
- **Diff highlight:** Background color fade in, 150ms
- **Status badge change:** Color crossfade, 200ms
- **Document chain node pulse:** Subtle pulse on stale nodes (warning color, 2s loop)
- **Loading:** Skeleton with shimmer animation

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | 640px | — |
| `md` | 768px | Minimum supported width |
| `lg` | 1024px | Sidebar collapses to icon-only by default |
| `xl` | 1280px | Full sidebar + main content |
| `2xl` | 1440px | Primary design target — sidebar + main + optional right panel |

### Layout rules
- Below 768px: Not officially supported (show "use a larger screen" message)
- 768–1024px: Collapsed sidebar (64px), full-width main content
- 1024–1280px: Sidebar can be toggled, main content fills remaining space
- 1280+: Sidebar expanded by default, main content centered at max-width
- 1440+: Optional right panel for persona suggestions or diff preview

---

## Accessibility Standards

- **Focus indicators:** Visible focus ring (`ring-2 ring-ring`) on all interactive elements
- **Keyboard navigation:** Full keyboard support for sidebar, editor, suggestion cards
- **Color contrast:** Minimum 4.5:1 for text, 3:1 for large text and UI components
- **Screen reader:** ARIA labels on all icons, roles on landmark regions
- **Reduced motion:** Respect `prefers-reduced-motion` — disable animations, keep functional transitions
- **Editor:** Full keyboard editing support (Tiptap handles this natively)
