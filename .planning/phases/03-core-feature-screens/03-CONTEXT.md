# Phase 3: Core Feature Screens - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the dashboard and listing pages (processos, clientes, prazos) with 4-tier urgency system, relative countdowns, themed Recharts charts, and migration to DataTable component — the highest-frequency pages deliver the visual promise of the product.

Requirements: DASH-01, DASH-02, DASH-03, LIST-01, LIST-02, LIST-03, LIST-04, LIST-05.

</domain>

<decisions>
## Implementation Decisions

### Dashboard KPI Cards
- Keep all 7 current stat cards: processos ativos, prazos pendentes, prazos fatais, clientes, tarefas pendentes, mov. não lidas, financeiro (conditional)
- Skip trend indicators (±% vs mês anterior) for now — no historical snapshot data exists. Defer to when backend supports comparison values
- Layout: 4 + 3 grid (first row: processos, prazos, fatais, clientes; second row: tarefas, mov., financeiro)
- Visual treatment: Stripe-style with 3px colored left border per card category, clean surface bg, large number, small label below

### Urgency Heat Map
- 2x2 quadrant grid replacing the current "Prazos desta semana" list in row 2 left column
- Tier day ranges: Fatal 0-1d, Urgente 2-3d, Semana 4-7d, Próximo 8+d
- Overdue prazos (dias < 0) count as Fatal — label shows e.g. "3 (1 vencido)" to differentiate
- Each cell shows count + tier label + day range description
- Clicking a tier cell navigates to Prazos page filtered by that tier
- Colors: Fatal=--color-tier-fatal (red), Urgente=--color-tier-urgent, Semana=--color-tier-warning, Próximo=--color-tier-info

### Listing Table Migration
- Migrate all 3 listings (processos, prazos, clientes) to the DataTable component from Phase 1
- Row click navigates to detail page; action buttons (edit/delete) use e.stopPropagation()
- Use Badge component from Phase 1 for status display in processos: ativo→active (azul), suspenso→suspended (âmbar), arquivado→archived (cinza), encerrado→closed (verde-água)
- CNJ numbers in JetBrains Mono 13px via column render function
- All tables must work without horizontal scroll at 1366x768

### Countdown Display (Prazos)
- Concise Portuguese wording with tier colors:
  - Vencido: "X d atrás" (red/fatal)
  - Hoje: "Hoje" (red/fatal)
  - Amanhã: "Amanhã" (amber/urgent)
  - 2-3 dias: "2 dias" / "3 dias" (amber/urgent)
  - 4-7 dias: "Próx. semana" (blue/warning)
  - 8+ dias: formatted date (muted)
- Hover tooltip always shows full absolute date (dd/mm/yyyy)

### Chart Theming Hook (useChartTheme)
- Returns color palette object: { primary, secondary, tertiary, danger, warning, success, muted } + grid, axis, tooltip resolved values
- Also returns pre-built config objects: gridProps, axisProps, tooltipProps ready to spread into Recharts components (e.g., `<CartesianGrid {...theme.gridProps} />`)
- Resolves CSS vars to actual hex values using getComputedStyle (Recharts needs resolved values)
- Reacts to theme changes by subscribing to useTheme context (ThemeContext)
- Support Area + Bar chart types only (current dashboard needs). Extend later if needed
- Eliminates all inline var() references in chart components

### Claude's Discretion
- Exact KPI card border colors per category
- Heat map cell sizing and padding within the dashboard grid
- DataTable column widths and responsive behavior at 1366px
- Countdown tooltip component styling
- useChartTheme internal implementation details (memoization, resolution strategy)
- Whether to keep the "Audiências da semana" section as-is or upgrade it visually

</decisions>

<specifics>
## Specific Ideas

- KPI cards inspired by Stripe dashboard — colored left border accent, large number prominently displayed, clean and spacious
- Heat map should communicate urgency at a glance — lawyers look at dashboard briefly and need to know if action is needed
- Row click + stopPropagation pattern follows Linear/Notion conventions
- Countdown wording uses natural Portuguese ("Hoje", "Amanhã", "Próx. semana") rather than dry numeric formats

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: Sort, hover row, click row, zebra — ready for listing migration
- `Badge` component: Predefined status colors (active/suspended/archived/closed) — use for processo status
- `StatusDot` component: Available for compact status indicators if needed
- `Card` component: Could wrap KPI stat cards if onClick behavior matches
- `useTheme` hook: ThemeContext provides current theme — useChartTheme subscribes to this
- 4-tier urgency tokens: `--color-tier-info/warning/urgent/fatal` already defined in globals.css
- `Skeleton` + `SkeletonTableRows`: Loading states ready to use

### Established Patterns
- Token system via var() references — no hardcoded hex
- Portuguese naming for business domain functions and variables
- Lucide React for icons
- useCallback + useEffect for data fetching with debounced search
- STATUS_STYLES/STATUS_LABELS Record maps for style lookups

### Integration Points
- `dashboard-page.tsx`: Complete rewrite of StatCard + heat map + chart theming
- `processos-page.tsx`: Migrate manual table to DataTable, add Badge for status
- `prazos-page.tsx`: Migrate manual table to DataTable, add countdown component with tier colors
- `clientes-page.tsx`: Migrate manual table to DataTable, add Badge for status
- `hooks/use-chart-theme.ts`: New hook consuming ThemeContext
- `lib/api.ts`: May need getFatalDeadlineSummary adjustment for heat map tier counts

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-feature-screens*
*Context gathered: 2026-03-15*
