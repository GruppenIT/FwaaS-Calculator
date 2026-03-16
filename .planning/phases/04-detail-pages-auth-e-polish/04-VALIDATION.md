---
phase: 4
slug: detail-pages-auth-e-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace-level config) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test --filter @causa/app-desktop` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter @causa/app-desktop`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DET-01 | unit | `pnpm test --filter @causa/app-desktop -- processo-detail` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DET-02 | unit | `pnpm test --filter @causa/app-desktop -- cliente-detail` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | DET-03 | manual-only | Browser print preview | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | AUTH-01 | manual-only | Visual inspection both themes | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | AUTH-02 | manual-only | Launch Electron, observe splash | N/A | ⬜ pending |
| 04-03-01 | 03 | 2 | ANIM-01 | manual-only | Open/close any modal, observe scale | N/A | ⬜ pending |
| 04-03-02 | 03 | 2 | ANIM-02 | manual-only | Navigate between pages | N/A | ⬜ pending |
| 04-03-03 | 03 | 2 | ANIM-03 | unit | `pnpm test --filter @causa/app-desktop -- data-table` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | A11Y-01 | manual-only | DevTools accessibility panel | N/A | ⬜ pending |
| 04-04-02 | 04 | 2 | A11Y-02 | manual-only | Tab navigation in Electron | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-desktop/src/pages/processos/processo-detail-page.test.ts` — stubs for DET-01 (tab state from searchParams)
- [ ] `packages/app-desktop/src/pages/clientes/cliente-detail-page.test.ts` — stubs for DET-02 (financial aggregation logic)
- [ ] `packages/app-desktop/src/components/ui/data-table.test.ts` — stubs for ANIM-03 (animateFirstLoad prop behavior)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Print layout hides sidebar/nav | DET-03 | CSS @media print — visual only | Ctrl+P on processo detail, verify clean layout |
| Login split-panel layout | AUTH-01 | Visual layout — no logic to test | Inspect login page in both themes |
| Splash screen appearance | AUTH-02 | Electron splash — outside React test scope | Launch Electron, observe #0F1829 bg, Lora tagline |
| Modal scale animation | ANIM-01 | CSS transition timing — visual only | Open/close modal, observe scale(0.95→1) |
| Page transition opacity | ANIM-02 | Route transition — visual only | Navigate pages, observe fade+translateY |
| Text contrast WCAG AA | A11Y-01 | Token audit — needs browser DevTools | Check all text tokens in both themes via contrast checker |
| Focus ring visibility | A11Y-02 | Keyboard nav — visual only | Tab through all interactive elements |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
