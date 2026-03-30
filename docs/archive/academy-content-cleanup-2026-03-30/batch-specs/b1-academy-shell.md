# Batch Spec: PRD-027 — Academy Page Shell & Navigation

## Phase
Phase 1 — Academy Foundation

## Size: Large

## Review
Custom editorial review (2 agents):
- Lane A (Senior Editor): Voice consistency, pro-tip quality, training effectiveness
- Lane B (Fact Checker): Code accuracy, component patterns, real-world data accuracy

## Why it matters
The Academy shell is the container for all 15 training modules. It must support module navigation, search/filter, progress tracking (future), and the reusable AnnotatedScreenshot component that every module will use for CSS-overlaid screenshot annotations.

## Scope
- Create `src/components/academy/AnnotatedScreenshot.tsx` — reusable component for CSS-overlaid annotations on screenshots (boxes, arrows, pulses, step markers)
- Create `src/components/academy/AcademyModuleCard.tsx` — card component for module listing
- Create `src/components/academy/AcademySection.tsx` — section renderer for module content (steps, pro tips, watch-outs)
- Create `src/constants/academy-modules.ts` — typed module definitions with all metadata
- Create `src/pages/admin/Academy.tsx` — main Academy page with module grid, search, category filters
- Create `src/pages/admin/AcademyModule.tsx` — individual module viewer page
- Add nav item to AdminShell (GraduationCap icon, after Playbooks group)
- Add lazy imports + routes in App.tsx (`/admin/academy`, `/admin/academy/:moduleId`)

## Non-goals
- No training content yet (that's PRDs 028–042)
- No progress tracking/completion state (future enhancement)
- No screenshot images yet (modules will show placeholder until content PRDs add them)

## File targets
| Action | File |
|--------|------|
| Create | src/components/academy/AnnotatedScreenshot.tsx |
| Create | src/components/academy/AcademyModuleCard.tsx |
| Create | src/components/academy/AcademySection.tsx |
| Create | src/constants/academy-modules.ts |
| Create | src/pages/admin/Academy.tsx |
| Create | src/pages/admin/AcademyModule.tsx |
| Modify | src/components/admin/AdminShell.tsx |
| Modify | src/App.tsx |

## Acceptance criteria
- [ ] `/admin/academy` renders with module grid showing all 15 planned modules (placeholder state)
- [ ] `/admin/academy/:moduleId` renders individual module viewer
- [ ] AnnotatedScreenshot component renders overlays (box, arrow, pulse, step) correctly
- [ ] Search filters modules by title
- [ ] Category filter groups modules by phase/domain
- [ ] Nav item visible in AdminShell
- [ ] Build passes (npx tsc --noEmit && npm run build)

## Regression risks
- New nav group in AdminShell — verify no layout shifts
- Two new routes in App.tsx — verify bundle splitting
