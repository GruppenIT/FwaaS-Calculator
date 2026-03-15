---
phase: 02
slug: layout-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via root vitest.config.ts) |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `cd packages/app-desktop && pnpm typecheck` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/app-desktop && pnpm typecheck`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + manual visual verification
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LY-01 | static (tsc) | `cd packages/app-desktop && pnpm typecheck` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | LY-01 | manual-only | N/A — visual token audit | N/A | ⬜ pending |
| 02-02-01 | 02 | 1 | LY-02 | static (tsc) | `cd packages/app-desktop && pnpm typecheck` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 1 | LY-02 | manual-only | N/A — visual header consistency | N/A | ⬜ pending |
| 02-03-01 | 03 | 2 | LY-03 | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | LY-03 | manual-only | N/A — banner visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-desktop/src/lib/fatal-deadlines.test.ts` — unit test for `getFatalDeadlineSummary` date arithmetic (LY-03)

*Pure logic function (no DOM), testable in Vitest node environment. Config pattern `packages/*/src/**/*.test.ts` includes this automatically.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar renders user info (email + role) in footer | LY-01 | No React test env configured | Verify sidebar footer shows user email and role label after login |
| Sidebar active/hover states use correct tokens | LY-01 | Visual verification | Click nav items, verify blue 8% active bg and off-white hover |
| PageHeader breadcrumbs render on detail pages | LY-02 | No React test env configured | Navigate to processo/cliente detail, verify breadcrumb links |
| All 20 pages show consistent headers | LY-02 | Cross-page visual audit | Visit each page, verify Inter 22px/700 title + aligned actions |
| Fatal deadline banner appears when fatal prazos exist | LY-03 | Requires seeded data + visual check | Create prazo with dataFatal = today, verify red sticky banner |
| Banner differentiates hoje/amanhã | LY-03 | Content format verification | Create prazos for today and tomorrow, verify both lines show |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
