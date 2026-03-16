---
phase: 1
slug: design-system-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (root vitest.config.ts) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run packages/app-desktop/src/components/ui/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run packages/app-desktop/src/components/ui/`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | DS-01 | unit | `pnpm vitest run packages/app-desktop/src/styles/tokens.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | DS-02 | unit | `pnpm vitest run packages/app-desktop/src/styles/tokens.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | DS-19 | unit | `pnpm vitest run packages/app-desktop/src/styles/tokens.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DS-03 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/button.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | DS-04 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/input.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | DS-05 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/modal.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | DS-07 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/modal.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | DS-11 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/badge.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-02 | 04 | 2 | DS-12 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/status-dot.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-03 | 04 | 2 | DS-13 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/card.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-04 | 04 | 2 | DS-14 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/data-table.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-05 | 04 | 2 | DS-15 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/select.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-06 | 04 | 2 | DS-16 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/checkbox.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-07 | 04 | 2 | DS-17 | unit | `pnpm vitest run packages/app-desktop/src/components/ui/textarea.test.ts` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 3 | DS-04 (barrel) | unit | `pnpm vitest run packages/app-desktop/src/components/ui/index.test.ts` | ❌ W0 | ⬜ pending |
| 01-05-02 | 05 | 3 | DS-18 | manual | Electron packaged build test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-desktop/src/styles/tokens.test.ts` — stubs for DS-01, DS-02, DS-19
- [ ] `packages/app-desktop/src/components/ui/button.test.ts` — stubs for DS-03
- [ ] `packages/app-desktop/src/components/ui/input.test.ts` — stubs for DS-04
- [ ] `packages/app-desktop/src/components/ui/modal.test.ts` — stubs for DS-05, DS-07
- [ ] `packages/app-desktop/src/components/ui/badge.test.ts` — stubs for DS-11
- [ ] `packages/app-desktop/src/components/ui/status-dot.test.ts` — stubs for DS-12
- [ ] `packages/app-desktop/src/components/ui/card.test.ts` — stubs for DS-13
- [ ] `packages/app-desktop/src/components/ui/data-table.test.ts` — stubs for DS-14
- [ ] `packages/app-desktop/src/components/ui/select.test.ts` — stubs for DS-15
- [ ] `packages/app-desktop/src/components/ui/checkbox.test.ts` — stubs for DS-16
- [ ] `packages/app-desktop/src/components/ui/textarea.test.ts` — stubs for DS-17
- [ ] `packages/app-desktop/src/components/ui/index.test.ts` — stubs for barrel export
- [ ] vitest.config.ts: add `*.test.tsx` to include pattern if DOM tests needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fonts load offline in Electron | DS-18 | Requires packaged Electron build without internet | 1. Build with `pnpm build` 2. Disconnect network 3. Launch app 4. Verify Inter, Lora, JetBrains Mono render |
| Visual identity match (light/dark) | DS-06 | Visual comparison against brand guide | Side-by-side comparison of components vs CAUSA_identidade_visual.md |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
