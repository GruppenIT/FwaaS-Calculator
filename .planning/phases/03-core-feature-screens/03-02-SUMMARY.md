---
phase: 03-core-feature-screens
plan: 02
subsystem: ui
tags: [react, recharts, tailwind, css-vars, dashboard, stat-cards, heat-map]

# Dependency graph
requires:
  - phase: 03-core-feature-screens/03-01
    provides: useChartTheme hook (resolves CSS vars to hex), UrgencyHeatMap component, computeTierCounts

provides:
  - Dashboard page with Stripe-style 7 KPI stat cards (3px colored left border per tier category)
  - UrgencyHeatMap replacing old Prazos desta semana list in Row 2
  - Recharts AreaChart + BarChart using resolved hex colors via useChartTheme

affects:
  - 03-03 listing migrations (dashboard visual reference for consistent card/chart patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stripe-style stat cards: borderLeft 3px solid with CSS var token as borderLeftColor via style prop
    - Per-category border color tokens: tier-info (blue) / tier-warning (amber) / tier-fatal (red) / success (teal)
    - Recharts chart theming: spread theme.gridProps, theme.axisProps.tick, theme.tooltipProps.contentStyle
    - UrgencyHeatMap receives all pending prazos — component handles tier computation internally

key-files:
  created: []
  modified:
    - packages/app-desktop/src/pages/dashboard/dashboard-page.tsx

key-decisions:
  - "StatCard borderColor prop accepts CSS var token string (e.g. var(--color-tier-info)) applied via style.borderLeftColor — Tailwind JIT cannot purge dynamic left-border colors from prop values"
  - "financeiro 7th card borderColor uses var(--color-success) (teal) to match Clientes card — both are positive-valence metrics"
  - "Prazos filter removed entirely: all pending prazos passed to UrgencyHeatMap, 7-day filter was only for old list display"
  - "Unused local diasRestantes() removed — UrgencyHeatMap imports its own diasRestantes from prazo-countdown.tsx"

patterns-established:
  - "StatCard with Stripe-style left border: outer div border + style.borderLeftColor override achieves 3px colored left edge without custom Tailwind utilities"
  - "Chart theming via spread: {...theme.gridProps} and tick={theme.axisProps.tick} — no individual prop duplication"

requirements-completed:
  - DASH-01
  - DASH-02

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 3 Plan 02: Dashboard Rewrite Summary

**Stripe-style 7 KPI stat cards with 3px tier-colored left borders, UrgencyHeatMap replacing the old prazos list, and all Recharts charts consuming resolved hex colors via useChartTheme**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T11:38:44Z
- **Completed:** 2026-03-16T11:44:12Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- StatCard layout redesigned Stripe-style: large number top-left, icon top-right, 3px colored left border per tier category
- UrgencyHeatMap now occupies Row 2 left column — lawyers see urgency distribution at a glance instead of a scrollable list
- All Recharts SVG props (stroke, fill, CartesianGrid, axis ticks, tooltip contentStyle) use resolved hex values from useChartTheme — no var() strings reach SVG attributes
- Removed timezone-unsafe local `diasRestantes()` — UrgencyHeatMap uses the UTC-safe version from prazo-countdown.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite StatCard with Stripe-style left border** - `625a730` (feat)
2. **Task 2: Replace Prazos list with UrgencyHeatMap + wire useChartTheme to charts** - `6c50d58` (feat)

## Files Created/Modified

- `packages/app-desktop/src/pages/dashboard/dashboard-page.tsx` - Complete dashboard rewrite: StatCard with borderColor/iconColor props, UrgencyHeatMap in Row 2, useChartTheme wired to AreaChart + BarChart

## Decisions Made

- **StatCard borderColor as style prop**: CSS var token strings (e.g. `var(--color-tier-info)`) are passed as `borderColor` prop and applied via `style={{ borderLeft: '3px solid', borderLeftColor: borderColor }}`. Tailwind JIT cannot statically analyze dynamic `borderColor` prop values, so inline style is the correct approach.
- **financeiro card uses var(--color-success)**: The 7th card (A receber / Parcelas atrasadas) now uses teal (success) instead of amber/warning to match the positive-valence financial category alongside Clientes.
- **All pending prazos passed to UrgencyHeatMap**: Removed the 7-day filter that existed only for the old scrollable list. UrgencyHeatMap handles tier bucketing internally via `computeTierCounts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused local diasRestantes() function**
- **Found during:** Task 2 (after removing the old prazos list)
- **Issue:** The local `diasRestantes()` function was only called by the old prazos list rows. With that section removed, the function was dead code. Additionally, it used the timezone-unsafe `setHours(0,0,0,0)` pattern that was fixed in Plan 01.
- **Fix:** Removed the function entirely. UrgencyHeatMap imports its own UTC-safe `diasRestantes` from `prazo-countdown.tsx`.
- **Files modified:** packages/app-desktop/src/pages/dashboard/dashboard-page.tsx
- **Verification:** TypeScript reports no errors in dashboard-page.tsx; no var() in Recharts props; no hardcoded hex colors.
- **Committed in:** 6c50d58 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - dead code removal)
**Impact on plan:** Improvement — also removes a stale copy of a function that had a timezone bug fixed in Plan 01.

## Issues Encountered

None — plan executed cleanly, TypeScript compiles without dashboard errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard rewrite is complete and ready for visual verification
- Plan 03 (listing migrations) can proceed: PrazoCountdown is ready for the prazos DataTable
- useChartTheme pattern established for any future chart additions

---
*Phase: 03-core-feature-screens*
*Completed: 2026-03-16*
