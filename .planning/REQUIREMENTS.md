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

- [x] **INT-01**: Navegacao por teclado em tabelas (arrow keys para mover entre rows, Enter para abrir detalhe, Esc para limpar busca)
- [x] **INT-02**: Atalho N para criar novo registro na pagina de listagem ativa
- [x] **INT-03**: Toggle de visibilidade de colunas em tabelas (processos e prazos) com preferencia persistida em localStorage
- [x] **INT-04**: Hover card com resumo do cliente ao passar mouse sobre nome em tabelas de processos
- [x] **INT-05**: Preferencia de ordenacao persistente em localStorage por tabela

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
| INT-01 | Phase 7 | Complete |
| INT-02 | Phase 7 | Complete |
| INT-03 | Phase 7 | Complete |
| INT-04 | Phase 7 | Complete |
| INT-05 | Phase 7 | Complete |
| VIS-01 | Phase 8 | Pending |
| VIS-02 | Phase 8 | Complete |
| VIS-03 | Phase 8 | Pending |

**Coverage:**
- v2.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
