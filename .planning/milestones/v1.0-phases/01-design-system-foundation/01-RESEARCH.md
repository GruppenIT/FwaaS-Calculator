# Phase 1: Design System Foundation - Research

**Researched:** 2026-03-15
**Domain:** CSS Design Tokens, Tailwind CSS 4, Radix UI Primitives, Fontsource, Framer Motion, ESLint Custom Rules
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CSS custom properties (:root/.dark) are the single source of truth for all design tokens
- Tailwind @theme block maps to CSS vars — no duplication, @theme references var() values
- Three surface levels for dark mode elevation: --color-bg (#0F0F1A), --color-surface (#1A1A2E), --color-surface-elevated (#22223A)
- Include 4-tier urgency color tokens in Phase 1: --color-tier-info, --color-tier-warning, --color-tier-urgent, --color-tier-fatal
- ESLint custom rule to flag hardcoded hex values (#xxx) in component files
- Use Radix UI primitives: @radix-ui/react-dialog (Modal + ConfirmDialog), @radix-ui/react-select, @radix-ui/react-checkbox
- Add Framer Motion (motion package) for AnimatePresence — Modal enter/exit animations
- Modal migrates to Radix Dialog as base
- Keep existing file names (button.tsx, input.tsx, etc.) — backward compatible props
- Use Fontsource packages: @fontsource/inter, @fontsource/lora, @fontsource/jetbrains-mono
- Import fonts in main.tsx — Vite bundles font files into the Electron build automatically
- Specific weights only: Inter 400/500/600/700, Lora 600, JetBrains Mono 400
- Include latin-ext subset for Portuguese diacritics
- DataTable (DS-14): Full-featured in Phase 1 — sort, hover row, click row, zebrado, 1366x768 responsive columns
- Card (DS-13): Single flexible component with optional onClick
- Badge (DS-11) and StatusDot (DS-12): Predefined status set only (active/suspended/archived/closed)
- Barrel export (components/ui/index.ts): Design system primitives only

### Claude's Discretion
- Exact Tailwind @theme <-> CSS var() mapping strategy (implementation detail)
- ESLint rule implementation (custom plugin vs inline rule)
- DataTable internal architecture (render props, compound components, or simple props API)
- Skeleton animation timing and exact pulse colors
- EmptyState layout and illustration approach
- Textarea resize behavior

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DS-01 | Token system CSS completo com variaveis semanticas para cores, tipografia, espacamento, sombras e radius — corrigindo split @theme vs CSS vars | @theme inline pattern resolves the split; new tokens (surface-elevated, tier-*) added to :root/.dark |
| DS-02 | Dark mode com 3 niveis de superficie distintos e tokens semanticos dedicados | --color-surface-elevated (#22223A) missing in current globals.css — must be added |
| DS-03 | Button refatorado (Primary, Secondary, Danger, Ghost) alturas 32/36/40px e hover states | Button already uses var() + Tailwind — needs height-40 variant and conformance audit |
| DS-04 | Input refatorado com estados de foco (border + shadow), erro (border), label posicionado conforme guia | Input already correct structurally — audit foco shadow spec: 0 0 0 3px rgba(37,99,168,0.15) |
| DS-05 | Modal refatorado com overlay rgba(0,0,0,0.4), largura 480-600px, radius 8px e suporte a AnimatePresence | Migrate Modal to Radix Dialog base + Framer Motion AnimatePresence wrap |
| DS-06 | Toast refatorado com variantes corretas | Toast uses causa-success/danger/warning tokens already — audit green-water token mapping |
| DS-07 | ConfirmDialog refatorado usando Radix Dialog com focus trap e ARIA roles | Radix Dialog provides focus trap + aria + portal for free; ConfirmDialog wraps it |
| DS-08 | Skeleton refatorado com animacao pulse alinhada aos tokens de cor | Skeleton uses bg-causa-surface-alt — needs token audit; add prefers-reduced-motion |
| DS-09 | EmptyState refatorado com mensagens contextuais juridicas e icone Lucide | Minor refactor — already uses Lucide; needs optional description text pattern |
| DS-10 | PageHeader refatorado com tipografia Inter 22px/700 e layout consistente | Already uses text-xl-causa — audit 22px matches token |
| DS-11 | Novo componente Badge para status pills (Ativo/Suspenso/Arquivado/Encerrado) | New file — predefined status map to tier tokens |
| DS-12 | Novo componente StatusDot para indicadores visuais de estado em listas | New file — dot + optional label, same status set as Badge |
| DS-13 | Novo componente Card com sombra, border e suporte a dark mode elevation | New file — uses --color-surface + --shadow-sm + optional onClick styles |
| DS-14 | Novo componente DataTable reutilizavel com sort, hover row, click row, zebrado e 1366x768 | New file — column definition API, sort state, row click callback, responsive at 1366px |
| DS-15 | Novo componente Select acessivel via Radix Select | New file — styled Radix Select, maps to var() tokens |
| DS-16 | Novo componente Checkbox acessivel via Radix Checkbox | New file — styled Radix Checkbox with ARIA |
| DS-17 | Novo componente Textarea com estilo consistente aos Inputs | New file — same base styles as Input, resize behavior at discretion |
| DS-18 | Fontes self-hosted via Fontsource no bundle Electron (sem CDN) | @fontsource/* packages, weight/subset imports in main.tsx |
| DS-19 | Todas as animacoes respeitam prefers-reduced-motion (WCAG AA) | @media (prefers-reduced-motion: reduce) guard on all keyframes and motion components |
</phase_requirements>

---

## Summary

Phase 1 is a CSS token audit + component refactor/creation phase on an existing React + Tailwind CSS 4 + Electron codebase. The foundation (globals.css with @theme + :root/.dark, use-theme.ts, 8 existing components) is already partially correct — the work is auditing conformance, filling gaps, and adding 7 new primitives.

The primary technical risk is the `@theme inline` pattern in Tailwind CSS 4. When @theme references var() values without `inline`, opacity modifiers like `bg-[var(--color-primary)]/8` may resolve at the wrong scope. The current codebase already uses this pattern (e.g., `bg-causa-danger/5`), which means the `@theme` entries need `@theme inline` or the var() references need to resolve without opacity modifiers. The existing globals.css uses `@theme` (without inline) for named Tailwind utilities and separate `:root` for semantic vars — this is the correct split but must be validated for opacity modifier cases.

The Radix UI migration for Modal and ConfirmDialog is the most structurally significant change: it replaces custom focus management code in modal.tsx with Radix Dialog's built-in focus trap, scroll lock, and portal. The AnimatePresence integration from Framer Motion (now `motion` package) wraps the Radix Dialog.Content for enter/exit animations conforming to the identity guide spec (scale 0.95→1 + opacity, 180ms ease-out).

**Primary recommendation:** Fix @theme → @theme inline for entries that reference var() values; add missing tokens (--color-surface-elevated, tier-* urgency tokens, --color-success/warning/danger in semantic :root); create new components using the established forwardRef + var() + Tailwind utilities pattern already in the codebase.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.2.1 (installed) | Utility-first CSS with @theme | Already in project; v4 provides @theme + color-mix opacity |
| @tailwindcss/vite | ^4.2.1 (installed) | Tailwind Vite plugin | Required for TW4 Vite integration |
| react | ^19.2.4 (installed) | Component model | Base framework |
| lucide-react | ^0.577.0 (installed) | Icon library | Already standard in all components |

### New Dependencies to Add
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @radix-ui/react-dialog | ^1.1.15 | Modal + ConfirmDialog base | Focus trap, scroll lock, portal, ARIA for free |
| @radix-ui/react-select | ^2.2.6 | Select component | Accessible keyboard nav, portal, ARIA |
| @radix-ui/react-checkbox | ^1.3.3 | Checkbox component | Indeterminate state, ARIA, keyboard |
| motion | ^12.x | AnimatePresence for Modal | Package formerly known as framer-motion |
| @fontsource/inter | latest | Inter font self-hosted | Offline Electron bundle |
| @fontsource/lora | latest | Lora font self-hosted | Offline Electron bundle |
| @fontsource/jetbrains-mono | latest | JetBrains Mono self-hosted | Offline Electron bundle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` package | `framer-motion` | framer-motion is the legacy name; motion is the current package from the same maintainer. Either works but motion is canonical for new projects |
| @radix-ui/* individual packages | `radix-ui` monorepo package | Single package is cleaner but individual packages are already the established pattern per CONTEXT.md |
| @fontsource/inter (static) | @fontsource-variable/inter | Variable font is smaller for many weights but CONTEXT.md locks specific non-variable weights only |

**Installation:**
```bash
# From packages/app-desktop directory
pnpm add @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-checkbox motion
pnpm add @fontsource/inter @fontsource/lora @fontsource/jetbrains-mono
```

---

## Architecture Patterns

### Recommended Project Structure

No structural changes to existing layout — all new files go into:
```
packages/app-desktop/src/
├── components/ui/
│   ├── button.tsx          # REFACTOR (existing)
│   ├── input.tsx           # AUDIT (existing — mostly correct)
│   ├── modal.tsx           # REFACTOR → Radix Dialog base
│   ├── confirm-dialog.tsx  # REFACTOR → uses new Modal
│   ├── toast.tsx           # AUDIT (existing — check token names)
│   ├── skeleton.tsx        # REFACTOR (add reduced-motion)
│   ├── empty-state.tsx     # REFACTOR (minor)
│   ├── page-header.tsx     # AUDIT (existing — mostly correct)
│   ├── badge.tsx           # NEW
│   ├── status-dot.tsx      # NEW
│   ├── card.tsx            # NEW
│   ├── data-table.tsx      # NEW
│   ├── select.tsx          # NEW (Radix Select styled)
│   ├── checkbox.tsx        # NEW (Radix Checkbox styled)
│   ├── textarea.tsx        # NEW
│   └── index.ts            # NEW barrel export
├── styles/globals.css      # EXTEND (token audit + new tokens)
└── main.tsx                # ADD font imports
```

### Pattern 1: Token Architecture — @theme inline + semantic :root

**What:** @theme defines Tailwind utility names (causa-*) using `@theme inline` when referencing var() — so opacity modifiers work correctly. :root/.dark defines semantic vars that components use directly.

**When to use:** All new tokens follow this dual-entry pattern.

**Critical: Use @theme inline when @theme entries reference var()**

```css
/* Source: https://tailwindcss.com/docs/theme */

/* WRONG — opacity modifiers will not work */
@theme {
  --color-causa-primary: var(--color-primary);
}

/* CORRECT — inline forces value resolution at use-site */
@theme inline {
  --color-causa-primary: var(--color-primary);
}

/* Semantic vars in :root (used via var() in components) */
:root {
  --color-primary: #2563a8;
  --color-surface-elevated: #ffffff; /* light: same as surface */
  --color-tier-info: #2563a8;
  --color-tier-warning: #e9a800;
  --color-tier-urgent: #e9a800;
  --color-tier-fatal: #dc2626;
}

.dark {
  --color-surface-elevated: #22223a; /* third elevation level */
  --color-tier-info: #3b82f6;
  --color-tier-warning: #e9a800;
  --color-tier-urgent: #e9a800;
  --color-tier-fatal: #dc2626;
}
```

### Pattern 2: Radix Dialog Migration for Modal

**What:** Replace custom focus management code with Radix Dialog primitives. Wrap Dialog.Content with Framer Motion `motion.div` for animation.

**When to use:** Modal.tsx and ConfirmDialog.tsx (DS-05, DS-07).

```tsx
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* modal inner box */}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

Note: `forceMount` on Portal keeps the element mounted for AnimatePresence exit animation. `asChild` passes Radix's accessibility props to the motion.div.

### Pattern 3: Font Imports in main.tsx

**What:** Fontsource imports resolve to bundled WOFF2 files; Vite inlines them into the dist. No external requests at runtime.

**When to use:** DS-18 — single addition to main.tsx.

```tsx
// Source: https://fontsource.org/fonts/inter/install
// In packages/app-desktop/src/main.tsx

// Inter — UI font: 4 weights, latin-ext for Portuguese
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';

// Lora — Brand/Splash: weight 600 only
import '@fontsource/lora/latin-ext-600.css';

// JetBrains Mono — Process numbers: weight 400 only
import '@fontsource/jetbrains-mono/latin-ext-400.css';
```

### Pattern 4: New Component using established forwardRef + var() pattern

**What:** All new components follow the Button/Input forwardRef pattern. Tailwind classes reference CSS vars via `var()` brackets or causa-* utility names.

**When to use:** All 7 new components (Badge, StatusDot, Card, DataTable, Select, Checkbox, Textarea).

```tsx
// Established pattern from existing codebase
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5
          rounded-[var(--radius-sm)] text-xs-causa font-medium
          ${statusStyles[status]}
          ${className}
        `}
        {...props}
      >
        {statusLabels[status]}
      </span>
    );
  }
);
```

### Pattern 5: Barrel Export

**What:** Single index.ts re-exports all UI primitives (not app-specific components).

```typescript
// components/ui/index.ts
// Design system primitives only
// Excludes: backup-indicator.tsx, causa-logo.tsx (app-specific)

export { Button } from './button';
export type { ButtonProps } from './button';
export { Input } from './input';
export { Modal } from './modal';
export { ConfirmDialog } from './confirm-dialog';
export { ToastProvider, useToast } from './toast';
export { Skeleton, SkeletonText, SkeletonTableRows } from './skeleton';
export { EmptyState } from './empty-state';
export { PageHeader } from './page-header';
export { Badge } from './badge';
export { StatusDot } from './status-dot';
export { Card } from './card';
export { DataTable } from './data-table';
export { Select } from './select';
export { Checkbox } from './checkbox';
export { Textarea } from './textarea';
```

### Pattern 6: ESLint Custom Rule for Hex Regression

**What:** Inline custom ESLint rule in eslint.config.js using a plugin object — no separate npm package needed. Flags `#` in JSX className strings and style props.

**When to use:** DS-01 Success Criteria 5 — added to eslint.config.js once in Phase 1.

```javascript
// eslint.config.js — custom rule approach
// Source: https://eslint.org/docs/latest/extend/custom-rules

const noHardcodedHexPlugin = {
  rules: {
    'no-hardcoded-hex': {
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string' && /#[0-9a-fA-F]{3,8}\b/.test(node.value)) {
              const filename = context.getFilename();
              if (filename.includes('components/ui/') || filename.includes('pages/')) {
                context.report({
                  node,
                  message: 'Hardcoded hex color found. Use CSS custom properties (var(--color-*)) instead.',
                });
              }
            }
          },
        };
      },
    },
  },
};
```

### Pattern 7: prefers-reduced-motion Guard

**What:** DS-19 requires all animations respect `prefers-reduced-motion`. CSS animations use @media guard; Framer Motion uses `useReducedMotion()` hook.

```css
/* In globals.css — wrap existing keyframes */
@media (prefers-reduced-motion: reduce) {
  @keyframes slideIn { from { opacity: 1; } to { opacity: 1; } }
  @keyframes skeletonPulse { 0%, 100% { opacity: 0.6; } }
}
```

```tsx
// In Framer Motion components
import { useReducedMotion } from 'motion/react';

function Modal() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' };
  // ...
}
```

### Anti-Patterns to Avoid

- **Duplicating tokens in both @theme and :root without purpose:** @theme creates utility class names (causa-primary); :root provides semantic vars (--color-primary). They serve different roles. Don't define the same value three times.
- **@theme without inline when referencing var():** Without `inline`, CSS variable resolution happens at the definition scope, breaking opacity modifiers (e.g., `bg-causa-primary/8` may fall back to transparent).
- **Hardcoded rgba() in component files:** Use oklch()-based values in globals.css, var() in components. Never write `rgba(37,99,168,0.08)` in a .tsx file.
- **Omitting forceMount on Radix Portal when using AnimatePresence:** Without `forceMount`, the Portal unmounts before exit animation completes.
- **Using `motion/react` exit animation without `AnimatePresence` wrapper:** AnimatePresence must wrap the conditional render for exit animations to fire.
- **Importing full font weight range from Fontsource:** Only import the 4 specific weights listed in CONTEXT.md to minimize bundle size.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in Modal | Custom useEffect + tabIndex cycling | @radix-ui/react-dialog | Edge cases: nested modals, dynamic content, virtual keyboard |
| Scroll lock | document.body.style.overflow = 'hidden' | Radix Dialog (built-in) | Fails on iOS, breaks fixed elements, doesn't restore correctly |
| Portal rendering | ReactDOM.createPortal to body | Radix Dialog.Portal | Z-index wars, stacking context issues |
| Accessible select | Native <select> styled | @radix-ui/react-select | Custom options (icons, groups), keyboard nav across platforms |
| Accessible checkbox | Input[type=checkbox] + label | @radix-ui/react-checkbox | Indeterminate state, ARIA checked, controlled/uncontrolled |
| Font bundling | Copy .woff2 to /public | @fontsource/* npm packages | Version-pinned, proper @font-face declarations, Vite asset pipeline |
| Exit animations on unmount | useEffect + setTimeout before unmount | AnimatePresence (Framer Motion) | Race conditions, React StrictMode double-invoke, ref instability |

**Key insight:** Accessible interactive components (dialog, select, checkbox) have 15+ edge cases each. Radix handles all of them while exposing a fully unstyled surface for design tokens.

---

## Common Pitfalls

### Pitfall 1: @theme vs @theme inline — opacity modifier breakage
**What goes wrong:** `bg-causa-primary/8` renders as transparent or wrong color when @theme uses var() references without `inline`.
**Why it happens:** Without `inline`, Tailwind generates `background-color: var(--color-causa-primary)` and tries to apply opacity via CSS — but since the underlying value is itself a var(), color-mix() can't introspect it correctly in all browsers.
**How to avoid:** Use `@theme inline { --color-causa-primary: var(--color-primary); }` — this resolves var() at theme-compile time, so opacity works.
**Warning signs:** Colors appear transparent or full-opacity when /N modifier is applied; inconsistent between light and dark mode.

### Pitfall 2: Radix Dialog + AnimatePresence forceMount omission
**What goes wrong:** Modal closes instantly without exit animation.
**Why it happens:** React removes the component from the tree immediately on `open=false`, before AnimatePresence can animate it out.
**How to avoid:** Add `forceMount` to `Dialog.Portal` so the Portal stays mounted, and let AnimatePresence control visibility via the `{open && ...}` conditional inside Portal.
**Warning signs:** No exit animation in dev; animation only plays on open.

### Pitfall 3: Font not loading in packaged Electron build
**What goes wrong:** System fallback font renders (system-ui, sans-serif) in packaged app.
**Why it happens:** Relative font paths in @font-face break when Electron loads from file:// protocol or Vite's base:'./' isn't resolving correctly.
**How to avoid:** Fontsource generates correct relative paths; verify Vite's `base: './'` is set (already confirmed in vite.config.ts). Test with `electron-builder --dir` (unpackaged) before final MSI build.
**Warning signs:** Flash of system font on app load; `document.fonts.check('500 15px Inter')` returns false in DevTools.

### Pitfall 4: causa-* Tailwind utilities missing from :root-only tokens
**What goes wrong:** `text-causa-danger` works but `bg-[var(--color-tier-fatal)]` requires arbitrary value syntax — inconsistent across components.
**Why it happens:** New tier-* tokens added only to :root but not to @theme, so no utility class is generated.
**How to avoid:** Every semantic var in :root should have a corresponding @theme inline entry for its utility class (e.g., `--color-causa-tier-fatal: var(--color-tier-fatal)`).
**Warning signs:** Developer writes `bg-[var(--color-tier-fatal)]` instead of `bg-causa-tier-fatal` — inconsistent pattern.

### Pitfall 5: Toast success color uses wrong token name
**What goes wrong:** Toast success uses `border-causa-success/30` but `--color-causa-success` in @theme is hardcoded `#2a9d8f` — dark mode doesn't change to contrast-safe version.
**Why it happens:** The identity guide's dark mode table doesn't list modified success/warning/danger colors, but contrast requirements may differ on #1A1A2E surface.
**How to avoid:** Add `--color-success` and `--color-warning` to :root/.dark sections in globals.css (keeping same hex values for now, changing in Phase 4 if WCAG audit fails). Audit with WCAG contrast checker.
**Warning signs:** Green-agua (#2A9D8F) on dark surface (#1A1A2E) — calculate contrast ratio (should be ≥ 4.5:1 for text, ≥ 3:1 for large text).

### Pitfall 6: DataTable at 1366x768 — column overflow
**What goes wrong:** Table renders horizontally scrollable or columns truncate unreadably.
**Why it happens:** Fixed column widths set for 1920px viewport without responsive handling.
**How to avoid:** Use `table-fixed` with percentage widths or `min-w-0 truncate` on cells; define visible column set for 1366px minimum. Do not rely on auto table layout for controlled widths.
**Warning signs:** Any `min-width` > 200px on a column in a 1366px-wide table with 5+ columns.

---

## Code Examples

Verified patterns from official sources:

### Radix Dialog with AnimatePresence (DS-05, DS-07)
```tsx
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
// Source: https://motion.dev/docs/react-animate-presence

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Content asChild>
                <motion.div
                  className="relative w-full max-w-[560px] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)] p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <Dialog.Title className="text-lg-causa text-[var(--color-text)] mb-5">
                    {title}
                  </Dialog.Title>
                  <div>{children}</div>
                  {footer && <div className="mt-5">{footer}</div>}
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-alt)] transition-causa cursor-pointer text-[var(--color-text-muted)]"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### Radix Checkbox (DS-16)
```tsx
// Source: https://www.radix-ui.com/primitives/docs/components/checkbox
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  label?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, label, checked, onCheckedChange, disabled }, ref) => (
    <div className="flex items-center gap-2">
      <RadixCheckbox.Root
        ref={ref}
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="h-4 w-4 rounded-[var(--radius-sm)] border border-[var(--color-border)]
          bg-[var(--color-surface)] focus-causa transition-causa
          data-[state=checked]:bg-[var(--color-primary)]
          data-[state=checked]:border-[var(--color-primary)]
          disabled:opacity-50 disabled:pointer-events-none"
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-white">
          <Check size={10} strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label htmlFor={id} className="text-sm-causa text-[var(--color-text)] cursor-pointer">
          {label}
        </label>
      )}
    </div>
  )
);
```

### Badge with predefined status (DS-11)
```tsx
type BadgeStatus = 'active' | 'suspended' | 'archived' | 'closed';

const statusConfig: Record<BadgeStatus, { label: string; classes: string }> = {
  active:    { label: 'Ativo',     classes: 'bg-[var(--color-tier-info)]/10 text-[var(--color-tier-info)]' },
  suspended: { label: 'Suspenso',  classes: 'bg-[var(--color-tier-warning)]/10 text-[var(--color-tier-warning)]' },
  archived:  { label: 'Arquivado', classes: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]' },
  closed:    { label: 'Encerrado', classes: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
};
```

### Font Imports (DS-18)
```tsx
// Source: https://fontsource.org/fonts/inter/install
// packages/app-desktop/src/main.tsx — prepend before App import

import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/lora/latin-ext-600.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
```

### New Tokens to add to globals.css (DS-01, DS-02)
```css
/* Add to :root */
:root {
  /* existing tokens... */
  --color-surface-elevated: #ffffff;   /* DS-02: third elevation level (light = surface) */
  --color-success: #2a9d8f;            /* semantic alias already in @theme but not :root */
  --color-warning: #e9a800;
  --color-danger: #dc2626;
  --color-tier-info:    #2563a8;       /* DS-01: urgency tier tokens */
  --color-tier-warning: #e9a800;
  --color-tier-urgent:  #e9a800;
  --color-tier-fatal:   #dc2626;
}

.dark {
  /* existing tokens... */
  --color-surface-elevated: #22223a;   /* DS-02: darkest card/modal elevation */
  --color-success: #2a9d8f;
  --color-warning: #e9a800;
  --color-danger:  #dc2626;
  --color-tier-info:    #3b82f6;       /* lighter blue for dark mode contrast */
  --color-tier-warning: #e9a800;
  --color-tier-urgent:  #e9a800;
  --color-tier-fatal:   #dc2626;
}

/* Add to @theme inline section */
@theme inline {
  --color-causa-surface-elevated: var(--color-surface-elevated);
  --color-causa-success:   var(--color-success);
  --color-causa-warning:   var(--color-warning);
  --color-causa-danger:    var(--color-danger);
  --color-causa-tier-info:    var(--color-tier-info);
  --color-causa-tier-warning: var(--color-tier-warning);
  --color-causa-tier-urgent:  var(--color-tier-urgent);
  --color-causa-tier-fatal:   var(--color-tier-fatal);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package (motion/react) | v11 (2024) | New install: `npm install motion`; import from `motion/react` not `framer-motion` |
| @radix-ui/\* individual packages | `radix-ui` unified package | 2024 | Both work; project uses individual packages per CONTEXT.md decision |
| Tailwind CSS 3 tailwind.config.js | Tailwind CSS 4 @theme in CSS | Jan 2025 | No config file needed; @theme lives in globals.css |
| CSS opacity via separate CSS variable trick | color-mix() opacity modifiers | TW4 | `/N` suffix works natively with var() when @theme inline is used |
| Google Fonts CDN in <head> | @fontsource npm packages | Ongoing | Fonts bundled in dist, no CDN dependency, works offline |

**Deprecated/outdated:**
- `tailwind.config.js`: Not needed in Tailwind CSS 4 — all configuration in globals.css
- `framer-motion` direct import: Use `motion/react` for React-specific API (AnimatePresence, motion.div)

---

## Open Questions

1. **@theme inline migration scope**
   - What we know: Current globals.css uses `@theme` (without inline) with hardcoded hex values, NOT var() references — so opacity modifiers work today
   - What's unclear: The CONTEXT.md decision says "@theme block maps to CSS vars — no duplication, @theme references var() values" — this IS a change from current state. Does every @theme entry need `@theme inline` or only the ones using var()?
   - Recommendation: Change `@theme {` to `@theme inline {` and update all hardcoded hex values in @theme to reference corresponding :root vars. Test opacity modifiers after migration.

2. **motion package vs framer-motion package name**
   - What we know: `framer-motion` (legacy) and `motion` (current) are both published and both work. The `motion/react` import path is the canonical modern path.
   - What's unclear: Since neither is currently installed, either can be chosen. The CONTEXT.md says "Framer Motion" but the package name is now `motion`.
   - Recommendation: Install `motion` (current package name), import from `motion/react`. Both provide AnimatePresence.

3. **DataTable column definition API**
   - What we know: CONTEXT.md marks this as Claude's Discretion. Phase 3 listings will consume it directly.
   - What's unclear: Which pattern (render props, column defs array, compound component) best serves Phase 3 sorting + click-row + zebra requirements
   - Recommendation: Use a simple column definition array `{ key, header, render?, sortable?, width? }[]` prop — easiest for Phase 3 consumers to adopt.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (root vitest.config.ts) |
| Config file | `/c/temp/FwaaS-Calculator/vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

**Important note:** The root vitest.config.ts has `include: ['packages/*/src/**/*.test.ts']` — only `.test.ts` files, not `.test.tsx`. UI component tests would need `.test.ts` or the config updated to include `.test.tsx`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-01 | Token system: :root has all required semantic vars | unit | `pnpm vitest run packages/app-desktop/src/styles/tokens.test.ts` | ❌ Wave 0 |
| DS-02 | Dark mode has 3 surface levels (bg, surface, surface-elevated) | unit | same tokens test file | ❌ Wave 0 |
| DS-03 | Button renders all 4 variants with correct classes | unit | `pnpm vitest run packages/app-desktop/src/components/ui/button.test.ts` | ❌ Wave 0 |
| DS-04 | Input shows error border on error prop | unit | `pnpm vitest run packages/app-desktop/src/components/ui/input.test.ts` | ❌ Wave 0 |
| DS-05 | Modal mounts in portal, has ARIA dialog role | unit | `pnpm vitest run packages/app-desktop/src/components/ui/modal.test.ts` | ❌ Wave 0 |
| DS-07 | ConfirmDialog has focus trap (Radix provides ARIA) | unit | same modal test | ❌ Wave 0 |
| DS-11 | Badge renders correct label and class for each status | unit | `pnpm vitest run packages/app-desktop/src/components/ui/badge.test.ts` | ❌ Wave 0 |
| DS-12 | StatusDot renders correct color class for each status | unit | `pnpm vitest run packages/app-desktop/src/components/ui/status-dot.test.ts` | ❌ Wave 0 |
| DS-13 | Card renders children; applies onClick styles when prop set | unit | `pnpm vitest run packages/app-desktop/src/components/ui/card.test.ts` | ❌ Wave 0 |
| DS-14 | DataTable sorts column on header click | unit | `pnpm vitest run packages/app-desktop/src/components/ui/data-table.test.ts` | ❌ Wave 0 |
| DS-15 | Select is accessible (Radix provides ARIA) | unit | `pnpm vitest run packages/app-desktop/src/components/ui/select.test.ts` | ❌ Wave 0 |
| DS-16 | Checkbox controlled/uncontrolled state works | unit | `pnpm vitest run packages/app-desktop/src/components/ui/checkbox.test.ts` | ❌ Wave 0 |
| DS-17 | Textarea renders with error state same as Input | unit | `pnpm vitest run packages/app-desktop/src/components/ui/textarea.test.ts` | ❌ Wave 0 |
| DS-18 | Font imports are importable (build-only validation) | manual | Electron packaged build test | N/A |
| DS-19 | prefers-reduced-motion CSS rule exists in globals.css | unit | `pnpm vitest run packages/app-desktop/src/styles/tokens.test.ts` | ❌ Wave 0 |
| DS-05 (barrel) | All new components importable via index.ts | unit | `pnpm vitest run packages/app-desktop/src/components/ui/index.test.ts` | ❌ Wave 0 |

**Note on UI testing:** The vitest config uses `environment: 'node'` — component rendering tests require `environment: 'jsdom'` and `@testing-library/react`. Either extend the config or use a simpler DOM-free approach (test component props logic and class generation via pure function tests). Prefer pure logic tests over DOM tests for this phase — e.g., test that `statusConfig['active'].classes` contains the expected token, not that a <div> has a className.

### Sampling Rate
- **Per task commit:** `pnpm vitest run packages/app-desktop/src/components/ui/`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green + ESLint passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app-desktop/src/components/ui/button.test.ts` — covers DS-03
- [ ] `packages/app-desktop/src/components/ui/badge.test.ts` — covers DS-11
- [ ] `packages/app-desktop/src/components/ui/status-dot.test.ts` — covers DS-12
- [ ] `packages/app-desktop/src/components/ui/card.test.ts` — covers DS-13
- [ ] `packages/app-desktop/src/components/ui/data-table.test.ts` — covers DS-14
- [ ] `packages/app-desktop/src/components/ui/index.test.ts` — covers barrel export (DS-04 Success Criteria 4)
- [ ] `packages/app-desktop/src/styles/tokens.test.ts` — covers DS-01, DS-02, DS-19 (CSS file parsing)
- [ ] vitest.config.ts update: add `*.test.tsx` to include pattern if DOM tests are added

---

## Sources

### Primary (HIGH confidence)
- https://tailwindcss.com/docs/theme — @theme inline pattern, CSS variable resolution, opacity modifiers
- https://www.radix-ui.com/primitives/docs/components/dialog — Dialog anatomy, focus trap, portal, accessibility
- https://www.radix-ui.com/primitives/docs/components/checkbox — Checkbox API
- https://www.radix-ui.com/primitives/docs/components/select — Select API
- https://motion.dev/docs/react-animate-presence — AnimatePresence API, exit animations
- https://fontsource.org/fonts/inter/install — Import syntax for specific weights/subsets

### Secondary (MEDIUM confidence)
- https://tailwindcss.com/blog/tailwindcss-v4 — color-mix() opacity modifiers in v4
- npm registry: @radix-ui/react-dialog@1.1.15, @radix-ui/react-select@2.2.6, @radix-ui/react-checkbox@1.3.3 (published ~Aug 2025)
- https://eslint.org/docs/latest/extend/custom-rules — Custom rule creation API

### Tertiary (LOW confidence — needs validation)
- motion package version 12.x — version confirmed from web search but changelog not verified against React 19 compat
- Fontsource latin-ext-400.css import path syntax — confirmed from npm page; actual file existence should be verified after install

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry and official docs
- Architecture: HIGH — patterns derived directly from existing codebase + official docs
- Pitfalls: MEDIUM — @theme inline risk from official docs; Radix/AnimatePresence pitfalls from official docs + known patterns
- ESLint custom rule: MEDIUM — approach verified via ESLint docs; exact regex/scope may need tuning

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable libraries; Tailwind 4.x may patch @theme behavior)
