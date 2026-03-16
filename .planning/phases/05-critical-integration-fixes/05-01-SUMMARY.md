---
plan: 05-01
status: complete
started: 2026-03-16T17:50:00Z
completed: 2026-03-16T17:55:00Z
requirements_completed: [DS-01, DS-18, DET-01, LIST-02, LIST-05, DS-11]
---

# Plan 05-01 Summary: Critical Integration Fixes

## What Was Done

### Task 1: Add --color-causa-info Token (HIGH)
- Added `--color-causa-info: var(--color-info)` to `@theme inline` block in globals.css
- Added `--color-info: #2563a8` to `:root` (light mode)
- Added `--color-info: #3b82f6` to `.dark` (dark mode)
- Prospecto status badge in clientes-page.tsx and cliente-detail-page.tsx now renders visibly

### Task 2: Deduplicate diasRestantes (MEDIUM)
- Removed timezone-unsafe local `diasRestantes()` from processo-detail-page.tsx (lines 115-120)
- Added import of UTC-safe `diasRestantes` from `prazo-countdown.tsx`
- Prazos tab in processo detail now uses same timezone-safe calculation as listing pages

### Task 3: Barrel Export Adoption (SHOULD)
- Converted clientes-page.tsx from 6 direct component imports to single barrel import from `components/ui/index.ts`
- First consumer to use barrel export, proving the pattern works

## Files Changed
- `packages/app-desktop/src/styles/globals.css` — 3 lines added (token definition)
- `packages/app-desktop/src/pages/processos/processo-detail-page.tsx` — 6 lines removed, 1 added (import swap)
- `packages/app-desktop/src/pages/clientes/clientes-page.tsx` — 6 lines replaced by 2 (barrel import)

## Verification
- TypeScript compilation: clean (0 errors)
- All three audit gaps addressed
