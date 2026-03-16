---
phase: 01-design-system-foundation
plan: 04
subsystem: ui
tags: [react, radix-ui, tailwind, design-system, components, forwardref]

# Dependency graph
requires:
  - phase: 01-design-system-foundation
    provides: Design tokens (var() CSS custom properties), focus-causa/transition-causa utilities, established forwardRef pattern from Button/Input
provides:
  - Badge component: 4-status pill using tier color tokens (DS-11)
  - StatusDot component: colored dot indicator for list rows (DS-12)
  - Card component: container with shadow/border/conditional interactive styles (DS-13)
  - Select component: Radix Select with portal, keyboard nav, error state (DS-15)
  - Checkbox component: Radix Checkbox with Check icon indicator, label (DS-16)
  - Textarea component: multi-line input matching Input visual style (DS-17)
affects: [phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BadgeStatus union type shared between Badge and StatusDot via import"
    - "exactOptionalPropertyTypes-safe Radix prop spreading using conditional spread syntax"
    - "Select/Checkbox forgo forwardRef where Radix handles its own ref internally"

key-files:
  created:
    - packages/app-desktop/src/components/ui/badge.tsx
    - packages/app-desktop/src/components/ui/status-dot.tsx
    - packages/app-desktop/src/components/ui/card.tsx
    - packages/app-desktop/src/components/ui/select.tsx
    - packages/app-desktop/src/components/ui/checkbox.tsx
    - packages/app-desktop/src/components/ui/textarea.tsx
  modified: []

key-decisions:
  - "BadgeStatus type exported from badge.tsx and imported by StatusDot to avoid duplication"
  - "Card renders as div with role=button + tabIndex + onKeyDown when onClick present — avoids button-inside-div nesting issues"
  - "Radix optional props (value, disabled, checked) spread conditionally to satisfy exactOptionalPropertyTypes strict mode"
  - "Select does not use forwardRef since trigger ref is handled by Radix internally and there is no DOM element to expose"

patterns-established:
  - "Conditional Radix prop spread: {...(prop !== undefined && { prop })} for exactOptionalPropertyTypes compatibility"
  - "Status type reuse: single source of truth for BadgeStatus imported across components"

requirements-completed: [DS-11, DS-12, DS-13, DS-15, DS-16, DS-17]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 1 Plan 4: Additional UI Primitives Summary

**6 design-system primitives: Badge/StatusDot status indicators, Card container, and Radix-based Select/Checkbox/Textarea form controls — all using var() tokens, no hardcoded hex**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T20:50:00Z
- **Completed:** 2026-03-15T21:05:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Badge renders 4 predefined status pills (active/suspended/archived/closed) using tier color design tokens
- StatusDot renders a colored dot + optional label for the same 4 statuses, importing BadgeStatus type from badge.tsx
- Card provides a flexible container with shadow/border and automatic interactive styles when onClick is present, including keyboard accessibility (Enter/Space)
- Select wraps Radix Select with portal, popper positioning, keyboard navigation, and consistent label/error pattern
- Checkbox wraps Radix Checkbox with a Check icon indicator and label
- Textarea mirrors the Input component's visual style with resize-y and error state

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Badge, StatusDot and Card components** - `5e86752` (feat)
2. **Task 2: Create Select, Checkbox and Textarea components** - `9e1a2c8` (feat)

## Files Created/Modified
- `packages/app-desktop/src/components/ui/badge.tsx` - Status pill with 4 predefined states and tier color tokens
- `packages/app-desktop/src/components/ui/status-dot.tsx` - Small dot indicator for list rows, imports BadgeStatus
- `packages/app-desktop/src/components/ui/card.tsx` - Container with elevation, conditional interactive styles + keyboard a11y
- `packages/app-desktop/src/components/ui/select.tsx` - Radix Select with portal, keyboard nav, error state, label
- `packages/app-desktop/src/components/ui/checkbox.tsx` - Radix Checkbox with Check icon, label, controlled state
- `packages/app-desktop/src/components/ui/textarea.tsx` - Multi-line input matching Input visual style, resize-y, aria-invalid

## Decisions Made
- BadgeStatus type is defined in badge.tsx and imported by status-dot.tsx — single source of truth for status values
- Card uses div with role="button"/tabIndex/onKeyDown rather than a button element to avoid invalid nesting when placed inside forms or containing buttons
- Radix optional props spread conditionally `{...(prop !== undefined && { prop })}` to satisfy TypeScript's `exactOptionalPropertyTypes` strict mode (discovered during Task 2 verification)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exactOptionalPropertyTypes TypeScript errors in Select and Checkbox**
- **Found during:** Task 2 (TypeScript verification after writing Select and Checkbox)
- **Issue:** `disabled` (Select, Checkbox) and `checked` (Checkbox) and `value` (Select) props typed as `T | undefined` were not assignable to Radix's strict `T` (non-optional) props under `exactOptionalPropertyTypes: true`
- **Fix:** Changed direct prop passing to conditional spread: `{...(prop !== undefined && { prop })}`
- **Files modified:** select.tsx, checkbox.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 9e1a2c8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type error)
**Impact on plan:** Fix necessary for TypeScript correctness. No scope creep.

## Issues Encountered
- TypeScript `exactOptionalPropertyTypes` strict mode required conditional spread pattern for Radix optional props — resolved inline per deviation Rule 1.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 design-system primitives complete and type-safe
- Badge and StatusDot ready for Phase 3 listing screens
- Card ready for dashboard stat cards
- Select, Checkbox, Textarea complete the form primitive set for Phase 2 forms
- Full primitive library (Button, Input, Badge, StatusDot, Card, Select, Checkbox, Textarea, Modal, DataTable, EmptyState, PageHeader, Skeleton, Toast) is now in place

---
*Phase: 01-design-system-foundation*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: packages/app-desktop/src/components/ui/badge.tsx
- FOUND: packages/app-desktop/src/components/ui/status-dot.tsx
- FOUND: packages/app-desktop/src/components/ui/card.tsx
- FOUND: packages/app-desktop/src/components/ui/select.tsx
- FOUND: packages/app-desktop/src/components/ui/checkbox.tsx
- FOUND: packages/app-desktop/src/components/ui/textarea.tsx
- FOUND commit: 5e86752 (Task 1)
- FOUND commit: 9e1a2c8 (Task 2)
