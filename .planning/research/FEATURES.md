# Feature Landscape — CAUSA UX/UI Redesign

**Domain:** Desktop Legal ERP for Brazilian Law Firms (Electron + React, on-premise)
**Researched:** 2026-03-15
**Confidence note:** Web search tools unavailable during this session. Findings are based on
training knowledge of legal software products (Clio, MyCase, PracticePanther, Themis, e-Fólio,
SAJ, Astrea, Jusnote), professional UX research literature (Nielsen Norman Group), and Stripe/Vercel
design system analysis. Confidence levels reflect reliance on training data.

---

## Table Stakes

Features users expect in any professional legal ERP. Missing = product feels amateur or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **4-tier urgency color system for deadlines** | Lawyers are conditioned to red = fatal. Any other pattern breaks muscle memory and trust. | Low | Already specified in `CAUSA_identidade_visual.md` (informativo/atenção/urgente/fatal). Implementation is table stakes; quality of execution differentiates. |
| **Process number in monospaced font** | Brazilian process numbers (CNJ format: `0001234-56.2024.8.26.0100`) have 20+ characters. Proportional fonts make digit comparison error-prone. | Low | `JetBrains Mono 13px` already approved. Must apply consistently in all list rows and detail pages, not just some. |
| **Sidebar navigation with section grouping** | All professional desktop ERPs use persistent left sidebar. Grouped sections reduce cognitive load for 20-page apps. | Low | Already exists. Redesign must add clear visual section labels and active/hover states per visual guide. |
| **Keyboard navigation on all core tables** | Power users (secretaries processing 50+ processes/day) navigate by arrow keys. Missing = workflow blocker. | Medium | Arrow key focus, Enter to open, Esc to clear search. Non-optional for professional users. |
| **Sortable columns on all list views** | Processes list needs sorting by urgency, client name, hearing date, responsible lawyer. | Low | Standard behavior. Current implementation status unknown — must be verified per table. |
| **Persistent column sort preference** | If user sorts processes by "next hearing date", that preference must survive page navigation. | Low | Trivial with localStorage. Irritating when missing. |
| **Hover row highlight + row click target** | Entire table row must be clickable (not just a small link). Hover state must be visible. | Low | Achievable with Tailwind. Ensure pointer cursor and accessible focus ring. |
| **Empty state messages that guide action** | Empty list with no context reads as "broken". Legal users are non-technical — they need direction. | Low | Already in scope. Messages must reference legal concepts ("Nenhum processo ativo") not generic ("No items found"). |
| **Global search with keyboard shortcut** | Ctrl+K or Cmd+K is the expected convention since Notion/Linear popularized it. Exists in CAUSA — redesign must make it visually prominent. | Low | Already exists. Ensure shortcut hint is visible in the search trigger element. |
| **Loading skeleton screens** | Blank white flash before data loads reads as broken on slow SQLite queries. | Low | Skeleton component already exists. Ensure it covers all list and detail pages, not just some. |
| **Toast notifications with type variants** | Success/error/warning after any user action. Silent operations feel broken. | Low | Toast component exists. Redesign must ensure correct colors: success = verde-água, error = vermelho reservado only for true errors, warning = âmbar. |
| **Confirmation dialog for destructive actions** | Delete, archive, close process — require explicit confirmation to prevent accidental data loss. | Low | ConfirmDialog component exists. Must use Danger button variant consistently. |
| **Form field error states inline** | Error must appear below the specific field, not only as a global toast. | Low | Required for login, process creation, client registration. Inline error = `border: #DC2626` per visual guide. |
| **Consistent page header structure** | Page title, action button(s), breadcrumb — every page must follow same layout so users know where to look. | Low | Already in scope. PageHeader component must enforce consistent typography: `Inter 22px / 700`. |
| **Date format BR standard everywhere** | `DD/MM/AAAA` format throughout. American dates in a Brazilian legal system = immediate distrust. | Low | Must be verified in all date pickers, display cells, detail pages. |
| **Responsive to 1366x768 at 100% scale** | Target screen for law firm notebooks. Content must not overflow or scroll horizontally. | Medium | Every page must be verified at this resolution before delivery. |
| **Dark mode that actually works** | Not an inversion of colors — dark mode must have proper surface hierarchy (background darker than cards, cards darker than modals). | High | Full redesign scope. See differentiators section for quality dimensions. |

---

## Differentiators

Features that set CAUSA apart from generic ERPs. Not always expected, but elevate perceived quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Urgency heat map in dashboard** | Dashboard shows processes in a 2x2 urgency grid: fatal-this-week, due-this-month, upcoming, no-deadline. Lawyers immediately see where to focus without reading a list. | Medium | Requires aggregating process + prazo data. Higher value than a generic chart. Recharts already available. |
| **Prazo countdown in list rows** | Instead of raw dates, show "Hoje", "2 dias", "Próxima semana" next to deadline in process list. Relative time reads faster under deadline pressure. | Low | Format: relative label in `text-xs / âmbar or vermelho` based on urgency tier. Absolute date on hover tooltip. |
| **Sticky critical-prazo banner** | If any prazo is fatal (0–1 day), a non-dismissible amber/red strip at the top of every page shows "1 prazo crítico hoje — ver prazos". | Low | Surgical urgency interrupt. Must not appear for non-fatal prazos or it loses impact. |
| **Stripe-style stat cards with trend indicators** | Dashboard KPI cards (processos ativos, prazos esta semana, honorários pendentes) show a sparkline or ±% change vs last month. Professional ERPs show velocity, not just snapshots. | Medium | Recharts sparkline or custom SVG. Requires storing historical snapshots or computing from existing data. |
| **Process detail tab layout** | Process detail split into tabs: Dados Gerais / Prazos / Movimentações / Documentos / Financeiro / Tarefas. Removes vertical scrolling through 1500px of stacked sections. | Medium | React Router tabs (URL-driven, so browser back works). Lazy-load tab content. |
| **Inline status badge on process rows** | Color-coded status pill: `Ativo`, `Suspenso`, `Arquivado`, `Encerrado` visible at a glance in list rows without opening the record. | Low | Small pill with `border-radius: 4px`, background from color system. Do not use red for Arquivado (red is reserved). |
| **Dark mode true surface elevation** | Three distinct surfaces in dark mode: background (`#0F0F1A`) / cards (`#1A1A2E`) / modals (`#22223A`). Not just one dark color with white text — proper visual hierarchy. | High | Must be implemented with CSS custom properties, not Tailwind arbitrary values, for maintainability. |
| **Animation: modal opens from trigger** | Modal appears to grow from the button that triggered it (transform-origin), not from screen center. Vercel/Stripe convention. Creates spatial continuity. | Medium | CSS transform: `scale(0.95) → scale(1)` + `opacity: 0 → 1` with 180ms ease-out. Must respect `prefers-reduced-motion`. |
| **Animation: page transition fade-slide** | Navigation between pages uses a subtle `opacity + translateY(4px → 0)` entrance. Makes app feel like a coherent product, not a browser rendering pages. | Low | 150ms ease-in-out. Framer Motion or pure CSS. Must not delay perceived navigation — animate on render, not on navigation start. |
| **Animation: table row stagger on load** | When a list first loads, rows appear with a 20ms stagger (row 1 at 0ms, row 2 at 20ms, etc.). Subtle but communicates "fresh data, live system". | Low | Cap at 10 rows (200ms total). Rows beyond 10 appear instantly. Framer Motion `staggerChildren` or CSS custom property with index. |
| **Keyboard shortcut for new record** | `N` key on any list page opens "New process" / "New client" modal. Linear-style convention. Reduces clicks for power users. | Low | Must display shortcut hint in the primary action button tooltip. |
| **Column visibility toggle in tables** | User can hide columns they don't care about (e.g., tribunal name if single-tribunal office). Preference persisted in localStorage. | Medium | Dropdown "Colunas" with checkboxes. Not all tables need this — prioritize processos and prazos lists. |
| **Hover card on party/client name in tables** | Hovering a client name in the process list shows a popover with client phone, email, OAB number, active process count. Avoids a full navigation. | High | Requires Radix Tooltip or custom popover. Must handle positioning near screen edges. High implementation complexity at 1366px width. |
| **Login page with ambient background** | Login screen has a subtle animated gradient or static hero image with legal/Brazilian courthouse visual. First impression matters for sales demos. | Low | Stripe-style: dark left panel with product value props, right panel with login form. |
| **Sidebar collapse to icon rail** | When window is at minimum width (1024px), sidebar can collapse to 48px icon-only rail, giving content more space. | Medium | Out of scope per PROJECT.md ("sidebar fixa, não colapsável no MVP"). Document as future differentiator. |
| **Audit trail timeline on process detail** | Process detail shows a chronological activity feed: "João abriu em 03/03", "Maria adicionou documento em 05/03". Legal accountability feature. | High | Blocked by backend — no audit_log table exists yet (see CONCERNS.md). UI design can be done; wiring to data is future work. |
| **Inline financial summary on client detail** | Client detail page shows total billed, total received, outstanding balance with visual progress bar. No need to navigate to Financeiro module. | Medium | Computed from existing honorários/parcelas tables. High value for partner-level users reviewing client profitability. |
| **Print-friendly process summary** | Single process detail exports a clean printable PDF / system print dialog view. Legal requires paper trail. | Medium | CSS `@media print` stylesheet. Not a full PDF generator — leverage browser print dialog. |

---

## Anti-Features

Features to explicitly NOT build in this redesign milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Collapsible sidebar (this milestone)** | PROJECT.md explicitly marks it out of scope. Adds complexity (layout reflow, icon-only state) disproportionate to value in a redesign sprint. | Ship fixed 240px sidebar. Revisit as post-v1 differentiator. |
| **Custom title bar (frameless Electron window)** | PROJECT.md explicitly prohibits it. Breaks Windows accessibility conventions (screen readers, snap assist), requires custom drag handling. | Keep native Windows title bar. |
| **Animated charts / auto-playing data** | Charts that animate on every render or cycle through data automatically = distraction in a work environment. Legal users look at dashboards to diagnose, not to be entertained. | Animate chart once on mount (recharts `isAnimationActive`), then static. |
| **Notification badges with counts on sidebar** | Red badge dots on nav items create low-grade anxiety loop. Users start optimizing to clear badges rather than doing legal work. | Surface urgent information only on the dashboard and via the critical-prazo banner. |
| **Onboarding tooltips / feature tours** | Tooltip overlays that guide new users through every feature = friction for existing users on every visit. Legal professionals do not have patience for software tutorials mid-workday. | Write clear empty states and contextual help text on forms instead. |
| **Modals that block entire screen with overlay** | 100% opacity dark overlay on a 1366px window is claustrophobic. Loses context of what triggered the action. | Use `rgba(0,0,0,0.4)` overlay maximum. Modals should be narrow (480-600px) and centered. |
| **Gradient backgrounds on content areas** | Subtle on marketing pages; distracting behind legal data. Gradients compete with urgency colors (âmbar, vermelho). | Reserve gradients for splash screen and login hero panel only. Content areas use flat surfaces per visual guide. |
| **Real-time collaborative editing** | CAUSA is on-premise, single-office. WebSockets or collaborative features require server infrastructure that conflicts with the stateless, local-first architecture. | Not applicable to this product tier. |
| **Mobile/responsive views** | PROJECT.md explicitly out of scope. Adding breakpoints to every component doubles styling work and breaks the 1366px-optimized density. | Design for 1366×768 as the minimum. Do not add `sm:` or `md:` Tailwind breakpoints. |
| **Custom date picker widget** | Custom date pickers in legal ERPs are a reliability trap. Browser inconsistencies, timezone edge cases, accessibility failures. | Use native `<input type="date">` styled to match design tokens, or a minimal library (react-day-picker) with ARIA support. |
| **"Power user" settings panels with dozens of options** | Non-technical legal staff (secretaries, trainees) get overwhelmed by option-heavy interfaces. | Expose only the settings that must change. Use sensible defaults for everything else. |

---

## Feature Dependencies

```
Sticky critical-prazo banner
  → depends on: prazo urgency tier data (already in DB)
  → depends on: global layout slot above content (not in sidebar, not in header)

Dark mode high-quality surfaces
  → depends on: CSS custom properties for all colors (must replace Tailwind arbitrary values)
  → depends on: color tokens being semantically named (--color-surface, not --color-gray-800)
  → blocks: everything visual — must be done in Phase 1 (design system)

Process detail tab layout
  → depends on: React Router URL-driven tab state
  → depends on: page-level layout refactor (not a component change — a page restructure)

Hover card on client/party names
  → depends on: Radix UI tooltip or Floating UI positioning library
  → depends on: API endpoint to fetch client summary by ID (likely exists already)

Audit trail timeline
  → blocked by: no audit_log table in backend (CONCERNS.md confirmed missing)
  → UI can be designed; wiring requires backend work outside this milestone scope

Inline financial summary (client detail)
  → depends on: aggregation query joining honorários + parcelas
  → likely implementable with existing DB schema

Print-friendly process summary
  → depends on: CSS @media print stylesheet per-page
  → no library dependency required

Animation: page transition fade-slide
  → depends on: React Router v7 transition API (loader-based) OR manual wrapper component
  → must be compatible with existing React Router 7 setup

Prazo countdown labels (relative time)
  → depends on: date-fns or Intl.RelativeTimeFormat (no new library if using native Intl)
  → must be localized to pt-BR

Global search keyboard shortcut (Ctrl+K)
  → already exists — redesign must ensure visual affordance is present
  → depends on: search modal already implemented

Column visibility toggle
  → depends on: localStorage utility for user preferences
  → depends on: table component accepting a column visibility prop/state
```

---

## MVP Recommendation

For this redesign milestone (UX/UI only, no new logic), prioritize in this order:

**Ship first (Phase 1 — Design System Foundation):**
1. CSS custom property token system (enables both light and dark mode quality)
2. Sidebar redesign (section grouping, active/hover states)
3. Button, Input, Modal, Toast component redesign (base component quality)
4. Typography scale enforcement across all pages

**Ship second (Phase 2 — Core Screens):**
5. Dashboard with urgency heat map and Stripe-style KPI cards
6. Process list with inline urgency badges, relative countdown, monospaced process numbers
7. Prazo list with 4-tier urgency coloring
8. Dark mode surface elevation (3 levels)

**Ship third (Phase 3 — Detail Pages and Polish):**
9. Process detail with tab layout
10. Client detail with inline financial summary
11. Login page redesign (Stripe split-panel style)
12. Micro-animations (page transitions, modal scale, stagger)
13. Sticky critical-prazo banner
14. Print-friendly process summary

**Defer beyond this milestone:**
- Collapsible sidebar (PROJECT.md out of scope)
- Audit trail timeline (requires backend work)
- Hover card on client names (complexity vs value at 1366px)
- Column visibility toggle (nice-to-have, add after core screens ship)

---

## Sources

| Finding | Source | Confidence |
|---------|--------|------------|
| Legal ERP dashboard patterns (urgency focus, KPI cards) | Training knowledge of Clio, MyCase, Themis, SAJ, Astrea | MEDIUM |
| CNJ process number format (20 chars, monospace need) | Training knowledge of Brazilian legal system standards | HIGH |
| Stripe/Vercel animation conventions (180ms modal, page fade-slide) | Training knowledge of documented Stripe design system, Vercel app | MEDIUM |
| Dark mode surface elevation (3 levels: bg/card/modal) | Training knowledge of Material Design 3, GitHub dark mode, Linear dark mode | HIGH |
| Keyboard shortcut conventions (Ctrl+K, N for new) | Training knowledge of Linear, Notion, GitHub documented shortcuts | HIGH |
| Anti-feature: notification badge anxiety loop | NNGroup research on notification overload (training data) | MEDIUM |
| Tailwind CSS 4 custom properties for dark mode | Context7 + official Tailwind docs | HIGH — verified in STACK.md |
| Brazilian date format DD/MM/AAAA as table stakes | Domain knowledge of Brazilian legal regulation | HIGH |
| `prefers-reduced-motion` for animation accessibility | WCAG 2.2 + browser specification | HIGH |
| Tab layout for detail pages (URL-driven) | React Router 7 documentation + training knowledge of Radix primitives | MEDIUM |

---

*Research conducted: 2026-03-15*
*Note: Web search and WebFetch tools were unavailable during this research session. All findings based on
training knowledge (cutoff August 2025) and direct analysis of project files (PROJECT.md, CAUSA_identidade_visual.md,
codebase CONCERNS.md, STACK.md). Verification via official sources is recommended before final implementation decisions.*
