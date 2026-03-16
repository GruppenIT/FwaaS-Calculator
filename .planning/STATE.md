---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 04-05-PLAN.md
last_updated: "2026-03-16T17:05:08.132Z"
last_activity: 2026-03-15 — Roadmap criado com 4 fases, 40 requisitos mapeados
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 17
  completed_plans: 17
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** Interface que transmite seriedade juridica com modernidade — advogados confiam no sistema desde o primeiro contato visual
**Current focus:** Phase 1 — Design System Foundation

## Current Position

Phase: 1 of 4 (Design System Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-15 — Roadmap criado com 4 fases, 40 requisitos mapeados

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 4 | 3 tasks | 5 files |
| Phase 01 P03 | 2min | 2 tasks | 3 files |
| Phase 01 P05 | 5 | 1 tasks | 1 files |
| Phase 01 P04 | 15 | 2 tasks | 6 files |
| Phase 01 P02 | 3 | 2 tasks | 3 files |
| Phase 01 P06 | 5 | 2 tasks | 1 files |
| Phase 02 P02 | 3 | 2 tasks | 4 files |
| Phase 02-layout-shell P01 | 4min | 2 tasks | 4 files |
| Phase 03 P01 | 3min | 2 tasks | 6 files |
| Phase 03 P02 | 3min | 2 tasks | 1 files |
| Phase 03 P03 | 6min | 2 tasks | 4 files |
| Phase 03 P04 | 30min | 2 tasks | 0 files |
| Phase 04-detail-pages-auth-e-polish P02 | 2min | 2 tasks | 2 files |
| Phase 04 P03 | 2min | 2 tasks | 2 files |
| Phase 04 P01 | 3min | 1 tasks | 1 files |
| Phase 04-detail-pages-auth-e-polish P04 | 1min | 2 tasks | 3 files |
| Phase 04-detail-pages-auth-e-polish P05 | 15min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Estetica Stripe/Vercel como referencia — profissionalismo sem ser corporativo demais
- [Init]: Escopo completo (todas as 20 telas) — interface parcialmente atualizada gera inconsistencia visual pior que antes
- [Init]: Guia de identidade visual como lei — nao renegociar decisoes de design
- [Init]: Dark mode com qualidade igual ao light — advogados trabalham muitas horas
- [Phase 01]: @theme inline required for var() opacity modifiers in Tailwind CSS 4 — hardcoded hex must only live in :root/.dark
- [Phase 01]: Font families kept as literals in @theme inline (no var() indirection) since they never change between themes
- [Phase 01]: Toast styleMap uses var() directly for all 4 variants — eliminates causa-* Tailwind aliasing layer for explicit, consistent token usage
- [Phase 01]: Skeleton animation must use CSS class (not inline style) for prefers-reduced-motion override to work correctly via !important
- [Phase 01]: DataTable is fully controlled for sort — no internal useState, parent manages sort state and sorted data
- [Phase 01]: SortIcon prop typed as SortState | undefined (not optional ?) to satisfy exactOptionalPropertyTypes tsconfig
- [Phase 01]: BadgeStatus type exported from badge.tsx and imported by StatusDot to avoid duplication
- [Phase 01]: Radix optional props spread conditionally for exactOptionalPropertyTypes compatibility
- [Phase 01]: Dialog.Portal forceMount required for AnimatePresence exit animations in Radix Dialog
- [Phase 01]: ease: 'easeOut' as const needed for motion/react Easing type in strict TypeScript mode
- [Phase 01]: Button compact prop kept as deprecated alias for size=sm for backward compatibility
- [Phase 01]: App-specific components excluded from barrel (backup-indicator, causa-logo) — not design system primitives
- [Phase 01]: export type used for ButtonProps, BadgeStatus, Column<T> for isolatedModules compatibility
- [Phase 02]: Silent error swallowing in useFatalDeadlines — banner polling must never crash AppLayout
- [Phase 02]: DeadlineBanner placed above UpdateBanner — fatal deadlines more urgent than app updates
- [Phase 02]: Non-dismissible banner with role=alert for accessibility — lawyers must see fatal deadline warnings
- [Phase 02-layout-shell]: Status badges preserved below PageHeader in detail pages to maintain visual density
- [Phase 02-layout-shell]: getInitials() uses strict null-safe indexing for noUncheckedIndexedAccess tsconfig
- [Phase 03-01]: UTC-safe date arithmetic: use Date.UTC() with local year/month/day for today — never new Date(dateStr).setHours(0,0,0,0) which is timezone-sensitive
- [Phase 03-01]: useChartTheme uses MutationObserver on documentElement class + tick counter pattern to drive useMemo recomputation on theme toggle
- [Phase 03-01]: Native title attribute for PrazoCountdown tooltip — zero dependencies, accessible
- [Phase 03-02]: StatCard borderColor prop uses CSS var token via style.borderLeftColor — Tailwind JIT cannot purge dynamic border-left colors from prop values
- [Phase 03-02]: All pending prazos passed to UrgencyHeatMap — 7-day filter removed as it was only for the old scrollable list display
- [Phase 03-03]: DataTable requires double cast (as unknown as) for typed interfaces — Component generic constraint T extends Record<string, unknown> doesn't accept specific typed interfaces
- [Phase 03-03]: sortState spread conditionally with spread operator for exactOptionalPropertyTypes strictness compatibility
- [Phase 03-03]: Clientes status column uses statusCliente field (actual ClienteData interface) and prazos uses tipoPrazo (actual PrazoRow interface)
- [Phase 03-04]: Phase 3 visual quality approved: 7 KPI stat cards (4+3 grid, colored left borders), 2x2 urgency heat map, themed Recharts charts, 3 listing pages with DataTable+PrazoCountdown+Badge — all in light and dark mode at 1366x768
- [Phase 04-02]: Left panel background uses inline style (not Tailwind bg-[]) — theme-independent hardcoded hex consistent with existing design decision
- [Phase 04-02]: Lora SemiBold (600) used for splash tagline — Lora-Regular.woff2 not bundled, SemiBold already declared in @font-face
- [Phase 04]: ResumoFinanceiro fetches all honorarios then filters client-side by clienteId for consistency with existing page patterns
- [Phase 04]: @media print data-print-section contract documented in CSS comments — processo-detail-page must add data-print-section attribute to tab sections for print to show all content
- [Phase 04]: All tab panels rendered in DOM simultaneously with data-print-section for Plan 04-03 print CSS contract
- [Phase 04]: useSearchParams with replace:false adds history entry per tab enabling browser back/forward navigation
- [Phase 04]: Financeiro tab conditionally included in allTabs array via financeiroEnabled feature flag
- [Phase 04]: Page transition key on location.pathname only — tab changes via ?tab= search params must NOT trigger route-level transition
- [Phase 04]: Row stagger uses native CSS animation via inline style on tr — motion.tr or wrapping motion.div both break table layout
- [Phase 04]: animateFirstLoad is a controlled prop from parent, not internal DataTable state — parent manages when to animate
- [Phase 04-05]: --color-text-muted bumped to #636e7b in :root for 4.78:1 WCAG AA contrast; focus-causa ring opacity increased from 0.15 to 0.30 for keyboard visibility

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Verificar comportamento de opacity modifiers Tailwind CSS 4 com `var()` references antes de finalizar migracao de tokens (ex: `bg-[var(--color-border)]/50`) — pode simplificar ou complicar estrategia de migracao
- [Phase 1]: Self-hosted fonts devem ser testadas em build Electron empacotado real — nao verificavel por analise estatica
- [Phase 4]: Verificar se Electron 33 no Windows reporta corretamente `prefers-reduced-motion` das configuracoes de acessibilidade do Windows

## Session Continuity

Last session: 2026-03-16T17:05:08.129Z
Stopped at: Completed 04-05-PLAN.md
Resume file: None
