# Requirements: CAUSA — Interacao e Dados

**Defined:** 2026-03-16
**Core Value:** Interface que transmite seriedade juridica com modernidade — advogados confiam no sistema desde o primeiro contato visual

## v2.1 Requirements

Requirements para seed de dados, interacoes avancadas e melhorias visuais. Cada um mapeia para fases do roadmap.

### Data Seed

- [ ] **SEED-01**: CLI `pnpm db:seed:demo` popula todas as entidades com dados falsos realistas (clientes PF/PJ, processos com CNJ, prazos com distribuicao temporal, honorarios com parcelas, movimentacoes, tarefas, agenda, documentos, despesas, contatos, timesheets)
- [ ] **SEED-02**: Seed gera dados temporalmente distribuidos nos ultimos 12 meses para alimentar sparklines e graficos de tendencia
- [ ] **SEED-03**: Seed cria pelo menos 1 prazo fatal (0-1 dia) e 3 prazos urgentes para validar o sistema de urgencia de 4 tiers
- [ ] **SEED-04**: Seed e idempotente — rodar duas vezes nao duplica dados (limpa antes de inserir)

### Interacao Avancada

- [ ] **INT-01**: Navegacao por teclado em tabelas (arrow keys para mover entre rows, Enter para abrir detalhe, Esc para limpar busca)
- [ ] **INT-02**: Atalho N para criar novo registro na pagina de listagem ativa
- [ ] **INT-03**: Toggle de visibilidade de colunas em tabelas (processos e prazos) com preferencia persistida em localStorage
- [ ] **INT-04**: Hover card com resumo do cliente ao passar mouse sobre nome em tabelas de processos
- [ ] **INT-05**: Preferencia de ordenacao persistente em localStorage por tabela

### Visual Avancado

- [ ] **VIS-01**: Sidebar colapsavel para icon rail em telas <= 1024px ou via toggle manual
- [ ] **VIS-02**: Timeline de audit trail na pagina de detalhe do processo (movimentacoes + prazos em ordem cronologica)
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
| SEED-01 | — | Pending |
| SEED-02 | — | Pending |
| SEED-03 | — | Pending |
| SEED-04 | — | Pending |
| INT-01 | — | Pending |
| INT-02 | — | Pending |
| INT-03 | — | Pending |
| INT-04 | — | Pending |
| INT-05 | — | Pending |
| VIS-01 | — | Pending |
| VIS-02 | — | Pending |
| VIS-03 | — | Pending |

**Coverage:**
- v2.1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12 ⚠️

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
