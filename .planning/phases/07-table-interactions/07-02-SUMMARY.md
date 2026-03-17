---
phase: 07-table-interactions
plan: 02
subsystem: ui
tags: [react, keyboard-shortcuts, localStorage, hover-card, column-visibility]

# Dependency graph
requires:
  - phase: 07-01
    provides: useTablePreferences hook, DataTable with hiddenColumns + arrow nav, ColumnVisibilityToggle, ClientHoverCard
provides:
  - ProcessosPage wired with all 5 INT interactions (persistent sort, column visibility, keyboard shortcuts, hover card)
  - PrazosPage wired with persistent sort, column visibility, N shortcut
  - ClientesPage wired with persistent sort, N shortcut, Esc-to-clear-search
affects: [08-data-display, any future listing pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [useTablePreferences replaces local sortState on all listing pages, keyboard shortcut useEffect pattern with isInput guard and modal guard]

key-files:
  created: []
  modified:
    - packages/app-desktop/src/pages/processos/processos-page.tsx
    - packages/app-desktop/src/pages/prazos/prazos-page.tsx
    - packages/app-desktop/src/pages/clientes/clientes-page.tsx
    - packages/app-desktop/src/lib/api.ts
    - packages/database/src/services/processos.ts

key-decisions:
  - "clienteId added to ProcessoListRow and listSelect() — hover card requires it and it was missing from the list query"
  - "Keyboard shortcut guard checks isInput (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) to avoid conflicts with form inputs"
  - "ColumnVisibilityToggle receives columns filtered by non-empty header to exclude the actions column"
  - "ClientesPage does not get ColumnVisibilityToggle — INT-03 only specifies processos and prazos"

patterns-established:
  - "Listing page keyboard shortcuts: useEffect with document keydown, guard showModal + isInput, cleanup on return"
  - "useTablePreferences replaces local sortState for all listing pages going forward"
  - "hiddenColumns from useTablePreferences flows to both ColumnVisibilityToggle and DataTable hiddenColumns prop"

requirements-completed: [INT-01, INT-02, INT-03, INT-04, INT-05]

# Metrics
duration: 25min
completed: 2026-03-17
---

# Phase 7 Plan 02: Table Interactions — Page Integration Summary

**ProcessosPage, PrazosPage, and ClientesPage wired with persistent sort via localStorage, keyboard shortcuts (N/Esc), column visibility toggles, and client hover card on processos**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-17T13:30:00Z
- **Completed:** 2026-03-17T13:55:00Z
- **Tasks:** 2 auto-tasks complete, 1 checkpoint pending human verification
- **Files modified:** 5

## Accomplishments
- All three listing pages now use `useTablePreferences` — sort state persists across navigation via localStorage
- ProcessosPage and PrazosPage have `ColumnVisibilityToggle` — column visibility persists across page reloads
- N shortcut opens create modal on all three listing pages (guarded against input focus and open modals)
- Esc shortcut clears search and blurs input on ProcessosPage and ClientesPage
- ClientHoverCard wired to `clienteNome` column in ProcessosPage using `clienteId` from the API response
- Arrow key row navigation inherited automatically from DataTable (no page-level changes needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire interactions into ProcessosPage** - `815d3fd` (feat)
2. **Task 2: Wire interactions into PrazosPage and ClientesPage** - `3462706` (feat)

## Files Created/Modified
- `packages/app-desktop/src/pages/processos/processos-page.tsx` - All 5 INT interactions wired
- `packages/app-desktop/src/pages/prazos/prazos-page.tsx` - Persistent sort, column visibility, N shortcut
- `packages/app-desktop/src/pages/clientes/clientes-page.tsx` - Persistent sort, N shortcut, Esc-to-clear-search
- `packages/app-desktop/src/lib/api.ts` - Added clienteId to ProcessoListRow interface
- `packages/database/src/services/processos.ts` - Added clienteId to listSelect() query

## Decisions Made
- `clienteId` was missing from `ProcessoListRow` interface and the database `listSelect()` query. Added it to both so `ClientHoverCard` can be wired — this is the data needed for hover card fetching and was a straightforward auto-fix (Rule 2 - missing critical functionality).
- `ColumnVisibilityToggle` columns prop is filtered to exclude the actions column (empty `header`) since it makes no sense to hide action buttons from the toggle UI.
- `ClientesPage` intentionally receives no `ColumnVisibilityToggle` — INT-03 specifies processos and prazos only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added clienteId to ProcessoListRow and database listSelect query**
- **Found during:** Task 1 (ProcessosPage ClientHoverCard wiring)
- **Issue:** TypeScript error TS2339: Property 'clienteId' does not exist on type 'ProcessoListRow'. The interface only had clienteNome but ClientHoverCard requires clienteId for its API fetch. The database listSelect() also did not include it.
- **Fix:** Added `clienteId: string | null` to `ProcessoListRow` in api.ts; added `clienteId: this.processos.clienteId` to `listSelect()` in the processos database service.
- **Files modified:** packages/app-desktop/src/lib/api.ts, packages/database/src/services/processos.ts
- **Verification:** TypeScript passes with no errors after the fix
- **Committed in:** 815d3fd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical functionality)
**Impact on plan:** The fix was required for INT-04 hover card wiring to function. No scope creep — clienteId was already present in the DB schema and the join was already performed; it just wasn't selected.

## Issues Encountered
None beyond the clienteId deviation documented above.

## User Setup Required
None - no external service configuration required. Preferences persist in browser localStorage automatically.

## Next Phase Readiness
- All 5 INT requirements addressed and ready for human verification (checkpoint:human-verify pending)
- Phase 07 will be complete after checkpoint approval
- Phase 08 (data-display) can begin after this is verified

---
*Phase: 07-table-interactions*
*Completed: 2026-03-17*
