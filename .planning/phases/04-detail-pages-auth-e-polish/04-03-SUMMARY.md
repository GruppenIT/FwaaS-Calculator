---
phase: 04-detail-pages-auth-e-polish
plan: "03"
subsystem: clientes-detail, print-stylesheet
tags: [financeiro, feature-flag, print, css, honorarios]
dependency_graph:
  requires: []
  provides: [ResumoFinanceiro, print-media-rules]
  affects: [cliente-detail-page, globals.css, processo-detail-page]
tech_stack:
  added: []
  patterns:
    - Intl.NumberFormat for BRL currency formatting
    - CSS @media print with data-attribute contracts
    - Feature-flagged data fetching inside useCallback
key_files:
  created: []
  modified:
    - packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx
    - packages/app-desktop/src/styles/globals.css
decisions:
  - ResumoFinanceiro fetches all honorarios then filters client-side by clienteId — consistent with existing process pattern in the page
  - brl Intl.NumberFormat defined at module level (not inside component) to avoid recreation on each render
  - SegmentLabel extracted as a separate function component for readability despite being file-local
  - CSS data-print-section contract documented in comments so processo-detail-page plan knows the required attribute
  - button display:none in print is intentional — hides tab bar and action buttons for clean layout
metrics:
  duration: "~2 min"
  completed: "2026-03-16"
  tasks_completed: 2
  files_modified: 2
---

# Phase 4 Plan 03: Financial Summary Card and Print Stylesheet Summary

ResumoFinanceiro stacked-bar card on cliente detail gated by financeiro flag, plus @media print rules for clean processo detail printing.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add ResumoFinanceiro card to cliente detail page | be8f1fa | cliente-detail-page.tsx |
| 2 | Add CSS @media print rules for processo detail | 2fcbb61 | globals.css |

## What Was Built

### Task 1: ResumoFinanceiro Card (DET-02)

Added an inline financial summary section to `cliente-detail-page.tsx`:

- **Data fetch**: `listarHonorarios()` called inside `carregar()` when `financeiroEnabled` is true, then filtered by `clienteId` client-side
- **State**: `honorarios: HonorarioRow[]` added to component state
- **Placement**: After "Informacoes Adicionais" card, before "Processos vinculados"
- **Gate**: Entire section wrapped in `{financeiroEnabled && <ResumoFinanceiro ... />}`
- **Component**: `ResumoFinanceiro` calculates recebido/pendente/inadimplente totals and percentages
- **Bar**: Flex container with three colored segments (green=recebido, blue=pendente, muted=inadimplente)
- **Labels**: `SegmentLabel` sub-component shows colored dot, label, BRL value, and percentage
- **Empty state**: Plain text message when `totalFaturado === 0`
- **Currency**: Module-level `brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

### Task 2: Print Stylesheet (DET-03)

Added `@media print` block to `globals.css` at the end of the file:

- **Hidden in print**: `[data-sidebar]`, `nav:not([role="tablist"])`, `header`, `.no-print`, `button`
- **Full-width content**: `main { padding: 0; overflow: visible }`
- **Layout reset**: `.flex.h-screen { display: block; height: auto }`
- **Tab sections**: `[data-print-section] { display: block !important }` — contract for processo-detail-page
- **Page breaks**: `[class*="rounded-"] { break-inside: avoid }`
- **Ink savings**: `box-shadow: none` on all elements
- **Readability**: `body { color: #000; background: white }`
- **Documentation**: Comments explain the `data-print-section` and `data-sidebar` attribute contracts

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx
- FOUND: packages/app-desktop/src/styles/globals.css
- FOUND commit be8f1fa: feat(04-03): add ResumoFinanceiro card to cliente detail page
- FOUND commit 2fcbb61: feat(04-03): add CSS @media print rules for processo detail (DET-03)
- ResumoFinanceiro appears 2 times in cliente-detail-page.tsx (component definition + usage)
- @media print appears 1 time in globals.css
- TypeScript compiles with no errors
