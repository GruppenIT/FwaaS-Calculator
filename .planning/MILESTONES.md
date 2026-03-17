# Milestones

## v2.1 Interacao e Dados (Shipped: 2026-03-17)

**Phases completed:** 4 phases, 9 plans
**Timeline:** 2 days (2026-03-16 → 2026-03-17)
**Files modified:** 71 (9,713 insertions)
**Codebase LOC:** 31,783 (TS/TSX/CSS)

**Key accomplishments:**
- Demo seed CLI (`pnpm db:seed:demo`) populating 12+ entity types with realistic Brazilian legal data spanning 12 months
- Table keyboard navigation (arrow keys, Enter, Esc) and N shortcut for new records on all listing pages
- Column visibility toggles and persistent sort preferences via localStorage
- Client hover cards with summary popup on mouse-over in processos table
- Collapsible sidebar with 64px icon rail mode and responsive media query (<=1024px)
- Audit trail timeline on processo detail page combining movimentacoes and prazos chronologically
- KPI sparklines with real historical snapshot data (kpi_snapshots table + API endpoint + SVG component)

**Tech debt accepted:**
- Phase 6 VERIFICATION `human_needed` (runtime seed + visual confirmation)
- `eslint-disable @typescript-eslint/no-explicit-any` in seed-demo.ts (intentional Drizzle workaround)
- `processos-page.tsx` handleEdit hardcodes empty clienteId (pre-existing)
- prazosFatais sparkline empty until seed or 2+ days organic usage (expected behavior)
- Nyquist validation missing for all 4 phases (VALIDATION.md not created)

---

## v1.0 CAUSA Revisao UX/UI (Shipped: 2026-03-16)

**Phases completed:** 5 phases, 19 plans
**Timeline:** 10 days (2026-03-06 → 2026-03-16)
**Files modified:** 309 (57,187 insertions)
**Frontend LOC:** 18,390 (TSX/TS/CSS)

**Key accomplishments:**
- Complete design system with 15 components, semantic CSS token system, and self-hosted fonts (Inter, Lora, JetBrains Mono)
- Layout shell with redesigned sidebar (section grouping, user info footer) and fatal deadline banner with 5-min polling
- Stripe-style dashboard with 7 KPI stat cards, 2x2 urgency heat map, and dynamically themed Recharts charts
- Three listing pages (processos, clientes, prazos) migrated to reusable DataTable with PrazoCountdown, Badge, and 1366x768 support
- Processo detail with URL-driven tabs, cliente financial summary, split-panel login, and print stylesheet
- WCAG AA accessibility (contrast, focus rings), micro-animations (page transitions, row stagger, modal enter/exit), and cross-phase integration fixes

**Tech debt accepted:**
- 5 DS components (Select, Checkbox, Textarea, Card, StatusDot) built but not yet consumed by pages
- SUMMARY.md frontmatter requirements_completed arrays empty across all plans
- Nyquist validation non-compliant (all 4 VALIDATION.md files in draft status)

---

