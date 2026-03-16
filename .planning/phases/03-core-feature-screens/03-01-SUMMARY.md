---
phase: 03-core-feature-screens
plan: 01
subsystem: ui
tags: [react, recharts, tailwind, vitest, css-vars, hooks, countdown, urgency]

# Dependency graph
requires:
  - phase: 01-design-system-foundation
    provides: CSS tier tokens (--color-tier-fatal/urgent/warning/info), DataTable, Badge components
  - phase: 02-layout-shell
    provides: useTheme hook, AppLayout, PrazoRow interface from api.ts

provides:
  - useChartTheme hook — resolves CSS vars to hex strings for Recharts, reacts to theme toggle
  - resolveCssVar() pure function — CSS var resolution utility
  - PrazoCountdown component — tier-colored countdown with native tooltip
  - formatCountdown() pure function — 7 tier ranges, Portuguese text, timezone-safe
  - diasRestantes() pure function — UTC-safe days remaining calculation
  - UrgencyHeatMap component — 2x2 tier grid with click handler
  - computeTierCounts() pure function — bucketing prazos into 4 tiers + fatalVencido

affects:
  - 03-02 dashboard rewrite (consumes useChartTheme + UrgencyHeatMap)
  - 03-03 listing migrations (consumes PrazoCountdown in prazos table)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - UTC-safe date arithmetic using Date.UTC() with local year/month/day for "today"
    - TDD with vitest globals: true, environment: node — pure function tests only for hooks/components
    - CSS var tokens in Tailwind JIT syntax: text-[var(--color-tier-fatal)]
    - MutationObserver + tick counter pattern for React theme reactivity

key-files:
  created:
    - packages/app-desktop/src/hooks/use-chart-theme.ts
    - packages/app-desktop/src/hooks/use-chart-theme.test.ts
    - packages/app-desktop/src/pages/prazos/prazo-countdown.tsx
    - packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts
    - packages/app-desktop/src/pages/dashboard/urgency-heat-map.tsx
    - packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts
  modified: []

key-decisions:
  - "UTC-safe date arithmetic: use Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) for today to avoid timezone drift when parsing ISO date-only strings"
  - "diasRestantes uses utcMidnight() helper — ISO date-only strings are parsed as UTC by spec, so both sides stay in UTC for accurate diff"
  - "useChartTheme uses MutationObserver on documentElement class + tick counter to drive useMemo recomputation on theme toggle"
  - "Pure function tests only (resolveCssVar, formatCountdown, diasRestantes, computeTierCounts) — hook/component rendering skipped as vitest environment is node"
  - "Native title attribute for PrazoCountdown tooltip — zero dependencies, accessible, matches research recommendation"

patterns-established:
  - "UTC-safe date arithmetic: always use Date.UTC() — never new Date(dateStr).setHours(0,0,0,0) which is timezone-sensitive"
  - "CSS vars in Tailwind arbitrary values: text-[var(--color-tier-fatal)] for tier colors"
  - "TDD in node environment: test exported pure functions; skip React rendering (no jsdom)"

requirements-completed:
  - DASH-03
  - LIST-02

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 3 Plan 01: Core Feature Utilities Summary

**useChartTheme hook with MutationObserver theme reactivity, PrazoCountdown with tier-colored Portuguese countdown, and UrgencyHeatMap with computeTierCounts — 19 unit tests covering all pure functions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T11:33:13Z
- **Completed:** 2026-03-16T11:36:17Z
- **Tasks:** 2
- **Files modified:** 6 (all new)

## Accomplishments

- useChartTheme hook resolves all CSS vars to hex via MutationObserver — no var() references reach Recharts SVG attributes
- PrazoCountdown outputs correct Portuguese text for all 7 day ranges with tier CSS class colors
- UrgencyHeatMap computes fatalVencido (overdue) separately so Fatal cell can show "(X vencido)" suffix
- All date arithmetic is timezone-safe via UTC-based calculation (fixed UTC-3 regression during TDD)
- 19 unit tests pass covering resolveCssVar, formatCountdown, diasRestantes, computeTierCounts

## Task Commits

Each task was committed atomically:

1. **Task 1: useChartTheme hook with MutationObserver** - `1206ba5` (feat)
2. **Task 2: PrazoCountdown + UrgencyHeatMap with pure function tests** - `0e89e5b` (feat)

_Note: TDD tasks included auto-fix during GREEN phase for timezone-safe date arithmetic._

## Files Created/Modified

- `packages/app-desktop/src/hooks/use-chart-theme.ts` - CSS var resolver + Recharts config hook
- `packages/app-desktop/src/hooks/use-chart-theme.test.ts` - resolveCssVar unit tests
- `packages/app-desktop/src/pages/prazos/prazo-countdown.tsx` - Countdown component + formatCountdown + diasRestantes
- `packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts` - formatCountdown + diasRestantes tests (10 tests)
- `packages/app-desktop/src/pages/dashboard/urgency-heat-map.tsx` - 2x2 tier grid + computeTierCounts
- `packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts` - computeTierCounts tests (7 tests)

## Decisions Made

- **UTC-safe date arithmetic**: Initial implementation used `new Date(dateStr).setHours(0,0,0,0)` which shifted ISO date-only strings to the wrong local day in UTC-3 timezone. Fixed to use `Date.UTC()` with consistent UTC parsing on both sides.
- **Pure function tests only**: vitest runs in `node` environment — no jsdom, so React rendering tests were skipped per plan's explicit guidance. Hook structure (MutationObserver + useMemo) is verified via dashboard visual checkpoint in Plan 02.
- **Native title tooltip**: PrazoCountdown uses the HTML `title` attribute for the absolute date tooltip. Zero dependencies, accessible, consistent with research recommendation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed timezone-unsafe date arithmetic in diasRestantes**
- **Found during:** Task 2 (GREEN phase — tests failing for dias=0 and dias=1)
- **Issue:** `new Date('2026-03-16').setHours(0,0,0,0)` in UTC-3 timezone creates local midnight `2026-03-15T03:00:00Z`, shifting date by -1 day. Test expected `diasRestantes('2026-03-16') = 0` but got `-1`.
- **Fix:** Replaced with `utcMidnight()` (parses date string parts with `Date.UTC`) and `todayUtcMidnight()` (uses `Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())` for local calendar day). Both sides stay in UTC.
- **Files modified:** packages/app-desktop/src/pages/prazos/prazo-countdown.tsx
- **Verification:** All 10 prazo-countdown tests pass, including heat-map tests which import diasRestantes
- **Committed in:** 0e89e5b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - timezone bug)
**Impact on plan:** Fix was required for correctness — wrong day calculations would cause incorrect tier assignment in production for all users outside UTC.

## Issues Encountered

- Timezone offset of UTC-3 on the execution host exposed date arithmetic bug during TDD RED→GREEN transition. Caught early by the test that fixed "today" to a specific date via `vi.setSystemTime`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useChartTheme is ready to consume in dashboard rewrite (Plan 02)
- PrazoCountdown is ready to drop into the prazos DataTable migration (Plan 03)
- UrgencyHeatMap is ready to place in dashboard row 2 left column (Plan 02)
- computeTierCounts needs prazos data from the existing prazos API endpoint (no changes needed)

---
*Phase: 03-core-feature-screens*
*Completed: 2026-03-16*
