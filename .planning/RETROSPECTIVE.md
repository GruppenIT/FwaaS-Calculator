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

## Milestone: v2.1 — Interacao e Dados

**Shipped:** 2026-03-17
**Phases:** 4 | **Plans:** 9

### What Was Built
- Demo seed CLI (`pnpm db:seed:demo`) populating 12+ entity types with realistic Brazilian legal data across 12 months
- Table keyboard navigation (arrow keys, Enter, Esc) and N shortcut for new records on all listing pages
- Column visibility toggles and persistent sort preferences via localStorage (useTablePreferences hook)
- Client hover cards with Radix HoverCard showing summary popup on mouse-over
- Collapsible sidebar with 64px icon rail mode and responsive media query (<=1024px)
- Audit trail timeline on processo detail page combining movimentacoes and prazos chronologically
- KPI sparklines with kpi_snapshots table, API endpoint, and SVG component wired into dashboard

### What Worked
- Phase 9 gap closure pattern (from v1.0) worked again — audit found permission bug, missing query, and doc gaps that phase-level work missed
- Quick task workflow for tech debt cleanup avoided full phase ceremony for documentation fixes
- useTablePreferences hook centralizing localStorage persistence prevented scattered storage logic
- Seed-first approach (Phase 6 before interactions) made all subsequent testing meaningful

### What Was Inefficient
- SUMMARY frontmatter requirements_completed still left empty (same v1.0 debt carried forward — quick task fixed it retroactively)
- Nyquist validation still not adopted — all 8 phases across 2 milestones lack VALIDATION.md
- Node 24 + better-sqlite3 incompatibility discovered late (Phase 06-02) — requires Node 22 for seed CLI
- Phase 8 VERIFICATION missing from initial execution — had to be created in Phase 9

### Patterns Established
- Arrow key nav on tbody (not individual rows) to avoid handleRowKeyDown conflicts
- ClientHoverCard useRef cache for fetch deduplication — subsequent hovers instant
- Keyboard shortcut guard: check isInput + showModal before handling document-level keydown
- kpi_snapshots table pattern for sparkline historical data (vs computed aggregations)
- Permission guard pattern: `can('entity:criar') || can('entity:editar')` for N shortcut

### Key Lessons
1. SUMMARY frontmatter debt compounds — must be filled during execution, not retroactively
2. Milestone audit is now a verified essential step (caught real bugs in both v1.0 and v2.1)
3. Seed data should be the first phase in any milestone that involves UI interaction work
4. Quick task workflow is effective for documentation/cosmetic cleanup without overhead

### Cost Observations
- Model mix: ~70% opus, ~30% sonnet (balanced profile)
- Notable: 2-day turnaround for 4 phases (seed + interactions + visuals + gap closure)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 19 | First milestone — established phase/plan/verify/audit workflow |
| v2.1 | 4 | 9 | Added quick task workflow, gap closure pattern confirmed |

### Top Lessons (Verified Across Milestones)

1. **Milestone audit catches real bugs** — confirmed in both v1.0 (integration gaps) and v2.1 (permission bug, missing query)
2. **SUMMARY frontmatter debt compounds** — unfilled in v1.0, still unfilled in v2.1, required retroactive quick task to fix
3. **Nyquist validation consistently skipped** — 0/9 phases across 2 milestones have VALIDATION.md
