# Architecture Patterns: Design System for React + Tailwind Desktop App

**Domain:** Design system implementation in an existing Electron + React + Tailwind CSS 4 app
**Researched:** 2026-03-15
**Milestone context:** UX/UI redesign of CAUSA, a legal ERP (on-premise, Windows desktop)

---

## Recommended Architecture

A React + Tailwind design system is not a separate package — it is a layered arrangement of
files within `packages/app-desktop/src/` that establishes a single source of truth for every
visual decision. The layers flow strictly top-down: tokens define raw values, utilities compose
tokens into named patterns, components consume utilities, pages consume components.

```
globals.css           ← Layer 0: Token definitions + @theme + :root / .dark
  │
  └── @utility classes (focus-causa, transition-causa, text-*-causa)
        │
        └── components/ui/     ← Layer 1: Primitive components (stateless, token-aware)
              │
              └── components/layout/  ← Layer 2: Composition shells (AppLayout, Sidebar)
                    │
                    └── pages/         ← Layer 3: Feature pages (consume all lower layers)
```

No layer may import from a layer above it. Pages are always consumers; tokens are always sources.

---

## Component Boundaries

### Layer 0 — Token Foundation (`src/styles/globals.css`)

| Responsibility | Notes |
|----------------|-------|
| `@theme` block — Tailwind CSS 4 token registration | Generates `bg-causa-primary`, `text-causa-danger`, etc. as utility classes |
| `:root` block — semantic CSS custom properties (light) | `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-border` |
| `.dark` block — semantic overrides (dark mode) | Same property names, different values — components never reference specific hex values |
| `@utility` definitions — typography scale, focus ring, transitions | `text-sm-causa`, `focus-causa`, `transition-causa` — shared by all components |
| `@keyframes` — functional animations only | `slideIn` (toast), `skeletonPulse` |

**What it does NOT do:** Layout, component structure, page logic.
**Consumes:** Nothing.
**Consumed by:** All components via Tailwind class names and `var()` references.

---

### Layer 1 — Primitive UI Components (`src/components/ui/`)

Each component is a self-contained, stateless (or minimally stateful) building block.
They consume tokens exclusively; they never hard-code colors or spacing.

**Current inventory (13 components):**

| Component | API contract | Token surface |
|-----------|-------------|---------------|
| `Button` | `variant`, `compact`, `disabled` | `--color-primary`, `--radius-md`, `text-sm-causa`, `transition-causa`, `focus-causa` |
| `Input` | `label`, `error`, `...HTMLInputElement` | `--color-surface`, `--color-text`, `--color-border`, `causa-danger`, `focus-causa` |
| `Modal` | `open`, `onClose`, `title`, `size`, `footer` | `--color-surface`, `--radius-lg`, `--shadow-md`, `--color-border` |
| `ConfirmDialog` | composes `Modal` + `Button` | inherits both surfaces |
| `Toast` / `ToastProvider` | `toast(message, type)` via context | `causa-success`, `causa-danger`, `causa-warning`, `--color-primary` with `/8` and `/30` opacity modifiers |
| `Skeleton` / `SkeletonText` / `SkeletonTableRows` | `className`, `lines`, `rows`, `cols` | `causa-surface-alt`, `skeletonPulse` keyframe |
| `EmptyState` | `icon`, `message`, `colSpan` | `--color-text-muted` |
| `PageHeader` | `title`, `description`, `action` | `text-xl-causa`, `--color-text` |
| `BackupIndicator` | none (reads state internally) | — |
| `CausaLogo` | `size` | static SVG |

**Component contract rules:**
- Accept `className` for layout overrides from parents (spacing, width) — never for color.
- Export a named export (not default) — enables fast tree-shaking and clean import paths.
- Depend on zero other `ui/` components except through explicit composition (like `ConfirmDialog` → `Modal` + `Button`).
- Never manage feature state (authentication, data fetching, RBAC).

**Communicates with:**
- Layer 0 (tokens) — via Tailwind utility classes and `var(--...)` references.
- Sibling `ui/` components — composition only (ConfirmDialog wraps Modal).
- React Context — only system-level contexts: `ToastContext`, NOT feature contexts.

---

### Layer 2 — Layout Components (`src/components/layout/`)

Structural shells that arrange the application frame. These are aware of routing and
system-level contexts (auth, theme, feature flags) but still contain no domain logic.

| Component | Responsibility | Consumes |
|-----------|---------------|----------|
| `AppLayout` | Full-screen grid: Sidebar + top header + `<Outlet />` + `BackupIndicator` | `Sidebar`, `GlobalSearch`, `UpdateBanner`, `BackupIndicator` from ui/ |
| `Sidebar` | Navigation, dark-mode toggle, logout | `useTheme`, `useAuth`, `usePermission`, `useFeatures`, `NavLink` (React Router), `CausaLogo` |
| `GlobalSearch` | Search input in top bar, keyboard shortcut, results dropdown | `Input` pattern (but currently inline), API search calls |

**Theme flow in Layout:**
`useTheme()` → toggles `document.documentElement.classList` → `.dark` CSS class activates dark tokens → all `var(--color-*)` properties resolve to dark values automatically → zero per-component dark-mode logic needed.

**Communicates with:**
- Layer 1 (ui/) — imports primitive components.
- React Router — `NavLink`, `Outlet`.
- Auth / Permission context — for RBAC-filtered nav items.
- `useTheme` hook — dark mode toggle.

---

### Layer 3 — Feature Pages (`src/pages/`)

20 page components organized by domain folder. These are the only layer permitted to:
- Call API functions from `lib/api.ts`.
- Manage domain state (loading, form state, lists, selected items).
- Apply RBAC checks for UI elements.
- Compose Layer 1 + Layer 2 components into full-screen layouts.

**Current page taxonomy:**

| Category | Pages | Modal pattern |
|----------|-------|---------------|
| List pages | processos, clientes, prazos, tarefas, documentos, contatos, despesas, financeiro, timesheet | Each has a paired `*-modal.tsx` |
| Detail pages | processo-detail-page, cliente-detail-page | Standalone, complex layouts |
| Dashboard | dashboard-page | Recharts integration, KPI cards |
| Auth / Setup | login-page, setup-page (4 steps) | No layout wrapper |
| System | configuracoes, integracoes, usuarios, conectores | Admin-only |

**Communicates with:**
- Layer 1 and Layer 2 — all display primitives.
- `lib/api.ts` — all data fetching.
- `lib/auth-context.tsx` — user identity, logout.
- `hooks/use-permission.ts` — permission checks.
- `hooks/use-theme.ts` — NOT used directly (theme applied by Layout).

---

### Cross-Cutting: Hooks (`src/hooks/`)

Not a visual layer — pure logic extracted from components.

| Hook | Purpose | Consumed by |
|------|---------|-------------|
| `useTheme` | Reads/writes `localStorage`, toggles `.dark` on `<html>` | Sidebar (toggle), potentially any component needing theme value |
| `usePermission` | Wraps auth context, exposes `can()`, `canAny()` | Sidebar (nav filtering), pages (element visibility) |
| `useUpdateStatus` | Polls auto-update state from Electron IPC | `UpdateBanner` |

---

## Token / Theme Architecture

### How CSS Variables Flow Through the System

```
globals.css @theme {}
  ↓ registers as Tailwind design tokens
  ↓ generates: bg-causa-primary, text-causa-danger, shadow-md, etc.

globals.css :root {}
  ↓ semantic aliases: --color-bg, --color-surface, --color-text, --color-primary, --color-border
  ↓ used via var() directly in components when a utility class doesn't exist

.dark {}
  ↓ overrides same --color-* custom properties with dark-mode values
  ↓ activated by: document.documentElement.classList.toggle('dark')
  ↓ no component needs to check theme — CSS handles switching automatically
```

### Token Categories (current state)

| Category | Where defined | Naming pattern | Examples |
|----------|--------------|----------------|---------|
| Brand colors | `@theme` | `--color-causa-*` | `--color-causa-primary: #2563a8` |
| Semantic colors (light) | `:root` | `--color-*` | `--color-bg`, `--color-surface`, `--color-text` |
| Semantic colors (dark) | `.dark` | `--color-*` (same names) | Different values, same props |
| State colors | `@theme` | `--color-causa-success/warning/danger` | Used in Toast, Input error, status badges |
| Typography | `@theme` | `--font-*` | `--font-ui`, `--font-brand`, `--font-mono` |
| Spacing | `@theme` | `--radius-*` | `--radius-sm/md/lg` |
| Shadows | `@theme` | `--shadow-*` | `--shadow-sm`, `--shadow-md` |
| Layout | `@theme` | custom | `--sidebar-width: 240px` |
| Type scale | `@utility` | `text-*-causa` | `text-sm-causa`, `text-xl-causa` (size + weight together) |

### Token Usage Split (current pattern)

Components use **both** approaches depending on context:
- `bg-[var(--color-surface)]` — inline CSS var for dynamic (theme-aware) properties
- `bg-causa-primary` — registered Tailwind class for brand-fixed properties
- `text-causa-danger` — registered class where opacity modifiers are needed (`/30`, `/8`)

This split is intentional in Tailwind CSS 4: `@theme` tokens enable opacity modifiers;
`:root` / `.dark` custom properties enable dynamic theming without class regeneration.

### Dark Mode Implementation

| Mechanism | Current | Status |
|-----------|---------|--------|
| Toggle | `useTheme()` → `classList.toggle('dark')` on `<html>` | Working |
| Persistence | `localStorage['causa-theme']` | Working |
| OS detection | `window.matchMedia('(prefers-color-scheme: dark)')` | Working |
| Component awareness | Zero per-component logic needed — CSS handles it | Correct architecture |
| Token coverage | Basic (bg, surface, text, border, primary) | Incomplete — needs elevation surfaces, surface-raised, surface-overlay |

**Gap identified:** Dark mode currently defines only 6 semantic tokens. A high-quality dark
theme requires 3-4 surface elevation levels (base, raised, overlay, floating) to create
depth without shadows. This is a critical token expansion needed before component work begins.

---

## Data Flow Direction

```
Tokens (globals.css)
  ↓ CSS classes + CSS custom properties
UI Components (components/ui/)
  ↓ styled primitives
Layout Components (components/layout/)
  ↓ composed shells
Feature Pages (pages/)
  ↓ composed screens
  → lib/api.ts → HTTP → embedded Express API
```

**State flows up separately:**
```
React Context (AuthProvider, ToastProvider, UpdateProvider)
  → consumed by any layer that needs it
  → context providers live in src/app.tsx or src/main.tsx (above all layers)
```

---

## Patterns to Follow

### Pattern 1: Semantic Token Reference

Components reference semantic tokens (`--color-surface`), never brand values (`--color-causa-primary: #2563a8`). When the user switches to dark mode, components automatically inherit the correct surface color because the semantic token is overridden in `.dark {}`.

```typescript
// CORRECT — works in both themes
className="bg-[var(--color-surface)] text-[var(--color-text)]"

// WRONG — breaks in dark mode
className="bg-white text-gray-900"
```

### Pattern 2: Tailwind Opacity Modifier Requires @theme Registration

Alpha variants (`/8`, `/30`, `/50`) only work on tokens declared in `@theme {}`, not on
`:root` custom properties. For state colors used with opacity (success, danger, warning),
always use the `causa-*` registered tokens.

```typescript
// CORRECT — causa-danger is in @theme, opacity modifier works
className="bg-causa-danger/8 border-causa-danger/30"

// WRONG — --color-border is in :root only, /30 does not work
className="bg-[var(--color-border)]/30"
```

### Pattern 3: Component Variant Map

Isolate variant-specific classes in a named record outside the JSX. This prevents runaway
className strings and makes variant additions safe.

```typescript
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary: 'bg-[var(--color-surface)] border border-[var(--color-border)] ...',
  danger: '...',
  ghost: '...',
};
```

### Pattern 4: className Passthrough for Layout Overrides

Primitive components accept `className` props for callers to add spacing, width, or
flex-child properties. Components must not use `className` overrides for colors or
typography — those belong in the component's own variant system.

```typescript
// CORRECT — caller controls width/margin, component controls appearance
<Button className="w-full mt-4" variant="primary">Submit</Button>

// WRONG — caller overrides a concern owned by the component
<Button className="bg-red-500 text-xs">Submit</Button>
```

### Pattern 5: Modal-per-Feature, Not Global Modal Manager

Each feature modal lives alongside its page (`processo-modal.tsx` beside `processos-page.tsx`).
This keeps domain logic co-located. The generic `Modal` primitive handles overlay, keyboard
dismissal, and sizing — not business logic.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hard-Coded Colors in Components

**What goes wrong:** A component uses `text-gray-700` or `bg-white`. When dark mode activates,
the component stays light, creating contrast failures and visual inconsistency.

**Prevention:** Run a grep for `text-gray-`, `bg-white`, `bg-black`, `text-black` before each
phase is marked done.

---

### Anti-Pattern 2: Dual CSS Systems (inline styles + Tailwind)

**What goes wrong:** Some components use `style={{ color: '#1e1e2e' }}` for one property and
Tailwind for everything else. The inline style ignores dark mode entirely.

**Prevention:** Never use `style={}` for values that have corresponding CSS custom properties.
The only valid use of inline `style={}` in this codebase is for dynamic numeric values
(chart widths, animation delays).

---

### Anti-Pattern 3: Importing UI Tokens from Business Logic

**What goes wrong:** A service or API function imports a color value from a CSS file to format
a response. Styling concerns bleed into data logic.

**Prevention:** Token values live only in CSS. If a component needs to know "is this deadline
critical?", pass a severity string (`'fatal' | 'urgent' | 'warning' | 'info'`) and map it
to a CSS class in the component.

---

### Anti-Pattern 4: Page-Level One-Off Styling

**What goes wrong:** A page has `className="text-[15px] font-medium text-[#2563a8]"` for a
heading because the developer didn't know `text-base-causa text-[var(--color-primary)]` existed.
Ten pages later there are ten slightly different implementations of the same element.

**Prevention:** Every typography size must use the `text-*-causa` utility. Every color must
use a semantic token. Document what exists in a `CONVENTIONS.md` note. Review new pages
against the token list before merging.

---

### Anti-Pattern 5: Theming via JavaScript Instead of CSS

**What goes wrong:** A component does `const isDark = useTheme().theme === 'dark'` and renders
`className={isDark ? 'bg-zinc-900' : 'bg-white'}`. This creates unnecessary React re-renders
and bypasses the CSS variable system entirely.

**Prevention:** Trust the `.dark` class on `<html>`. If a token override is needed in dark
mode, add the override in `.dark {}` in `globals.css` — never in component render logic.
`useTheme()` is for the toggle button and for reading the theme value for non-CSS purposes
(e.g., chart color palettes where CSS variables can't reach the charting library).

---

## Suggested Build Order for the Design System Milestone

The dependency graph determines the order. A later layer cannot be correctly implemented
before the layer it consumes is stable.

```
Phase 1: Token Audit + Expansion (Layer 0)
  ↓ Prerequisite for everything else
  → Audit globals.css against brand guide — missing tokens, wrong values
  → Add missing dark-mode surface levels (surface-raised, surface-overlay, surface-floating)
  → Add missing semantic tokens (sidebar-bg, header-bg, table-row-alt, badge-*)
  → Add animation token (@keyframes for page transition, modal entry)
  → Self-hosted font verification (Inter, Lora, JetBrains Mono — must be in assets/)

Phase 2: Primitive Component Redesign (Layer 1)
  ↓ Consumes Phase 1 tokens
  → Button — add icon-only variant, loading state
  → Input — add Textarea, Select, Checkbox, DateInput, SearchInput as sibling components
  → Modal — add enter/exit animation, larger size variant (xl)
  → Toast — review dark mode contrast, slide direction
  → Badge — new component for status labels (processo status, prazo urgency)
  → StatusDot — new micro-component for inline severity indicators
  → Card — new component for dashboard panels (replaces ad-hoc div patterns in pages)
  → DataTable — new compound component (table shell + header + empty state + skeleton rows)
  → Skeleton — review dark mode pulse color
  → EmptyState — add action button slot, domain-specific messages

Phase 3: Layout Shell Redesign (Layer 2)
  ↓ Consumes Phase 2 components
  → Sidebar — section groups, active state glow, hover transitions, footer user card
  → AppLayout — header elevation (shadow vs. border), top bar search refinement
  → GlobalSearch — result grouping by entity type, keyboard navigation

Phase 4: Feature Page Redesign (Layer 3)
  ↓ Consumes Phase 3 layout + Phase 2 primitives
  → Dashboard first (high visibility, KPI cards use the new Card component)
  → List pages second (all share the same DataTable pattern — build once, apply everywhere)
  → Detail pages third (most complex layouts)
  → Auth + Setup last (lowest frequency, no new patterns introduced)
```

**Why this order:**
- Token changes cascade downward — fixing a token in Phase 1 fixes all consumers for free.
- Getting a component wrong in Phase 2 means rework in 20 pages if pages are built first.
- Layout redesign (Phase 3) before pages ensures every page inherits the correct frame.
- Dashboard in Phase 4 is highest-impact first, giving early validation of the system.

---

## Scalability Considerations (Desktop App Context)

| Concern | Current approach | Recommendation |
|---------|-----------------|----------------|
| Token maintenance | Single globals.css file | Acceptable for this app size — do not split into multiple files until >200 tokens |
| Component additions | Manual creation alongside existing | Create a `components/ui/index.ts` barrel file to enable `import { Button, Modal } from '@/components/ui'` |
| Dark mode quality | 6 semantic tokens | Expand to 10-12 before page redesign |
| Animation consistency | 2 keyframes in globals.css | Add motion preference: `@media (prefers-reduced-motion)` wrapper for all keyframe animations |
| Chart colors | Recharts receives hex values directly | Create a `getChartColors(theme: Theme)` utility in `lib/chart-colors.ts` that returns the correct palette per theme |
| Icon consistency | Lucide-only rule is enforced | Enforce with ESLint `no-restricted-imports` rule targeting common icon packages |

---

## Sources

- Direct codebase analysis: `packages/app-desktop/src/styles/globals.css`, all `components/ui/` and `components/layout/` files, `hooks/use-theme.ts`
- Tailwind CSS 4 `@theme` and `@utility` mechanism — observed in existing implementation (HIGH confidence, version 4.2.1 confirmed in STACK.md)
- CSS custom property dark mode switching via class on `<html>` — observed in `use-theme.ts` and `.dark {}` block (HIGH confidence)
- Component composition patterns — observed in `ConfirmDialog` → `Modal` + `Button` (HIGH confidence)
- Opacity modifier constraint (`@theme` required) — inferred from Tailwind CSS 4 architecture where opacity modifiers are generated only for registered tokens (MEDIUM confidence — verify with a failing test: `bg-[var(--color-border)]/50`)

---

*Architecture analysis: 2026-03-15*
