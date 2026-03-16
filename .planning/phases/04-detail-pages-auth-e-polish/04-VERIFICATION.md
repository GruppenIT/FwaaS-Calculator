---
phase: 04-detail-pages-auth-e-polish
verified: 2026-03-16T18:00:00Z
status: gaps_found
score: 8/10 must-haves verified
gaps:
  - truth: "Printing processo detail page produces clean layout without sidebar or navigation"
    status: partial
    reason: "Print CSS uses [data-sidebar] selector but sidebar <aside> element has no data-sidebar attribute. The nav:not([role='tablist']) fallback hides sidebar nav content but the <aside> wrapper (with width var(--sidebar-width)) remains, producing a blank column in print output."
    artifacts:
      - path: "packages/app-desktop/src/components/layout/sidebar.tsx"
        issue: "Root <aside> element missing data-sidebar attribute — print CSS [data-sidebar] selector has no match"
      - path: "packages/app-desktop/src/styles/globals.css"
        issue: "Print rule comment documents the data-sidebar contract but the contract was never fulfilled in sidebar.tsx"
    missing:
      - "Add data-sidebar attribute to the <aside> element at line 159 of sidebar.tsx: <aside data-sidebar className=\"w-[var(--sidebar-width)] ...\">"

  - truth: "Table rows appear with 20ms stagger on first load, capped at 10 rows"
    status: failed
    reason: "animateFirstLoad prop is defined in DataTable but no consuming page passes it. processos-page.tsx, clientes-page.tsx, and prazos-page.tsx all use <DataTable> without animateFirstLoad. The stagger CSS keyframe (rowFadeIn) and prop infrastructure exist but the feature is orphaned — it never fires."
    artifacts:
      - path: "packages/app-desktop/src/components/ui/data-table.tsx"
        issue: "animateFirstLoad prop defined but no caller passes it (prop is orphaned)"
      - path: "packages/app-desktop/src/pages/processos/processos-page.tsx"
        issue: "Uses DataTable without animateFirstLoad — no row stagger on first load"
      - path: "packages/app-desktop/src/pages/clientes/clientes-page.tsx"
        issue: "Uses DataTable without animateFirstLoad — no row stagger on first load"
      - path: "packages/app-desktop/src/pages/prazos/prazos-page.tsx"
        issue: "Uses DataTable without animateFirstLoad — no row stagger on first load"
    missing:
      - "Add animateFirstLoad={isFirstLoad} to DataTable in processos-page.tsx — track first-load state with useState(true) + useEffect to set false after initial data"
      - "Same pattern for clientes-page.tsx and prazos-page.tsx"
      - "Pattern: const [isFirstLoad, setIsFirstLoad] = useState(true); after carregar() resolves: setIsFirstLoad(false)"

human_verification:
  - test: "Print layout without sidebar"
    expected: "After fixing data-sidebar attribute on sidebar <aside>, Ctrl+P on a processo detail page should show no sidebar column, no navigation chrome, all 6 tab sections visible, full-width content"
    why_human: "CSS print behavior requires browser print preview to verify visual output"
  - test: "Row stagger animation on first page load"
    expected: "After adding animateFirstLoad prop to consuming pages, navigating to processos/clientes/prazos listings for the first time shows rows fading in sequentially (20ms stagger); sorting or filtering shows rows instantly"
    why_human: "Animation timing behavior requires visual inspection in running app"
  - test: "Browser back/forward between tabs"
    expected: "On processo detail page, click Prazos tab, then click Movimentacoes tab, then press browser back — should return to Prazos tab with ?tab=prazos in URL"
    why_human: "History navigation behavior requires interactive testing in running app"
  - test: "Login left panel theme independence"
    expected: "On login page, toggle theme via top-right button — right panel background changes but left #0F1829 panel stays dark regardless of theme"
    why_human: "Theme toggle behavior requires visual inspection in running app"
---

# Phase 4: Detail Pages, Auth e Polish Verification Report

**Phase Goal:** Paginas de detalhe, login e splash completam a revisao visual com layouts profissionais e micro-animacoes com proposito — o app atinge qualidade visual Stripe/Vercel do primeiro clique ao ultimo
**Verified:** 2026-03-16T18:00:00Z
**Status:** gaps_found — 2 gaps blocking full goal achievement
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #  | Truth                                                                    | Status      | Evidence                                                                                     |
|----|--------------------------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------|
| 1  | Processo detail: 6 URL-driven tabs, direct URL access, back/forward nav  | VERIFIED    | useSearchParams + setSearchParams({ tab }) at lines 133-139; allTabs array at lines 302-311 |
| 2  | Cliente: financial summary with stacked bar; processo prints cleanly     | PARTIAL     | ResumoFinanceiro exists and wired; print CSS exists but sidebar <aside> lacks data-sidebar   |
| 3  | Login split-panel dark left + Lora splash with #0F1829                   | VERIFIED    | login-page.tsx line 49: inline style #0F1829; splash.html lines 104-106: Lora 16px tagline  |
| 4  | Modals scale 0.95→1 + AnimatePresence; page opacity+translateY 150ms; rows stagger | PARTIAL | Modal and page transitions verified; animateFirstLoad prop orphaned (no page passes it)      |
| 5  | WCAG AA contrast both themes; visible focus rings on all interactive     | VERIFIED    | Light: #636e7b = 4.78:1 AA pass; Dark: #9ca3af = 6.98:1 AA pass; focus-causa 0.30 opacity  |

**Score:** 3 fully verified / 2 partial (8/10 individual requirement-level truths)

---

### Required Artifacts

| Artifact                                                         | Expected                                     | Status     | Details                                                                   |
|------------------------------------------------------------------|----------------------------------------------|------------|---------------------------------------------------------------------------|
| `packages/app-desktop/src/pages/processos/processo-detail-page.tsx` | Tabbed layout with URL-driven tab state   | VERIFIED   | useSearchParams, allTabs, data-print-section, count badges, AnimatePresence |
| `packages/app-desktop/src/pages/clientes/cliente-detail-page.tsx`  | ResumoFinanceiro inline with stacked bar  | VERIFIED   | ResumoFinanceiro at line 597; listarHonorarios at line 127; financeiroEnabled gate at line 367 |
| `packages/app-desktop/src/styles/globals.css`                    | @media print rules for processo detail       | PARTIAL    | Print block exists at line 293; [data-sidebar] selector present but no matching element in DOM |
| `packages/app-desktop/src/pages/login/login-page.tsx`            | Split-panel login layout                     | VERIFIED   | #0F1829 inline style; CausaLogo import; handleSubmit preserved            |
| `packages/app-desktop/electron/splash/splash.html`               | Refreshed splash with Lora tagline           | VERIFIED   | Lora font-family and font-size: 16px at lines 104-106                    |
| `packages/app-desktop/src/components/layout/app-layout.tsx`      | AnimatePresence wrapper around Outlet        | VERIFIED   | AnimatePresence mode="wait", motion.div key={location.pathname} at lines 24-35 |
| `packages/app-desktop/src/components/ui/data-table.tsx`          | animateFirstLoad prop for row stagger        | ORPHANED   | Prop defined at line 31, staggerStyle at lines 123-133, but zero consuming pages pass it |
| `packages/app-desktop/src/styles/globals.css`                    | @keyframes rowFadeIn animation               | VERIFIED   | rowFadeIn defined at line 258                                             |
| `packages/app-desktop/src/components/layout/sidebar.tsx`         | data-sidebar attribute on root element       | MISSING    | Root <aside> at line 159 has no data-sidebar attribute — print CSS contract broken |

---

### Key Link Verification

| From                             | To                          | Via                                    | Status      | Details                                                              |
|----------------------------------|-----------------------------|----------------------------------------|-------------|----------------------------------------------------------------------|
| processo-detail tab buttons      | URL search params           | setSearchParams({ tab: tabKey })       | WIRED       | Line 139: setSearchParams({ tab: tabKey })                           |
| processo-detail active tab       | searchParams.get('tab')     | useSearchParams hook                   | WIRED       | Line 136: searchParams.get('tab') ?? 'dados-gerais'                  |
| processo-detail tab panels       | globals.css @media print    | data-print-section attribute           | WIRED       | Line 419: data-print-section present on each panel div               |
| login-page.tsx left panel        | CausaLogo component         | white variant rendering                | WIRED       | CausaLogo imported and used at line 52 with brightness/invert filter |
| login-page.tsx form              | useAuth().login             | existing handleSubmit                  | WIRED       | handleSubmit at line 25; useAuth().login called within               |
| app-layout.tsx AnimatePresence   | location.pathname           | motion.div key={location.pathname}     | WIRED       | Line 26: key={location.pathname} confirmed                           |
| data-table.tsx row render        | rowFadeIn keyframes         | inline style animationName             | PARTIAL     | Code exists in data-table.tsx lines 123-133 but animateFirstLoad never passed from parents |
| globals.css @media print         | sidebar/nav elements        | display: none !important               | PARTIAL     | nav:not([role='tablist']) hides sidebar <nav> content; but <aside> wrapper has no data-sidebar attribute so it persists |
| globals.css .dark tokens         | all text-muted usages       | var(--color-text-muted)                | WIRED       | Dark: #9ca3af at line 122; Light: #636e7b at line 82                 |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                          | Status    | Evidence                                                       |
|-------------|-------------|------------------------------------------------------|-----------|----------------------------------------------------------------|
| DET-01      | 04-01       | Processo detail tabs URL-driven via React Router     | SATISFIED | useSearchParams, allTabs, data-print-section, count badges     |
| DET-02      | 04-03       | Cliente financial summary with stacked progress bar  | SATISFIED | ResumoFinanceiro with 3-segment bar, feature-gated             |
| DET-03      | 04-03       | CSS @media print for clean processo detail printing  | BLOCKED   | Print CSS exists but [data-sidebar] contract unfulfilled — sidebar <aside> not hidden |
| AUTH-01     | 04-02       | Login split-panel dark left + form right             | SATISFIED | #0F1829 left panel, CausaLogo, feature bullets, handleSubmit   |
| AUTH-02     | 04-02       | Splash: #0F1829 bg, logo white, Lora 16px, blue bar  | SATISFIED | All elements verified in splash.html                           |
| ANIM-01     | 04-04       | Modal scale(0.95→1) + opacity, 180ms, AnimatePresence exit | SATISFIED | modal.tsx lines 27, 55-57 verified correct                |
| ANIM-02     | 04-04       | Page transitions opacity + translateY(4px→0), 150ms  | SATISFIED | app-layout.tsx AnimatePresence mode=wait, pathname key         |
| ANIM-03     | 04-04       | Table row stagger 20ms, cap 10 rows, first-load only  | BLOCKED   | Infrastructure exists but zero pages pass animateFirstLoad prop |
| A11Y-01     | 04-05       | WCAG AA contrast both themes for all text            | SATISFIED | Light 4.78:1, Dark 6.98:1 — both exceed 4.5:1 threshold       |
| A11Y-02     | 04-05       | Focus rings on all interactive elements              | SATISFIED | focus-causa 0.30 opacity; sidebar, login, tabs all covered     |

**Orphaned requirements:** None — all 10 DET/AUTH/ANIM/A11Y requirements declared in plan frontmatter and mapped to this phase in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File                                           | Line | Pattern                                          | Severity | Impact                                                                        |
|------------------------------------------------|------|--------------------------------------------------|----------|-------------------------------------------------------------------------------|
| `packages/app-desktop/src/components/layout/sidebar.tsx` | 159 | Missing data-sidebar attribute on root <aside>  | BLOCKER  | Print CSS [data-sidebar] selector has no match — sidebar width column persists in print |
| `packages/app-desktop/src/components/ui/data-table.tsx` | 31   | animateFirstLoad prop defined but never passed  | BLOCKER  | Row stagger never fires in the actual app — ANIM-03 is dead code at runtime  |

---

### Human Verification Required

These items require the running Electron application to verify and cannot be checked programmatically:

#### 1. Print Layout — Sidebar Hidden

**Test:** Open any processo detail page. Press Ctrl+P (or Cmd+P). Examine the print preview.
**Expected:** No sidebar column visible; no navigation bar; content spans full width; all 6 tab sections (Dados Gerais, Prazos, Movimentacoes, Documentos, Financeiro, Tarefas) visible in print output.
**Why human:** CSS @media print requires browser print preview to verify visual output. The gap (missing data-sidebar on <aside>) must be fixed first, then verified in preview.

#### 2. Row Stagger Animation

**Test:** After adding animateFirstLoad to consuming pages, navigate to the Processos listing for the first time. Observe row appearance. Then sort by any column and observe again.
**Expected:** On first load, rows 1-10 fade in sequentially with ~20ms delay between each. After sorting, all rows appear instantly (no stagger).
**Why human:** Animation timing requires visual inspection. The gap (no page passes animateFirstLoad) must be fixed first.

#### 3. Tab Back/Forward Navigation

**Test:** On a processo detail page, click the Prazos tab (URL: ?tab=prazos), then click Movimentacoes (URL: ?tab=movimentacoes). Press browser back button.
**Expected:** URL changes to ?tab=prazos and Prazos tab content is active.
**Why human:** Browser history API behavior in Electron requires interactive testing.

#### 4. Login Theme Independence

**Test:** On login page, toggle theme via the button (top-right of right panel). Toggle multiple times.
**Expected:** Right panel background changes between light/dark theme backgrounds. Left panel remains #0F1829 dark regardless of theme state.
**Why human:** Theme toggle visual behavior requires running app.

---

### Gaps Summary

Two gaps block complete goal achievement:

**Gap 1 — DET-03 print sidebar hiding (BLOCKER):** The print stylesheet plan (04-03) documented a `data-sidebar` attribute contract — the sidebar's root element must have `data-sidebar` for `[data-sidebar] { display: none !important }` to hide it in print. Plan 04-03 noted this contract in CSS comments but explicitly excluded sidebar.tsx from its `files_modified` list, deferring it to be "documented." The sidebar `<aside>` at line 159 of sidebar.tsx was never updated. The `nav:not([role='tablist'])` backup selector hides the sidebar's navigation content but the `<aside>` wrapper with `width: var(--sidebar-width)` persists, creating a blank column in print output.

**Gap 2 — ANIM-03 row stagger wiring (BLOCKER):** The DataTable received an `animateFirstLoad` prop and the `rowFadeIn` CSS keyframes were added to globals.css — the infrastructure is complete. However, the three primary listing pages (processos-page.tsx, clientes-page.tsx, prazos-page.tsx) each use `<DataTable>` without passing `animateFirstLoad`. The feature exists but never activates. Each consuming page needs a `isFirstLoad` boolean state initialized to `true`, flipped to `false` after the initial `carregar()` resolves, and passed as `animateFirstLoad={isFirstLoad}` to DataTable.

Both gaps are small fixes requiring changes to 1-4 files with no architectural implications.

---

_Verified: 2026-03-16T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
