# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — CAUSA Revisao UX/UI

**Shipped:** 2026-03-16
**Phases:** 5 | **Plans:** 19

### What Was Built
- Complete design system (15 components, semantic CSS tokens, self-hosted fonts)
- Layout shell (sidebar sections, fatal deadline banner, consistent page headers)
- Stripe-style dashboard (KPI stat cards, urgency heat map, themed charts)
- Three listing pages migrated to reusable DataTable with tier-based countdowns
- Detail pages (URL-driven tabs, financial summary, print stylesheet)
- Auth polish (split-panel login, splash screen refresh)
- Micro-animations (page transitions, modal enter/exit, row stagger)
- WCAG AA accessibility (contrast, focus rings)

### What Worked
- Strict dependency ordering (tokens → components → layout → pages) prevented "half-redesigned" visual inconsistency
- Phase-level verification with automated checks caught issues early
- Milestone audit after all phases identified 2 cross-phase integration gaps invisible to phase-level checks
- Phase 5 gap closure pattern effectively addressed audit findings
- Yolo mode enabled fast iteration without unnecessary confirmation gates

### What Was Inefficient
- SUMMARY.md frontmatter requirements_completed arrays left empty across all 18 plans — metadata gap makes automated traceability harder
- Nyquist validation deferred (all 4 VALIDATION.md files draft) — automated test coverage not established
- 5 DS components built but never consumed (Select, Checkbox, Textarea, Card, StatusDot) — premature implementation
- Barrel export created in Phase 1 but only adopted by 1 consumer in Phase 5 — adoption should have been enforced earlier

### Patterns Established
- `@theme inline` block for Tailwind CSS 4 opacity modifiers — hex only in `:root`/`.dark`
- UTC-safe date arithmetic via `Date.UTC()` — never `setHours(0,0,0,0)`
- DataTable fully controlled (parent manages sort state)
- Native CSS animation for table row stagger (motion.tr breaks table layout)
- `data-sidebar` / `data-print-section` attribute contracts between CSS and components
- `isFirstLoad` state pattern for controlled animation props

### Key Lessons
1. Cross-phase integration gaps are invisible to phase-level verification — milestone audits are essential before shipping
2. Building components speculatively (without consumers) creates adoption debt — only build what's immediately needed
3. Strict TypeScript (exactOptionalPropertyTypes, noUncheckedIndexedAccess) requires specific patterns (conditional spread, null-safe indexing) that should be documented upfront

### Cost Observations
- Model mix: ~80% opus, ~20% sonnet (balanced profile)
- Notable: 10-day turnaround for complete 20-page UX/UI redesign across 5 phases

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 19 | First milestone — established phase/plan/verify/audit workflow |

### Top Lessons (Verified Across Milestones)

1. (First milestone — lessons to verify in future milestones)
