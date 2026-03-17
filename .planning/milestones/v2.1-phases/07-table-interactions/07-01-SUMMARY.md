---
phase: 07-table-interactions
plan: 01
subsystem: ui
tags: [react, radix-ui, localstorage, typescript, keyboard-nav, hover-card, data-table]

# Dependency graph
requires:
  - phase: 05-ds-primitives
    provides: DataTable, Badge, Skeleton components used as base
  - phase: 06-data-seed
    provides: ClienteData interface and obterCliente API function

provides:
  - useTablePreferences hook with localStorage persistence for sort and column visibility
  - DataTable enhanced with arrow key navigation and hiddenColumns filtering
  - ColumnVisibilityToggle dropdown component for column show/hide
  - ClientHoverCard Radix HoverCard showing client summary on hover

affects:
  - 07-02-table-wiring (will wire these components into individual pages)

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-hover-card ^1.x"
  patterns:
    - "localStorage persistence: useState initializer reads, useEffect writes on change"
    - "Column filtering via useMemo to avoid unnecessary re-renders"
    - "Keyboard nav via onKeyDown on tbody element, not individual rows"
    - "Hover fetch with useRef cache to avoid re-fetching on repeated hovers"

key-files:
  created:
    - packages/app-desktop/src/hooks/use-table-preferences.ts
    - packages/app-desktop/src/components/ui/column-visibility-toggle.tsx
    - packages/app-desktop/src/components/ui/client-hover-card.tsx
  modified:
    - packages/app-desktop/src/components/ui/data-table.tsx
    - packages/app-desktop/src/components/ui/index.ts
    - packages/app-desktop/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Arrow key nav on tbody (not individual rows) avoids Enter/Space conflict with existing handleRowKeyDown"
  - "ColumnVisibilityToggle uses native checkbox instead of Radix to keep it simple"
  - "Minimum 2 visible columns rule prevents unusable empty table states"
  - "ClientHoverCard caches fetch result in useRef — subsequent hovers are instant, no redundant API calls"
  - "useTablePreferences wraps both sortState and hiddenColumns in single JSON blob per table key"

patterns-established:
  - "Table preferences: causa-table-{tableId} localStorage key pattern"
  - "Hover data fetch: useRef cache + load on HoverCard open"
  - "Column visibility: filter on useMemo visibleColumns, pass hiddenColumns as prop"

requirements-completed: [INT-01, INT-03, INT-04, INT-05]

# Metrics
duration: 18min
completed: 2026-03-17
---

# Phase 7 Plan 01: Table Interactions Infrastructure Summary

**Reusable table infrastructure: localStorage preferences hook, arrow-key navigation in DataTable, column visibility dropdown, and Radix hover card showing client data**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-17T12:23:00Z
- **Completed:** 2026-03-17T12:41:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created `useTablePreferences(tableId)` hook that persists sort state and hidden columns to `causa-table-{tableId}` localStorage keys
- Enhanced `DataTable` with optional `hiddenColumns` prop (useMemo filtered) and ArrowUp/ArrowDown keyboard navigation via tbody onKeyDown
- Built `ColumnVisibilityToggle` dropdown with checkbox list, click-outside dismissal, and 2-column minimum guard
- Built `ClientHoverCard` wrapping Radix HoverCard with 300ms open delay, useRef fetch cache, and graceful error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useTablePreferences hook and install Radix HoverCard** - `3eda722` (feat)
2. **Task 2: Enhance DataTable with arrow key navigation and hiddenColumns** - `59291d5` (feat)
3. **Task 3: Create ColumnVisibilityToggle and ClientHoverCard components** - `df7e6db` (feat)

## Files Created/Modified
- `packages/app-desktop/src/hooks/use-table-preferences.ts` - localStorage persistence hook for sort and column visibility per table
- `packages/app-desktop/src/components/ui/data-table.tsx` - Extended with hiddenColumns filtering and ArrowUp/ArrowDown tbody navigation
- `packages/app-desktop/src/components/ui/column-visibility-toggle.tsx` - Dropdown with native checkboxes for toggling column visibility
- `packages/app-desktop/src/components/ui/client-hover-card.tsx` - Radix HoverCard showing client name, tipo, contact info, and status
- `packages/app-desktop/src/components/ui/index.ts` - Added ColumnVisibilityToggle and ClientHoverCard exports
- `packages/app-desktop/package.json` - Added @radix-ui/react-hover-card dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made
- Arrow key handler placed on `<tbody>` not individual `<tr>` rows to avoid conflict with existing `handleRowKeyDown` (Enter/Space). The tbody handler uses `e.target.closest('tr')` to find current row then navigates via `nextElementSibling`/`previousElementSibling`.
- `ColumnVisibilityToggle` uses native `<input type="checkbox">` instead of Radix Checkbox — plan specified this explicitly to keep the component simple.
- Minimum 2 visible columns enforced by disabling the checkbox when `visibleCount <= 2` and the column is currently visible.
- `ClientHoverCard` caches fetch results in `useRef` so hovering repeatedly doesn't re-fetch from the API.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Running `pnpm add` from inside the package subdirectory failed with a pnpm workspace manifest error. Fixed by running from workspace root with `--filter @causa/app-desktop` flag (Rule 3 auto-fix, no separate commit needed).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 infrastructure pieces ready for Plan 07-02 page wiring
- `useTablePreferences` can be dropped into any page with a table ID
- `DataTable` hiddenColumns and arrow nav fully backward-compatible (optional props)
- `ColumnVisibilityToggle` and `ClientHoverCard` exported from ui/index.ts barrel

---
*Phase: 07-table-interactions*
*Completed: 2026-03-17*
