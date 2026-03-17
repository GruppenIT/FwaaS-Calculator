# Roadmap: CAUSA

## Milestones

- ✅ **v1.0 CAUSA Revisao UX/UI** — Phases 1-5 (shipped 2026-03-16)
- 🚧 **v2.1 Interacao e Dados** — Phases 6-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 CAUSA Revisao UX/UI (Phases 1-5) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: Design System Foundation (6/6 plans) — completed 2026-03-15
- [x] Phase 2: Layout Shell (2/2 plans) — completed 2026-03-15
- [x] Phase 3: Core Feature Screens (4/4 plans) — completed 2026-03-16
- [x] Phase 4: Detail Pages, Auth e Polish (6/6 plans) — completed 2026-03-16
- [x] Phase 5: Critical Integration Fixes (1/1 plan) — completed 2026-03-16

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### 🚧 v2.1 Interacao e Dados

**Milestone Goal:** Tornar o sistema testavel com dados realistas e adicionar interacoes avancadas (teclado, hover cards, sidebar colapsavel, sparklines)

- [ ] **Phase 6: Data Seed** - CLI que popula todas as entidades com dados falsos realistas e temporalmente distribuidos
- [x] **Phase 7: Table Interactions** - Navegacao por teclado, atalhos, visibilidade de colunas, hover cards e sort persistente (completed 2026-03-17)
- [ ] **Phase 8: Visual Enhancements** - Sidebar colapsavel, audit trail timeline e sparklines reais nos KPIs
- [ ] **Phase 9: Bug Fix, Verification & Tech Debt** - Correcao de bug de permissao, verificacao da Phase 7, atualizacao de docs e tech debt

## Phase Details

### Phase 6: Data Seed
**Goal**: Sistema pode ser demonstrado e testado com dados realistas que cobrem todos os cenarios de uso (urgencia, financeiro, temporal)
**Depends on**: Phase 5 (v1.0 shipped)
**Requirements**: SEED-01, SEED-02, SEED-03, SEED-04
**Success Criteria** (what must be TRUE):
  1. Running `pnpm db:seed:demo` populates the app with realistic data visible across all listing pages (processos, clientes, prazos)
  2. Dashboard KPI cards and charts show meaningful trends because seed data spans 12 months of temporal distribution
  3. The urgency heat map displays at least 1 fatal (red) and 3 urgent deadlines, exercising all 4 tiers of the urgency system
  4. Running the seed command twice produces the same result — no duplicate records appear in any listing
**Plans:** 2/2 plans executed (06-02 at human-verification checkpoint)
Plans:
- [x] 06-01-PLAN.md — Install faker, create seed-demo.ts with all entity factories and idempotent clear logic
- [x] 06-02-PLAN.md — Verify idempotency, data counts, urgency tiers, and visual confirmation in the app (checkpoint: human must run seed + verify UI)

### Phase 7: Table Interactions
**Goal**: Users navigate and manipulate tables efficiently using keyboard and mouse, with preferences that persist across sessions
**Depends on**: Phase 6 (seed data makes interaction testing meaningful)
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05
**Success Criteria** (what must be TRUE):
  1. User can navigate table rows with arrow keys, open a record with Enter, and dismiss search with Esc — without touching the mouse
  2. Pressing N on any listing page opens the creation form for that entity type
  3. User can toggle column visibility in processos and prazos tables, and the preference survives page reload (localStorage)
  4. Hovering over a client name in the processos table shows a card with client summary (without navigating away)
  5. User can sort any table column, leave the page, return, and find the same sort order applied automatically
**Plans:** 2/2 plans complete
Plans:
- [x] 07-01-PLAN.md — Create useTablePreferences hook, enhance DataTable with arrow keys + hiddenColumns, build ColumnVisibilityToggle and ClientHoverCard components
- [x] 07-02-PLAN.md — Wire all interactions into ProcessosPage, PrazosPage, and ClientesPage with keyboard shortcuts and visual verification

### Phase 8: Visual Enhancements
**Goal**: Interface adapts to smaller screens, shows process history visually, and displays real trend data in dashboard KPIs
**Depends on**: Phase 6 (sparklines require historical seed data)
**Requirements**: VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):
  1. On screens 1024px or narrower, sidebar automatically collapses to an icon rail; on wider screens, user can toggle collapse manually
  2. Processo detail page shows a chronological timeline combining movimentacoes and prazos, making the process history scannable at a glance
  3. Dashboard KPI stat cards display sparkline charts reflecting actual historical data from the last 30 days of snapshots
**Plans:** 3/3 plans complete
Plans:
- [x] 08-01-PLAN.md — Collapsible sidebar with icon rail mode and responsive media query
- [x] 08-02-PLAN.md — Chronological timeline component on processo detail page
- [x] 08-03-PLAN.md — KPI sparklines with snapshot table, API endpoint, seed data, and dashboard wiring

### Phase 9: Bug Fix, Verification & Tech Debt
**Goal**: Fechar todos os gaps identificados no audit v2.1 — corrigir bug de permissao, verificar Phase 7, atualizar docs e resolver tech debt
**Depends on**: Phase 8 (all prior phases complete)
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05, VIS-01, VIS-03
**Gap Closure:** Closes gaps from v2.1 milestone audit
**Success Criteria** (what must be TRUE):
  1. PrazosPage N shortcut and header button use correct prazos permission guards (not processos)
  2. Phase 7 has a VERIFICATION.md confirming all 5 INT requirements pass
  3. REQUIREMENTS.md checkboxes for VIS-01 and VIS-03 are checked
  4. Sparkline and ProcessoTimeline exported from UI barrel index.ts
  5. prazosFatais in api-server.ts queries actual fatal prazo count instead of hardcoded 0
**Plans:** 2 plans
Plans:
- [x] 09-01-PLAN.md — Fix permission bug, implement prazosFatais query, add UI barrel exports
- [ ] 09-02-PLAN.md — Create Phase 7 VERIFICATION.md and update REQUIREMENTS.md checkboxes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Design System Foundation | v1.0 | 6/6 | Complete | 2026-03-15 |
| 2. Layout Shell | v1.0 | 2/2 | Complete | 2026-03-15 |
| 3. Core Feature Screens | v1.0 | 4/4 | Complete | 2026-03-16 |
| 4. Detail Pages, Auth e Polish | v1.0 | 6/6 | Complete | 2026-03-16 |
| 5. Critical Integration Fixes | v1.0 | 1/1 | Complete | 2026-03-16 |
| 6. Data Seed | v2.1 | 2/2 | Checkpoint | - |
| 7. Table Interactions | v2.1 | 2/2 | Complete | 2026-03-17 |
| 8. Visual Enhancements | v2.1 | 3/3 | Complete | 2026-03-17 |
| 9. Bug Fix, Verification & Tech Debt | v2.1 | 1/2 | In Progress | - |
