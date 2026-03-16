# Phase 4: Detail Pages, Auth e Polish - Research

**Researched:** 2026-03-16
**Domain:** React Router v7 nested routes, motion/react AnimatePresence, Framer Motion stagger, CSS @media print, WCAG AA contrast audit, Electron splash HTML
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Processo Detail Tabs**
- Underline tabs style — horizontal text tabs with active underline indicator, like Stripe/GitHub
- 6 tabs: Dados Gerais / Prazos / Movimentações / Documentos / Financeiro / Tarefas
- URL-driven via React Router — navigating directly to a tab URL opens the correct tab, browser back/forward navigates between tabs
- Tab labels show item count badges: "Prazos (5)", "Documentos (12)" — data already fetched in carregar() Promise.all
- Header area (CNJ + breadcrumb + status badges + edit button) sits ABOVE the tabs, always visible regardless of active tab
- "Dados Gerais" tab keeps current layout as-is: info cards grid + status badges + tags + observações (already well-organized)
- Each remaining tab (Prazos, Movimentações, Documentos, Financeiro, Tarefas) renders its corresponding Section content from the current page

**Login Split-Panel**
- Split-panel layout: left dark panel (#0F1829) + right form panel (--color-bg)
- Left panel content: CAUSA logo (white), tagline "A sua causa, no seu escritório" in Lora, 3-4 feature bullets, version at bottom
- Right panel: "Entrar" heading, "Acesse seu escritório" subtitle, email/password form, submit button
- Theme toggle stays on login page — top-right corner of the right panel
- No major changes to form logic — keep existing email/password + error handling

**Splash Screen Refresh**
- Broader refresh beyond minimal fix — update to visually cohesify with new login split-panel
- Fix tagline font: change Inter 15px → Lora 16px per AUTH-02 spec
- Refresh spacing, progress bar styling, and general visual alignment with login left panel aesthetic
- Keep existing Electron IPC progress integration — splash.html is a static file in electron/splash/

**Cliente Financial Summary**
- New "Resumo Financeiro" card section placed after "Informações Adicionais" and before "Processos vinculados"
- Stacked horizontal bar with 3 color segments: green (recebido) + blue (pendente) + muted (não faturado)
- Numbers displayed below each segment with absolute value + percentage
- "Total Faturado" as card header value
- Gated behind `useFeatures().financeiro` flag
- Empty state when no financial data exists

**Print Stylesheet (DET-03)**
- CSS @media print for processo detail page — clean layout without sidebar or navigation
- Print shows processo header info + active tab content (or all sections if no tab context in print)

**Animations**
- Modal (ANIM-01): Keep current AnimatePresence + motion.div. Ensure scale(0.95→1) + opacity, 180ms ease-out. Center origin — skip trigger tracking
- Page transitions (ANIM-02): motion/react AnimatePresence at route level with `mode="wait"`. initial: opacity 0 + y:4px → animate: opacity 1 + y:0 → exit: opacity 0 + y:-4px. 150ms ease-in-out
- Row stagger (ANIM-03): First load only — rows animate with 20ms stagger (cap 10 rows / 200ms). Sorting/filtering/re-fetching shows rows instantly
- All animations respect prefers-reduced-motion (DS-19 carried from Phase 1)

**Accessibility**
- A11Y-01: WCAG AA contrast audit for all text and interactive elements in both themes
- A11Y-02: Focus rings visible on all interactive elements — buttons, inputs, links, table rows, tabs

### Claude's Discretion
- Tab component implementation (Radix Tabs vs custom with NavLink)
- Exact feature bullet text for login left panel
- Splash refresh visual details (spacing, animation timing updates)
- Financial summary API endpoint design (aggregate from existing honorários data)
- Print stylesheet exact layout and which sections to include
- Row stagger implementation approach (motion.div per row vs CSS animation-delay)
- WCAG AA contrast fixes — specific token adjustments as needed
- Tab underline animation (static vs sliding indicator)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DET-01 | Pagina de detalhe do processo com layout em tabs: Dados Gerais / Prazos / Movimentacoes / Documentos / Financeiro / Tarefas — tabs URL-driven via React Router | React Router v7 nested routes + NavLink pattern enables URL-driven tabs without Radix dependency |
| DET-02 | Resumo financeiro inline na pagina de detalhe do cliente: total faturado, recebido, pendente com barra visual de progresso | listarHonorarios() global API + clienteId filter approach; stacked bar via CSS flexbox segments |
| DET-03 | CSS @media print para pagina de detalhe do processo — resumo limpo e imprimivel via dialogo de impressao do sistema | @media print with print-only classes; hide sidebar via .dark/body class; show all tab sections in print even if only one active |
| AUTH-01 | Login page redesenhada em split-panel: painel esquerdo escuro com proposta de valor CAUSA + painel direito com formulario de login | Rewrite login-page.tsx from centered card to two-panel flex layout; left panel hardcoded dark #0F1829 ignoring theme |
| AUTH-02 | Splash screen conforme guia: fundo #0F1829, logo CAUSA branco centralizado, tagline Lora 16px, barra de progresso azul 2px, versao no canto | splash.html static update: change .tagline from Inter 15px → Lora 16px; background already correct at #0F1829 |
| ANIM-01 | Modal abre com scale(0.95 → 1) + opacity(0 → 1), 180ms ease-out — com AnimatePresence para animacao de saida | modal.tsx already implements this pattern correctly; verify transform-origin: center is default, no changes needed |
| ANIM-02 | Transicao entre paginas com opacity + translateY(4px → 0), 150ms ease-in-out | AnimatePresence with mode="wait" around Outlet in app-layout.tsx; useLocation() key triggers re-mount |
| ANIM-03 | Table rows aparecem com stagger de 20ms (cap 10 rows / 200ms total) no primeiro load da lista | DataTable isFirstLoad prop + CSS animation-delay approach OR motion.div per row; CSS approach avoids motion DOM overhead for large tables |
| A11Y-01 | Contraste WCAG AA em ambos os temas (light e dark) para todos os textos e elementos interativos | Audit --color-text-muted (#9ca3af on dark surfaces) — known risk; --color-text-muted on light (#6b7280 on #f7f6f3 passes at 4.7:1) |
| A11Y-02 | Focus rings visiveis em todos os elementos interativos (botoes, inputs, links, rows de tabela) | focus-causa utility already defined in globals.css; DataTable rows already have focus-causa; verify tab nav elements get it |
</phase_requirements>

---

## Summary

This phase completes the CAUSA visual revision by tackling the four most complex UI areas: tabbed detail pages, redesigned auth screens, purposeful micro-animations, and accessibility hardening. The codebase is in excellent condition — Phase 1-3 established all the primitives needed, so Phase 4 is primarily about composition and polish rather than new infrastructure.

The highest-complexity task is DET-01 (processo tabs with URL routing). The current processo-detail-page.tsx (765 lines) must be restructured so each tab section becomes a child route or a conditional render driven by URL params. React Router v7 is already installed (v7.13.1) and the project uses `HashRouter` — which means nested routes work with `#/app/processos/:id/prazos` style paths. The decision of whether to use Radix Tabs or custom NavLink tabs is left to Claude's discretion; the NavLink approach is lighter and gives full URL control without requiring a new Radix dependency.

The animation work (ANIM-01/02/03) builds directly on existing patterns. `modal.tsx` already uses the exact ANIM-01 pattern. The only open work is adding AnimatePresence around `<Outlet>` in `app-layout.tsx` for page transitions and adding a first-load stagger to `DataTable`. The accessibility audit (A11Y-01) has one confirmed risk: `--color-text-muted` in dark mode is `#9ca3af` on surface `#1a1a2e` — this should be verified for WCAG AA compliance.

**Primary recommendation:** Use React Router nested routes for tabs (not Radix Tabs) to keep the tab URL pattern fully integrated with `HashRouter` history. Use CSS animation-delay for row stagger (not motion.div per row) to avoid adding motion DOM nodes to every table row in the app.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | ^7.13.1 (installed) | URL-driven tabs via nested routes + NavLink | Already in project; v7 has stable `<Outlet>` for nested layout |
| motion/react | ^12.36.0 (installed) | Page transitions AnimatePresence + modal scale | Already used in modal.tsx; established pattern |
| tailwindcss | ^4.2.1 (installed) | @media print utilities + layout | Already used; @media print works with Tailwind utilities |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.15 (installed) | Modal focus trap already implemented | Not adding Radix Tabs — use NavLink pattern instead |
| lucide-react | ^0.577.0 (installed) | Icons for tab content headers | Already used everywhere |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom NavLink tabs | Radix Tabs | Radix Tabs adds a dependency but handles ARIA roles for tab pattern automatically. NavLink gives URL-driven behavior without additional bundle weight. Given the decision to use URL-driven tabs, NavLink is the natural fit. |
| CSS animation-delay stagger | motion.div per row | motion.div wraps each row in a DOM node — adds overhead for large tables. CSS animation-delay is zero-cost at runtime and respects `prefers-reduced-motion` via the existing `@media (prefers-reduced-motion: reduce)` block in globals.css. |

**Installation:** No new packages required — all needed libraries are already in package.json.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. Changes are modifications to existing files:

```
packages/app-desktop/src/
├── pages/processos/
│   └── processo-detail-page.tsx    # Major rewrite: scroll → tabbed layout
├── pages/clientes/
│   └── cliente-detail-page.tsx     # Add ResumoFinanceiro card section
├── pages/login/
│   └── login-page.tsx              # Rewrite: centered card → split-panel
├── components/layout/
│   └── app-layout.tsx              # Add AnimatePresence around Outlet
├── components/ui/
│   └── data-table.tsx              # Add optional firstLoad stagger prop
├── lib/
│   └── api.ts                      # Add listarHonorariosDoCliente()
└── styles/
    └── globals.css                 # Add @media print rules (or separate print.css)

electron/splash/
└── splash.html                     # Update tagline font, refresh spacing
app.tsx                             # Add nested routes for processo tabs
```

### Pattern 1: URL-Driven Tabs via Nested Routes (DET-01)

**What:** Convert processo detail page from a single-route flat page to a parent route (with header + tab bar) plus child routes for each tab's content.

**When to use:** When tab state must survive direct URL navigation and browser history traversal.

**Approach — Option A (Nested Routes — recommended):**

Add child routes to `app.tsx`:
```typescript
// app.tsx — nested routes for processo tabs
<Route
  path="processos/:id"
  element={<RequirePermission ...><ProcessoDetailPage /></RequirePermission>}
>
  <Route index element={<Navigate to="dados-gerais" replace />} />
  <Route path="dados-gerais" element={<ProcessoDadosGeraisTab />} />
  <Route path="prazos" element={<ProcessoPrazosTab />} />
  <Route path="movimentacoes" element={<ProcessoMovimentacoesTab />} />
  <Route path="documentos" element={<ProcessoDocumentosTab />} />
  <Route path="financeiro" element={<ProcessoFinanceiroTab />} />
  <Route path="tarefas" element={<ProcessoTarefasTab />} />
</Route>
```

`ProcessoDetailPage` renders header + tab bar + `<Outlet />` for tab content. Tab components receive data via props passed from the parent (data already fetched in `carregar()`).

**Approach — Option B (Single route + useSearchParams/useNavigate):**

Stay on single route `processos/:id`, store active tab in URL as `?tab=prazos`. Use `useSearchParams()` (already used in prazos-page.tsx) to read and set the active tab. Simpler restructure — no need to split the component into sub-files.

```typescript
// processo-detail-page.tsx — useSearchParams approach
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') ?? 'dados-gerais';

function handleTabChange(tab: string) {
  setSearchParams({ tab }, { replace: false }); // adds history entry
}
```

**Recommendation:** Option B (useSearchParams) is lower risk — no need to refactor routes in app.tsx, no need to split ProcessoDetailPage into multiple files, and browser back/forward still works because `replace: false` adds history entries. The CONTEXT.md says "URL-driven via React Router" — useSearchParams satisfies this requirement with less restructure.

**Tab bar implementation (custom NavLink-style with useSearchParams):**
```typescript
// Source: established pattern from prazos-page.tsx (useSearchParams already used)
const TABS = [
  { key: 'dados-gerais', label: 'Dados Gerais' },
  { key: 'prazos', label: 'Prazos', count: prazos.length },
  { key: 'movimentacoes', label: 'Movimentações', count: movimentacoes.length },
  { key: 'documentos', label: 'Documentos', count: documentos.length },
  ...(financeiroEnabled ? [{ key: 'financeiro', label: 'Financeiro', count: honorarios.length }] : []),
  { key: 'tarefas', label: 'Tarefas', count: tarefas.length },
] as const;

// Tab bar with underline indicator
<nav role="tablist" className="flex border-b border-[var(--color-border)]">
  {TABS.map(tab => (
    <button
      key={tab.key}
      role="tab"
      aria-selected={activeTab === tab.key}
      onClick={() => handleTabChange(tab.key)}
      className={`
        px-4 py-2.5 text-sm-causa font-medium transition-causa cursor-pointer
        relative focus-causa
        ${activeTab === tab.key
          ? 'text-[var(--color-primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }
      `}
    >
      {tab.label}
      {'count' in tab && tab.count > 0 && (
        <span className="ml-1.5 text-xs-causa bg-causa-surface-alt px-1.5 py-0.5 rounded-full">
          {tab.count}
        </span>
      )}
    </button>
  ))}
</nav>
```

**ARIA note:** `role="tablist"` + `role="tab"` + `aria-selected` is sufficient for WCAG AA tab pattern. Focus ring from `focus-causa` utility covers A11Y-02.

### Pattern 2: Page Transitions via AnimatePresence (ANIM-02)

**What:** Wrap the `<Outlet />` in `app-layout.tsx` with `AnimatePresence` keyed on the current route path.

**When to use:** When all route transitions should share a uniform enter/exit animation.

```typescript
// Source: modal.tsx pattern (same library, same approach)
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, Outlet } from 'react-router-dom';

// Inside AppLayout main area:
const location = useLocation();
const prefersReducedMotion = useReducedMotion();

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
    exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
    transition={{ duration: 0.15, ease: 'easeInOut' }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

**Critical:** `mode="wait"` ensures the exit animation completes before the new page enters. Without it, both pages are mounted simultaneously during the transition, which can cause layout jumps if pages have different heights.

**Tab change transitions:** For tabs within processo-detail-page, the `key` on the tab content container drives AnimatePresence re-mount. Use `activeTab` as the key:
```typescript
<AnimatePresence mode="wait">
  <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.1}}>
    {renderActiveTabContent()}
  </motion.div>
</AnimatePresence>
```

### Pattern 3: Row Stagger — CSS animation-delay (ANIM-03)

**What:** Add an optional `isFirstLoad` boolean prop to DataTable. When true, each row gets a CSS animation-delay based on its index (capped at 10).

**When to use:** First mount of a list page — not on sort/filter/re-fetch.

```typescript
// DataTable enhancement
interface DataTableProps<T> {
  // ...existing props
  animateFirstLoad?: boolean; // NEW optional prop
}

// In row render:
const rowStyle = (animateFirstLoad && idx < 10)
  ? { animationDelay: `${idx * 20}ms`, animationName: 'rowFadeIn', animationDuration: '200ms', animationFillMode: 'both' }
  : undefined;
```

CSS in globals.css:
```css
@keyframes rowFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Respects prefers-reduced-motion:** The existing `@media (prefers-reduced-motion: reduce)` block in globals.css already overrides all animation-duration to 0.01ms, so no additional handling needed.

**First-load detection:** The calling page component controls `animateFirstLoad` — pass `true` on initial data fetch, `false` on subsequent fetches (sort, filter, re-fetch). This is a managed prop, not internal DataTable state.

### Pattern 4: Login Split-Panel (AUTH-01)

**What:** Rewrite login-page.tsx from centered single card to two-column flex layout.

```typescript
// login-page.tsx structure
<div className="min-h-screen flex">
  {/* Left panel — always dark, ignores theme */}
  <div className="hidden lg:flex w-1/2 flex-col justify-between p-10"
       style={{ backgroundColor: '#0F1829' }}>
    <CausaLogo size={48} showText className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
    <div className="flex-1 flex flex-col justify-center gap-6">
      <p className="font-[var(--font-brand)] text-white" style={{ fontSize: '20px' }}>
        A sua causa, no seu escritório.
      </p>
      <ul className="space-y-3 text-white/70 text-sm-causa">
        <li>— Gestão de prazos e processos</li>
        <li>— Controle financeiro completo</li>
        <li>— Monitoramento processual automático</li>
      </ul>
    </div>
    <p className="text-white/30 text-xs-causa">CAUSA {appVersion}</p>
  </div>
  {/* Right panel — respects theme */}
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-bg)] relative">
    <button onClick={toggleTheme} className="absolute top-4 right-4 ...">
      {/* theme toggle */}
    </button>
    {/* existing form card */}
  </div>
</div>
```

**CausaLogo white variant:** The existing `CausaLogo` component renders an SVG icon + Lora text. For the dark panel, the icon needs `filter: invert(1)` or `brightness(0) invert(1)` and the text needs `color: white`. Pass via className or a new `variant="white"` prop.

**Responsive note:** The left panel is `hidden lg:flex` — on small screens only the right form panel shows. The app is desktop-only (min 1366px per requirements) so this is always visible.

### Pattern 5: Financial Summary Bar (DET-02)

**What:** Stacked horizontal progress bar with 3 segments driven by honorários data.

**Data aggregation:** No new API endpoint needed. The existing `listarHonorarios()` function returns all honorários globally with `clienteId` field. Filter client-side:
```typescript
// In cliente-detail-page.tsx carregar()
const honData = financeiroEnabled
  ? await listarHonorarios()  // existing function
  : [];
const clienteHonorarios = honData.filter(h => h.clienteId === id);
```

**Bar component:**
```typescript
// ResumoFinanceiro card — inline in cliente-detail-page.tsx
const totalFaturado = honorarios.reduce((sum, h) => sum + h.valor, 0);
const recebido = honorarios.filter(h => h.status === 'recebido').reduce((sum, h) => sum + h.valor, 0);
const pendente = honorarios.filter(h => h.status === 'pendente').reduce((sum, h) => sum + h.valor, 0);
const inadimplente = honorarios.filter(h => h.status === 'inadimplente').reduce((sum, h) => sum + h.valor, 0);

// Stacked bar: width percentage of each segment
const pctRecebido = totalFaturado > 0 ? (recebido / totalFaturado) * 100 : 0;
const pctPendente = totalFaturado > 0 ? (pendente / totalFaturado) * 100 : 0;
```

**Visual:** CSS flexbox with 3 divs, `flex-shrink-0`, explicit widths set via inline style. Segments: green (--color-success), blue (--color-primary), muted (--color-surface-alt). No external chart library needed.

### Pattern 6: CSS @media print (DET-03)

**What:** Print stylesheet that hides sidebar, navigation, and buttons — shows only processo content.

**Approach — inline in globals.css or separate print.css:**
```css
@media print {
  /* Hide chrome */
  [data-sidebar], nav, header, .no-print { display: none !important; }

  /* Full width for content area */
  main { padding: 0 !important; overflow: visible !important; }

  /* Make all tab sections visible in print (not just active tab) */
  [data-print-section] { display: block !important; }

  /* Prevent page breaks inside cards */
  .bg-\[var\(--color-surface\)\] { break-inside: avoid; }

  /* Remove shadows and borders that waste ink */
  * { box-shadow: none !important; }
}
```

**Tab content in print:** Add `data-print-section` attribute to each tab panel. In normal rendering they're conditionally visible. In print, override with `display: block !important` to show all sections. The processo header is always visible (above tabs), so it always prints.

### Anti-Patterns to Avoid

- **Keying AnimatePresence by query param:** When using useSearchParams for tabs, DO NOT key the AnimatePresence on `location.search` for the outer page-level transition — this would trigger a full page re-mount on every tab click. Use a separate inner AnimatePresence keyed on `activeTab` for tab content, and the outer one keyed on `location.pathname` only.
- **Animating DataTable rows with motion.div:** Wrapping each `<tr>` in a `<motion.div>` would break table layout since `motion.div` renders a `<div>` not a `<tr>`. Use inline style animation-delay on the `<tr>` element directly.
- **Hardcoding hex in React components for the login left panel:** The left panel background (#0F1829) is a one-time exception using `style={{ backgroundColor: '#0F1829' }}`. The design decision (logged in STATE.md patterns) is that hex only lives in :root/.dark. Since this hardcoded value IS the dark brand color and never changes between themes, using inline style here is acceptable per the identity guide principle. Do not use Tailwind arbitrary value for it.
- **Using `replace: true` for tab navigation:** Tab history entries MUST be added with `replace: false` (the default) so browser back/forward navigates between tabs. The CONTEXT.md requirement explicitly states back/forward must work.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab ARIA semantics | Custom role management | `role="tablist"` + `role="tab"` + `aria-selected` — 3 attributes on existing HTML elements | Browser handles keyboard navigation in tablist role automatically |
| Exit animations for modals/pages | CSS transitions with class toggling | `AnimatePresence` + `motion/react` (already installed) | AnimatePresence handles the unmounting timing problem that plain CSS transitions cannot solve |
| Progress bar segments | Canvas or SVG chart | CSS flexbox with 3 `<div>` elements + inline width percentages | Zero dependency, theme-aware via var() tokens, simple to maintain |
| Print layout | JavaScript-driven print state | `@media print` CSS | Browser handles print rendering; JS-based approaches can fail in Electron |
| WCAG contrast checking | Custom contrast calculation | Browser DevTools accessibility panel + manual ratio check (4.5:1 AA text, 3:1 AA large text) | No runtime checking needed — this is a build-time audit |

**Key insight:** This phase is almost entirely composition and configuration of already-installed libraries. The main pitfalls are API surface details (correct motion/react props, correct router patterns) not missing capabilities.

---

## Common Pitfalls

### Pitfall 1: HashRouter + Nested Routes
**What goes wrong:** When using `HashRouter`, nested routes with `<Navigate to="dados-gerais" replace />` redirect works correctly in browser, but if using the useSearchParams approach the hash URL is `#/app/processos/:id?tab=prazos` — this may look unusual but works correctly with React Router's hash-based routing.
**Why it happens:** `HashRouter` encodes everything after `#` as the path + search params. `useSearchParams()` reads from the hash portion, not the real URL search params.
**How to avoid:** Test tab navigation with direct URL entry and browser back/forward before declaring complete. Use `useSearchParams` consistently — do not mix `useNavigate` with manual hash manipulation.
**Warning signs:** Tab state not persisting on browser refresh (means reading from wrong param source).

### Pitfall 2: AnimatePresence mode="wait" + Outlet Performance
**What goes wrong:** `mode="wait"` blocks the new route from rendering until the exit animation finishes. At 150ms, this is barely noticeable, but if the new page has a slow data fetch, users see a blank page for 150ms + fetch time.
**Why it happens:** `mode="wait"` prevents new children from mounting until exit completes.
**How to avoid:** 150ms is fast enough that this is a non-issue. If a page has loading skeletons, they appear after the animation completes, not before — which is acceptable UX.
**Warning signs:** Visible blank flash before new page content loads (acceptable at 150ms).

### Pitfall 3: DataTable `<tr>` Animation
**What goes wrong:** Applying `motion.div` or `motion.tr` to table rows in a `<table>` + `<tbody>` context. `motion.tr` requires `motion/react` v10+ and may not be available in all versions.
**Why it happens:** `<motion.div>` inside `<tbody>` is invalid HTML — browsers auto-fix by pulling the div out of the table.
**How to avoid:** Use inline `style={{ animationDelay: '...', animationName: 'rowFadeIn' }}` on native `<tr>` elements. The `@keyframes rowFadeIn` lives in globals.css.
**Warning signs:** Rows appearing outside the table borders, or table layout collapsing.

### Pitfall 4: Login Left Panel in Dark Mode
**What goes wrong:** If `--color-bg` is used for the left panel in dark mode, the left panel becomes `#0f0f1a` instead of `#0F1829` — visually different from the spec and from the splash screen.
**Why it happens:** Left panel should ALWAYS be `#0F1829` regardless of theme — it is the brand dark background, not a theme-aware surface.
**How to avoid:** Use `style={{ backgroundColor: '#0F1829' }}` (inline style) for the left panel — not a CSS token reference. This is the one justified hex hardcode in React components.
**Warning signs:** Left panel changes color when switching between light and dark themes.

### Pitfall 5: Splash HTML Font Path
**What goes wrong:** Changing the tagline font in splash.html from Inter to Lora requires verifying the Lora font file is available at `fonts/Lora-Regular.woff2` (or whatever weight is needed) in the `electron/splash/` directory.
**Why it happens:** The existing `@font-face` in splash.html only loads `Lora-SemiBold.woff2` (weight 600). The tagline at 16px regular weight needs weight 400, which may require adding a separate `@font-face` for `Lora-Regular.woff2`.
**How to avoid:** Check which Lora weight files exist in the splash/fonts directory before writing the CSS. The CONTEXT.md spec says "tagline in Lora 16px" — check if regular or italic is intended.
**Warning signs:** Tagline rendering in browser fallback font (Georgia/Times) instead of Lora.

### Pitfall 6: WCAG AA Contrast — Dark Theme Risk
**What goes wrong:** `--color-text-muted: #9ca3af` on dark surfaces `#1a1a2e` (surface) or `#252540` (surface-alt) may fail AA contrast ratio of 4.5:1 for normal text.
**Why it happens:** #9ca3af on #1a1a2e gives approximately 4.15:1 contrast ratio — below the 4.5:1 AA threshold for normal-weight text at 13px. It passes for large text (3:1) but text-muted is used at 11-13px throughout.
**How to avoid:** In the A11Y-01 pass, audit text-muted in dark mode specifically. Consider bumping `--color-text-muted` in `.dark` from `#9ca3af` to `#b3b8c4` (approximately 5.3:1 on #1a1a2e).
**Warning signs:** Any text using `text-[var(--color-text-muted)]` in the dark theme at 11-13px.

---

## Code Examples

Verified patterns from existing codebase and motion/react documentation:

### Modal Animation (Already Correct — ANIM-01 Reference)
```typescript
// Source: packages/app-desktop/src/components/ui/modal.tsx (lines 23-58)
// This is the reference pattern — ANIM-01 is already implemented correctly
const animTransition: Transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.18, ease: 'easeOut' as const };

<Dialog.Portal forceMount>
  <AnimatePresence>
    {open && (
      <Dialog.Content asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={animTransition}
        />
      </Dialog.Content>
    )}
  </AnimatePresence>
</Dialog.Portal>
```

### Page Transition in AppLayout (ANIM-02)
```typescript
// Source: modal.tsx pattern adapted for route-level transitions
// packages/app-desktop/src/components/layout/app-layout.tsx
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header ...>...</header>
        <DeadlineBanner />
        <UpdateBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BackupIndicator />
    </div>
  );
}
```

### Tab Navigation with useSearchParams
```typescript
// Source: useSearchParams pattern from prazos-page.tsx (line 50)
// Apply to processo-detail-page.tsx
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') ?? 'dados-gerais';

function handleTabChange(tabKey: string) {
  setSearchParams({ tab: tabKey }); // replace: false by default = adds history entry
}
```

### Row Stagger Animation (ANIM-03)
```typescript
// Source: globals.css @keyframes pattern + DataTable tr
// In globals.css — add to existing animations section:
@keyframes rowFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

// In DataTable.tsx — add animateFirstLoad prop to DataTableProps
// In the row render loop:
const staggerStyle = (animateFirstLoad && idx < 10)
  ? {
      animationName: 'rowFadeIn',
      animationDuration: '200ms',
      animationTimingFunction: 'ease-out',
      animationFillMode: 'both',
      animationDelay: `${idx * 20}ms`,
    } as React.CSSProperties
  : undefined;

<tr style={staggerStyle} className="..." ...>
```

### Focus Ring on Tab Buttons (A11Y-02)
```typescript
// Source: globals.css @utility focus-causa (line 216-222)
// Apply to tab button elements:
<button
  role="tab"
  aria-selected={activeTab === tab.key}
  className={`... focus-causa cursor-pointer`}
>
```

### CausaLogo White Variant for Login Left Panel
```typescript
// Source: packages/app-desktop/src/components/ui/causa-logo.tsx
// CausaLogo already supports className prop.
// For white-on-dark rendering — the SVG icon and text need CSS filters:
<CausaLogo
  size={48}
  showText
  className="[&_img]:brightness-0 [&_img]:invert [&_span]:!text-white"
/>
// OR: add a 'white' variant prop to CausaLogo component
```

### Financial Summary Bar
```typescript
// Inline component in cliente-detail-page.tsx
// No additional imports needed
function ResumoFinanceiro({ honorarios }: { honorarios: HonorarioRow[] }) {
  const total = honorarios.reduce((s, h) => s + h.valor, 0);
  if (total === 0) return <EmptyFinanceiro />;

  const recebido = honorarios.filter(h => h.status === 'recebido').reduce((s,h) => s + h.valor, 0);
  const pendente = honorarios.filter(h => h.status === 'pendente').reduce((s,h) => s + h.valor, 0);
  const inadimplente = total - recebido - pendente;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
      {/* header + stacked bar + segment labels */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div style={{ width: `${(recebido/total)*100}%`, backgroundColor: 'var(--color-success)' }} />
        <div style={{ width: `${(pendente/total)*100}%`, backgroundColor: 'var(--color-primary)' }} />
        <div style={{ width: `${(inadimplente/total)*100}%` }} className="bg-causa-surface-alt" />
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion package | motion/react (same package, new name) | 2024 — Framer Motion v11 rebranded to motion | Import from `motion/react` not `framer-motion` — already correct in codebase |
| HashRouter `useHistory` | `useNavigate` + `useSearchParams` | React Router v6+ | `useHistory` removed; `useSearchParams` is the modern API |
| CSS Modules / styled-components | Tailwind CSS 4 @theme inline | Phase 1 established this pattern | No CSS Modules — all styling via Tailwind utilities + var() tokens |

**Deprecated/outdated:**
- `useHistory`: Replaced by `useNavigate` in React Router v6+. Project already uses `useNavigate` (prazos-page.tsx line 49).
- `withRouter` HOC: Not in React Router v7. All hook-based.
- `framer-motion` package name: Rebranded to `motion`. Import path is `motion/react` — already correct in modal.tsx.

---

## Open Questions

1. **Lora font weights in splash.html**
   - What we know: `@font-face` in splash.html loads `Lora-SemiBold.woff2` (weight 600). The tagline currently uses `Inter` weight 400.
   - What's unclear: Which Lora weight files exist in `electron/splash/fonts/` directory (not read during research).
   - Recommendation: Planner should add a Wave 0 task to verify font files. If `Lora-Regular.woff2` is absent, either use weight 600 (SemiBold, which is fine at 16px) or copy the file from `@fontsource/lora` package assets.

2. **listarHonorarios() performance for DET-02**
   - What we know: `listarHonorarios()` returns ALL honorários without clienteId filter at the API level. For a large office with many clients, this could return hundreds of records.
   - What's unclear: Whether the backend `/api/honorarios` endpoint supports a `?clienteId=` query param (not visible in api.ts).
   - Recommendation: Use client-side filter for MVP (correct per CONTEXT.md — "aggregate from existing honorários data"). If the office has 500+ honorários, the API call takes longer. This is acceptable for a first version. Planner can note this as a known limitation.

3. **Tab scroll position on tab switch**
   - What we know: Current processo-detail-page scrolls as a flat layout. After converting to tabs, switching tabs will jump to the top of the main content area.
   - What's unclear: Whether this is desirable UX.
   - Recommendation: This is standard behavior for tab-based UIs (Stripe, GitHub both do this). Accept it as correct.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (workspace-level config) |
| Config file | `/vitest.config.ts` — `include: ['packages/*/src/**/*.test.ts']` |
| Quick run command | `pnpm test --filter @causa/app-desktop` |
| Full suite command | `pnpm test` (workspace root) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DET-01 | URL-driven tabs — `?tab=prazos` sets active tab to Prazos | unit | `pnpm test --filter @causa/app-desktop -- processo-detail` | ❌ Wave 0 |
| DET-02 | ResumoFinanceiro aggregates recebido/pendente/inadimplente correctly | unit | `pnpm test --filter @causa/app-desktop -- cliente-detail` | ❌ Wave 0 |
| DET-03 | @media print rules — visual only | manual-only | Browser print preview in Electron | N/A |
| AUTH-01 | Login split-panel — visual only | manual-only | Visual inspection in both themes | N/A |
| AUTH-02 | Splash tagline font — visual only | manual-only | Launch Electron, observe splash | N/A |
| ANIM-01 | Modal animation already correct — no regression | manual-only | Open/close any modal, observe scale | N/A |
| ANIM-02 | Page transitions — visual only | manual-only | Navigate between pages in Electron | N/A |
| ANIM-03 | Row stagger fires on first load only (not on sort) | unit | `pnpm test --filter @causa/app-desktop -- data-table` | ❌ Wave 0 |
| A11Y-01 | Text contrast tokens — static audit | manual-only | Browser DevTools accessibility panel | N/A |
| A11Y-02 | Focus rings visible on tabs, buttons, rows | manual-only | Tab navigation in Electron | N/A |

### Sampling Rate
- **Per task commit:** `pnpm test --filter @causa/app-desktop`
- **Per wave merge:** `pnpm test` (all packages)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app-desktop/src/pages/processos/processo-detail-page.test.ts` — covers DET-01 (tab state from searchParams)
- [ ] `packages/app-desktop/src/pages/clientes/cliente-detail-page.test.ts` — covers DET-02 (financial aggregation logic)
- [ ] `packages/app-desktop/src/components/ui/data-table.test.ts` — covers ANIM-03 (animateFirstLoad prop behavior)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `packages/app-desktop/src/components/ui/modal.tsx` — AnimatePresence + motion/react pattern verified
- Direct codebase read: `packages/app-desktop/src/app.tsx` — HashRouter + route structure verified
- Direct codebase read: `packages/app-desktop/src/pages/prazos/prazos-page.tsx` — useSearchParams pattern verified
- Direct codebase read: `packages/app-desktop/src/styles/globals.css` — token system, focus-causa utility, prefers-reduced-motion block verified
- Direct codebase read: `packages/app-desktop/package.json` — motion ^12.36.0, react-router-dom ^7.13.1 versions confirmed
- Direct codebase read: `electron/splash/splash.html` — current Lora font load (weight 600 only), IPC integration verified
- Direct codebase read: `lib/api.ts` — listarHonorarios(), listarTarefas(processoId), HonorarioRow interface verified

### Secondary (MEDIUM confidence)
- React Router v7 docs (knowledge from training + confirmed by v7.13.1 in package.json): `useSearchParams`, `useNavigate`, `<Outlet>`, `mode="wait"` on AnimatePresence with router
- motion/react v12 docs (knowledge from training + confirmed by import path `motion/react` in modal.tsx): `AnimatePresence`, `useReducedMotion`, Transition type

### Tertiary (LOW confidence)
- WCAG AA contrast ratios: #9ca3af on #1a1a2e ≈ 4.15:1 — needs verification with actual contrast checker tool during A11Y-01 audit pass

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — all patterns verified from existing codebase (modal.tsx, prazos-page.tsx, data-table.tsx)
- Pitfalls: HIGH for implementation pitfalls (verified from code); MEDIUM for contrast ratios (calculated from CSS token values, needs tool verification)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable dependencies — motion, react-router-dom, tailwindcss are stable releases)
