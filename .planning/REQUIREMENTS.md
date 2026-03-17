# Requirements: CAUSA — Interacao e Dados

**Defined:** 2026-03-16
**Core Value:** Interface que transmite seriedade juridica com modernidade — advogados confiam no sistema desde o primeiro contato visual

## v2.1 Requirements

Requirements para seed de dados, interacoes avancadas e melhorias visuais. Cada um mapeia para fases do roadmap.

### Data Seed

- [x] **SEED-01**: CLI `pnpm db:seed:demo` popula todas as entidades com dados falsos realistas (clientes PF/PJ, processos com CNJ, prazos com distribuicao temporal, honorarios com parcelas, movimentacoes, tarefas, agenda, documentos, despesas, contatos, timesheets)
- [x] **SEED-02**: Seed gera dados temporalmente distribuidos nos ultimos 12 meses para alimentar sparklines e graficos de tendencia
- [x] **SEED-03**: Seed cria pelo menos 1 prazo fatal (0-1 dia) e 3 prazos urgentes para validar o sistema de urgencia de 4 tiers
- [x] **SEED-04**: Seed e idempotente — rodar duas vezes nao duplica dados (limpa antes de inserir)

### Interacao Avancada

- [ ] **INT-01**: Navegacao por teclado em tabelas (arrow keys para mover entre rows, Enter para abrir detalhe, Esc para limpar busca)
- [ ] **INT-02**: Atalho N para criar novo registro na pagina de listagem ativa
- [ ] **INT-03**: Toggle de visibilidade de colunas em tabelas (processos e prazos) com preferencia persistida em localStorage
- [ ] **INT-04**: Hover card com resumo do cliente ao passar mouse sobre nome em tabelas de processos
- [ ] **INT-05**: Preferencia de ordenacao persistente em localStorage por tabela

### Visual Avancado

- [ ] **VIS-01**: Sidebar colapsavel para icon rail em telas <= 1024px ou via toggle manual
- [x] **VIS-02**: Timeline de audit trail na pagina de detalhe do processo (movimentacoes + prazos em ordem cronologica)
- [ ] **VIS-03**: Sparklines reais com dados historicos nos KPI stat cards do dashboard (requer snapshots dos ultimos 30 dias)

## Future Requirements

Nenhum deferido neste milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mudancas em logica de negocio/backend alem do seed | Escopo e seed + UI — servicos existentes nao mudam |
| Mobile/responsive | App e desktop-only (min 1366x768) |
| Custom title bar | Proibido pelo guia de identidade visual |
| Testes E2E automatizados | Fora do escopo — validacao manual |
| Internacionalizacao | App e pt-BR only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEED-01 | Phase 6 | Complete |
| SEED-02 | Phase 6 | Complete |
| SEED-03 | Phase 6 | Complete |
| SEED-04 | Phase 6 | Complete |
| INT-01 | Phase 9 (gap closure) | Pending |
| INT-02 | Phase 9 (gap closure) | Pending |
| INT-03 | Phase 9 (gap closure) | Pending |
| INT-04 | Phase 9 (gap closure) | Pending |
| INT-05 | Phase 9 (gap closure) | Pending |
| VIS-01 | Phase 9 (gap closure) | Pending |
| VIS-02 | Phase 8 | Complete |
| VIS-03 | Phase 9 (gap closure) | Pending |

**Coverage:**
- v2.1 requirements: 12 total
- Satisfied: 5 (SEED-01..04, VIS-02)
- Pending (gap closure Phase 9): 7 (INT-01..05, VIS-01, VIS-03)
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
