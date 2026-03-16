---
phase: 04-detail-pages-auth-e-polish
plan: "05"
subsystem: ui
tags: [wcag, accessibility, a11y, css-variables, focus-rings, contrast]

# Dependency graph
requires:
  - phase: 04-detail-pages-auth-e-polish
    provides: All Phase 4 UI components (tabs, login split-panel, animations, financial summary, print CSS)

provides:
  - WCAG AA contrast-compliant color tokens in both light and dark themes
  - Visible focus rings on all interactive elements (sidebar nav, login, DataTable rows, tab buttons)
  - Complete Phase 4 visual quality approval

affects: [future-phases, any-ui-work-touching-color-tokens, accessibility-audits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS variable contrast adjustment: bump --color-text-muted hex to meet 4.5:1 AA ratio against darkest background"
    - "focus-causa utility class applied consistently to all interactive elements needing keyboard focus ring"

key-files:
  created: []
  modified:
    - packages/app-desktop/src/styles/globals.css
    - packages/app-desktop/src/components/layout/sidebar.tsx
    - packages/app-desktop/src/pages/login/login-page.tsx

key-decisions:
  - "--color-text-muted in :root bumped from #6b7280 to #636e7b to achieve 4.78:1 AA contrast on #f7f6f3 background (was ~4.46:1, borderline failing)"
  - "focus-causa ring opacity increased from 0.15 to 0.30 for better visibility without changing ring color"
  - "Sidebar NavLink, theme-toggle, and logout buttons all receive focus-causa class — previously missing"
  - "Login page theme-toggle button receives focus-causa class — previously missing"

patterns-established:
  - "A11Y pattern: All new interactive elements must include focus-causa class at authoring time"
  - "Contrast pattern: --color-text-muted is the highest-risk token — verify against darkest bg when changing"

requirements-completed: [A11Y-01, A11Y-02]

# Metrics
duration: 15min
completed: 2026-03-16
---

# Phase 4 Plan 05: WCAG AA Contrast and Focus Ring Polish Summary

**WCAG AA contrast fixes for --color-text-muted in both themes and focus-causa rings added to sidebar nav, login, and all missing interactive elements**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-16T16:44:00Z
- **Completed:** 2026-03-16T16:58:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint approved)
- **Files modified:** 3

## Accomplishments

- Fixed --color-text-muted contrast in light theme (:root) from borderline-failing ~4.46:1 to passing 4.78:1 against #f7f6f3 background
- Increased focus-causa ring opacity from 0.15 to 0.30 for visible keyboard focus indicator in both themes
- Added missing focus-causa class to sidebar NavLink items, theme-toggle button, and logout button
- Added missing focus-causa class to login page theme-toggle button
- User approved complete Phase 4 visual quality at checkpoint (10 features verified across both themes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and fix WCAG AA contrast tokens + verify focus rings** - `d8bfa4e` (fix)
2. **Task 2: Visual verification of complete Phase 4** - Checkpoint approved, no code changes

**Plan metadata:** (this commit)

## Files Created/Modified

- `packages/app-desktop/src/styles/globals.css` - Bumped --color-text-muted in :root to #636e7b; increased focus-causa ring opacity to 0.30
- `packages/app-desktop/src/components/layout/sidebar.tsx` - Added focus-causa to NavLink, theme-toggle, and logout button
- `packages/app-desktop/src/pages/login/login-page.tsx` - Added focus-causa to theme-toggle button

## Decisions Made

- Adjusted only :root (light theme) --color-text-muted — dark theme value #9ca3af on #1a1a2e was already passing after recalculation; the RESEARCH.md risk note was based on an older surface value
- Minimal adjustment strategy preserved: single hex value change, no brand color modifications
- focus-causa ring opacity 0.30 is high enough for WCAG AA focus indicator visibility while remaining visually subtle

## Deviations from Plan

None - plan executed exactly as written. The RESEARCH.md identified risk (dark mode --color-text-muted failing) turned out not to require a fix once actual token values were verified against current surface colors.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 is complete. All 10 requirements verified (DET-01..03, AUTH-01..02, ANIM-01..03, A11Y-01..02):
- Processo detail page with URL-driven tabs and browser back/forward
- Cliente financial summary with stacked bar chart
- Print stylesheet hiding sidebar/nav, full-width content
- Login split-panel with theme-independent left panel
- Splash screen with Lora SemiBold tagline
- Modal enter/exit animations verified
- Page transitions with AnimatePresence (fade + translateY, 150ms)
- DataTable row stagger on first load only
- WCAG AA contrast for all text in both themes
- Visible focus rings on all interactive elements

The codebase is ready for the next phase. No blockers.

---
*Phase: 04-detail-pages-auth-e-polish*
*Completed: 2026-03-16*
