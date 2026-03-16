---
phase: 03-core-feature-screens
plan: 03
subsystem: ui
tags: [react, typescript, datatable, badge, vitest]

# Dependency graph
requires:
  - phase: 03-01
    provides: DataTable component, Badge component, PrazoCountdown component

provides:
  - Processos listing page using DataTable with Badge status and mono-font CNJ
  - Prazos listing page using DataTable with PrazoCountdown and tier-based URL filtering
  - Clientes listing page using DataTable with row click navigation
  - Exported STATUS_TO_BADGE mapping with 7 unit tests

affects: [detail pages, navigation, any future listing pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [DataTable with cast pattern for typed interfaces, useMemo sort, sortState as optional spread]

key-files:
  created:
    - packages/app-desktop/src/pages/processos/processos-page.test.ts
  modified:
    - packages/app-desktop/src/pages/processos/processos-page.tsx
    - packages/app-desktop/src/pages/prazos/prazos-page.tsx
    - packages/app-desktop/src/pages/clientes/clientes-page.tsx

key-decisions:
  - "DataTable<T extends Record<string, unknown>> requires `as unknown as` double cast when using typed interfaces — cannot be avoided without changing DataTable signature"
  - "sortState spread conditionally with {...(sortState !== undefined ? { sortState } : {})} for exactOptionalPropertyTypes compatibility"
  - "Clientes status column uses statusCliente field (not status) — matches actual ClienteData interface"
  - "PrazoRow uses tipoPrazo field (not tipo) — matches actual interface"
  - "prazos-page tier filter uses diasRestantes imported from prazo-countdown.tsx — removes duplicated local function"

patterns-established:
  - "Typed-to-DataTable cast: use `as unknown as Column<Record<string, unknown>>[]` and `as unknown as Record<string, unknown>[]` to bridge typed interfaces with DataTable generic constraint"
  - "Column widths budget: 1366px viewport - 240px sidebar - 48px padding = 1078px max, verified per page"
  - "Sort integration: useMemo sorts filtrados based on sortState, passes sorted array to DataTable data prop"

requirements-completed: [LIST-01, LIST-03, LIST-04, LIST-05]

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 03 Plan 03: Listing Pages DataTable Migration Summary

**Three listing pages (processos/prazos/clientes) migrated from manual HTML tables to DataTable with Badge status mapping, mono-font CNJ/CPF-CNPJ display, PrazoCountdown integration, and 7-test STATUS_TO_BADGE unit suite**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T11:39:08Z
- **Completed:** 2026-03-16T11:45:00Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- Processos page: DataTable with Badge status display, CNJ in JetBrains Mono 13px, sort state, exported STATUS_TO_BADGE mapping covering all 5 processo statuses
- Prazos page: DataTable with PrazoCountdown in description column, tier-based URL filter (?tier=fatal/urgente/semana/proximo), diasRestantes imported from prazo-countdown.tsx
- Clientes page: DataTable with CPF/CNPJ in mono font, row click navigation to detail
- All 3 pages: column widths budgeted within 1078px, no horizontal scroll at 1366x768, action buttons with stopPropagation

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate processos-page to DataTable with Badge + STATUS_TO_BADGE tests** - `e035622` (feat)
2. **Task 2: Migrate prazos-page and clientes-page to DataTable** - `f3a8473` (feat)

**Plan metadata:** (docs commit — see below)

_Note: Task 1 followed TDD: RED (failing tests) → GREEN (implementation passing tests)_

## Files Created/Modified
- `packages/app-desktop/src/pages/processos/processos-page.tsx` - DataTable + Badge + STATUS_TO_BADGE (exported), sort state, mono CNJ
- `packages/app-desktop/src/pages/processos/processos-page.test.ts` - 7 unit tests for STATUS_TO_BADGE (all 5 statuses + count + type validity)
- `packages/app-desktop/src/pages/prazos/prazos-page.tsx` - DataTable + PrazoCountdown + tier URL filter + diasRestantes import
- `packages/app-desktop/src/pages/clientes/clientes-page.tsx` - DataTable + statusCliente-aware status column + mono CPF/CNPJ

## Decisions Made
- `DataTable<T extends Record<string, unknown>>` requires double cast (`as unknown as`) when using typed interfaces — the component signature uses a constrained generic that doesn't overlap with specific typed interfaces. Kept the cast pattern rather than modifying DataTable (preserves existing DataTable contract).
- `sortState` is spread conditionally to satisfy `exactOptionalPropertyTypes` strictness (same pattern established in Phase 01).
- Clientes status column maps `statusCliente` (actual field name in `ClienteData`) not `status` — plan used generic `status` but real interface differs.
- PrazoRow uses `tipoPrazo` (actual field name) for the Tipo column key — plan used `tipo` but real interface differs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DataTable generic constraint incompatibility**
- **Found during:** Task 1 (processos-page TypeScript check)
- **Issue:** `DataTable<T extends Record<string, unknown>>` doesn't accept typed interfaces like `ProcessoListRow` — TypeScript errors on `Column<ProcessoListRow>[]` cast
- **Fix:** Used `as unknown as Column<Record<string, unknown>>[]` double cast for columns, `as unknown as Record<string, unknown>[]` for data, `r['id'] as string` for keyExtractor/onRowClick
- **Files modified:** processos-page.tsx, prazos-page.tsx, clientes-page.tsx
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** e035622 (Task 1), f3a8473 (Task 2)

**2. [Rule 1 - Bug] Fixed field name mismatches from plan spec vs actual interfaces**
- **Found during:** Task 2 (prazos + clientes review)
- **Issue:** Plan used `tipo` for PrazoRow column but actual field is `tipoPrazo`; plan used `status` for ClienteData column but actual field is `statusCliente`
- **Fix:** Used `tipoPrazo` as column key in prazos-page, `statusCliente` in clientes-page
- **Files modified:** prazos-page.tsx, clientes-page.tsx
- **Verification:** TypeScript compiles, no unknown-property errors
- **Committed in:** f3a8473 (Task 2)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes required for TypeScript correctness. No scope creep.

## Issues Encountered
- DataTable component's generic constraint `T extends Record<string, unknown>` creates friction with typed domain interfaces. The cast pattern is the correct solution without changing the DataTable contract. Future listing pages should follow the same `as unknown as` pattern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 listing pages use DataTable consistently — visual alignment across listings complete
- STATUS_TO_BADGE exported and tested — ready for reuse in detail pages or other components
- PrazoCountdown integrated in prazos listing — tier system fully visible in table context
- Ready for Phase 03 Plan 04 (detail pages or remaining feature screens)

---
*Phase: 03-core-feature-screens*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: packages/app-desktop/src/pages/processos/processos-page.tsx
- FOUND: packages/app-desktop/src/pages/processos/processos-page.test.ts
- FOUND: packages/app-desktop/src/pages/prazos/prazos-page.tsx
- FOUND: packages/app-desktop/src/pages/clientes/clientes-page.tsx
- FOUND: .planning/phases/03-core-feature-screens/03-03-SUMMARY.md
- FOUND commit: e035622
- FOUND commit: f3a8473
