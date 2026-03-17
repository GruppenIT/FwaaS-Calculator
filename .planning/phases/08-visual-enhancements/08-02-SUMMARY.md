---
phase: 08-visual-enhancements
plan: 02
subsystem: ui
tags: [react, typescript, timeline, processo, movimentacoes, prazos]

# Dependency graph
requires:
  - phase: 07-table-interactions
    provides: processo detail page with tab system and fetched movimentacoes/prazos data
provides:
  - ProcessoTimeline component merging movimentacoes and prazos in chronological view
  - Timeline tab on processo detail page between Dados Gerais and Prazos
affects: [08-visual-enhancements, processo-detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [timeline-merge-pattern, month-grouping-pattern, visual-type-distinction]

key-files:
  created:
    - packages/app-desktop/src/components/ui/processo-timeline.tsx
  modified:
    - packages/app-desktop/src/pages/processos/processo-detail-page.tsx

key-decisions:
  - "Timeline uses date column + circle node + content card layout with a single vertical line running through nodes"
  - "prazoNodeColor derived from p.status: pendente=warning, cumprido=success, perdido=danger"
  - "Month grouping uses YYYY-MM key for reliable sorting; label formatted with toLocaleDateString pt-BR"
  - "Urgent items get border-l-2 border-l-causa-danger on both the row and the content card"
  - "var(--color-tier-warning) used as fallback for prazo pending color with CSS variable inline style"

patterns-established:
  - "Timeline merge pattern: map each array to unified TimelineItem, sort descending by date, group by monthKey"
  - "Month separator: text-xs-causa uppercase tracking-wide + flex-1 h-px divider line"
  - "Circle node: 24x24px, white bg, colored border, icon centered — connected by absolute vertical line"

requirements-completed: [VIS-02]

# Metrics
duration: 12min
completed: 2026-03-17
---

# Phase 8 Plan 02: Timeline Tab Summary

**Chronological audit trail tab on processo detail page merging movimentacoes and prazos, grouped by month with visual type distinction**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-17T17:32:14Z
- **Completed:** 2026-03-17T17:44:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- ProcessoTimeline component (200 lines) renders merged movimentacoes + prazos sorted newest-first
- Events grouped by month with styled separator headers ("Marco 2026", "Fevereiro 2026")
- Visual distinction: FileText icon (primary color) for movimentacoes; Clock icon with status-driven color for prazos
- Urgent movimentacoes flagged with AlertTriangle icon and red left-border accent
- Teor excerpt shown with line-clamp-2 for movimentacoes that have content
- Empty state with Clock icon and "Nenhum evento registrado" message
- Timeline tab inserted between "Dados Gerais" and "Prazos" with combined event count badge
- No new data fetching — reuses movimentacoes and prazos already loaded in carregar()

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ProcessoTimeline component** - `5cbc2f7` (feat)
2. **Task 2: Add Timeline tab to processo detail page** - `08e8e3f` (feat)

## Files Created/Modified

- `packages/app-desktop/src/components/ui/processo-timeline.tsx` — Reusable timeline component, 200 lines, exports ProcessoTimeline
- `packages/app-desktop/src/pages/processos/processo-detail-page.tsx` — Added import, timeline tab entry in allTabs, and timeline tab panel

## Decisions Made

- Timeline uses date column (dd/MM) + circle node + content card layout with a vertical line running through all nodes. This creates a clear visual audit trail.
- Prazo node color derived from status: pending=warning, cumprido=success, perdido=danger — matches existing PRAZO_STATUS_STYLES convention.
- Month grouping uses YYYY-MM key for reliable sorting; label uses toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).
- Status badge on prazo cards uses inline style with `${nodeColor}1a` for background alpha — reuses the computed color variable rather than duplicating Tailwind classes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled cleanly after both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timeline component ready and wired into processo detail page
- ProcessoTimeline is standalone and reusable — could be embedded elsewhere
- Phase 08-03 (if planned) can build on this foundation
