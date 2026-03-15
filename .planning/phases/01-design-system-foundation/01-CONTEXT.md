# Phase 1: Design System Foundation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Correct and complete the CSS token system, self-host fonts for offline Electron use, refactor 8 existing UI components (Button, Input, Modal, Toast, ConfirmDialog, Skeleton, EmptyState, PageHeader), and create 7 new primitive components (Badge, StatusDot, Card, DataTable, Select, Checkbox, Textarea) — all following the CAUSA identity guide as law. Create barrel export. Add ESLint rule to prevent hex regression.

Requirements: DS-01 through DS-19.

</domain>

<decisions>
## Implementation Decisions

### Token Architecture
- CSS custom properties (:root/.dark) are the single source of truth for all design tokens
- Tailwind @theme block maps to CSS vars — no duplication, @theme references var() values
- Three surface levels for dark mode elevation: --color-bg (#0F0F1A), --color-surface (#1A1A2E), --color-surface-elevated (#22223A)
- Include 4-tier urgency color tokens in Phase 1: --color-tier-info, --color-tier-warning, --color-tier-urgent, --color-tier-fatal — so Phase 3 listings can consume them directly
- ESLint custom rule to flag hardcoded hex values (#xxx) in component files — enforced from Phase 1 to prevent regression (Success Criteria 5 requires this)

### Component Library Approach
- Use Radix UI primitives for accessible components: @radix-ui/react-dialog (Modal + ConfirmDialog), @radix-ui/react-select, @radix-ui/react-checkbox
- Add Framer Motion for AnimatePresence — required for Modal enter/exit animations (DS-05) and reused in Phase 4 page transitions
- Modal (DS-05) migrates to Radix Dialog as base — consistent with ConfirmDialog, gets focus trap + scroll lock + portal for free
- Keep existing file names (button.tsx, input.tsx, etc.) — evolve props interface as needed but maintain backward compatibility with existing pages

### Font Loading Strategy
- Use Fontsource packages: @fontsource/inter, @fontsource/lora, @fontsource/jetbrains-mono
- Import in main.tsx — Vite bundles font files into the Electron build automatically
- Specific weights only (not variable font): Inter 400/500/600/700, Lora 600, JetBrains Mono 400
- Include latin-ext subset for Portuguese diacritics (á, ã, ç, õ, etc.)

### New Components Scope
- DataTable (DS-14): Full-featured in Phase 1 — sort, hover row, click row, zebrado, 1366x768 responsive columns. Phase 3 listings use it directly.
- Card (DS-13): Single flexible component with optional onClick — when onClick is set, hover/cursor styles activate automatically. No separate variants.
- Badge (DS-11) and StatusDot (DS-12): Predefined status set only (active/suspended/archived/closed mapped to azul/âmbar/cinza/verde-água). No custom color prop — prevents inconsistency.
- Barrel export (components/ui/index.ts): Design system primitives only — excludes app-specific components like backup-indicator and causa-logo.

### Claude's Discretion
- Exact Tailwind @theme ↔ CSS var() mapping strategy (implementation detail)
- ESLint rule implementation (custom plugin vs inline rule)
- DataTable internal architecture (render props, compound components, or simple props API)
- Skeleton animation timing and exact pulse colors
- EmptyState layout and illustration approach
- Textarea resize behavior

</decisions>

<specifics>
## Specific Ideas

- Stripe/Vercel aesthetic reference — cards with depth, subtle gradients, professional feel
- Identity guide is law — all color values, typography scales, and component specs come from CAUSA_identidade_visual.md
- Dark mode must be equal quality to light — not a "cidadão de segunda classe"
- Red (#DC2626) is EXCLUSIVELY for: prazo fatal, erro crítico, falha de conector — never decorative

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- globals.css: Token system already exists with @theme + :root/.dark — needs audit and extension, not rewrite
- use-theme.ts: Theme toggle hook with localStorage persistence and .dark class toggle — works as-is
- Button, Input, Modal, Toast, ConfirmDialog, Skeleton, EmptyState, PageHeader: All exist and use var() + Tailwind utilities already
- Custom Tailwind utilities (focus-causa, transition-causa, text-*-causa): Already defined in globals.css, reusable across all components

### Established Patterns
- Components use forwardRef pattern (Button)
- Context + hook pattern for global state (ToastProvider/useToast)
- Tailwind classes with var() references: bg-[var(--color-primary)], text-[var(--color-text)]
- Lucide React for all icons
- No existing barrel export — needs creation

### Integration Points
- components/ui/ directory: All UI components live here
- globals.css: Token definitions and global utilities
- main.tsx: Font imports will go here
- eslint.config.js: Custom hex rule will be added here
- package.json (app-desktop): New dependencies (Radix, Framer Motion, Fontsource)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-design-system-foundation*
*Context gathered: 2026-03-15*
