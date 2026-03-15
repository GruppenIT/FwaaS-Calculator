---
phase: 01-design-system-foundation
plan: 03
subsystem: ui
tags: [react, tailwind, tokens, accessibility, reduced-motion]

# Dependency graph
requires:
  - phase: 01-design-system-foundation plan 01
    provides: "@theme inline CSS variables and semantic tokens in globals.css"
provides:
  - Toast with 4 consistent var()-based color variants (success/error/warning/info)
  - Skeleton with CSS class animation that respects prefers-reduced-motion override
  - EmptyState with optional description prop below message
  - PageHeader confirmed conformant to identity guide (22px/700 title)
affects: [all feature screens using these 4 UI primitives]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "var() arbitrary Tailwind classes for semantic token references (e.g., bg-[var(--color-success)]/8)"
    - "Tailwind arbitrary animation class instead of inline style for prefers-reduced-motion compatibility"
    - "EmptyState description optional secondary text pattern with /60 opacity muted color"

key-files:
  created: []
  modified:
    - packages/app-desktop/src/components/ui/toast.tsx
    - packages/app-desktop/src/components/ui/skeleton.tsx
    - packages/app-desktop/src/components/ui/empty-state.tsx

key-decisions:
  - "All 4 Toast variants use var(--color-*) directly instead of causa-* Tailwind utilities — more explicit, no Tailwind aliasing layer"
  - "Skeleton animation uses animate-[...] Tailwind class not inline style so prefers-reduced-motion media query !important override works correctly"
  - "PageHeader required no changes — already fully conformant to identity guide"

patterns-established:
  - "Token pattern: border-[var(--color-success)]/30 bg-[var(--color-success)]/8 text-[var(--color-success)]"
  - "Reduced-motion: always use CSS class animations, never inline style animations"

requirements-completed: [DS-06, DS-08, DS-09, DS-10]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 1 Plan 03: Design System — Toast/Skeleton/EmptyState/PageHeader Audit Summary

**Toast styleMap migrated to consistent var() token pattern; Skeleton inline animation fixed for prefers-reduced-motion; EmptyState gains optional description prop**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T20:48:23Z
- **Completed:** 2026-03-15T20:53:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Toast: all 4 variants now use `var(--color-*)` directly, eliminating the inconsistency where `success`/`error`/`warning` used `causa-*` Tailwind utilities while `info` used `var()` directly
- Skeleton: replaced `style={{ animation: ... }}` inline prop with `animate-[skeletonPulse_1.5s_ease-in-out_infinite]` Tailwind class, and updated bg token to `bg-[var(--color-surface-alt)]`
- EmptyState: added optional `description` prop rendered below message with `text-xs-causa text-[var(--color-text-muted)]/60 mt-1` styling
- PageHeader: audited and confirmed fully conformant — `text-xl-causa` (22px/700), `var()` tokens, no hardcoded hex

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit Toast token usage and Skeleton reduced-motion** - `827e68f` (feat)
2. **Task 2: Refactor EmptyState with description and audit PageHeader** - `e29d0a9` (feat)

## Files Created/Modified

- `packages/app-desktop/src/components/ui/toast.tsx` - styleMap migrated to consistent var() pattern for all 4 variants
- `packages/app-desktop/src/components/ui/skeleton.tsx` - inline style animation replaced with CSS class; bg token updated
- `packages/app-desktop/src/components/ui/empty-state.tsx` - optional description prop added

## Decisions Made

- Using `var()` directly in Tailwind arbitrary property classes (`border-[var(--color-success)]/30`) rather than relying on `causa-*` theme aliases. This makes token usage explicit and consistent across all components.
- PageHeader needed zero changes — the audit confirmed it was already fully conformant. Documented as-is rather than making no-op changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors found in `data-table.tsx` and `modal.tsx` (unrelated to plan scope). Both have `exactOptionalPropertyTypes` issues. Logged to `deferred-items.md` for future resolution. The 4 plan files all pass TypeScript without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 UI primitives (Toast, Skeleton, EmptyState, PageHeader) now conform to identity guide token usage
- Reduced-motion accessibility pattern established for all animation components
- Ready for Plan 04+ which will build feature screens using these primitives

---
*Phase: 01-design-system-foundation*
*Completed: 2026-03-15*
