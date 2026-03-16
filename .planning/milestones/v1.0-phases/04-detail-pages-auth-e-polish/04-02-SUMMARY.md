---
phase: 04-detail-pages-auth-e-polish
plan: 02
subsystem: auth
tags: [react, tailwind, electron, split-panel, lora, login]

requires:
  - phase: 01-design-system
    provides: CausaLogo component, design tokens (--color-bg, --font-brand, causa-* Tailwind classes)
  - phase: 02-layout-shell
    provides: useAuth, useTheme hooks already wired to auth-context and theme system
provides:
  - "Split-panel login page (dark left branding + theme-aware right form)"
  - "Refreshed splash screen with Lora 16px tagline matching login left panel"
affects: [04-03, visual consistency]

tech-stack:
  added: []
  patterns:
    - "Left panel hardcoded dark: inline style backgroundColor '#0F1829' — not Tailwind arbitrary value, theme-independent"
    - "CausaLogo white variant via Tailwind filter: [&_img]:brightness-0 [&_img]:invert [&_span]:!text-white"

key-files:
  created: []
  modified:
    - packages/app-desktop/src/pages/login/login-page.tsx
    - packages/app-desktop/electron/splash/splash.html

key-decisions:
  - "Left panel background uses inline style (not Tailwind bg-[]) per existing design decision that only :root/.dark variables use hardcoded hex"
  - "Lora SemiBold (weight 600) used for splash tagline — Lora-Regular.woff2 not bundled, SemiBold already declared in @font-face"
  - "Left panel version text uses appVersion from same useEffect as before — shared state between panels via React closure"

patterns-established:
  - "Split-panel auth layout: hidden lg:flex w-1/2 left panel + flex-1 right panel, always visible at 1366px desktop minimum"

requirements-completed: [AUTH-01, AUTH-02]

duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 02: Login Split-Panel and Splash Refresh Summary

**Split-panel login with dark #0F1829 left branding (CausaLogo white, Lora tagline, feature bullets) and theme-aware right form, plus splash tagline changed from Inter 15px to Lora SemiBold 16px**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T16:31:52Z
- **Completed:** 2026-03-16T16:33:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Login page redesigned: dark left panel with CausaLogo (white via CSS filter), Lora 20px tagline "A sua causa, no seu escritorio", 3 feature bullets, version footer; theme-aware right panel with toggle, Entrar heading, email/password form
- All existing auth logic preserved: useState for email/senha/error/loading, useEffect for appVersion, handleSubmit with useAuth().login()
- Splash screen tagline font updated from Inter 15px to Lora SemiBold 16px — background #0F1829, progress bar #2563A8 2px, and all Electron IPC integration unchanged

## Task Commits

1. **Task 1: Rewrite login page to split-panel layout** - `2f11452` (feat)
2. **Task 2: Refresh splash screen to match login aesthetic** - `73a3683` (feat)

## Files Created/Modified

- `packages/app-desktop/src/pages/login/login-page.tsx` - Complete rewrite to split-panel layout: left panel always dark, right panel theme-aware, all auth logic preserved
- `packages/app-desktop/electron/splash/splash.html` - Tagline `.tagline` CSS changed from Inter 15px to Lora 16px (font-family, font-weight, font-size)

## Decisions Made

- Left panel uses `style={{ backgroundColor: '#0F1829' }}` inline style (not Tailwind `bg-[#0F1829]`) — consistent with existing decision that hardcoded hex lives only in `:root/.dark` or inline styles for theme-independent cases
- Lora SemiBold (600) used for splash tagline since Lora-Regular.woff2 is not in the splash fonts bundle; SemiBold was already declared in the `@font-face` block for the h1
- Left panel version string reuses the `appVersion` state already fetched from `causaElectron.getAppVersion()` — no additional effect needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx` (line 367: `Cannot find name 'ResumoFinanceiro'`) — unrelated to this plan's changes. No errors in the files modified by this plan. Logged to deferred items for Phase 4.

## Next Phase Readiness

- Login and splash screens now share #0F1829 dark aesthetic — AUTH-01 and AUTH-02 complete
- Ready for Phase 4 Plan 03 (detail pages polish)
- Pre-existing TS error in cliente-detail-page.tsx should be resolved in Phase 4

---
*Phase: 04-detail-pages-auth-e-polish*
*Completed: 2026-03-16*
