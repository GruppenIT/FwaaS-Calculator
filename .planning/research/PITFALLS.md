# Domain Pitfalls: UI/UX Redesign of an Existing Production Desktop App

**Domain:** Legal ERP — Electron + React + Tailwind CSS desktop app redesign
**Researched:** 2026-03-15
**Confidence:** HIGH (grounded in actual codebase inspection + domain-specific analysis)

---

## Critical Pitfalls

Mistakes that cause rewrites, visual regressions, or erode user trust in the product.

---

### Pitfall 1: Hardcoded Color Values That Bypass the Token System

**What goes wrong:** Design token infrastructure is already in place (`globals.css` defines `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, etc. for both light and dark modes). During a large redesign across 20 pages, developers reach for literal hex codes or Tailwind palette classes instead of the token aliases — especially under deadline pressure. The result: components that look correct in light mode but break silently in dark mode.

**Why it happens:** The codebase already has this problem in `dashboard-page.tsx`. Recharts `<Area>` and `<Bar>` components use `stroke="#f59e0b"`, `fill="#10b981"` — raw hex values that do not respond to the `.dark` class. Any redesigned chart component that follows this pattern will be incorrect in dark mode from day one.

**Evidence in codebase:**
- `dashboard-page.tsx` lines 581-593: `stroke="#f59e0b"`, `fill="#10b981"`, `stroke="#10b981"` — three hardcoded chart colors that ignore the token system.
- `button.tsx` uses `text-causa-danger` (token-based) correctly, but `hover:bg-causa-surface-alt` references a `@theme` token that does not have a `.dark` override, which means it will always render the light-mode surface color.

**Consequences:**
- Charts appear with washed-out or overly bright colors in dark mode.
- Every page where a developer chose a hardcoded color becomes a dark mode defect that must be hunted down after the fact.
- WCAG AA contrast requirements fail silently — a `#f59e0b` warning yellow on a near-white `#0f0f1a` background may pass, but a `#f59e0b` on a brighter dark surface may not.

**Prevention:**
- Before the redesign phase starts, audit every file for raw hex values and Tailwind palette classes (`text-yellow-500`, `bg-green-600`, etc.) that are not routed through CSS custom properties. Replace all of them.
- For Recharts specifically: extract a `useChartColors()` hook that reads computed CSS variable values from `getComputedStyle(document.documentElement)` — this is the only way to pass theme-aware colors to SVG fill/stroke attributes.
- Add an ESLint rule or Prettier plugin that flags raw hex codes in `.tsx`/`.css` files not inside the `@theme` or `:root`/`.dark` blocks.
- Code review checklist: any PR touching chart or SVG rendering must include a dark mode screenshot.

**Warning signs:**
- A developer writes `fill="var(--color-primary)"` inside a Recharts prop — this looks correct but fails: SVG attributes do not resolve CSS variables at render time in all Electron/Chromium versions. Must use JS to read the value first.
- A new component has `bg-[#2563a8]` instead of `bg-[var(--color-primary)]`.

**Phase to address:** Phase 1 (Design System foundation) — before any page redesign begins. Establish the rule, the ESLint guard, and the chart color hook.

---

### Pitfall 2: Dark Mode as an Afterthought — "Invert and Pray"

**What goes wrong:** The current dark mode in `globals.css` defines only six surface-level overrides in `.dark { }`. Components are redesigned in light mode, then dark mode is verified with a single toggle — and only at the surface level (background goes dark, text goes light). Shadows, elevation hierarchy, status badge backgrounds, skeleton pulse colors, and tooltip backgrounds do not get separate dark-mode treatment.

**Specific failure modes for this app:**
- Cards use `shadow-[var(--shadow-sm)]` which is defined as `0 1px 3px oklch(0 0 0 / 0.08)` — a black shadow on a dark background has zero visibility. Dark mode needs elevated shadows or border-based elevation instead.
- `bg-causa-surface-alt` (defined as `#f3f4f6` in `@theme`) has no dark-mode equivalent — it always renders as a light gray, even when `.dark` is active, because `@theme` tokens are not overridden by the `.dark` selector.
- Status badges like `bg-causa-success/10` render as a tinted light green in light mode. In dark mode, a 10% opacity tint on a near-dark surface becomes nearly invisible — urgency signals disappear.
- The `skeletonPulse` animation goes from `opacity: 0.4` to `opacity: 0.8` — on a dark surface with a light skeleton color this flickers aggressively.

**Why it happens:** Tailwind's `@theme` variables are static at build time. They do not respond to runtime class changes like `.dark`. Only CSS custom properties declared in `:root`/`.dark` blocks respond to theme switching. The current codebase mixes both systems, which means some tokens are theme-aware and some are not.

**Consequences:** CAUSA's stated requirement is that dark mode must be "equal quality" to light mode. If dark mode is verified by eye after the fact rather than designed alongside light mode, it will visually degrade — and lawyers who work nights will immediately notice.

**Prevention:**
- For every new component, design both modes simultaneously: write the light CSS, then immediately write the `.dark` override before committing.
- Create a `dark-mode-audit.md` checklist covering: shadows/elevation, badge backgrounds at low opacity, skeleton colors, tooltip backgrounds, chart grid lines, input placeholder text.
- Replace `@theme`-only tokens that need dark-mode variants with CSS custom properties in `:root`/`.dark`. Specifically, `--color-surface-alt` should be added to both `:root` and `.dark` as a CSS var, not just in `@theme`.
- Test dark mode on every page at 1366x768 before marking a phase complete.

**Warning signs:**
- A component uses only Tailwind utility classes with no `dark:` prefix and no `var(--color-*)` reference — it will not respond to theme changes.
- Shadow values are not overridden in `.dark { }`.
- A PR has no dark mode screenshot in its description.

**Phase to address:** Phase 1 (Design System) — the token architecture must be corrected before any component gets redesigned.

---

### Pitfall 3: Violating the Red-Reserved Rule in the Redesigned Components

**What goes wrong:** The brand constraint is unambiguous: red (`causa-danger`, `#dc2626`) is reserved exclusively for fatal deadlines, critical errors, and connector failures. It must never appear decoratively. During redesign, this rule breaks in subtle ways:
- A redesigned "delete" button uses a red background (`bg-causa-danger`) instead of the correct pattern (ghost text in red, no filled background, as in the current `button.tsx` `danger` variant).
- A "required field" asterisk is styled red.
- A progress bar uses red at 0% completion as a "visual design choice."
- An empty state illustration uses a red accent.
- A section divider or decorative badge uses red to add visual interest.

**Evidence in codebase:** The current `button.tsx` already handles this correctly — `danger` variant uses `bg-[var(--color-surface)] text-causa-danger border border-causa-danger` (no filled red background). Any redesign that changes this to a filled red button violates the constraint.

**Why it happens:** Designers and developers internalize "red = danger" as a UX heuristic but lose track of the specific brand rule that red is reserved for system-level criticality (prazo fatal, connector failure, authentication error) — not just any destructive action.

**Consequences:** Lawyers see red on screen and immediately assume something is critically wrong with a case deadline or system failure. False alarms erode trust in the alert system. When a real `prazo fatal` appears in red, it competes with decorative reds and loses urgency.

**Prevention:**
- Document the rule as a code comment in `globals.css` at the `.color-causa-danger` definition: `/* RESERVED: prazo fatal, erro critico, falha de conector — nunca decorativo */`.
- Add a lint rule or custom ESLint plugin that flags `text-causa-danger`, `bg-causa-danger`, or `border-causa-danger` usage outside the approved component files (`toast.tsx error variant`, `prazos-page.tsx`, `dashboard-page.tsx danger stats`, `confirm-dialog.tsx`).
- During design review, scan every new component screenshot for any red pixel that is not attached to a deadline or system error.

**Warning signs:**
- A delete confirmation button has a red filled background.
- A form validation error label uses `text-causa-danger` for a non-critical field error.
- Any decorative element (divider, badge, icon accent, chart color) is red.

**Phase to address:** Phase 1 (Design System) — establish the lint guard. Enforce in every subsequent phase's code review.

---

### Pitfall 4: 1366x768 Overflow — Designing at Larger Resolutions

**What goes wrong:** The developer's monitor is 1920x1080 or a high-DPI MacBook. The redesigned dashboard looks elegant at their resolution: 7 stat cards in a row, two side-by-side chart panels, a sidebar with breathing room. At 1366x768 (the actual target), the layout either overflows horizontally, truncates text, or requires horizontal scrolling — which is unacceptable for a desktop ERP.

**Specific risks in this codebase:**
- The dashboard currently uses `grid-cols-3 lg:grid-cols-7` for stat cards. At 1366px, `lg` breakpoint (1024px) is active, so 7 cards render. Each card must fit in `(1366 - 240px sidebar - padding) / 7 ≈ 158px`. If redesigned cards get wider padding, gradients, or icons, they overflow.
- The sidebar is fixed at `240px`. Any reduction of this value ripples into all page content widths. Any increase would compress content to ~1080px effective width.
- Tables (processos-page.tsx has 8 columns) are already dense at 1366px. A redesign that adds column padding, borders, or new columns will cause horizontal scroll.
- Modals that are redesigned with wider minimum widths will extend beyond the viewport on 1366px screens.

**Why it happens:** Tailwind's responsive prefixes (`md:`, `lg:`, `xl:`) encourage designing for larger breakpoints. Electron desktop apps do not have the same "just scroll" escape hatch that web apps do.

**Prevention:**
- Lock the browser devtools or Electron window to exactly 1366x768 as the primary testing viewport during all redesign work. Never test at a larger size first.
- For every new layout, verify: does it fit at 1366x768 at 100% zoom? Does it still fit if the user has the Electron window slightly smaller (e.g., 1280x720)?
- Stat card grid: test with the `financeiro` feature flag on (7 cards) and off (6 cards) at 1366px.
- Table columns: establish a maximum column count rule (8 is already at the limit). New columns must replace existing ones, not be added on top.
- Modal max-width: standardize at `max-w-2xl` (672px) which leaves comfortable margins at 1366px after the sidebar.

**Warning signs:**
- A component has `min-w-[400px]` or similar fixed minimum widths without verification at 1366px.
- A layout has more than 3 side-by-side panels.
- A table adds a new column without removing or collapsing an existing one.
- Horizontal scrollbar appears in Electron window at 1366px.

**Phase to address:** Every phase — but especially Phase 2 (Dashboard) and Phase 3 (Listings). Establish the 1366x768 testing checkpoint as a gate for each phase.

---

### Pitfall 5: Inconsistent Styling Patterns Across 20 Pages — The "Partial Redesign" Problem

**What goes wrong:** The redesign is planned page-by-page or component-by-component. Midway through, some pages use the new token system with refined shadows and spacing, while others still use the old patterns. The result is an interface that looks *worse* than before the redesign because the visual inconsistency is now more visible — users perceive it as bugs or unfinished work.

**Specific risk:** CAUSA already has a working interface. If Phase 2 redesigns the Dashboard but Phase 3 hasn't touched Processos yet, users opening the app will see a polished dashboard immediately followed by a dated-looking processos list. This inconsistency is more jarring than a consistently dated interface.

**Why it happens:** Large redesigns almost always scope "the hard pages" for later phases. Dashboard gets done first because it's visible. Configuracoes, Timesheet, and setup wizard get done last because they're "less important." But users navigate between all pages constantly.

**Prevention:**
- Phase the redesign by *component layer*, not by page: fix all shared components (Button, Input, Modal, Toast, Sidebar, PageHeader) first. This immediately makes all 20 pages look more consistent even before page-level work begins, because shared components appear everywhere.
- Establish a "visual consistency checkpoint" at each phase boundary: open every page of the app and verify that shared components look uniform.
- Do not ship a phase to a real user until all 20 pages are at least at the baseline consistency level.
- Track each page's redesign status with a checklist to avoid forgetting low-traffic pages (Conectores, Integracoes, server-error, setup wizard).

**Warning signs:**
- A phase plan redesigns individual pages before shared components are finalized.
- The Sidebar, PageHeader, or Modal has two different visual styles present in the same build.
- A page is skipped because "nobody uses it much."

**Phase to address:** Phase 1 must complete all shared components before any page-level redesign begins. This is the correct sequencing — not optional.

---

### Pitfall 6: Animations That Feel Cheap or Cause Visual Noise

**What goes wrong:** The brand constraint is explicit: no purely decorative animations. During redesign, developers add CSS transitions or keyframe animations to make the interface feel "modern" — but without purpose:
- A sidebar nav item bounces when hovered.
- Cards have an entrance animation (fade-in on mount) that plays every time a list re-renders.
- A page transition slides the entire content area left/right on route change.
- Skeleton loaders pulse at a rate that causes flicker rather than calm anticipation.

The existing `transition-causa` utility (`120ms ease-out` for color/border/background) is well-calibrated. The `slideIn` for toasts is purposeful. The `skeletonPulse` is appropriate. Any animation added beyond these must have a clear functional purpose.

**Specific Electron risk:** Electron on Windows uses the Chromium compositor. Poorly composed animations (animating `width`, `height`, `top`, `left` instead of `transform` and `opacity`) trigger layout reflows that cause jank on 1366x768 machines, which are often budget laptops with slower CPUs.

**Why it happens:** "Stripe/Vercel aesthetic" is the stated reference. Stripe and Vercel use micro-animations extensively. The difference is that every Stripe animation communicates state change (loading → loaded, error → resolved). Developers may add animation for visual similarity without asking "what state change does this communicate?"

**Prevention:**
- For every animation added during redesign, require a one-sentence justification: "This animation communicates [X] to the user." If the blank cannot be filled, the animation is decorative and must be removed.
- Animate only `transform` and `opacity` in CSS — never `width`, `height`, `max-height` (unless used for collapsible sections with explicit purpose), `margin`, `padding`, or `top`/`left`.
- Duration budget: entrance animations ≤ 150ms, exit animations ≤ 100ms, hover transitions ≤ 120ms (already enforced by `transition-causa`). Never exceed 300ms for any functional animation.
- Respect `prefers-reduced-motion`: wrap all animations in `@media (prefers-reduced-motion: no-preference)` — users with vestibular disorders will thank you, and many legal professionals are older.

**Warning signs:**
- A component animates `max-height` or `opacity` on every render, not just on initial mount.
- An animation has `duration-500` or longer.
- The same visual element animates both on enter and on every re-render.
- A page transition slides or fades the entire route content.

**Phase to address:** Phase 1 (establish animation rules in the design system). Enforce in every subsequent phase review.

---

## Moderate Pitfalls

### Pitfall 7: Self-Hosted Fonts Not Loading in Electron Production Builds

**What goes wrong:** Inter, Lora, and JetBrains Mono are referenced via `@font-face` with local file paths. In development (Vite dev server), font files resolve correctly. In the production Electron build (packaged `.exe`), the base URL changes — fonts may fail to load if paths are relative and not accounted for in the Electron asset loading configuration.

**Evidence of risk:** The current `globals.css` uses `font-family: 'Inter', system-ui` with no `@font-face` declarations visible — meaning fonts may currently be loaded from a CDN or system. The constraint "fonts must be self-hosted" implies this needs to be implemented or verified. If fonts are currently from a CDN and fail at runtime (no internet, office network blocks CDNs), the app falls back to `system-ui` — which would be fine functionally but would break the brand identity guide's typographic rules.

**Prevention:**
- Place font files in `packages/app-desktop/public/fonts/`. Vite copies `public/` contents to the build output, and `electron-builder` includes the output directory.
- Use root-relative paths in `@font-face` src: `url('/fonts/Inter-Regular.woff2')`. Electron's renderer protocol resolves these against the app root.
- Test font loading in a packaged build (run `npm run build:installer`, install the MSI, launch) before declaring the typography phase complete.
- Verify with DevTools: open Electron DevTools in production, check the Network tab for font requests. All should return 200 from a local file source, not from `fonts.googleapis.com` or similar.

**Warning signs:**
- `globals.css` references `@import url('https://fonts.googleapis.com/...')`.
- Fonts load in dev but the app uses system-ui after packaging.
- `woff2` files are not present in the `dist/` output directory.

**Phase to address:** Phase 1 (Design System) — font loading must be verified in a packaged build before typography is considered settled.

---

### Pitfall 8: recharts Components Ignoring Theme Tokens

**What goes wrong:** Recharts uses SVG under the hood. SVG `fill` and `stroke` attributes do not resolve CSS custom properties — they require JavaScript to read the computed value. The current codebase uses hardcoded hex values for chart colors (`stroke="#f59e0b"`, `fill="#10b981"`). A redesign that adds more charts or changes chart colors will perpetuate this pattern unless the correct approach is established.

**Prevention:**
- Create a `useChartTheme()` hook:
  ```typescript
  function useChartTheme() {
    const { theme } = useTheme();
    return useMemo(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        primary: style.getPropertyValue('--color-primary').trim(),
        warning: style.getPropertyValue('--color-causa-warning').trim(), // needs to be a CSS var
        success: style.getPropertyValue('--color-causa-success').trim(),
        danger: style.getPropertyValue('--color-causa-danger').trim(),
        border: style.getPropertyValue('--color-border').trim(),
        textMuted: style.getPropertyValue('--color-text-muted').trim(),
      };
    }, [theme]);
  }
  ```
- All Recharts `stroke`, `fill`, and `tick.fill` props must use values from this hook, not hardcoded hex.
- This requires that warning, success, and danger colors be promoted to CSS custom properties in `:root`/`.dark`, not just `@theme` tokens.

**Phase to address:** Phase 2 (Dashboard redesign) — this is where charts live. Fix the hook before redesigning chart visuals.

---

### Pitfall 9: Alert Urgency System Color Semantics Violated During Redesign

**What goes wrong:** CAUSA has a 4-level deadline alert system: informativo / atencao / urgente / fatal. The current codebase implements this in `dashboard-page.tsx` using color cues (muted → warning → warning → danger). A redesign that adds visual interest by using color more aggressively (e.g., making the "atencao" level orange-red instead of amber, or making "informativo" blue-accented) will compress the visual distance between levels — lawyers will lose the ability to quickly scan deadline urgency by color alone.

**Prevention:**
- Document the exact color+icon mapping for all 4 urgency levels in the design system before any redesign of deadline-displaying components.
- Urgency must be communicated through at minimum two channels (color + icon or color + label) so colorblind users are not excluded.
- Leave sufficient perceptual distance between levels: informativo (muted/neutral), atencao (amber/warning), urgente (amber+bold), fatal (red+icon+bold). Do not use red for urgente.

**Phase to address:** Phase 2 (Dashboard) and Phase 3 (Prazos page) — any phase touching deadline display.

---

### Pitfall 10: Non-Technical Users Disoriented by Visual Change Without Transition

**What goes wrong:** Lawyers, secretaries, and paralegals who use CAUSA daily have built muscle memory around the current interface. A complete visual redesign — even a correct and beautiful one — creates a period of confusion. If the redesign changes the visual weight or position of frequently-used elements (e.g., the "Novo processo" button moves from top-right to a floating action button, or the sidebar reorders sections), users will contact support claiming the application is broken.

**Specific risk:** The sidebar currently has 4 sections (GERAL, FINANCEIRO, REDE, SISTEMA) with items in a specific order. Any redesign that reorders items, changes section names, or adds visual grouping that users must "learn" creates cognitive load.

**Prevention:**
- Navigation structure is explicitly out of scope (PROJECT.md confirms: "Redesign de navegacao/rotas — manter estrutura atual"). Enforce this strictly — do not reorder sidebar items even if a new grouping "makes more sense."
- Maintain all interactive element positions (buttons, action links) in their expected spatial locations. A button that was top-right of a page header should remain top-right after redesign, even if the button looks different.
- Do not replace familiar text labels with icon-only controls. Non-technical users rely on labels.
- If the redesign changes how a workflow feels (e.g., a modal becomes a slide-over panel), test with a real user or run through the most common workflows manually as if you were a non-technical user on day one.

**Phase to address:** Every phase — but especially any phase touching navigation (Sidebar) or primary actions (page-level CTAs).

---

## Minor Pitfalls

### Pitfall 11: WCAG AA Contrast Failing in Edge Cases

**What goes wrong:** Muted text on surface-alt backgrounds fails contrast ratios. The most common failure: `text-[var(--color-text-muted)]` (#6b7280 in light mode) on `bg-causa-surface-alt` (#f3f4f6) gives approximately 4.0:1 — which passes AA for normal text but fails for small text (below 18px) requiring 4.5:1.

**Prevention:**
- Audit every instance of muted text on non-white backgrounds with a contrast checker after each phase.
- In dark mode, `--color-text-muted` is `#9ca3af` on `--color-surface` `#1a1a2e` — verify this combination passes at the relevant font sizes used in the typography scale.

**Phase to address:** Phase 1 (Design System) — validate token combinations before committing them. Re-check in each phase that uses muted text on non-standard backgrounds.

---

### Pitfall 12: `@theme` vs CSS Custom Property Confusion in Tailwind CSS 4

**What goes wrong:** Tailwind CSS 4 introduces `@theme` as the new configuration mechanism. `@theme` values are build-time constants resolved into utility classes. CSS custom properties in `:root`/`.dark` are runtime values that respond to class changes. The codebase currently uses both — and components inconsistently switch between `bg-causa-surface-alt` (a `@theme`-derived class, always light) and `bg-[var(--color-surface)]` (a CSS var, theme-aware).

**Prevention:**
- Establish a clear rule: values that must change with the theme (backgrounds, text, borders) → always use `var(--color-*)` custom properties. Values that never change with the theme (radius, spacing scale, font families) → `@theme` is acceptable.
- Specifically: `bg-causa-surface-alt` should be removed from component usage and replaced with `bg-[var(--color-surface-alt)]` after adding `--color-surface-alt` to both `:root` and `.dark` in `globals.css`.

**Phase to address:** Phase 1 — this is a foundational token architecture issue.

---

### Pitfall 13: Splash Screen / Login Page Not Constrained to 1366x768

**What goes wrong:** The splash screen and login page render before the app shell loads. If redesigned with large hero elements, background imagery, or full-bleed gradients that assume a wide viewport, they will look cropped or misaligned on 1366x768.

**Prevention:**
- Design splash and login at exactly 1366x768 as the primary artboard. Both pages are standalone (no sidebar) so they use the full viewport — the constraint is more visible here than on app pages with the sidebar.
- The Electron window is not resizable by default in many configurations — verify the window creation constraints in `electron/main.ts` and design splash/login to match.

**Phase to address:** The phase that redesigns the login and splash screen.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Design System tokens | `@theme` values not theme-aware (P12) | Migrate to CSS custom properties for all theme-responsive tokens before any page work |
| Design System tokens | Dark mode shadows invisible (P2) | Add border-based elevation as dark mode shadow alternative |
| Design System fonts | Self-hosted fonts break in packaged builds (P7) | Test in a packaged Electron build before typography is finalized |
| Design System animations | Animations added without purpose (P6) | Require written justification for every animation; default is no animation |
| Dashboard redesign | Chart colors hardcoded, ignore dark mode (P1, P8) | Implement `useChartTheme()` hook before redesigning chart visuals |
| Dashboard redesign | Deadline urgency levels visually collapse (P9) | Document 4-level color+icon mapping before redesigning deadline cards |
| Dashboard redesign | 7 stat cards overflow at 1366px (P4) | Test at 1366x768 before each commit touching the stat card grid |
| Listings (Processos, Clientes, Prazos) | Table columns exceed 1366px width (P4) | Enforce max 8 columns; verify at 1366px with all columns populated |
| Sidebar redesign | Navigation reordering confuses non-technical users (P10) | Keep all items in current order; visual refresh only |
| All pages | Red used decoratively in redesigned components (P3) | ESLint guard on `causa-danger` usage; design review checklist |
| All pages | Partial redesign creates visual inconsistency (P5) | Complete all shared components before page-level redesign |
| Login + Splash | Not tested at 1366x768 full-screen (P13) | Design at 1366x768 artboard from the start |
| Any component with muted text | WCAG AA contrast failures (P11) | Run contrast audit after each phase on non-white backgrounds |

---

## Sources

- Codebase inspection: `packages/app-desktop/src/styles/globals.css` — token system and dark mode implementation
- Codebase inspection: `packages/app-desktop/src/pages/dashboard/dashboard-page.tsx` — confirmed hardcoded hex colors in recharts
- Codebase inspection: `packages/app-desktop/src/components/ui/button.tsx` — confirmed correct danger variant pattern (border-only, no filled red)
- Codebase inspection: `packages/app-desktop/src/components/layout/sidebar.tsx` — confirmed navigation structure and dark mode toggle implementation
- Codebase inspection: `packages/app-desktop/src/pages/processos/processos-page.tsx` — confirmed 8-column table at 1366px target resolution
- Project constraints: `.planning/PROJECT.md` — confirmed 1366x768 minimum, dark mode quality requirement, red reservation rule, font self-hosting requirement, no decorative animations
- Tailwind CSS 4 documentation: `@theme` vs CSS custom property semantics (HIGH confidence — documented behavior)
- Electron packaging behavior: `public/` directory inclusion in `electron-builder` output (HIGH confidence — standard behavior)
