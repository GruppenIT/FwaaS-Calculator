---
phase: 04-detail-pages-auth-e-polish
plan: "04"
subsystem: ui
tags: [framer-motion, motion-react, animation, page-transitions, data-table, css-keyframes]

# Dependency graph
requires:
  - phase: 04-01
    provides: app-layout structure with Outlet used as animation host
  - phase: 04-03
    provides: processo detail page with tab-based navigation using search params

provides:
  - AnimatePresence page transitions on route changes in AppLayout
  - rowFadeIn CSS keyframes for table row stagger animation
  - animateFirstLoad prop on DataTable for controlled first-load stagger

affects:
  - Any page using DataTable (processos, clientes, prazos listing pages)
  - All route changes in the app (AppLayout wraps all authenticated routes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page transitions: AnimatePresence mode=wait wraps Outlet, keyed on location.pathname only (not search/key)"
    - "Row stagger: CSS animation via inline style on tr — no motion.div to avoid table layout breakage"
    - "prefers-reduced-motion: useReducedMotion hook (Framer) for JS animations, CSS @media override for CSS animations"
    - "Controlled stagger: animateFirstLoad is a parent-controlled prop, not internal DataTable state"

key-files:
  created: []
  modified:
    - packages/app-desktop/src/components/layout/app-layout.tsx
    - packages/app-desktop/src/components/ui/data-table.tsx
    - packages/app-desktop/src/styles/globals.css

key-decisions:
  - "Page transition key on location.pathname only — tab changes via ?tab= search params must NOT trigger route-level transition"
  - "Row stagger uses native CSS animation via inline style on <tr> — motion.tr or wrapping motion.div both break table layout"
  - "animateFirstLoad is a controlled prop from parent, not internal DataTable state — parent passes false/omit on sort/filter to skip stagger"
  - "ANIM-01 verified: modal.tsx already implements correct animation (scale 0.95->1 + opacity, 180ms ease-out with AnimatePresence exit) — no changes needed"

patterns-established:
  - "Page-level transitions: AnimatePresence mode=wait + motion.div key=pathname in layout shell"
  - "Table stagger: animateFirstLoad prop controls CSS animation injection, parent manages when to animate"

requirements-completed: [ANIM-01, ANIM-02, ANIM-03]

# Metrics
duration: 1min
completed: 2026-03-16
---

# Phase 4 Plan 04: Micro-Animations Summary

**AnimatePresence page transitions (150ms opacity + translateY), DataTable first-load row stagger via CSS keyframes, and modal animation verified correct**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T17:18:06Z
- **Completed:** 2026-03-16T17:19:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- ANIM-01: Verified modal.tsx already implements correct animation (scale 0.95->1 + opacity, 180ms ease-out with AnimatePresence exit) — no changes needed
- ANIM-02: Added AnimatePresence + motion.div wrapper around Outlet in AppLayout, keyed on location.pathname — page transitions with opacity + translateY(4px->0), 150ms ease-in-out; tab changes via ?tab= search params do NOT trigger transition
- ANIM-03: Added rowFadeIn @keyframes to globals.css and animateFirstLoad prop to DataTable; first 10 rows animate with 20ms stagger (200ms total) using CSS animation on <tr> elements

## Task Commits

Each task was committed atomically:

1. **Task 1: Add page transitions to AppLayout and rowFadeIn keyframes** - `6227bdc` (feat)
2. **Task 2: Add animateFirstLoad prop to DataTable for row stagger** - `dc26e61` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/app-desktop/src/components/layout/app-layout.tsx` - Added AnimatePresence + motion.div with useLocation and useReducedMotion for page transitions
- `packages/app-desktop/src/components/ui/data-table.tsx` - Added animateFirstLoad prop and staggerStyle inline CSS animation on tr rows
- `packages/app-desktop/src/styles/globals.css` - Added @keyframes rowFadeIn (opacity 0->1 + translateY 4px->0)

## Decisions Made
- Page transition key on `location.pathname` only — not `location.search` or `location.key`. Tab changes within processo detail (which use `?tab=` search params) must NOT trigger the page-level transition.
- Row stagger uses native CSS animation via inline style on `<tr>` elements — `motion.tr` or wrapping in `motion.div` both break table layout.
- `animateFirstLoad` is a parent-controlled prop, not internal DataTable state — parent passes `false` or omits on subsequent renders (sort, filter, re-fetch) to skip stagger.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 4 animations complete: modal (ANIM-01), page transitions (ANIM-02), row stagger (ANIM-03)
- All animations respect prefers-reduced-motion
- DataTable animateFirstLoad prop ready for consuming pages to integrate

---
*Phase: 04-detail-pages-auth-e-polish*
*Completed: 2026-03-16*
