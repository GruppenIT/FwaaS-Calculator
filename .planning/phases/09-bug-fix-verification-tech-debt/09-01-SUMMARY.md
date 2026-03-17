---
phase: 09-bug-fix-verification-tech-debt
plan: 01
subsystem: ui, api
tags: [react, permissions, drizzle, dashboard, barrel-exports]

# Dependency graph
requires:
  - phase: 07-interaction-patterns
    provides: PrazosPage with usePermission hook and can() guard pattern
  - phase: 08-visual-enhancements
    provides: Sparkline and ProcessoTimeline components

provides:
  - Correct prazos permission guards in PrazosPage (N shortcut + header button)
  - Real prazosFatais count query (fatal=true AND status=pendente)
  - Sparkline and ProcessoTimeline exported from UI barrel index.ts

affects:
  - dashboard stats consumers
  - prazos access control
  - ui component imports

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Permission guard pattern: can('resource:criar') || can('resource:editar') for create actions"
    - "Drizzle count with compound where: and(eq(status,'pendente'), eq(fatal,true))"

key-files:
  created: []
  modified:
    - packages/app-desktop/src/pages/prazos/prazos-page.tsx
    - packages/database/src/api-server.ts
    - packages/app-desktop/src/components/ui/index.ts

key-decisions:
  - "N shortcut and PageHeader action both use can('prazos:criar') || can('prazos:editar') — consistent with prazos domain permissions"
  - "prazosFataisCount uses same Drizzle count pattern as prazosPendentes, with and() compound where clause"

patterns-established:
  - "Permission guards on prazos pages use prazos:(criar|editar), not processos permissions"
  - "All UI barrel exports belong in packages/app-desktop/src/components/ui/index.ts"

requirements-completed: [INT-02, VIS-03]

# Metrics
duration: 10min
completed: 2026-03-17
---

# Phase 09 Plan 01: Bug Fix, Verification, Tech Debt Summary

**Permission copy-paste bug fixed in PrazosPage, prazosFatais now queries real fatal+pendente count, and Sparkline/ProcessoTimeline added to UI barrel exports**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-17T18:35:00Z
- **Completed:** 2026-03-17T18:45:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed PrazosPage N keyboard shortcut — now checks `prazos:criar || prazos:editar` (was copying `processos:editar`)
- Fixed PageHeader "Novo prazo" button guard — same prazos permission fix
- Implemented real `prazosFatais` Drizzle query filtering `fatal=true AND status=pendente` — both kpiSnapshots insert and dashboard response updated
- Added `Sparkline` and `ProcessoTimeline` exports to UI barrel index.ts, making them importable via `@/components/ui`

## Task Commits

1. **Task 1: Fix PrazosPage permission bug and add UI barrel exports** - `e831ebc` (fix)
2. **Task 2: Implement real prazosFatais query in api-server.ts** - `909b90a` (feat)

## Files Created/Modified

- `packages/app-desktop/src/pages/prazos/prazos-page.tsx` - Fixed two permission guards (lines 131, 313) from `processos:editar` to `prazos:criar || prazos:editar`
- `packages/database/src/api-server.ts` - Added `prazosFataisCount` query, replaced hardcoded `0` in snapshot insert and dashboard response
- `packages/app-desktop/src/components/ui/index.ts` - Added exports for Sparkline and ProcessoTimeline

## Decisions Made

- Permission guard uses `can('prazos:criar') || can('prazos:editar')` — both roles can trigger create modal, consistent with prazos domain semantics
- `prazosFataisCount` declared inline between `prazosPendentes` and `honorariosPendentes` to maintain logical grouping of stat queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All 3 gap closure requirements (INT-02, VIS-01, VIS-03) closed
- Phase 09 plan 02 can proceed (if any remaining gap closure plans exist)

---
*Phase: 09-bug-fix-verification-tech-debt*
*Completed: 2026-03-17*

## Self-Check: PASSED

- FOUND: packages/app-desktop/src/pages/prazos/prazos-page.tsx
- FOUND: packages/database/src/api-server.ts
- FOUND: packages/app-desktop/src/components/ui/index.ts
- FOUND: .planning/phases/09-bug-fix-verification-tech-debt/09-01-SUMMARY.md
- FOUND commit: e831ebc (fix prazos permission guards + barrel exports)
- FOUND commit: 909b90a (prazosFatais real query)
