---
phase: 02-layout-shell
plan: "02"
subsystem: ui
tags: [react, typescript, polling, deadline-banner, layout]

# Dependency graph
requires:
  - phase: 02-layout-shell
    provides: AppLayout shell with UpdateBanner pattern
provides:
  - DeadlineBanner component (non-dismissible, red, clickable to /app/prazos)
  - useFatalDeadlines hook (polls every 5 min, returns today/tomorrow counts)
  - getFatalDeadlineSummary API function (filters pendente prazos, date-diff logic)
  - AppLayout with DeadlineBanner inserted above UpdateBanner
affects: [prazos, layout, app-shell]

# Tech tracking
tech-stack:
  added: []
  patterns: [polling-hook-with-cleanup, silent-error-swallowing-for-banner-polling]

key-files:
  created:
    - packages/app-desktop/src/components/layout/deadline-banner.tsx
    - packages/app-desktop/src/hooks/use-fatal-deadlines.ts
  modified:
    - packages/app-desktop/src/lib/api.ts
    - packages/app-desktop/src/components/layout/app-layout.tsx

key-decisions:
  - "Silent error swallowing in useFatalDeadlines — banner polling must never crash AppLayout"
  - "Initial state { today: 0, tomorrow: 0 } ensures banner hidden until first fetch completes"
  - "DeadlineBanner placed above UpdateBanner — fatal deadlines more urgent than app updates"
  - "Non-dismissible banner: no X button, no close mechanism — lawyers must see it"
  - "role=alert for accessibility — screen readers announce fatal deadline warnings"

patterns-established:
  - "Polling hook pattern: useState + useEffect with cancelled flag + clearInterval cleanup for React strict mode safety"
  - "Banner component returns null when all counts are zero (no DOM element, no layout space)"

requirements-completed: [LY-03]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 2 Plan 02: Fatal Deadline Banner Summary

**Non-dismissible red banner in AppLayout polling API every 5 min, showing today/tomorrow fatal prazo counts with navigation to /app/prazos**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-15T21:51:57Z
- **Completed:** 2026-03-15T21:54:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `getFatalDeadlineSummary()` added to api.ts — filters pendente prazos, excludes suspenso, computes midnight-normalized date diff to count today/tomorrow fatal deadlines
- `useFatalDeadlines` hook created — polls every 5 min with cancelled flag cleanup, silently swallows errors, initial state hides banner until data arrives
- `DeadlineBanner` component created — role=alert, non-dismissible, clickable entire surface navigates to /app/prazos, singular/plural Portuguese text, uses causa-tier-fatal design tokens
- `AppLayout` updated — DeadlineBanner inserted above UpdateBanner, outside scrollable main area

## Task Commits

Each task was committed atomically:

1. **Task 1: API function and polling hook for fatal deadlines** - `8cd410c` (feat)
2. **Task 2: DeadlineBanner component and AppLayout integration** - `9d41ce6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/app-desktop/src/lib/api.ts` - Added FatalDeadlineSummary interface and getFatalDeadlineSummary function after listarPrazos section
- `packages/app-desktop/src/hooks/use-fatal-deadlines.ts` - New polling hook returning { today, tomorrow } counts
- `packages/app-desktop/src/components/layout/deadline-banner.tsx` - New non-dismissible red banner component
- `packages/app-desktop/src/components/layout/app-layout.tsx` - Added DeadlineBanner import and render above UpdateBanner

## Decisions Made
- Silent error swallowing in polling hook — banner is a non-critical enhancement, should never crash AppLayout
- Cancelled flag pattern ensures no setState after unmount in React strict mode
- Initial state zeros ensure banner is invisible until the first fetch resolves (avoids flash of alert)
- DeadlineBanner above UpdateBanner per plan — fatal prazos are more urgent than software updates
- Singular/plural: "prazo fatal vence" (1) vs "prazos fatais vencem" (N)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `processo-detail-page.tsx` (ArrowLeft not imported) was detected during typecheck but is out of scope — no errors in the new/modified files for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- LY-03 requirement fulfilled: fatal deadline warnings visible on every page
- DeadlineBanner ready for use; polling hook pattern available as template for future banner features
- No blockers

---
*Phase: 02-layout-shell*
*Completed: 2026-03-15*
