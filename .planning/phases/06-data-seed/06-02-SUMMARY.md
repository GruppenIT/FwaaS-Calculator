---
phase: 06-data-seed
plan: 02
subsystem: database
tags: [seed, sqlite, verification, idempotency, date-format-fix]

# Dependency graph
requires:
  - phase: 06-data-seed/06-01
    provides: "seed-demo.ts script with 13 entity factories, pnpm db:seed:demo command"
provides:
  - Verified idempotent demo seed with all entity types rendering in UI
  - Date format fixes for dataFatal, vencimento, timesheet, despesas
  - api-server.ts Windows path fix for standalone execution
affects: [07-interacao, 08-polish, demo-presentations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Date-only strings (YYYY-MM-DD) for fields parsed by UI with split('-') or + 'T00:00:00'"
    - "Windows import.meta.url normalization for isDirectRun detection"

key-files:
  created: []
  modified:
    - packages/database/src/seeds/seed-demo.ts
    - packages/database/src/api-server.ts

key-decisions:
  - "Date fields consumed by UI formatters must be date-only (YYYY-MM-DD), not full ISO"
  - "seed-demo.ts writes to causa.db (same as api-server), not causa-dev.db"
  - "api-server isDirectRun uses normalized path comparison for Windows compatibility"

patterns-established:
  - "randomDateOnly() helper for seed fields that feed UI date formatters"

requirements-completed: [SEED-02, SEED-03]

# Metrics
duration: 25min
completed: 2026-03-17
---

# Phase 6 Plan 02: Seed Verification Summary

**Seed data verified across all app pages — date format bugs fixed during visual verification checkpoint**

## Performance

- **Duration:** 25 min (includes human verification loop)
- **Completed:** 2026-03-17
- **Tasks:** 2/2 completed (human-verified)

## Accomplishments

- Verified seed idempotency: two consecutive runs produce identical counts, no duplicates
- Verified all 13 entity types display correctly in the app UI
- Fixed 3 date format bugs discovered during visual verification:
  - `dataFatal` stored as full ISO → UI `split('-')` and `+ 'T00:00:00'` patterns broke
  - `vencimento` in parcelas stored as full ISO
  - Timesheet `data` and despesa `data` stored as full ISO
- Fixed api-server.ts `isDirectRun` detection failing on Windows due to path format mismatch
- Fixed seed writing to `causa-dev.db` instead of `causa.db` (API reads `causa.db`)

## Task Commits

| Commit | Description |
|--------|-------------|
| 9f221af | fix(06-02): correct date formats in seed and api-server startup |

## Issues Encountered

**Date format mismatch (fixed)**
UI date formatters expected date-only strings (`YYYY-MM-DD`) but seed generated full ISO (`YYYY-MM-DDTHH:mm:ss.sssZ`). The UI concatenates `+ 'T00:00:00'` which breaks on full ISO, producing "Invalid Date" and "NaNd restantes". Fixed by adding `randomDateOnly()` helper and using date-only strings for all UI-consumed date fields.

**api-server standalone startup (fixed)**
`import.meta.url` on Windows uses forward slashes while `process.argv[1]` uses backslashes, causing `isDirectRun` to always be false. Fixed with normalized path comparison.

**better-sqlite3 Node 24 incompatibility (resolved)**
Required `nvm install 22` + `nvm use 22` + `pnpm install` to rebuild native binary for Node 22.

## Self-Check: PASSED

- SUMMARY.md: FOUND at `.planning/phases/06-data-seed/06-02-SUMMARY.md`
- Commits: 1 fix commit for date format and api-server bugs
- Human verification: APPROVED

---
*Phase: 06-data-seed*
*Completed: 2026-03-17*
