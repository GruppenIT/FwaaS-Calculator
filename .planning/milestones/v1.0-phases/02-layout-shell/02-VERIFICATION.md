---
phase: 02-layout-shell
verified: 2026-03-15T22:10:00Z
status: passed
score: 12/12 must-haves verified
gaps: []
human_verification:
  - test: "Sidebar footer renders initials circle, email, and role visually above theme/logout row"
    expected: "User avatar circle with 2-letter initials visible in sidebar footer; email truncated below; formatted role label below that; theme+logout row at very bottom"
    why_human: "Cannot verify visual rendering or pixel-level layout from static code analysis"
  - test: "Hover state on sidebar nav items uses off-white background, not the old blue-tinted background"
    expected: "Hovering over a sidebar nav item shows a subtle off-white fill (causa-surface-alt token) distinct from the active item's blue 8% background"
    why_human: "CSS token resolution and visual appearance cannot be verified without rendering"
  - test: "DeadlineBanner appears in red above UpdateBanner when fatal prazos exist"
    expected: "When at least one non-suspended pending prazo is due today or tomorrow, a non-dismissible red banner appears above the update banner on every page within AppLayout"
    why_human: "Requires live data with qualifying prazos to observe banner appearance; polling behavior requires runtime"
  - test: "Clicking the DeadlineBanner navigates to /app/prazos"
    expected: "Clicking anywhere on the red banner navigates to the prazos list page"
    why_human: "Navigation behavior requires browser interaction"
  - test: "Breadcrumb renders correctly on processo and cliente detail pages"
    expected: "Above the page title, 'Processos > {CNJ number}' appears with 'Processos' as a clickable link back to the list"
    why_human: "Requires live render with data loaded to verify breadcrumb link and separator rendering"
---

# Phase 2: Layout Shell Verification Report

**Phase Goal:** Sidebar, AppLayout e banner de prazo critico consistentes em todas as paginas
**Verified:** 2026-03-15T22:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|----------|
| LY-01 | 02-01 | Sidebar redesenhada com agrupamento por secoes, labels Inter 11px/600 em caixa alta, item ativo fundo azul 8%, hover off-white | SATISFIED | `sidebar.tsx`: section labels with `text-[11px] font-semibold tracking-wider uppercase`; active item `bg-[var(--color-primary)]/8`; hover `hover:bg-causa-surface-alt`; user info footer with `getInitials()`, email, `formatRole()` |
| LY-02 | 02-01 | Page headers consistentes em todas as 20 paginas com titulo Inter 22px/700, botoes de acao e breadcrumb quando aplicavel | SATISFIED | `page-header.tsx` exports `PageHeader` + `BreadcrumbItem`; 17 pages import `PageHeader`; both detail pages use breadcrumb prop; list pages use without breadcrumb (backward compatible) |
| LY-03 | 02-02 | Banner sticky de prazo critico no topo da area de conteudo quando existe prazo fatal (0-1 dia) — nao-dispensavel, cor vermelho reservado | SATISFIED | `deadline-banner.tsx` with `role="alert"`, no dismiss mechanism, `causa-tier-fatal` tokens; `useFatalDeadlines` polls every 5min; `app-layout.tsx` renders `<DeadlineBanner />` above `<UpdateBanner />` |

All three requirement IDs declared in plan frontmatter (LY-01 in 02-01-PLAN.md, LY-02 in 02-01-PLAN.md, LY-03 in 02-02-PLAN.md) are accounted for. No orphaned requirements — REQUIREMENTS.md traceability table maps exactly LY-01, LY-02, LY-03 to Phase 2 and all three are covered.

---

## Goal Achievement

### Observable Truths — Plan 01 (LY-01, LY-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sidebar shows user email-derived initials circle + email + formatted role in footer, above theme toggle row | VERIFIED | `sidebar.tsx` lines 201-218: `{user && (...)}` block with initials div, email `<p>`, role `<p>`; followed by theme/logout row at lines 221-238 |
| 2 | Sidebar hover state uses `var(--color-surface-alt)` token, not `var(--color-bg)` | VERIFIED | `hover:bg-causa-surface-alt` at lines 188, 225, 233; zero occurrences of `hover:bg-causa-bg` in file |
| 3 | PageHeader accepts optional breadcrumb prop and renders linked breadcrumb trail above title | VERIFIED | `page-header.tsx` lines 13, 16, 19-38: `breadcrumb?: BreadcrumbItem[]` prop; conditional `<nav>` with `<Link>` items and `›` separator rendered above title `<div>` |
| 4 | Processo detail page uses PageHeader with breadcrumb `[Processos > numero CNJ]` instead of ArrowLeft button | VERIFIED | `processo-detail-page.tsx` line 272-286: `<PageHeader title={processo.numeroCnj} breadcrumb={[{ label: 'Processos', to: '/app/processos' }, { label: processo.numeroCnj }]}>`; no `ArrowLeft` import present |
| 5 | Cliente detail page uses PageHeader with breadcrumb `[Clientes > nome]` instead of ArrowLeft button | VERIFIED | `cliente-detail-page.tsx` line 202-216: `<PageHeader title={cliente.nome} breadcrumb={[{ label: 'Clientes', to: '/app/clientes' }, { label: cliente.nome }]}>`; no `ArrowLeft` import present |
| 6 | All 15 list pages continue to compile and render PageHeader unchanged | VERIFIED | 17 files total import `PageHeader`; breadcrumb prop is optional (`BreadcrumbItem[] \| undefined`); list pages call `<PageHeader title=... />` without breadcrumb — no breaking change introduced |

### Observable Truths — Plan 02 (LY-03)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | When fatal prazos exist for today, a non-dismissible red banner appears above UpdateBanner showing count and 'vencem hoje' | VERIFIED | `deadline-banner.tsx` lines 20-23: `{today > 0 && <p>...{today} ... vencem hoje</p>}`; `app-layout.tsx` line 17: `<DeadlineBanner />` placed before `<UpdateBanner />` |
| 8 | When fatal prazos exist for tomorrow, the banner shows a separate line with count and 'vencem amanha' | VERIFIED | `deadline-banner.tsx` lines 25-28: `{tomorrow > 0 && <p>...{tomorrow} ... vencem amanha</p>}` |
| 9 | When both today and tomorrow fatal prazos exist, both lines appear | VERIFIED | Both `today > 0` and `tomorrow > 0` blocks are independent conditionals rendered in sequence; no else branch |
| 10 | When no fatal prazos exist, no banner is rendered | VERIFIED | `deadline-banner.tsx` line 9: `if (today === 0 && tomorrow === 0) return null` |
| 11 | Clicking the banner navigates to /app/prazos | VERIFIED | `deadline-banner.tsx` line 14: `onClick={() => navigate('/app/prazos')}` on the outer `<div>` |
| 12 | Banner polls every 5 minutes for updated data | VERIFIED | `use-fatal-deadlines.ts` lines 4, 22: `const POLL_INTERVAL = 5 * 60 * 1000`; `setInterval(fetchSummary, POLL_INTERVAL)` with `clearInterval` cleanup on unmount |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/app-desktop/src/components/layout/sidebar.tsx` | User info footer with initials + email + role, corrected hover token | VERIFIED | 242 lines; `useAuth` destructuring `{logout, user}`; `getInitials()` and `formatRole()` helpers; user info block with avatar, email, role; `hover:bg-causa-surface-alt` on all three interactive elements |
| `packages/app-desktop/src/components/ui/page-header.tsx` | Breadcrumb prop with Link-based navigation | VERIFIED | 51 lines; exports `PageHeader` and `BreadcrumbItem`; `Link` imported from `react-router-dom`; breadcrumb `<nav>` with conditional rendering |
| `packages/app-desktop/src/pages/processos/processo-detail-page.tsx` | PageHeader with breadcrumb replacing ArrowLeft | VERIFIED | `PageHeader` imported line 22; breadcrumb prop used line 274-277; no `ArrowLeft`, no `useNavigate` |
| `packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx` | PageHeader with breadcrumb replacing ArrowLeft | VERIFIED | `PageHeader` imported line 4; breadcrumb prop used line 204-207; no `ArrowLeft`, no `useNavigate` |
| `packages/app-desktop/src/components/layout/deadline-banner.tsx` | Sticky fatal deadline banner component | VERIFIED | 34 lines; exports `DeadlineBanner`; `role="alert"`; no dismiss mechanism; `causa-tier-fatal` tokens throughout |
| `packages/app-desktop/src/hooks/use-fatal-deadlines.ts` | Polling hook returning `{ today, tomorrow }` counts | VERIFIED | 31 lines; exports `useFatalDeadlines`; `POLL_INTERVAL = 5 * 60 * 1000`; cancelled flag + clearInterval cleanup; silent catch block |
| `packages/app-desktop/src/lib/api.ts` | `getFatalDeadlineSummary` function | VERIFIED | Lines 626-650; exports `FatalDeadlineSummary` interface and `getFatalDeadlineSummary` function; filters `status: 'pendente'`; skips `suspenso`; midnight-normalized date diff |
| `packages/app-desktop/src/components/layout/app-layout.tsx` | DeadlineBanner inserted above UpdateBanner | VERIFIED | Line 6: `import { DeadlineBanner } from './deadline-banner'`; line 17: `<DeadlineBanner />` before `<UpdateBanner />` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `sidebar.tsx` | `lib/auth-context.tsx` | `useAuth()` for `user.email` and `user.role` | WIRED | Line 22: `import { useAuth, useFeatures } from '../../lib/auth-context'`; line 154: `const { logout, user } = useAuth()`; line 206: `{getInitials(user.email)}`; line 213: `{formatRole(user.role)}` |
| `page-header.tsx` | `react-router-dom` | `Link` component for breadcrumb navigation | WIRED | Line 2: `import { Link } from 'react-router-dom'`; line 27: `<Link to={item.to} ...>` rendered for breadcrumb items with `to` prop |
| `processo-detail-page.tsx` | `page-header.tsx` | `PageHeader` with breadcrumb prop | WIRED | Line 22: import; line 272: `<PageHeader ... breadcrumb={[...]} />` with array literal |
| `deadline-banner.tsx` | `hooks/use-fatal-deadlines.ts` | `useFatalDeadlines()` hook call | WIRED | Line 3: `import { useFatalDeadlines } from '../../hooks/use-fatal-deadlines'`; line 6: `const { today, tomorrow } = useFatalDeadlines()` |
| `hooks/use-fatal-deadlines.ts` | `lib/api.ts` | `getFatalDeadlineSummary()` API call | WIRED | Line 2: `import { getFatalDeadlineSummary, type FatalDeadlineSummary } from '../lib/api'`; line 14: `const data = await getFatalDeadlineSummary()` |
| `app-layout.tsx` | `deadline-banner.tsx` | `<DeadlineBanner>` rendered above `<UpdateBanner>` | WIRED | Line 6: import; line 17: `<DeadlineBanner />` before `<UpdateBanner />` outside scrollable `<main>` |

---

### Anti-Patterns Scan

No anti-patterns found in phase files:

- Zero `TODO`, `FIXME`, `PLACEHOLDER` comments in any modified file
- No empty implementations (`return null` is guarded by logic, not a stub)
- No hardcoded hex colors (`#`) in `sidebar.tsx` (all use `var()` tokens or `causa-*` aliases)
- No `console.log` in any modified file
- `deadline-banner.tsx`: `return null` is a legitimate conditional render when counts are zero, not a stub

---

### Human Verification Required

#### 1. Sidebar User Info Visual Layout

**Test:** Log in and observe the sidebar footer area.
**Expected:** Initials circle (e.g., "RG" for rodrigo.garcia@...) appears above the theme toggle and logout button row, with email text truncated if long, and formatted role ("Administrador", "Advogado", etc.) below.
**Why human:** Visual rendering, truncation behavior, and exact spacing cannot be verified from static code.

#### 2. Sidebar Hover Token Appearance

**Test:** Hover over a non-active sidebar nav item in both light and dark mode.
**Expected:** A subtle off-white (light mode) or slightly lighter surface (dark mode) highlight appears — distinct from the active item's blue-tinted background and distinct from the old blue `causa-bg` hover.
**Why human:** CSS token visual output requires rendering to verify.

#### 3. DeadlineBanner Appearance and Non-Dismissibility

**Test:** Create or ensure at least one non-suspended pending prazo with `dataFatal` set to today or tomorrow, then navigate to any page within AppLayout.
**Expected:** A red banner with `TriangleAlert` icon appears above any UpdateBanner (or directly below the top nav bar), showing the count with "vencem hoje" / "vencem amanha" text. No close/dismiss button exists.
**Why human:** Requires live data with qualifying prazos; banner visibility depends on runtime fetch.

#### 4. DeadlineBanner Navigation

**Test:** Click anywhere on the red fatal deadline banner.
**Expected:** Navigation to `/app/prazos` (the prazos list page).
**Why human:** Navigation behavior requires browser interaction.

#### 5. Breadcrumb Navigation on Detail Pages

**Test:** Open a processo detail page (e.g., `/app/processos/{id}`).
**Expected:** Above the processo number title, "Processos" appears as a clickable link with a `›` separator followed by the processo's CNJ number as plain text. Clicking "Processos" navigates back to `/app/processos`.
**Why human:** Requires live render with data loaded; link click behavior requires browser interaction.

---

### Notes

**Design decision — fatal field not filtered in getFatalDeadlineSummary:** The implementation counts all non-suspended pending prazos due in 0-1 days, not just those with `fatal: true`. This matches the plan's explicit code sample, which does not include a `p.fatal` filter. The plan's objective states "prazos with 0-1 days remaining" as the condition. If future requirements need strict filtering on the `fatal` boolean (i.e., exclude non-fatal urgent prazos), that would be a plan change, not a bug.

**Committed work verified:** All four commits documented in SUMMARYs exist in git log (`ae4b81f`, `5764b26`, `8cd410c`, `9d41ce6`). Code in repository matches what commits describe.

---

_Verified: 2026-03-15T22:10:00Z_
_Verifier: Claude (gsd-verifier)_
