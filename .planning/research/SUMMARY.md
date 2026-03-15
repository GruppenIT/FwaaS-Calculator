# Project Research Summary

**Project:** CAUSA — UX/UI Redesign
**Domain:** Desktop Legal ERP (Electron + React + Tailwind CSS 4, on-premise, Brazilian law firms)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

CAUSA is a production legal ERP built on Electron 33 + React 19 + Tailwind CSS 4 + TypeScript, already serving Brazilian law firms on-premise. The UX/UI redesign milestone is not a greenfield design system build — the foundation already exists (design tokens, 13 UI components, dark mode infrastructure, layout shells). The correct framing is: **audit, correct, and extend** an existing system toward a Stripe/Vercel quality bar within strict brand constraints. The risk is not "how to build it" but "how to avoid degrading what already works while improving it." Minimal new dependencies are needed (Motion for animations, Radix UI primitives for accessibility, Fontsource for fonts, clsx/tailwind-merge for class composition, and conditionally react-day-picker and TanStack Virtual).

The recommended approach follows a strict bottom-up layer sequence: fix token infrastructure first, then redesign primitive components, then layout shells, then feature pages. This order is non-negotiable — it ensures token changes cascade for free into all downstream consumers, and shared components achieve visual consistency across all 20 pages before any page-level work begins. The most critical architectural problem to solve in Phase 1 is the split between `@theme` tokens (build-time, theme-unaware) and CSS custom properties (runtime, dark-mode-aware). Several existing components incorrectly use `@theme`-derived classes for theme-responsive properties, which causes silent dark mode breakage.

The key risks are well-identified: hardcoded hex colors in Recharts chart components bypass the token system entirely (already present in `dashboard-page.tsx`); the dark mode surface elevation is too flat (only 6 semantic tokens, no elevation hierarchy); and the 1366x768 minimum viewport is unforgiving for any layout redesign done on a larger monitor. The red-reserved-for-fatal-urgency rule must be enforced via ESLint guard from day one, as it will break silently during a large redesign. Phasing by component layer rather than by page is the correct strategy to avoid the "partial redesign" trap where the app looks worse mid-milestone than before it started.

---

## Key Findings

### Recommended Stack

The existing stack (React 19.2.4, Tailwind CSS 4.2.1, Vite 7.3.1, Electron 33.4.11, TypeScript 5.9.3, Lucide React, recharts) requires no replacement. Only additive dependencies are needed for the redesign milestone. Full details in `.planning/research/STACK.md`.

**Additions recommended:**
- **Motion (Framer Motion v11):** Page transitions, modal enter/exit, micro-animations — replaces CSS-only keyframes for exit animations and orchestrated sequences. HIGH confidence.
- **Radix UI Primitives (selected packages):** Headless accessible behavior for Dialog, Select, DropdownMenu, Tooltip, Popover — replaces manual Escape key / focus trap implementations. Install only unstyled primitives, not `@radix-ui/themes`. HIGH confidence.
- **Fontsource (Inter variable, Lora, JetBrains Mono):** Self-hosted fonts as npm packages that bundle into the Vite build — required for offline-first operation and brand compliance. HIGH confidence.
- **clsx + tailwind-merge:** `cn()` utility for safe class composition and caller override support. HIGH confidence.
- **react-day-picker v9 (conditional):** Headless, accessible date picker for prazo/timesheet date fields — only if native `<input type="date">` styling proves insufficient. MEDIUM confidence.
- **TanStack Virtual v3 (conditional):** Row virtualization for large process/client lists — only if profiling shows render jank on real data volumes (500–5,000 rows). MEDIUM confidence.

**What NOT to install:** shadcn/ui, MUI/Chakra/Ant Design, `@radix-ui/themes`, react-spring, GSAP, styled-components, Storybook, react-query. All would either conflict with CAUSA's existing design system or are out of scope.

---

### Expected Features

Full feature analysis in `.planning/research/FEATURES.md`.

**Must have (table stakes):**
- 4-tier urgency color system for deadlines (informativo / atencao / urgente / fatal)
- Process numbers in JetBrains Mono 13px throughout all list and detail pages
- Keyboard navigation on all core tables (arrow keys, Enter to open, Esc to clear)
- Hover row highlight with full-row click target (pointer cursor, accessible focus ring)
- Loading skeleton screens on all list and detail pages (component exists, coverage is incomplete)
- Empty state messages with legal-domain phrasing ("Nenhum processo ativo", not "No items found")
- Form field inline error states (error below field, not only as global toast)
- Global search keyboard shortcut (Ctrl+K already exists — ensure visual affordance)
- DD/MM/AAAA date format verified throughout all display contexts
- Dark mode that actually works — proper 3-level surface hierarchy, not color inversion
- Responsive at 1366x768 at 100% scale without horizontal scroll

**Should have (differentiators):**
- Urgency heat map on dashboard (2x2 grid: fatal-this-week / due-this-month / upcoming / no-deadline)
- Relative prazo countdown in list rows ("Hoje", "2 dias", "Próxima semana")
- Sticky critical-prazo banner (non-dismissible, only for fatal tier, shown app-wide)
- Stripe-style KPI stat cards with trend indicators on dashboard
- Process detail tab layout (Dados Gerais / Prazos / Movimentações / Documentos / Financeiro / Tarefas)
- Inline status badge on process rows (color-coded pill visible in list without opening record)
- Dark mode true surface elevation (background / cards / modals at 3 distinct levels)
- Login page Stripe-style split-panel layout
- Micro-animations: modal scale-in (180ms), page fade-slide (150ms), table row stagger on load (20ms/row, capped at 10 rows)
- Keyboard shortcut `N` on list pages to open "New record" modal

**Defer to post-milestone:**
- Collapsible sidebar (explicitly out of scope in PROJECT.md)
- Audit trail timeline (blocked by missing `audit_log` table in backend)
- Hover card on client/party names in tables (high complexity at 1366px width)
- Column visibility toggle (nice-to-have after core screens ship)

---

### Architecture Approach

The codebase already implements a correct 4-layer architecture: tokens (globals.css) → primitive UI components (components/ui/) → layout shells (components/layout/) → feature pages (pages/). The layer contract is strict: no layer imports from a layer above it. The work of this milestone is to audit conformance to this contract and extend it correctly. Full details in `.planning/research/ARCHITECTURE.md`.

**Major components:**
1. **Layer 0 — Token Foundation (globals.css):** `@theme` block for Tailwind-registered tokens (opacity modifier support), `:root`/`.dark` blocks for runtime-theme-aware CSS custom properties, `@utility` classes for shared typography and interaction patterns. This layer must be expanded before any other work.
2. **Layer 1 — Primitive UI Components (components/ui/):** 13 existing components (Button, Input, Modal, ConfirmDialog, Toast/ToastProvider, Skeleton variants, EmptyState, PageHeader, BackupIndicator, CausaLogo). Require: Badge, StatusDot, Card, DataTable as new additions. Radix UI primitives sit under Modal and ConfirmDialog.
3. **Layer 2 — Layout Shells (components/layout/):** AppLayout, Sidebar, GlobalSearch. Theme switching lives here (`useTheme` → `.dark` on `<html>`). Zero per-component dark mode logic needed elsewhere.
4. **Layer 3 — Feature Pages (pages/):** 20 pages across list/detail/dashboard/auth/system categories. Only layer permitted to call `lib/api.ts`, manage domain state, or apply RBAC. Redesign order: Dashboard first (highest impact), list pages second (shared DataTable pattern), detail pages third, auth/setup last.

**Key patterns to follow:**
- Semantic token references (`var(--color-surface)`) in components, never hardcoded hex or Tailwind palette classes
- `@theme` tokens for values needing opacity modifiers; CSS custom properties for theme-responsive values
- Component variant maps as named records outside JSX (not inline ternaries)
- `className` passthrough for layout overrides from parents only (never for color or typography)
- Modal-per-feature co-located with its page (not a global modal registry)

---

### Critical Pitfalls

Full pitfall analysis (13 pitfalls) in `.planning/research/PITFALLS.md`.

1. **Hardcoded colors bypassing the token system** — Already present in `dashboard-page.tsx` (Recharts `stroke="#f59e0b"`, `fill="#10b981"`). Prevention: audit all files for raw hex before redesign starts; implement `useChartTheme()` hook that reads CSS custom property values via `getComputedStyle()` for all Recharts props. SVG attributes cannot resolve CSS variables directly.

2. **Dark mode as an afterthought** — Current `.dark {}` block has only 6 semantic tokens. No elevation hierarchy. `@theme`-only tokens (like `bg-causa-surface-alt`) never respond to `.dark` class. Prevention: design both modes simultaneously for every component; add `--color-surface-raised`, `--color-surface-overlay`, `--color-surface-floating` to `:root`/`.dark` in Phase 1 before any component work.

3. **Red-reserved rule broken during redesign** — `causa-danger` (#dc2626) is brand-reserved for prazo fatal, critical errors, and connector failures only. Prevention: add ESLint guard on `causa-danger` usage; add code comment at token definition; enforce in every phase's code review.

4. **1366x768 overflow from designing at larger resolutions** — Dashboard grid (7 stat cards), 8-column process table, and fixed 240px sidebar leave little margin for error. Prevention: lock devtools/Electron window to 1366x768 as the primary test viewport for all redesign work; make it a phase completion gate.

5. **Partial redesign visual inconsistency** — Redesigning pages before shared components are finalized creates jarring visual gaps. Prevention: complete all Layer 1 and Layer 2 components before any Layer 3 page redesign begins; verify visual consistency across all 20 pages at each phase boundary.

---

## Implications for Roadmap

Based on the combined research, 4 phases are recommended. The layer dependency graph determines the order — this is non-negotiable.

### Phase 1: Design System Foundation

**Rationale:** Every other phase depends on tokens and shared components being correct. A wrong token value caught in Phase 1 is a one-line fix; the same error in Phase 4 means rework across 20 pages. This phase has no prerequisite.
**Delivers:** Corrected token architecture, self-hosted fonts verified in packaged build, all shared primitive components redesigned, ESLint guards for brand constraints, animation rules documented.
**Addresses (from FEATURES.md):** Dark mode quality, typography consistency, toast/confirmation/skeleton coverage, form error states.
**Avoids (from PITFALLS.md):** P1 (hardcoded colors), P2 (dark mode afterthought), P3 (red-reserved violation), P6 (decorative animations), P7 (font loading in packaged builds), P12 (@theme vs CSS var confusion).
**Key tasks:**
- Token audit: migrate all theme-responsive tokens from `@theme`-only to CSS custom properties
- Add dark mode elevation levels: `--color-surface-raised`, `--color-surface-overlay`, `--color-surface-floating`
- Add chart theme hook: `useChartTheme()` reading from `getComputedStyle`
- Verify self-hosted fonts in a packaged Electron build
- Install and configure: Motion, Radix UI primitives, Fontsource, clsx/tailwind-merge
- Redesign/extend: Button, Input, Modal (with Radix), ConfirmDialog, Toast, Skeleton, EmptyState, PageHeader
- Create new: Badge, StatusDot, Card, DataTable compound component
- Establish `cn()` utility in `lib/utils.ts`
- Create barrel export `components/ui/index.ts`
- ESLint guard: `causa-danger` usage, raw hex in component files

**Research flag:** SKIP — patterns are standard and well-documented in the existing codebase. No `/gsd:research-phase` needed.

---

### Phase 2: Layout Shell Redesign

**Rationale:** Layout components (Sidebar, AppLayout, GlobalSearch) appear on every page. Correct them before pages are redesigned so every page inherits the right frame automatically.
**Delivers:** Sidebar with section grouping and refined active/hover states, AppLayout header with correct elevation, GlobalSearch with keyboard result navigation.
**Addresses (from FEATURES.md):** Sidebar section grouping, persistent sidebar navigation, global search visual affordance (Ctrl+K shortcut hint).
**Avoids (from PITFALLS.md):** P10 (user disorientation — keep sidebar item order exactly as-is, visual refresh only), P5 (partial redesign — layout must be consistent before pages start).
**Key tasks:**
- Sidebar: add section labels, refine active/hover states, footer user card — do NOT reorder items
- AppLayout: header shadow vs. border elevation, sticky critical-prazo banner slot
- GlobalSearch: result grouping by entity type

**Research flag:** SKIP — patterns observed directly in codebase. Standard React Router + CSS patterns.

---

### Phase 3: Core Feature Screens

**Rationale:** Dashboard and list pages are the highest-frequency pages. Dashboard is the entry point and highest-impact validation of the design system. List pages (processos, clientes, prazos) share a single DataTable pattern built in Phase 1 — apply it consistently here.
**Delivers:** Redesigned dashboard with urgency heat map and KPI stat cards, process/client/prazo list pages with inline urgency badges and relative countdown, correct recharts dark mode via `useChartTheme()`.
**Addresses (from FEATURES.md):** Urgency heat map, prazo countdown ("Hoje"/"2 dias"), Stripe-style KPI cards, inline status badge on process rows, 4-tier urgency coloring on prazos page, sticky critical-prazo banner wired to real data.
**Uses (from STACK.md):** recharts (existing) with `useChartTheme()`, Motion stagger animation (row entrance), Radix Tooltip (relative date tooltip showing absolute date on hover).
**Avoids (from PITFALLS.md):** P1/P8 (chart hardcoded colors), P4 (1366x768 — 7 stat cards must fit, 8-column table must not overflow), P9 (urgency levels must maintain perceptual distance).

**Research flag:** SKIP for recharts integration — patterns are documented. CONSIDER `/gsd:research-phase` for the urgency heat map layout if the 2x2 grid interaction design is unclear during planning.

---

### Phase 4: Detail Pages, Auth, and Polish

**Rationale:** Detail pages are the most complex layouts (tabs, mixed content types). Auth pages are low frequency but visible during demos. Polish (micro-animations, print styles) completes the Stripe/Vercel quality target.
**Delivers:** Process detail with tab layout (URL-driven), client detail with inline financial summary, login page Stripe split-panel redesign, micro-animations (modal scale, page fade-slide), print-friendly process summary.
**Addresses (from FEATURES.md):** Process detail tab layout, inline financial summary on client, login page, page transition animations, print-friendly export.
**Uses (from STACK.md):** Motion AnimatePresence (modal exit animation), react-day-picker (if date fields need styling), CSS `@media print`.
**Avoids (from PITFALLS.md):** P4 (login/splash must be designed at 1366x768 full-screen), P13 (splash/login not constrained to viewport), P6 (animations must have purpose — modal 180ms, page 150ms, never decorative).

**Research flag:** SKIP — all patterns are documented. Tab layout is standard React Router URL-driven pattern.

---

### Phase Ordering Rationale

- **Tokens before components:** A corrected token in Phase 1 propagates to all consumers without further work. A wrong token in a later phase requires hunting down every consumer.
- **Components before layout:** Sidebar and AppLayout import from `components/ui/`. Redesigning layout before primitives are finalized means rework when primitives change.
- **Layout before pages:** Every page inherits the frame. Visual consistency starts the moment shared components and layout are correct.
- **Dashboard first in page phase:** Highest visibility, uses the most components from Phase 1 (Card, DataTable, Badge, recharts), gives early validation that the design system holds together in a real page context.
- **Auth last:** Lowest frequency, no new patterns introduced, but benefits from all prior work being stable.

### Research Flags

Phases needing deeper research during planning:
- **Phase 1 only if:** the `@theme` vs CSS custom property migration reveals unexpected Tailwind CSS 4 behavior — run a failing test (`bg-[var(--color-border)]/50`) to confirm opacity modifier behavior before committing to the migration strategy.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 2:** Sidebar visual refresh follows established CSS patterns; navigation structure is explicitly frozen.
- **Phase 3:** recharts `getComputedStyle` pattern for chart theming is documented; DataTable virtualization (TanStack Virtual) only if profiling shows need.
- **Phase 4:** React Router URL-driven tab pattern is well-documented; Motion AnimatePresence is stable.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct codebase inspection of existing dependencies; addition recommendations (Motion, Radix, Fontsource, clsx/tailwind-merge) are stable, widely adopted libraries with verified React 19 compatibility |
| Features | MEDIUM-HIGH | Table stakes are HIGH (legal domain knowledge + codebase inspection confirmed gaps). Differentiator priority is MEDIUM (informed by training knowledge of Clio, SAJ, Astrea, Stripe/Vercel — not live user research) |
| Architecture | HIGH | Derived from direct codebase analysis; 4-layer architecture is observable in the existing code; token system constraints verified against Tailwind CSS 4 documentation |
| Pitfalls | HIGH | Most critical pitfalls (P1, P2, P4) have specific codebase evidence (hardcoded colors in `dashboard-page.tsx` lines 581-593 confirmed; 6-token dark mode in globals.css confirmed; 8-column table at 1366px confirmed) |

**Overall confidence:** HIGH

### Gaps to Address

- **Tailwind CSS 4 opacity modifier with `var()` references:** The rule that opacity modifiers (e.g., `/30`) only work on `@theme`-registered tokens and not on CSS custom properties needs to be verified with a live failing test before Phase 1 token migration is finalized. If this constraint is looser than documented, the migration strategy simplifies.
- **Self-hosted font loading in packaged Electron build:** Font path resolution in production builds must be verified against the actual `electron-builder` config and Electron renderer protocol. This cannot be confirmed from static analysis alone — requires building and running the packaged app.
- **React DayPicker v9 + Tailwind CSS 4 @theme interop:** React DayPicker's `classNames` prop approach with Tailwind CSS 4's `@utility` system was not live-tested. Verify with a prototype before committing to this library in Phase 4.
- **Real data volume for virtualization decision:** TanStack Virtual should only be installed if profiling shows render jank on actual CAUSA database volumes. Do not install preemptively.
- **`prefers-reduced-motion` in Electron:** Verify that Electron 33 on Windows correctly reports `prefers-reduced-motion` from Windows accessibility settings. If not, the CSS `@media (prefers-reduced-motion)` fallback may need a JavaScript detection path.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `packages/app-desktop/src/styles/globals.css` — token system, dark mode, typography scale
- Direct codebase inspection: `packages/app-desktop/src/pages/dashboard/dashboard-page.tsx` — confirmed hardcoded Recharts hex values at lines 581-593
- Direct codebase inspection: `packages/app-desktop/src/components/ui/` — all 13 existing components, API contracts, token usage patterns
- Direct codebase inspection: `packages/app-desktop/src/components/layout/sidebar.tsx` — navigation structure, dark mode toggle
- Direct codebase inspection: `packages/app-desktop/src/pages/processos/processos-page.tsx` — 8-column table at 1366px
- Project constraints: `.planning/PROJECT.md` — 1366x768 minimum, dark mode quality requirement, red reservation, font self-hosting, no decorative animations, navigation structure frozen
- Brand guide: `CAUSA_identidade_visual.md` — Section 5 (animation durations), Section 8 (token reference), Section 9 (prohibitions)
- Tailwind CSS 4 documentation: `@theme` vs CSS custom property runtime semantics

### Secondary (MEDIUM confidence)

- Training knowledge (cutoff August 2025): Motion v11 API, Radix UI v1 primitives, Fontsource v5, react-day-picker v9, TanStack Virtual v3
- Training knowledge: Legal ERP patterns (Clio, MyCase, Themis, SAJ, Astrea, Jusnote)
- Training knowledge: Stripe/Vercel design system animation conventions
- NNGroup research (training data): notification overload patterns

### Tertiary (LOW confidence)

- Web search tools were unavailable during all research sessions. Version availability for new packages should be verified with `pnpm info [package] version` before installation.

---

*Research completed: 2026-03-15*
*Ready for roadmap: yes*
