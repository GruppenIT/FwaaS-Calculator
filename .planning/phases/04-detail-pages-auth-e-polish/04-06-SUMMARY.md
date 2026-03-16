---
phase: 04-detail-pages-auth-e-polish
plan: 06
subsystem: layout/listing-pages
tags: [print, animation, sidebar, datatable, gap-closure]
dependency_graph:
  requires: []
  provides: [DET-03, ANIM-03]
  affects:
    - packages/app-desktop/src/components/layout/sidebar.tsx
    - packages/app-desktop/src/pages/processos/processos-page.tsx
    - packages/app-desktop/src/pages/clientes/clientes-page.tsx
    - packages/app-desktop/src/pages/prazos/prazos-page.tsx
tech_stack:
  added: []
  patterns:
    - isFirstLoad state pattern for controlled animation prop in listing pages
key_files:
  created: []
  modified:
    - packages/app-desktop/src/components/layout/sidebar.tsx
    - packages/app-desktop/src/pages/processos/processos-page.tsx
    - packages/app-desktop/src/pages/clientes/clientes-page.tsx
    - packages/app-desktop/src/pages/prazos/prazos-page.tsx
decisions:
  - "data-sidebar attribute added to sidebar aside element to fulfill globals.css @media print [data-sidebar] CSS contract"
  - "isFirstLoad starts true in each listing page, flips to false after first carregar() finally block — idempotent, correct for subsequent filter/sort triggered calls"
metrics:
  duration: 2min
  completed_date: "2026-03-16"
  tasks: 2
  files: 4
requirements_closed: [DET-03, ANIM-03]
---

# Phase 04 Plan 06: Gap Closure — Print Sidebar + Row Stagger Wiring Summary

**One-liner:** Wire sidebar data-sidebar attribute and isFirstLoad-controlled animateFirstLoad prop to close DET-03 print hide and ANIM-03 row stagger verification gaps.

## What Was Done

Two verification gaps from `04-VERIFICATION.md` were closed in this plan. Both gaps were infrastructure-complete but never connected to their consumers.

### Task 1 — Add data-sidebar attribute to sidebar aside element

**Commit:** `4a6942a`

The `globals.css` `@media print` block had `[data-sidebar] { display: none !important }` documented since Plan 04-03, but the `aside` element in `sidebar.tsx` was missing the `data-sidebar` attribute. Added the attribute to line 159 of `sidebar.tsx`. The CSS selector now has a matching DOM element and the sidebar will be hidden completely when printing.

### Task 2 — Wire animateFirstLoad prop to all listing pages DataTables

**Commit:** `c65a9f8`

Three listing pages (`processos-page.tsx`, `clientes-page.tsx`, `prazos-page.tsx`) each received:
- `const [isFirstLoad, setIsFirstLoad] = useState(true)` state declaration
- `setIsFirstLoad(false)` call in the `carregar()` `finally` block
- `animateFirstLoad={isFirstLoad}` prop on the `DataTable` usage

The DataTable's animation infrastructure (row stagger CSS keyframes, `animateFirstLoad` prop definition) was already complete from Plan 04-03. This plan only wired the three consumers.

**Behavior:** On first page load `isFirstLoad=true`, rows stagger-animate with 20ms delay per row (cap 10). After the first data fetch completes, `isFirstLoad` becomes `false`. Subsequent calls triggered by sorting or filtering pass `false`, so rows appear instantly.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `grep -n "data-sidebar" sidebar.tsx` — confirmed: line 159 has `data-sidebar` attribute
2. `grep -n "animateFirstLoad" processos-page.tsx clientes-page.tsx prazos-page.tsx` — confirmed: prop wired in all 3 pages at lines 371, 267, 310 respectively
3. TypeScript compile: `npx tsc --noEmit` — no errors

## Self-Check: PASSED

Files confirmed:
- `packages/app-desktop/src/components/layout/sidebar.tsx` — FOUND, contains `data-sidebar`
- `packages/app-desktop/src/pages/processos/processos-page.tsx` — FOUND, contains `animateFirstLoad`
- `packages/app-desktop/src/pages/clientes/clientes-page.tsx` — FOUND, contains `animateFirstLoad`
- `packages/app-desktop/src/pages/prazos/prazos-page.tsx` — FOUND, contains `animateFirstLoad`

Commits confirmed:
- `4a6942a` — feat(04-06): add data-sidebar attribute to sidebar aside element
- `c65a9f8` — feat(04-06): wire animateFirstLoad prop to processos, clientes, prazos DataTables
