---
phase: 3
slug: core-feature-screens
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (globals: true, environment: node) |
| **Config file** | `/vitest.config.ts` (workspace root) |
| **Quick run command** | `pnpm vitest run packages/app-desktop` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run packages/app-desktop`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DASH-03 | unit | `pnpm vitest run packages/app-desktop/src/hooks/use-chart-theme.test.ts` | W0 | pending |
| 03-01-02 | 01 | 1 | LIST-02 | unit | `pnpm vitest run packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts` | W0 | pending |
| 03-01-03 | 01 | 1 | DASH-02 | unit | `pnpm vitest run packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts` | W0 | pending |
| 03-01-04 | 03 | 2 | LIST-03 | unit | `pnpm vitest run packages/app-desktop/src/pages/processos/processos-page.test.ts` | W0 | pending |
| 03-02-01 | 02 | 2 | DASH-01 | manual | visual: stat cards render Stripe-style with 3px colored left border, 4+3 grid (no trend indicators — deferred per decision) | N/A | pending |
| 03-02-02 | 02 | 2 | DASH-02 | manual | visual: heat map renders 2x2 grid with tier colors | N/A | pending |
| 03-03-01 | 03 | 2 | LIST-01,LIST-02 | manual | visual: countdown + tier colors in prazos listing | N/A | pending |
| 03-03-02 | 03 | 2 | LIST-03,LIST-04 | manual | visual: processo rows with mono font + status badges | N/A | pending |
| 03-04-01 | 04 | 3 | LIST-05 | manual | visual check at 1366x768 | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-desktop/src/hooks/use-chart-theme.test.ts` — stubs for DASH-03 (mock getComputedStyle, assert resolved hex)
- [ ] `packages/app-desktop/src/pages/prazos/prazo-countdown.test.ts` — stubs for LIST-02 (pure function, no DOM needed)
- [ ] `packages/app-desktop/src/pages/dashboard/urgency-heat-map.test.ts` — stubs for DASH-02 (computeTierCounts pure function)
- [ ] `packages/app-desktop/src/pages/processos/processos-page.test.ts` — stubs for LIST-03 (STATUS_TO_BADGE mapping, created in Plan 03 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stat cards render Stripe-style with 3px colored left border, 4+3 grid (no trend indicators — deferred) | DASH-01 | Visual layout quality | Open dashboard, verify 7 cards in 4+3 grid with colored left borders, large number + small label |
| Heat map renders 2x2 grid with correct tier colors | DASH-02 | Visual color accuracy | Open dashboard, verify heat map quadrants match tier tokens |
| Recharts colors change on dark/light toggle | DASH-03 | Requires DOM + CSS var resolution | Toggle theme, verify chart colors update without page reload |
| Countdown text + tier colors in prazos listing | LIST-02 | Visual rendering + tooltip hover | Hover countdown badges, verify tooltip shows absolute date |
| Processo rows: mono font + status badges | LIST-03,LIST-04 | Visual typography + color | Check CNJ numbers in JetBrains Mono 13px, badge colors per status |
| No horizontal scroll at 1366x768 | LIST-05 | Viewport-dependent layout | Resize window to 1366x768, verify no horizontal scrollbar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
