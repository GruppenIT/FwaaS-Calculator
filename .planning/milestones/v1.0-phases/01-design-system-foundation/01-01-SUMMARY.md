---
phase: 01-design-system-foundation
plan: "01"
subsystem: design-system
tags: [css-tokens, fonts, tailwind, eslint, accessibility]
dependency_graph:
  requires: []
  provides: [css-token-system, fontsource-fonts, no-hardcoded-hex-rule]
  affects: [all-ui-components, tailwind-utility-classes]
tech_stack:
  added:
    - "@radix-ui/react-dialog@1.1.15"
    - "@radix-ui/react-select@2.2.6"
    - "@radix-ui/react-checkbox@1.3.3"
    - "motion@12.36.0"
    - "@fontsource/inter@5.2.8"
    - "@fontsource/lora@5.2.8"
    - "@fontsource/jetbrains-mono@5.2.8"
  patterns:
    - "@theme inline with var() references for Tailwind opacity modifiers"
    - "CSS custom properties as single source of truth for all color tokens"
    - "Fontsource packages for offline Electron font bundling"
    - "Inline ESLint plugin for domain-specific rules"
key_files:
  created: []
  modified:
    - packages/app-desktop/src/styles/globals.css
    - packages/app-desktop/src/main.tsx
    - packages/app-desktop/package.json
    - eslint.config.js
    - pnpm-lock.yaml
decisions:
  - "@theme inline (not @theme) required for var() opacity modifiers to work in Tailwind CSS 4"
  - "Font families kept as literal values in @theme inline — no var() indirection since they do not change between themes"
  - "Pre-existing test failures (drizzle-orm/better-sqlite3) are out-of-scope — Vite renderer build passes cleanly"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 3
  files_modified: 5
---

# Phase 1 Plan 01: CSS Token System, Fonts, and ESLint Guard Summary

**One-liner:** Complete Tailwind CSS 4 @theme inline token migration with Fontsource self-hosted fonts and inline ESLint hex regression rule.

## What Was Built

### Task 1: Install dependencies and add font imports (commit: 1f45f39)

Installed all 7 Phase 1 npm dependencies via pnpm:
- `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-checkbox` — accessible primitives for later component work
- `motion` — Framer Motion for AnimatePresence in modal animations
- `@fontsource/inter`, `@fontsource/lora`, `@fontsource/jetbrains-mono` — self-hosted fonts

Updated `main.tsx` with 6 Fontsource latin-ext imports before the App import:
- Inter 400/500/600/700 (latin-ext subset for Portuguese diacritics)
- Lora 600 (brand headings)
- JetBrains Mono 400 (code/data display)

### Task 2: CSS token system with @theme inline migration (commit: 95fe1e2)

Rewrote `globals.css` token sections:

**@theme inline** — all `--color-causa-*` utility class mappings now reference `var()` instead of hardcoded hex. This is required in Tailwind CSS 4 for opacity modifiers like `bg-causa-primary/8` to work correctly.

**:root (light mode)** — added missing semantic tokens:
- `--color-surface-elevated: #ffffff` (third elevation level)
- `--color-surface-alt: #f3f4f6`
- `--color-success: #2a9d8f`, `--color-warning: #e9a800`, `--color-danger: #dc2626`
- `--color-tier-info/warning/urgent/fatal` (4-tier urgency system for Phase 3 listings)
- `--color-primary-light` via oklch()

**.dark** — same tokens with dark-mode values:
- `--color-surface-elevated: #22223a` (distinct third elevation for modals/cards)
- `--color-surface-alt: #252540`
- `--color-tier-info: #3b82f6` (lighter blue for dark contrast)

**prefers-reduced-motion guard** — added at end of file per DS-19, guards all animations and transitions.

### Task 3: ESLint no-hardcoded-hex custom rule (commit: 34b8f3e)

Added inline `causa-custom-rules` plugin to `eslint.config.js` with `causa/no-hardcoded-hex` set to `error`. The rule:
- Fires on `Literal` nodes containing `/#[0-9a-fA-F]{3,8}\b/`
- Only in files under `components/ui/` or `pages/` paths
- Does NOT flag `globals.css` (correct — that is where hex values belong)

## Verification Results

- **Dependency check:** `require.resolve('@fontsource/inter')`, `require.resolve('motion')` — OK
- **Vite renderer build:** Succeeded in 5.3s, all 13 font files (Inter 400/500/600/700, Lora 600, JetBrains Mono 400) bundled into dist/assets
- **ESLint rule check:** `--print-config` confirms `causa/no-hardcoded-hex` registered on button.tsx
- **Token structure:** Verified via grep — `@theme inline`, `--color-surface-elevated`, `--color-tier-fatal`, `prefers-reduced-motion` all present

## Deviations from Plan

### Out-of-Scope Pre-existing Issues (logged, not fixed)

**Pre-existing test failures:** 3 test files fail with `Cannot find package 'drizzle-orm/better-sqlite3'` in the database package. These are pre-existing failures completely unrelated to this plan's changes. The 1 passing test (in app-desktop) continues to pass.

**Full build failure:** `pnpm --filter @causa/app-desktop build` fails because `electron/main.ts` cannot find `@causa/database` types — a pre-existing workspace build order issue. The Vite renderer build (`vite build --mode development`) succeeds cleanly. Documented for future fix.

None of the plan's objectives were blocked by these pre-existing issues.

## Self-Check

### Files exist:

- [x] `packages/app-desktop/src/styles/globals.css` — contains `@theme inline`, all new tokens, reduced-motion guard
- [x] `packages/app-desktop/src/main.tsx` — contains 6 Fontsource import lines
- [x] `eslint.config.js` — contains `noHardcodedHexPlugin` and `causa/no-hardcoded-hex` rule
- [x] `packages/app-desktop/package.json` — contains all 7 new dependencies

### Commits exist:

- [x] 1f45f39 — feat(01-01): install Phase 1 deps and add Fontsource font imports
- [x] 95fe1e2 — feat(01-01): complete CSS token system with @theme inline migration
- [x] 34b8f3e — feat(01-01): add ESLint no-hardcoded-hex custom rule

## Self-Check: PASSED
