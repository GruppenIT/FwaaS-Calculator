---
phase: 04-detail-pages-auth-e-polish
plan: "01"
subsystem: processo-detail
tags: [tabs, url-routing, print, accessibility, animations]
dependency_graph:
  requires: []
  provides: [tabbed-processo-detail, data-print-section-contract]
  affects: [04-03-print-stylesheet]
tech_stack:
  added: []
  patterns:
    - useSearchParams for URL-driven tab state
    - AnimatePresence keyed on activeTab for tab transitions
    - useReducedMotion for accessible animations
    - data-print-section attribute contract for print stylesheet
    - role=tablist/tab/tabpanel ARIA pattern
key_files:
  created: []
  modified:
    - packages/app-desktop/src/pages/processos/processo-detail-page.tsx
decisions:
  - "All tab panels rendered in DOM simultaneously (not conditionally) so data-print-section CSS contract with Plan 04-03 works"
  - "useSearchParams with replace:false (default) adds history entry per tab change enabling browser back/forward"
  - "AnimatePresence keyed on activeTab re-mounts motion.div per tab change — acceptable for lightweight sections"
  - "Tarefas tab fetches via listarTarefas({ processoId }) added to existing carregar() Promise.all"
  - "Financeiro tab conditionally included in allTabs array based on financeiroEnabled flag"
metrics:
  duration: "3 minutes"
  completed: "2026-03-16"
  tasks_completed: 1
  files_modified: 1
---

# Phase 4 Plan 01: Processo Detail Page Tabbed Layout Summary

**One-liner:** Tabbed processo detail with 6 URL-driven tabs (useSearchParams), all panels in DOM for print stylesheet contract, count badges, reduced-motion animation.

## What Was Built

Converted processo-detail-page.tsx from a flat scrollable layout to a tabbed layout with:

- 6 tabs: Dados Gerais, Prazos, Movimentacoes, Documentos, Financeiro (gated), Tarefas
- URL-driven tab state via `useSearchParams` — `?tab=prazos` navigates directly to Prazos tab
- Browser back/forward navigates between tab history entries
- Tab bar using `role="tablist"` with underline-style active indicator (Stripe/GitHub inspired)
- Count badges on each tab showing item counts from `carregar()` data
- All tab panels always in DOM with `data-print-section` attribute for Plan 04-03 print contract
- Inactive tabs hidden via Tailwind `hidden` class (overridable by `[data-print-section] { display: block !important }` in print CSS)
- AnimatePresence + motion.div keyed on `activeTab` with `useReducedMotion()` support
- New Tarefas tab fetching via `listarTarefas({ processoId })` added to `carregar()` Promise.all
- Header area (CNJ + breadcrumb + status badges + edit button) stays above tabs, always visible
- All existing functionality preserved: ProcessoModal, DocumentoModal, DocumentoEditModal, DocumentoViewer, ConfirmDialog, download, sync

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added Tarefas tab content and fetch**
- **Found during:** Task 1 — plan specified Tarefas tab but current file had no tarefas data fetch or content
- **Fix:** Added `TarefaRow` import, `tarefas` state, `listarTarefas({ processoId: id })` to `carregar()` Promise.all, and full Tarefas tab content with status/priority/responsible/deadline display
- **Files modified:** packages/app-desktop/src/pages/processos/processo-detail-page.tsx
- **Commit:** 1ea6e8e

## Self-Check

- [x] `packages/app-desktop/src/pages/processos/processo-detail-page.tsx` exists and modified
- [x] TypeScript compiles without errors (`npx tsc --noEmit` passes)
- [x] `data-print-section` attribute present on all tab panel divs (inside allTabs.map)
- [x] `useSearchParams` imported and used for tab state
- [x] Commit 1ea6e8e exists

## Self-Check: PASSED
