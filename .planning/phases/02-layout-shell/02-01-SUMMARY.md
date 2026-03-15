---
phase: 02-layout-shell
plan: "01"
subsystem: layout-shell
tags: [sidebar, page-header, breadcrumb, navigation, ux]
dependency_graph:
  requires: []
  provides: [sidebar-user-info, page-header-breadcrumb]
  affects: [all-detail-pages, all-list-pages]
tech_stack:
  added: []
  patterns: [breadcrumb-navigation, user-info-footer, css-token-correction]
key_files:
  created: []
  modified:
    - packages/app-desktop/src/components/layout/sidebar.tsx
    - packages/app-desktop/src/components/ui/page-header.tsx
    - packages/app-desktop/src/pages/processos/processo-detail-page.tsx
    - packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx
decisions:
  - "Status badges preserved below PageHeader in detail pages (not moved into PageHeader description) to maintain existing visual density and badge styling"
  - "BreadcrumbItem exported as named export (not export type) for cleaner consumer imports"
  - "navigate/useNavigate removed from both detail pages — was only used for ArrowLeft back button"
  - "getInitials() uses strict null-safe indexing (??'') to satisfy noUncheckedIndexedAccess tsconfig"
  - "CNJ mono font not applied to PageHeader title in processo-detail-page — deferred to Phase 3 LIST-01 as planned"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-03-15"
  tasks: 2
  files_modified: 4
---

# Phase 2 Plan 01: Layout Shell — Sidebar User Info + PageHeader Breadcrumb Summary

**One-liner:** Sidebar user info footer with initials/email/role from useAuth context, corrected hover token, and PageHeader with optional breadcrumb prop migrating both detail pages from ArrowLeft buttons.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Sidebar user info footer and token audit | ae4b81f | sidebar.tsx |
| 2 | PageHeader breadcrumb prop and detail page migration | 5764b26 | page-header.tsx, processo-detail-page.tsx, cliente-detail-page.tsx |

## What Was Built

### Task 1: Sidebar User Info Footer + Hover Token Fix

- Added `getInitials(email)` helper: extracts up to 2 initials from email local part (splits on `.`, `_`, `-`); strict null-safe for `noUncheckedIndexedAccess`
- Added `ROLE_LABELS` map and `formatRole(role)` helper for display labels
- Destructured `user` from `useAuth()` alongside existing `logout`
- Inserted user info block above theme/logout footer:
  - Circular initials avatar using `var(--color-primary)/10` background
  - Email text (truncated) + formatted role label
  - Bordered top via `border-t border-[var(--color-border)]` on the user info div
- Removed `border-t` from the existing footer div (now `px-3 pb-3 pt-1`)
- Fixed hover token on nav items: `hover:bg-causa-bg` -> `hover:bg-causa-surface-alt`
- Fixed hover token on theme toggle button: same fix
- Fixed hover token on logout button: same fix

### Task 2: PageHeader Breadcrumb + Detail Page Migration

**PageHeader (page-header.tsx):**
- Added `Link` import from `react-router-dom`
- Added exported `BreadcrumbItem` interface (`label: string; to?: string | undefined`)
- Extended `PageHeaderProps` with optional `breadcrumb?: BreadcrumbItem[] | undefined`
- Added breadcrumb `<nav>` above title/action row: linked items with `›` separator
- Outer wrapper changed from `flex items-start justify-between mb-6` to `mb-6` div with nested flex div; breadcrumb renders above the flex row

**processo-detail-page.tsx:**
- Removed `ArrowLeft` from lucide-react imports
- Removed `useNavigate` import and `navigate` variable (was only used for back button)
- Replaced custom header section (ArrowLeft + h1 + badges inline) with `<PageHeader>` component
- Status/area/prioridade/segredo/justicaGratuita badges preserved in a separate row below PageHeader

**cliente-detail-page.tsx:**
- Removed `ArrowLeft` from lucide-react imports
- Removed `useNavigate` import and `navigate` variable (was only used for back button)
- Replaced custom header section with `<PageHeader>` component
- Tipo pessoa and statusCliente badges preserved in a separate row below PageHeader

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed noUncheckedIndexedAccess errors in getInitials()**
- **Found during:** Task 1 verification (typecheck)
- **Issue:** TypeScript strict mode (`noUncheckedIndexedAccess`) flagged `parts[0][0]` and `parts[1][0]` as possibly undefined; also `email.split('@')[0]` possibly undefined
- **Fix:** Added null-coalescing (`?? ''`) on all array accesses; added bounds check guards before character indexing
- **Files modified:** packages/app-desktop/src/components/layout/sidebar.tsx
- **Commit:** ae4b81f (included in same commit)

### Known Deferred Items

- **CNJ mono font on processo title:** `font-[var(--font-mono)]` was on the old `<h1>` in processo-detail-page. PageHeader renders with Inter (default). This is intentional per plan comment — will be addressed in Phase 3 LIST-01 as part of the processo list/detail redesign.

## Verification Results

- `pnpm typecheck` — zero errors (both tasks)
- `pnpm vitest run` — 1 test file passes (5 tests); 3 test files fail due to pre-existing `drizzle-orm/better-sqlite3` missing package in `packages/database` — unrelated to this plan
- `grep hover:bg-causa-bg sidebar.tsx` — 0 matches
- `grep ArrowLeft processo-detail-page.tsx cliente-detail-page.tsx` — 0 matches

## Self-Check: PASSED

Files exist:
- packages/app-desktop/src/components/layout/sidebar.tsx — FOUND
- packages/app-desktop/src/components/ui/page-header.tsx — FOUND
- packages/app-desktop/src/pages/processos/processo-detail-page.tsx — FOUND
- packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx — FOUND

Commits exist:
- ae4b81f — FOUND (feat(02-01): sidebar user info footer and hover token fix)
- 5764b26 — FOUND (feat(02-01): PageHeader breadcrumb + migrate detail pages from ArrowLeft)
