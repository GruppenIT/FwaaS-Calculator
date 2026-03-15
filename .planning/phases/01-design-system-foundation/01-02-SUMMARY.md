---
phase: 01-design-system-foundation
plan: 02
subsystem: ui
tags: [react, tailwind, radix-ui, framer-motion, accessibility, design-system]

# Dependency graph
requires:
  - phase: 01-01
    provides: CSS token system with var() references and @theme inline for Tailwind CSS 4
provides:
  - Button with 4 variants and size prop (sm/md/lg = h-8/h-9/h-10) plus deprecated compact alias
  - Input with aria-invalid on error and normalized var() token usage
  - Modal using Radix Dialog with focus trap, scroll lock, portal, and AnimatePresence scale/opacity animation
  - ConfirmDialog inheriting Radix accessibility via new Modal
affects: [01-03, 01-04, 01-05, all pages using Button/Input/Modal/ConfirmDialog]

# Tech tracking
tech-stack:
  added: []  # @radix-ui/react-dialog and motion already in package.json
  patterns:
    - Radix Dialog with forceMount Portal for exit animation support
    - AnimatePresence wrapping conditional children for enter/exit
    - useReducedMotion() from motion/react to disable animation on prefers-reduced-motion
    - Transition type import from motion/react + ease as const for strict TypeScript

key-files:
  created: []
  modified:
    - packages/app-desktop/src/components/ui/button.tsx
    - packages/app-desktop/src/components/ui/input.tsx
    - packages/app-desktop/src/components/ui/modal.tsx

key-decisions:
  - "Dialog.Portal forceMount required for AnimatePresence exit animation — without it, content unmounts before exit animation plays"
  - "useReducedMotion() sets transition duration to 0 (not null) — Framer Motion handles 0-duration transitions cleanly"
  - "ease: 'easeOut' as const required in TypeScript strict mode (exactOptionalPropertyTypes) — motion/react Easing type is literal union, not string"
  - "compact prop kept as deprecated alias for size=sm maintaining 100% backward compatibility with existing pages"

patterns-established:
  - "Modal pattern: Dialog.Root + Dialog.Portal forceMount + AnimatePresence + Dialog.Overlay/Content as motion.div"
  - "Size prop pattern: sm/md/lg with explicit height classes (h-8/h-9/h-10), deprecated bool alias for backward compat"
  - "Accessibility: aria-invalid on input error state, Dialog.Title for modal title, Dialog.Close for close button"

requirements-completed: [DS-03, DS-04, DS-05, DS-07]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 1 Plan 02: Component Refactor Summary

**Button gets sm/md/lg size system, Modal migrates to Radix Dialog with focus trap and AnimatePresence scale animation, Input gets aria-invalid**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T20:48:26Z
- **Completed:** 2026-03-15T20:51:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Button: replaced compact bool with size prop (sm/md/lg), fixed secondary and danger variants to use var() tokens consistently, exported ButtonProps type
- Input: added aria-invalid="true" when error is truthy, normalized error classes to var(--color-danger) pattern
- Modal: full rewrite to Radix Dialog with focus trap, scroll lock, portal, Dialog.Title; AnimatePresence with scale 0.95->1 and opacity animation at 180ms easeOut; useReducedMotion() kills animation when OS accessibility setting is active
- ConfirmDialog: unchanged — inherits full Radix accessibility stack from new Modal at zero cost

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor Button with 3 height sizes and audit variants** - `4de2457` (feat)
2. **Task 2: Migrate Modal to Radix Dialog + AnimatePresence, fix Input states** - `33b32b7` (feat)

**Plan metadata:** see docs commit below

## Files Created/Modified

- `packages/app-desktop/src/components/ui/button.tsx` - Added size prop (sm/md/lg), deprecated compact alias, fixed secondary/danger var() tokens, exported ButtonProps
- `packages/app-desktop/src/components/ui/input.tsx` - Added aria-invalid, normalized error styles to var(--color-danger)
- `packages/app-desktop/src/components/ui/modal.tsx` - Full rewrite: Radix Dialog + AnimatePresence + motion.div overlay/content + useReducedMotion

## Decisions Made

- `Dialog.Portal forceMount` is required for AnimatePresence exit animations — without it Radix unmounts the DOM before the exit animation can run
- `ease: 'easeOut' as const` is needed in strict TypeScript mode because motion/react's `Easing` type is a literal union, not `string`
- `useReducedMotion()` sets `transition={{ duration: 0 }}` rather than removing the transition — this keeps the API clean while respecting OS accessibility preferences
- Size prop uses explicit height classes `h-8/h-9/h-10` mapped in a `sizeStyles` record, consistent with variantStyles pattern already in the file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error: ease string not assignable to Easing union**
- **Found during:** Task 2 (Modal TypeScript verification)
- **Issue:** `ease: 'easeOut'` typed as `string` fails `exactOptionalPropertyTypes` check — motion/react expects literal union `Easing`, not `string`
- **Fix:** Added `type Transition` import from motion/react and typed `animTransition` explicitly; added `as const` to ease string literal
- **Files modified:** packages/app-desktop/src/components/ui/modal.tsx
- **Verification:** `npx tsc --noEmit` passes with 0 errors for modal.tsx
- **Committed in:** `33b32b7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Type fix necessary for TypeScript correctness under strictest compiler settings. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors in `checkbox.tsx` and `select.tsx` (Radix UI exactOptionalPropertyTypes compatibility issues) were present before this plan and are out of scope. They are noted in deferred-items for future cleanup.

## Next Phase Readiness

- Button, Input, Modal, ConfirmDialog are production-ready with full accessibility and animation
- Components maintain backward-compatible interfaces — no callers need updates
- Modal focus trap and ARIA roles (dialog, title) are provided by Radix automatically

---
*Phase: 01-design-system-foundation*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: packages/app-desktop/src/components/ui/button.tsx
- FOUND: packages/app-desktop/src/components/ui/input.tsx
- FOUND: packages/app-desktop/src/components/ui/modal.tsx
- FOUND: .planning/phases/01-design-system-foundation/01-02-SUMMARY.md
- FOUND commit: 4de2457 (Task 1 - Button)
- FOUND commit: 33b32b7 (Task 2 - Input/Modal/ConfirmDialog)
