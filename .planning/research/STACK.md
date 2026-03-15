# Technology Stack — CAUSA UX/UI Redesign

**Project:** CAUSA — Revisao UX/UI
**Researched:** 2026-03-15
**Milestone scope:** Design system implementation on top of existing React 19 + Tailwind CSS 4 + Electron 33

---

## Context: What Already Exists

Before recommending additions, the existing stack must be understood precisely:

| Technology | Version | Status |
|------------|---------|--------|
| React | 19.2.4 | In use |
| Tailwind CSS | 4.2.1 | In use — `@theme` block in `globals.css` |
| Vite | 7.3.1 | In use |
| Lucide React | 0.577.0 | In use — icon library locked |
| recharts | 3.8.0 | In use — dashboard charts |
| TypeScript | 5.9.3 | In use |
| Electron | 33.4.11 | In use |

Design tokens already defined in `packages/app-desktop/src/styles/globals.css`:
- Color palette (light + dark variants) via CSS custom properties
- Typography scale (11px–28px) via `@utility` blocks
- Border radius (4px/6px/8px), shadows, sidebar width
- Focus ring and transition utilities (`focus-causa`, `transition-causa`)
- Keyframe animations: `slideIn` (toasts), `skeletonPulse` (skeletons)

Custom components already built: Button (4 variants), Input, Modal, Toast/ToastProvider, ConfirmDialog, Skeleton/SkeletonText/SkeletonTableRows, EmptyState, PageHeader, CausaLogo, AppLayout, Sidebar, GlobalSearch, UpdateBanner.

**The design system foundation already exists. The work is refinement and extension, not replacement.**

---

## Recommended Stack

### Animation Library

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Motion** (formerly Framer Motion) | `^11.x` | Page transitions, modal enter/exit, micro-animations | HIGH |

**Why Motion:** The codebase currently uses CSS keyframes for slide-in (toasts) and pulse (skeletons). This works for static animations but falls short for the Stripe/Vercel aesthetic targets in the PRD: modal enter/exit with fade+scale, page transitions with slide, and any orchestrated sequence animations (e.g., dashboard cards staggering in on load). Motion (the rebranded Framer Motion) is the de-facto standard for React animations in 2025, has excellent Tailwind CSS 4 compatibility (it does not conflict with Tailwind classes), and works in Electron without any special configuration. It supports `AnimatePresence` for unmount animations — critical for modal fade-out, which the current implementation (`if (!open) return null`) cannot do.

**Why not alternatives:**
- **React Spring**: More verbose API, less intuitive for layout animations; Motion has overtaken it in adoption as of 2024.
- **AutoAnimate**: Too limited — only handles list add/remove, not fine-grained modal/page transitions.
- **CSS-only (`@keyframes`)**: Already used for simple cases. Insufficient for exit animations (unmounting DOM elements) and cannot be driven by React state with completion callbacks.
- **GSAP**: Commercial license required for many use cases; overkill for a desktop ERP.

**Usage boundary:** Motion is ONLY for purposeful transitions as defined in `CAUSA_identidade_visual.md` Section 5 (hover: 120ms, modal open: 180ms, page: 150ms, toast: 200ms/150ms). Do not add decorative animations.

```bash
pnpm --filter @causa/app-desktop add motion
```

**Confidence:** HIGH — Motion 11 is stable, widely adopted, and verified to work with React 19 and Vite.

---

### Accessible Primitive Layer

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Radix UI Primitives** (selected packages) | `^1.x` | Accessible behavior for Dialog, Select, DropdownMenu, Tooltip, Popover | HIGH |

**Why Radix UI:** The existing Modal, ConfirmDialog, and other interactive components implement their own keyboard/focus management manually (e.g., `useEffect` for Escape key in `modal.tsx`, `overlayRef` click detection). This approach misses: focus trap inside modals, ARIA roles and properties, focus restoration on close, roving tabindex for menus. WCAG AA compliance is a stated requirement in the PRD. Radix UI provides headless accessible primitives — they bring behavior only, zero default styles, and compose cleanly with Tailwind CSS 4 classes.

**Install only what is needed** — do not install `@radix-ui/themes` (that would impose its own design system). Install individual primitives:

```bash
pnpm --filter @causa/app-desktop add \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tooltip \
  @radix-ui/react-popover \
  @radix-ui/react-switch
```

**Usage:** Refactor `Modal` and `ConfirmDialog` to use `@radix-ui/react-dialog` under the hood. Keep the same visual API (same props, same Tailwind styles). The consumer code does not change — only the accessibility plumbing improves.

**Why not alternatives:**
- **shadcn/ui**: shadcn/ui is a code-generator that installs pre-styled Radix components. The CAUSA codebase already has its own components with its own tokens. Installing shadcn/ui would create a style conflict and require stripping all shadcn defaults. Use Radix primitives directly and keep CAUSA styles.
- **Headless UI (Tailwind Labs)**: Solid option, but Radix has broader component coverage (Select, Tooltip, Popover, Slider) and better ARIA implementation depth. Radix is the industry standard as of 2025.
- **React Aria (Adobe)**: More complete accessibility implementation than Radix, but significantly more complex API. Justified for screen-reader-first products; over-engineered for this use case.

**Confidence:** HIGH — Radix UI primitives are stable (v1.x), well-documented, and production-proven.

---

### Date/Time Picker

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **React DayPicker** | `^9.x` | Date picker for prazos, agenda, timesheet date fields | MEDIUM |

**Why React DayPicker:** The app has multiple date-sensitive modules (prazos, agenda, timesheet). The current codebase uses `<input type="date">` (native HTML), which is functional but inconsistent across Windows versions and visually unstyled. React DayPicker v9 is headless by default (bring your own styles via `classNames` prop), is accessible (ARIA calendar pattern), and composes well with Tailwind CSS 4. It has no peer dependencies beyond React.

**Why not alternatives:**
- **react-datepicker**: Heavy, has its own CSS file that conflicts with custom design systems, not headless.
- **Flatpickr**: JavaScript library, not React-native; requires wrapper component.
- **Native `<input type="date">`**: Acceptable minimum but non-styleable; Windows date picker UI varies by Windows version and does not respect dark mode via CSS.

**Confidence:** MEDIUM — React DayPicker v9 is stable and well-regarded; the specific compatibility with Tailwind CSS 4's `@utility` system is based on knowledge through mid-2025, not verified against a live environment.

```bash
pnpm --filter @causa/app-desktop add react-day-picker
```

---

### Virtual List (Large Tables)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **TanStack Virtual** | `^3.x` | Virtualized rendering for process/client/deadline lists | MEDIUM |

**Why TanStack Virtual:** The PRD requires redesigning listagens (processos, clientes, prazos) with "adequate information density." Processo lists in Brazilian law firms commonly hold 500–5,000 entries. Rendering all rows causes jank. TanStack Virtual provides row virtualization with zero DOM overhead outside the visible viewport. It is framework-agnostic and integrates with React via `useVirtualizer` hook — no component library imposed, full control over rendering.

**Why not alternatives:**
- **react-window / react-virtualized**: react-virtualized is abandoned (last release 2019). react-window is stable but less actively maintained than TanStack Virtual.
- **AG Grid / TanStack Table**: Full table management solutions — overkill. The tables in CAUSA are already implemented; we only need virtualization.

**Confidence:** MEDIUM — TanStack Virtual v3 is stable. The need is conditional: only install if profiling shows render performance issues on real data volumes. Do not install preemptively.

```bash
pnpm --filter @causa/app-desktop add @tanstack/react-virtual
```

---

### Font Loading (Self-Hosted)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **`fontsource` packages** | `^5.x` | Self-hosted Inter, JetBrains Mono fonts as npm packages | HIGH |

**Why Fontsource:** The identity guide mandates that fonts be self-hosted with no CDN dependency at runtime (the app runs offline on-premise). Fontsource packages fonts as npm modules with pre-generated `@font-face` CSS, so they bundle into the Vite build without network requests. Lora is already referenced in `globals.css` — it needs to be available as a bundled asset too.

```bash
pnpm --filter @causa/app-desktop add \
  @fontsource-variable/inter \
  @fontsource/lora \
  @fontsource/jetbrains-mono
```

Then import in `main.tsx` or `globals.css`:
```css
@import '@fontsource-variable/inter';
@import '@fontsource/lora/600.css';
@import '@fontsource/jetbrains-mono/400.css';
```

**Note:** `@fontsource-variable/inter` uses the Inter variable font (supports all weights 100–900 from a single file) — preferred over loading 4 separate weight files.

**Why not alternatives:**
- **Google Fonts `<link>` tags**: Fails in offline mode. Prohibited by the identity guide.
- **Custom `@font-face` with local asset files**: Works, but requires manual WOFF2 file management. Fontsource automates this and integrates with pnpm/Vite naturally.

**Confidence:** HIGH — Fontsource is a well-maintained project (backed by the open-source community, v5.x stable). Electron bundles assets from `public/` or Vite imports, both work.

---

### Dark Mode Toggle Mechanism

**No new library needed.**

The app already has `useTheme` hook (referenced in `sidebar.tsx`) and a `.dark` class on the root element with CSS custom property overrides in `globals.css`. This is the correct Tailwind CSS 4 dark mode pattern (class-based). The dark tokens are already defined:

```css
.dark {
  --color-bg: #0f0f1a;
  --color-surface: #1a1a2e;
  --color-text: #e8e8f0;
  /* ... */
}
```

The UX/UI milestone work here is **improving the dark mode tokens** (surface hierarchy, elevated surfaces, border subtlety) and **ensuring every component respects `var(--color-*)` properties** — not adding new libraries.

**What to improve (not a library, but a token work):**

The current dark palette is flat: only one surface level (`#1a1a2e`). For the Stripe/Vercel aesthetic with cards having depth, a second surface level is needed:

```css
/* To add in globals.css dark section */
--color-surface-elevated: #1e1e32;  /* for modals, dropdown overlays */
--color-surface-alt: #141422;       /* for zebra rows in dark mode */
```

---

### Utility: Class Merging

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **clsx** | `^2.x` | Conditional class composition in components | HIGH |
| **tailwind-merge** | `^2.x` | Merge Tailwind classes without conflicts when `className` props override base styles | HIGH |

**Why both:** The existing `Button` component uses string interpolation (`${className}`) which means consumers can accidentally pass classes that conflict with base styles (e.g., passing `rounded-none` does not override `rounded-[var(--radius-md)]` in Tailwind CSS 4 without `tailwind-merge`). The `clsx` + `tailwind-merge` pattern (often combined as a `cn()` utility) is the standard approach in Tailwind-based design systems.

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```bash
pnpm --filter @causa/app-desktop add clsx tailwind-merge
```

**Why not alternatives:**
- **`classnames` (npm)**: Older, same purpose as `clsx`. `clsx` is smaller (228 bytes), typed, and more actively maintained.
- **String interpolation (current)**: Works for simple cases but breaks class conflict resolution.

**Confidence:** HIGH — These are stable, tiny utilities with no breaking changes expected.

---

## What NOT to Install

| Library | Reason to Avoid |
|---------|-----------------|
| **shadcn/ui** | Installs pre-styled components that would override CAUSA tokens. Use Radix primitives directly instead. |
| **MUI / Ant Design / Chakra UI** | Full design systems with their own tokens. Incompatible with CAUSA's custom design system. Massive bundle. |
| **@radix-ui/themes** | Radix's own styled layer — conflicts with CAUSA tokens. Install only unstyled primitives. |
| **react-spring** | Replaced in recommendation by Motion; installing both creates confusion about which to use. |
| **GSAP** | Commercial license for many uses; overkill for 120–200ms UI transitions. |
| **styled-components / Emotion** | CSS-in-JS approaches conflict with Tailwind CSS 4's compile-time approach. No runtime CSS generation in this stack. |
| **Storybook** | Useful for component documentation but out of scope for this milestone (PRD: "documentar componentes e tokens CSS"). Use inline JSDoc comments and a dedicated `components/ui/README.md` instead. |
| **react-query / SWR** | Data-fetching libraries — out of scope. Backend is local SQLite/PostgreSQL via Electron IPC, not REST API to fetch from renderer. |

---

## Full Additions Summary

```bash
# Animation
pnpm --filter @causa/app-desktop add motion

# Accessible primitives (install only what's needed)
pnpm --filter @causa/app-desktop add \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tooltip \
  @radix-ui/react-switch

# Date picker
pnpm --filter @causa/app-desktop add react-day-picker

# Virtualization (conditional — only if profiling shows need)
pnpm --filter @causa/app-desktop add @tanstack/react-virtual

# Self-hosted fonts
pnpm --filter @causa/app-desktop add \
  @fontsource-variable/inter \
  @fontsource/lora \
  @fontsource/jetbrains-mono

# Class utilities
pnpm --filter @causa/app-desktop add clsx tailwind-merge
```

**Total new runtime dependencies: 11–12 packages** (excluding TanStack Virtual if profiling doesn't warrant it). No new build tools or Vite plugins required.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Animation | Motion 11 | React Spring | Motion has better React 19 support, cleaner API for layout animations |
| Animation | Motion 11 | CSS-only @keyframes | Cannot animate unmount (exit animations); no JS-driven sequencing |
| Accessible primitives | Radix UI | shadcn/ui | shadcn imposes styles; Radix is the headless layer we actually need |
| Accessible primitives | Radix UI | Headless UI | Less component coverage; Radix dominates in 2025 adoption |
| Class merging | clsx + tailwind-merge | classnames | clsx is smaller, typed; tailwind-merge is non-negotiable for prop override safety |
| Date picker | react-day-picker | react-datepicker | react-datepicker has mandatory CSS; react-day-picker is truly headless |
| Fonts | Fontsource | CDN / Google Fonts | CDN fails offline; identity guide explicitly prohibits runtime font CDN |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Motion (Framer Motion rebranded) | HIGH | Stable v11, React 19 compatible, widely documented through mid-2025 |
| Radix UI primitives | HIGH | v1.x stable, ARIA pattern implementation is authoritative |
| clsx + tailwind-merge | HIGH | Tiny, stable, no API churn |
| Fontsource | HIGH | npm-native font hosting, standard pattern for offline-first Electron apps |
| React DayPicker v9 | MEDIUM | Stable but Tailwind CSS 4 `@theme` interop not personally verified in live env |
| TanStack Virtual v3 | MEDIUM | Stable, but need for it is conditional on data volume — recommend profiling first |

---

## Sources

- Existing codebase: `packages/app-desktop/package.json`, `src/styles/globals.css`, `src/components/ui/*`
- Identity guide: `CAUSA_identidade_visual.md` (Section 5: animations spec, Section 8: token reference, Section 9: prohibitions)
- Project requirements: `.planning/PROJECT.md` (WCAG AA requirement, Stripe/Vercel aesthetic target, offline constraint)
- Knowledge base (through mid-2025): Motion v11 API, Radix UI v1 primitives, Fontsource v5, react-day-picker v9, TanStack Virtual v3
- Note: WebSearch and Context7 tools were unavailable during this research session. Recommendations are based on codebase analysis + training knowledge through August 2025. Verify exact versions with `pnpm info [package] version` before installing.
