---
phase: 08-visual-enhancements
plan: 03
subsystem: fullstack
tags: [drizzle, sqlite, api, react, svg, sparkline, dashboard, seed]

# Dependency graph
requires:
  - phase: 06-data-seed
    provides: seed infrastructure with faker.seed(42) pattern
  - phase: 03-core-feature-screens
    provides: dashboard page with StatCard components
provides:
  - kpi_snapshots table for daily metric snapshots
  - GET /api/dashboard/sparklines endpoint
  - Auto-record snapshot on dashboard load (once per day)
  - Sparkline SVG component
  - 30 days of seeded historical KPI data
affects: [08-visual-enhancements, dashboard, database-schema]

# Tech tracking
tech-stack:
  added: []
  patterns: [sparkline-svg, auto-snapshot-recording, kpi-snapshot-table]

key-files:
  created:
    - packages/database/src/schema/kpi-snapshots.ts
    - packages/database/src/schema-pg/kpi-snapshots.ts
    - packages/app-desktop/src/components/ui/sparkline.tsx
    - packages/database/src/migrations/0011_typical_living_lightning.sql
  modified:
    - packages/database/src/schema/index.ts
    - packages/database/src/schema-pg/index.ts
    - packages/database/src/api-server.ts
    - packages/database/src/seeds/seed-demo.ts
    - packages/app-desktop/src/lib/api.ts
    - packages/app-desktop/src/pages/dashboard/dashboard-page.tsx

key-decisions:
  - "Pure SVG sparkline — no recharts dependency for a 30-point line"
  - "Auto-snapshot recording in existing dashboard GET handler (at most once per day)"
  - "exactOptionalPropertyTypes fix: sparklineData?: number[] | undefined"
  - "Seed uses Math.random with trending patterns (processos grow, prazos fluctuate)"

requirements-completed: [VIS-03]

# Metrics
duration: 20min
completed: 2026-03-17
---

# Phase 8 Plan 03: KPI Sparklines Summary

**Dashboard KPI stat cards display sparkline mini-charts with actual 30-day trend data from kpi_snapshots table**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- kpi_snapshots SQLite + PG table schema with daily metric columns
- Drizzle migration generated (0011_typical_living_lightning.sql)
- GET /api/dashboard/sparklines returns last 30 days ordered by date
- Dashboard auto-records daily KPI snapshot on load (idempotent, once per day)
- getDashboardSparklines() frontend API function with KpiSnapshot type
- Sparkline SVG component — minimal trend line, no axes/labels, strokeLinecap round
- Seed generates 30 days of realistic trending data (processos grow, prazos fluctuate)
- All 7 StatCards wired with sparkline data via extractSparkline helper
- Fixed exactOptionalPropertyTypes compatibility for optional sparkline props

## Task Commits

1. **Task 1: Schema, migration, API endpoint, frontend function** - `759eb8c` (feat)
2. **Task 2: Seed data and Sparkline component** - `bcac98b` (feat)
3. **Task 3: Wire sparklines into dashboard StatCards** - `73ae847` (feat)

## Files Created/Modified

- `packages/database/src/schema/kpi-snapshots.ts` — SQLite table definition
- `packages/database/src/schema-pg/kpi-snapshots.ts` — PG table definition
- `packages/app-desktop/src/components/ui/sparkline.tsx` — SVG sparkline component
- `packages/database/src/api-server.ts` — sparklines endpoint + auto-record
- `packages/database/src/seeds/seed-demo.ts` — 30 days of KPI snapshot seed data
- `packages/app-desktop/src/lib/api.ts` — KpiSnapshot type + getDashboardSparklines
- `packages/app-desktop/src/pages/dashboard/dashboard-page.tsx` — StatCard sparkline props + wiring

## Deviations from Plan

- Added `| undefined` to sparklineData/sparklineColor props for exactOptionalPropertyTypes compatibility

## Issues Encountered

- TypeScript exactOptionalPropertyTypes required `| undefined` on optional props — fixed in orchestrator
