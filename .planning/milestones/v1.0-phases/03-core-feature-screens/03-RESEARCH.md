# Phase 3: Core Feature Screens - Research

**Researched:** 2026-03-15
**Domain:** React dashboard redesign, Recharts theming, DataTable migration, countdown display, urgency tier visualization
**Confidence:** HIGH

## Summary

Phase 3 rewrites the three highest-frequency pages (dashboard, processos, prazos) and migrates clientes to the DataTable component built in Phase 1. All components to be created already have their foundation in place: DataTable, Badge, useTheme, tier tokens, and Skeleton are ready to consume.

The primary technical challenge is `useChartTheme`: Recharts renders SVG and SVG elements do not resolve CSS custom properties (var()) from the page's CSS cascade. The existing charts in `dashboard-page.tsx` already pass `var(--color-primary)` strings directly as `stroke` and `fill` values — this works visually only when the browser SVG renderer happens to inherit them, but is unreliable for dark mode switching. The hook must resolve CSS vars to actual hex strings using `getComputedStyle(document.documentElement)` at render time and re-run whenever the theme changes.

The second challenge is that `useTheme` is a standalone hook (not a React Context), so each component that calls it maintains its own local state. `useChartTheme` must call `useTheme()` directly and use `theme` as a `useMemo` dependency so the palette recomputes on every theme toggle.

**Primary recommendation:** Build `useChartTheme` as a memoized hook that calls `useTheme()` + resolves via `getComputedStyle`. Migrate all three listing pages to DataTable with column width constraints guaranteeing no horizontal scroll at 1366x768. Build the 2x2 heat map as a standalone `UrgencyHeatMap` component that computes tier counts client-side from the existing `listarPrazos` API.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep all 7 current stat cards: processos ativos, prazos pendentes, prazos fatais, clientes, tarefas pendentes, mov. nao lidas, financeiro (conditional)
- Skip trend indicators (+-% vs mes anterior) — no historical snapshot data. Defer to when backend supports comparison values
- Layout: 4 + 3 grid (first row: processos, prazos, fatais, clientes; second row: tarefas, mov., financeiro)
- Visual treatment: Stripe-style with 3px colored left border per card category, clean surface bg, large number, small label below
- 2x2 quadrant grid replacing the current "Prazos desta semana" list in row 2 left column
- Tier day ranges: Fatal 0-1d, Urgente 2-3d, Semana 4-7d, Proximo 8+d
- Overdue prazos (dias < 0) count as Fatal — label shows e.g. "3 (1 vencido)"
- Each cell shows count + tier label + day range description
- Clicking a tier cell navigates to Prazos page filtered by that tier
- Colors: Fatal=--color-tier-fatal (red), Urgente=--color-tier-urgent, Semana=--color-tier-warning, Proximo=--color-tier-info
- Migrate all 3 listings (processos, prazos, clientes) to DataTable from Phase 1
- Row click navigates to detail page; action buttons (edit/delete) use e.stopPropagation()
- Use Badge component for status in processos: ativo->active (azul), suspenso->suspended (ambar), arquivado->archived (cinza), encerrado->closed (verde-agua)
- CNJ numbers in JetBrains Mono 13px via column render function
- All tables must work without horizontal scroll at 1366x768
- Countdown wording: Vencido="X d atras" (red/fatal), Hoje="Hoje" (red/fatal), Amanha="Amanha" (amber/urgent), 2-3 dias="2 dias"/"3 dias" (amber/urgent), 4-7 dias="Prox. semana" (blue/warning), 8+ dias=formatted date (muted)
- Hover tooltip shows full absolute date (dd/mm/yyyy)
- useChartTheme returns { primary, secondary, tertiary, danger, warning, success, muted } + gridProps, axisProps, tooltipProps ready to spread into Recharts components
- Resolves CSS vars to actual hex values using getComputedStyle
- Reacts to theme changes by subscribing to useTheme context (ThemeContext)
- Support Area + Bar chart types only

### Claude's Discretion
- Exact KPI card border colors per category
- Heat map cell sizing and padding within the dashboard grid
- DataTable column widths and responsive behavior at 1366px
- Countdown tooltip component styling
- useChartTheme internal implementation details (memoization, resolution strategy)
- Whether to keep the "Audiencias da semana" section as-is or upgrade it visually

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | KPI stat cards estilo Stripe com indicador de tendencia para processos ativos, prazos da semana e honorarios pendentes | Trend indicators deferred (no historical data). Stripe-style stat cards with 3px left border are the implementation. 7 cards in 4+3 grid layout |
| DASH-02 | Heat map de urgencia 2x2 grid com cores do sistema de 4 tiers | Client-side tier computation from listarPrazos. 4 cells with tier token colors. Clickable to navigate to /app/prazos with tier filter |
| DASH-03 | Hook useChartTheme() fornece cores dinamicas para Recharts baseado no tema atual | getComputedStyle resolution pattern confirmed. useTheme() as dependency. Returns spreadable Recharts config objects |
| LIST-01 | Numeros de processo em JetBrains Mono 13px em todas as listagens | DataTable column render function with inline style font-family: var(--font-mono) and fontSize 13px |
| LIST-02 | Countdown relativo de prazos com cor de urgencia e data absoluta em tooltip | diasRestantes() utility already exists in prazos-page.tsx. Needs PrazoCountdown component with Radix Tooltip or title attribute |
| LIST-03 | Status badge inline em linhas de processo (Badge component) | Badge component maps active/suspended/archived/closed. Processos-page status values must map to BadgeStatus type |
| LIST-04 | Linha inteira da tabela clicavel com hover highlight e focus ring acessivel | DataTable already implements this: onRowClick, tabIndex, focus-causa, e.stopPropagation on action buttons |
| LIST-05 | Todas as listagens funcionam corretamente em 1366x768 sem scroll horizontal | DataTable uses table-fixed with explicit column widths. Must define column widths summing to <= viewport minus sidebar (1366 - 240px = 1126px usable) |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.8.0 | AreaChart + BarChart in dashboard | Already in use; 4 components already render charts |
| react | ^19.2.4 | Component framework | Project foundation |
| react-router-dom | ^7.13.1 | Navigation from heat map cells to filtered prazos page | Already in use |
| tailwindcss | ^4.2.1 | Utility classes using causa token aliases | Project CSS system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tooltip | not yet installed | Accessible hover tooltip for countdown absolute date | If adding tooltip — OR use native `title` attribute for simplicity |
| lucide-react | ^0.577.0 | Icons in stat cards and heat map cells | All icon usage in this project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/react-tooltip | Native `title` attribute | title is simpler (zero deps), but styled tooltip matches design system. Decision left to Claude's discretion |
| Client-side tier count from listarPrazos | New /api/dashboard/heat-map endpoint | Client-side avoids backend changes (scope says no backend changes). Reuses existing API |

**Installation (if Radix Tooltip chosen):**
```bash
pnpm --filter @causa/app-desktop add @radix-ui/react-tooltip
```

---

## Architecture Patterns

### Recommended Project Structure
```
packages/app-desktop/src/
├── pages/dashboard/
│   ├── dashboard-page.tsx      # Complete rewrite: StatCard + UrgencyHeatMap + chart theming
│   └── urgency-heat-map.tsx    # New: 2x2 tier grid component
├── pages/processos/
│   └── processos-page.tsx      # Migrate manual <table> to DataTable, add Badge
├── pages/prazos/
│   ├── prazos-page.tsx         # Migrate manual <table> to DataTable, add PrazoCountdown
│   └── prazo-countdown.tsx     # New: countdown display component with tier color + tooltip
├── pages/clientes/
│   └── clientes-page.tsx       # Migrate manual <table> to DataTable
└── hooks/
    └── use-chart-theme.ts      # New: CSS var resolver + Recharts config builder
```

### Pattern 1: Stripe-Style StatCard with Left Border
**What:** Each KPI card has a 3px colored left border accent, large numeric value, small label, optional click handler
**When to use:** All 7 KPI cards in dashboard row 1

```tsx
// Source: Based on existing dashboard-page.tsx StatCard + CONTEXT.md specification
function StatCard({ icon: Icon, label, value, borderColor, iconColor, onClick }: StatCardProps) {
  return (
    <div
      className={`
        relative bg-[var(--color-surface)] rounded-[var(--radius-md)]
        border border-[var(--color-border)] shadow-[var(--shadow-sm)]
        p-5 overflow-hidden
        ${onClick ? 'cursor-pointer hover:border-[var(--color-primary)]/30 transition-causa' : ''}
      `}
      onClick={onClick}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl-causa text-[var(--color-text)] font-bold">{value}</div>
          <div className="text-sm-causa text-[var(--color-text-muted)] mt-0.5">{label}</div>
        </div>
        <div className={`p-2 rounded-[var(--radius-md)] ${iconColor}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
```

**Border colors per category (Claude's discretion):**
- Processos ativos: `var(--color-tier-info)` (blue)
- Prazos pendentes: `var(--color-tier-warning)` (amber)
- Prazos fatais: `var(--color-tier-fatal)` (red)
- Clientes: `var(--color-success)` (teal)
- Tarefas: `var(--color-tier-info)` (blue)
- Mov. nao lidas: `var(--color-tier-warning)` (amber)
- Financeiro: `var(--color-success)` (teal)

### Pattern 2: useChartTheme Hook
**What:** Resolves CSS vars to hex values; Recharts SVG cannot consume var() references
**When to use:** Any component using Recharts Area/Bar charts

**Critical pitfall:** SVG `stroke` and `fill` attributes do not resolve CSS custom properties. Passing `stroke="var(--color-primary)"` may work coincidentally when the SVG element inherits from its HTML parent, but is not reliable — especially in dark mode transitions where the class change happens on `<html>` but SVG elements may not re-render. Always resolve to actual color values.

```ts
// Source: Code investigation of existing dashboard-page.tsx (uses var() directly — this is the bug to fix)
// getComputedStyle approach is the documented pattern for resolving CSS vars in JS
import { useMemo } from 'react';
import { useTheme } from './use-theme';

function resolveCssVar(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

export function useChartTheme() {
  const { theme } = useTheme();

  return useMemo(() => {
    const primary   = resolveCssVar('--color-primary');
    const warning   = resolveCssVar('--color-warning');
    const success   = resolveCssVar('--color-success');
    const danger    = resolveCssVar('--color-danger');
    const muted     = resolveCssVar('--color-text-muted');
    const border    = resolveCssVar('--color-border');
    const surface   = resolveCssVar('--color-surface');
    const radius    = resolveCssVar('--radius-md');
    const amber     = resolveCssVar('--color-accent-amber');
    const emerald   = resolveCssVar('--color-accent-emerald');

    return {
      colors: { primary, warning, success, danger, muted, amber, emerald },
      gridProps: {
        strokeDasharray: '3 3',
        stroke: border,
      },
      axisProps: {
        tick: { fontSize: 11, fill: muted },
      },
      tooltipProps: {
        contentStyle: {
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: radius,
          fontSize: 12,
        },
      },
    };
  }, [theme]); // theme as dep: recomputes when .dark class toggled
}
```

**Key insight:** `theme` from `useTheme()` changes value on toggle, forcing `useMemo` to recompute. `getComputedStyle` runs after React re-render when the `.dark` class is already applied.

### Pattern 3: UrgencyHeatMap Component
**What:** 2x2 grid showing prazo counts by tier. Computes tiers client-side from pending prazos.
**When to use:** Dashboard row 2, left column (replaces "Prazos desta semana" list)

```tsx
// Tier computation logic (client-side from listarPrazos)
function computeTierCounts(prazos: PrazoRow[]) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let fatal = 0, fatailVencido = 0, urgente = 0, semana = 0, proximo = 0;

  for (const p of prazos) {
    if (p.status !== 'pendente') continue;
    const dias = Math.ceil(
      (new Date(p.dataFatal + 'T00:00:00').getTime() - hoje.getTime()) / 86400000
    );
    if (dias < 0) { fatal++; fatailVencido++; }
    else if (dias <= 1) fatal++;
    else if (dias <= 3) urgente++;
    else if (dias <= 7) semana++;
    else proximo++;
  }

  return { fatal, fatailVencido, urgente, semana, proximo };
}

// Each cell renders:
// - Large count number (colored)
// - Tier label
// - Day range description
// - onClick navigates to /app/prazos (with tier filter via URL param or state)
```

**Navigation from heat map cell:** Use `navigate('/app/prazos', { state: { tier: 'fatal' } })` and read `location.state` in PrazosPage to pre-filter. OR use URL query param `?tier=fatal`. URL param is simpler and shareable.

### Pattern 4: DataTable Migration with Column Width Budgeting
**What:** Replace manual `<table>` elements with DataTable component. Column widths must be explicit to prevent horizontal scroll.
**When to use:** All three listing pages

**Width budget (1366x768 viewport):**
- Sidebar: 240px
- Content padding: ~48px (24px each side)
- Usable table width: ~1078px

**Processos column budget (8 cols → 7 after merging actions):**
| Column | Width | Notes |
|--------|-------|-------|
| Numero CNJ | 220px | JetBrains Mono 13px, CNJ format is 25 chars |
| Cliente | 200px | truncated |
| Advogado | 160px | truncated |
| Tribunal | 80px | badge pill |
| Area | 100px | text label |
| Status | 100px | Badge component |
| Acoes | 80px | icon buttons |

**Prazos column budget:**
| Column | Width | Notes |
|--------|-------|-------|
| Descricao + countdown | 280px | description + PrazoCountdown below |
| Processo (CNJ) | 200px | JetBrains Mono 13px |
| Data Fatal | 110px | absolute date |
| Tipo | 100px | pill |
| Status | 100px | pill |
| Responsavel | 150px | name |
| Acoes | 100px | 3 icon buttons |

**Clientes — already narrow enough.**

### Pattern 5: PrazoCountdown Component
**What:** Inline countdown with tier color, tooltip showing absolute date
**When to use:** In prazos-page DataTable column render function

```tsx
// PrazoCountdown — no external deps if using title attr for tooltip
interface PrazoCountdownProps {
  dataFatal: string;
  status: string;
}

function formatCountdown(dias: number): { text: string; colorClass: string } {
  if (dias < 0)  return { text: `${Math.abs(dias)} d atras`, colorClass: 'text-[var(--color-tier-fatal)]' };
  if (dias === 0) return { text: 'Hoje',           colorClass: 'text-[var(--color-tier-fatal)]' };
  if (dias === 1) return { text: 'Amanha',         colorClass: 'text-[var(--color-tier-urgent)]' };
  if (dias <= 3)  return { text: `${dias} dias`,   colorClass: 'text-[var(--color-tier-urgent)]' };
  if (dias <= 7)  return { text: 'Prox. semana',   colorClass: 'text-[var(--color-tier-warning)]' };
  return { text: formatAbsoluteDate(dataFatal), colorClass: 'text-[var(--color-text-muted)]' };
}
```

### Anti-Patterns to Avoid
- **Passing `var(--token)` strings to Recharts SVG props:** SVG does not resolve CSS custom properties. Always resolve via `getComputedStyle` in `useChartTheme`.
- **Inline hex colors in chart components:** All colors must come from `useChartTheme()`, never hardcoded hex.
- **`table-auto` without explicit widths in DataTable:** `DataTable` already uses `table-fixed` — always provide `width` on column definitions to control layout.
- **Row onClick without stopPropagation on action buttons:** Action buttons inside clickable rows must call `e.stopPropagation()` to prevent row navigation triggering.
- **Separate sort state per column in parent:** DataTable sort state is a single `{ key, direction }` object — the parent uses one `useState<SortState>`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable table headers | Custom sort UI | DataTable `sortable: true` on column + `onSort` prop | Already built in Phase 1 with correct aria semantics |
| Status pills | Inline className maps | Badge component (`status: 'active' \| 'suspended' \| 'archived' \| 'closed'`) | Consistent tokens, forwardRef, accessible |
| Loading skeleton rows | Custom skeleton | `SkeletonTableRows` from skeleton.tsx | Already integrates with table structure |
| Empty table state | Custom empty UI | DataTable `emptyIcon` + `emptyMessage` props | EmptyState component baked in |
| Theme detection | DOM query | `useTheme()` hook | Hook manages localStorage persistence and `.dark` toggle |

**Key insight:** Every primitive needed for this phase was built in Phase 1. The work is wiring them together correctly, not building new primitives.

---

## Common Pitfalls

### Pitfall 1: Recharts SVG and CSS Custom Properties
**What goes wrong:** Charts appear correct in light mode but show wrong colors in dark mode, or show `var(--color-primary)` literally as color (which SVG ignores, defaulting to black).
**Why it happens:** SVG `stroke`/`fill` attributes do not participate in CSS cascade for custom properties. The existing charts pass `stroke="var(--color-primary)"` — this currently works because Recharts renders inside an SVG that inherits some styles from the surrounding HTML, but is fragile and breaks on theme switch.
**How to avoid:** Always resolve through `useChartTheme()`. Never write `var()` inside Recharts prop values.
**Warning signs:** Charts look correct in one theme but lose color in the other.

### Pitfall 2: useTheme as Singleton vs Context
**What goes wrong:** `useChartTheme` calls `useTheme()` and gets a `theme` value, but theme changes made in the sidebar toggle do not trigger a re-render in the chart component.
**Why it happens:** `useTheme` is NOT a React Context — each call creates independent `useState`. The sidebar toggle calls its own `useTheme()` instance which changes the DOM but the chart's `useTheme()` instance has separate state.
**How to avoid:** This is actually safe because `useTheme` reads from `localStorage` on mount and any component calling `useTheme()` shares the DOM mutation (adding `.dark` to `<html>`). However, the component won't know about the change unless the DOM mutation triggers a re-render. The robust solution is to listen to `document.documentElement.classList` changes via a MutationObserver inside `useChartTheme`, or elevate `useTheme` to a React Context. The simplest approach: add a `storage` event listener for `'causa-theme'` changes, or use `useTheme()` in the chart component and memoize on `theme`.

**Recommended approach:** Call `useTheme()` directly in `useChartTheme` — this means `useChartTheme` must be called in the same component tree where theme toggling happens. Since all pages are inside AppLayout which renders the sidebar toggle, this works: the toggle calls its `setThemeState`, which updates localStorage + DOM. But OTHER components' `useTheme()` instances won't re-render because they have separate state. **Fix:** Convert `useTheme` to a proper React Context so all consumers share state. This is a legitimate improvement for Phase 3.

**Alternative fix (lower scope):** Use a `MutationObserver` on `document.documentElement` watching for `class` attribute changes inside `useChartTheme`, so it can force a re-render when `.dark` is added/removed without needing a full Context refactor.

### Pitfall 3: DataTable `table-fixed` Requiring Explicit Column Widths
**What goes wrong:** Text overflows or columns collapse to 0 width, causing horizontal scroll.
**Why it happens:** `table-fixed` distributes width equally across columns unless `width` is set per column. With 7-8 columns at equal width on 1078px, each gets ~135-154px — CNJ numbers (25 chars at 13px monospace ≈ 175px) overflow.
**How to avoid:** Define `width` on every Column definition. CNJ column must be at least 200px.
**Warning signs:** Horizontal scrollbar appears at 1366px viewport.

### Pitfall 4: Status Map Mismatch Between processos-page and Badge
**What goes wrong:** processos-page uses `status: 'ativo' | 'arquivado' | 'encerrado' | 'suspenso' | 'baixado'` but Badge expects `BadgeStatus: 'active' | 'suspended' | 'archived' | 'closed'`. The "baixado" status has no Badge equivalent.
**Why it happens:** Badge was designed for a 4-status system; the processos domain has 5 statuses.
**How to avoid:** Create a mapping function inside processos-page: `'ativo' -> 'active', 'suspenso' -> 'suspended', 'arquivado' -> 'archived', 'encerrado' -> 'closed', 'baixado' -> 'archived'` (or render a manual pill for 'baixado').
**Warning signs:** TypeScript error on `status` prop of Badge.

### Pitfall 5: Heat Map API Data — No Dedicated Endpoint
**What goes wrong:** Dashboard loads slowly because heat map requires a separate full `listarPrazos` call on top of the existing `getDashboardStats` call.
**Why it happens:** There is no `getDashboardHeatMap()` API function — the heat map must be computed client-side from `listarPrazos({ status: 'pendente' })`.
**How to avoid:** The existing dashboard already calls `listarPrazos({ status: 'pendente' })` to populate `prazosUrgentes`. Reuse this same data for heat map computation — pass prazos data down to `UrgencyHeatMap` as a prop rather than making a second API call.
**Warning signs:** Two identical parallel API calls in the dashboard's `Promise.all`.

### Pitfall 6: Countdown Tooltip Accessibility
**What goes wrong:** Hover tooltip is invisible to keyboard/screen reader users.
**Why it happens:** CSS hover-only tooltips don't work for keyboard navigation.
**How to avoid:** Either use `@radix-ui/react-tooltip` (accessible, handles focus), or add both `title` attribute (browser native, accessible) and a custom hover display. Native `title` is the minimal viable solution and is accessible.

---

## Code Examples

### useChartTheme Complete Implementation
```ts
// Source: Project code analysis + getComputedStyle documented API
// File: packages/app-desktop/src/hooks/use-chart-theme.ts
import { useMemo, useState, useEffect } from 'react';

function resolveCssVar(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

export function useChartTheme() {
  // Subscribe to DOM class changes (.dark added/removed)
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setTick((t) => t + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return useMemo(() => {
    const primary  = resolveCssVar('--color-primary');
    const warning  = resolveCssVar('--color-warning');
    const success  = resolveCssVar('--color-success');
    const danger   = resolveCssVar('--color-danger');
    const muted    = resolveCssVar('--color-text-muted');
    const border   = resolveCssVar('--color-border');
    const surface  = resolveCssVar('--color-surface');
    const amber    = resolveCssVar('--color-accent-amber');
    const emerald  = resolveCssVar('--color-accent-emerald');

    return {
      colors: { primary, warning, success, danger, muted, amber, emerald },
      gridProps: { strokeDasharray: '3 3', stroke: border },
      axisProps:  { tick: { fontSize: 11, fill: muted } },
      tooltipProps: {
        contentStyle: {
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: '6px',
          fontSize: 12,
          color: resolveCssVar('--color-text'),
        },
      },
    };
  }, [tick]);
}
```

### DataTable Usage with Row Click + stopPropagation
```tsx
// Source: data-table.tsx analysis — Column render function pattern
const columns: Column<ProcessoListRow>[] = [
  {
    key: 'numeroCnj',
    header: 'Numero CNJ',
    width: 'w-[220px]',
    sortable: true,
    render: (value) => (
      <span
        className="text-[var(--color-primary)] font-medium"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
      >
        {String(value ?? '')}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-[100px]',
    render: (value) => {
      const statusMap: Record<string, BadgeStatus> = {
        ativo: 'active', suspenso: 'suspended',
        arquivado: 'archived', encerrado: 'closed', baixado: 'archived',
      };
      const mapped = statusMap[String(value ?? '')] ?? 'archived';
      return <Badge status={mapped} />;
    },
  },
  // action column with stopPropagation:
  {
    key: 'id',
    header: '',
    width: 'w-[80px]',
    render: (_value, row) => (
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={() => handleEdit(row)}>
          <Pencil size={14} />
        </button>
      </div>
    ),
  },
];

// Usage:
<DataTable
  columns={columns}
  data={filtrados}
  keyExtractor={(r) => r.id}
  onRowClick={(r) => navigate(`/app/processos/${r.id}`)}
  sortState={sortState}
  onSort={setSortState}
/>
```

### UrgencyHeatMap Cell
```tsx
// Source: CONTEXT.md specification + tier token definitions in globals.css
const TIER_CONFIG = [
  {
    key: 'fatal',
    label: 'Fatal',
    range: '0–1 dia',
    color: 'var(--color-tier-fatal)',
    bgColor: 'var(--color-tier-fatal)',
  },
  {
    key: 'urgente',
    label: 'Urgente',
    range: '2–3 dias',
    color: 'var(--color-tier-urgent)',
    bgColor: 'var(--color-tier-urgent)',
  },
  {
    key: 'semana',
    label: 'Esta semana',
    range: '4–7 dias',
    color: 'var(--color-tier-warning)',
    bgColor: 'var(--color-tier-warning)',
  },
  {
    key: 'proximo',
    label: 'Proximo',
    range: '8+ dias',
    color: 'var(--color-tier-info)',
    bgColor: 'var(--color-tier-info)',
  },
] as const;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `<table>` per page | DataTable component (fully controlled sort) | Phase 1 | All listing pages get consistent sort, keyboard access, row click |
| CSS `var()` strings in Recharts | `getComputedStyle` resolution in useChartTheme | Phase 3 | Charts correctly theme-switch in dark mode |
| Simple list for "Prazos desta semana" | 2x2 urgency heat map | Phase 3 | Lawyers see urgency distribution at a glance |
| Ad-hoc StatCard with icon bg | Stripe-style card with left border accent | Phase 3 | Cleaner visual hierarchy |

**Deprecated/outdated in this phase:**
- Manual inline `<table>/<thead>/<tbody>` in processos-page, prazos-page, clientes-page: replaced by DataTable
- `var(--color-*)` strings directly in Recharts `stroke`/`fill` props: replaced by resolved hex from useChartTheme
- "Prazos desta semana" list widget: replaced by UrgencyHeatMap

---

## Open Questions

1. **useTheme as standalone hook vs React Context**
   - What we know: `useTheme` is a standalone hook. Each caller has isolated state. DOM mutation (.dark class) is shared, but React state is not.
   - What's unclear: Does the sidebar toggle's `setThemeState` cause chart components to re-render via a different mechanism? (It does not — they are separate component instances with separate state.)
   - Recommendation: Use MutationObserver in `useChartTheme` (as shown in code examples) rather than refactoring `useTheme` to a Context. This avoids touching Phase 1 work and is self-contained.

2. **Heat map navigation — URL query vs React Router state**
   - What we know: React Router 7 supports both `navigate('/app/prazos?tier=fatal')` and `navigate('/app/prazos', { state: { tier } })`.
   - What's unclear: URL query is more bookmarkable; state avoids polluting URLs.
   - Recommendation: Use URL query param (`?tier=fatal`) — prazos-page already has `filtroStatus` state; adding `filtroTier` read from `useSearchParams` is minimal work and makes the filter linkable.

3. **"Audiencias da semana" section — keep or upgrade**
   - What we know: CONTEXT.md leaves this to Claude's discretion. Current implementation is a simple list.
   - Recommendation: Keep as-is (visual upgrade is out of scope for Phase 3 success criteria). Don't touch it unless the grid layout changes require it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (globals: true, environment: node) |
| Config file | `/vitest.config.ts` (workspace root) |
| Quick run command | `pnpm vitest run packages/app-desktop` |
| Full suite command | `pnpm vitest run` |

**Note:** The vitest config includes only `packages/*/src/**/*.test.ts` (TypeScript, not TSX). React component testing with jsdom is NOT configured in this workspace. The existing tests are pure unit tests (auth services, tipo validation). This phase's logic is primarily in render functions and hooks — **unit-testable portions are the pure utility functions** (countdown calculation, tier computation, CSS var resolution logic).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-03 | `useChartTheme` returns resolved hex strings (not var() strings) | unit | `pnpm vitest run packages/app-desktop/src/hooks/use-chart-theme.test.ts` | Wave 0 |
| LIST-02 | `formatCountdown(dias)` returns correct text + color class for each tier range | unit | `pnpm vitest run packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts` | Wave 0 |
| LIST-03 | Status mapping function maps processos statuses to BadgeStatus correctly including 'baixado' | unit | `pnpm vitest run packages/app-desktop/src/pages/processos/processos-page.test.ts` | Wave 0 |
| DASH-02 | `computeTierCounts` correctly buckets prazos into fatal/urgente/semana/proximo tiers | unit | `pnpm vitest run packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts` | Wave 0 |
| LIST-05 | Column width definitions sum <= 1078px for each listing | manual | visual check at 1366x768 | N/A — manual |

### Sampling Rate
- **Per task commit:** `pnpm vitest run packages/app-desktop`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app-desktop/src/hooks/use-chart-theme.test.ts` — covers DASH-03 (mock getComputedStyle, assert resolved hex)
- [ ] `packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts` — covers LIST-02 (pure function, no DOM needed)
- [ ] `packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts` — covers DASH-02 (computeTierCounts pure function)
- [ ] `packages/app-desktop/src/pages/processos/processos-page.test.ts` — covers LIST-03 (status mapping function)

**Note on test environment:** These tests require `environment: 'node'` for the pure functions. `use-chart-theme` calls `getComputedStyle` which must be mocked in node environment. Export `resolveCssVar` and `computeTierCounts` as standalone functions for testability.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `packages/app-desktop/src/pages/dashboard/dashboard-page.tsx` — existing chart patterns, StatCard component, API usage
- Direct code inspection of `packages/app-desktop/src/components/ui/data-table.tsx` — DataTable API, Column interface, sort mechanics
- Direct code inspection of `packages/app-desktop/src/components/ui/badge.tsx` — BadgeStatus type, statusConfig map
- Direct code inspection of `packages/app-desktop/src/hooks/use-theme.ts` — hook is NOT a Context, uses localStorage + DOM mutation
- Direct code inspection of `packages/app-desktop/src/styles/globals.css` — all CSS custom property names, tier token values in :root and .dark

### Secondary (MEDIUM confidence)
- Recharts docs pattern: SVG `stroke`/`fill` do not resolve CSS custom properties — verified by existing codebase behavior description and well-known SVG spec behavior
- MutationObserver pattern for watching class changes — standard Web API, well-documented

### Tertiary (LOW confidence)
- Stripe dashboard aesthetic inspiration — referenced in CONTEXT.md specifics, exact implementation details at Claude's discretion

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in package.json, versions confirmed
- Architecture: HIGH — based on direct code inspection of existing components
- Pitfalls: HIGH — identified from code analysis of existing bug patterns (var() in Recharts, useTheme singleton)
- Validation architecture: MEDIUM — test infrastructure exists but no app-desktop component tests exist yet

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack, 30-day window)
