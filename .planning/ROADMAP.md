# Roadmap: CAUSA — Revisao UX/UI

## Overview

A revisao parte de uma base funcional — tokens, 13 componentes UI, dark mode e layout shell ja existem. O trabalho e auditar, corrigir e estender essa base em ordem de dependencia estrita: tokens primeiro, depois primitivos, depois layout, depois paginas. Cada fase entrega uma camada completa antes que a proxima comece, evitando o efeito "redesign parcial" onde o app parece pior no meio do processo do que antes de comecar.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Design System Foundation** - Tokens corrigidos, fontes self-hosted e todos os componentes primitivos redesenhados (completed 2026-03-15)
- [x] **Phase 2: Layout Shell** - Sidebar, AppLayout e banner de prazo critico consistentes em todas as paginas (completed 2026-03-15)
- [x] **Phase 3: Core Feature Screens** - Dashboard e listagens redesenhados com hierarquia de urgencia e dados reais (completed 2026-03-16)
- [ ] **Phase 4: Detail Pages, Auth e Polish** - Paginas de detalhe, login, splash e micro-animacoes finalizados

## Phase Details

### Phase 1: Design System Foundation
**Goal**: Todos os tokens CSS estao corretos e semanticos, fontes funcionam offline no build Electron, e cada componente primitivo segue o guia de identidade visual — tornando todas as camadas subsequentes consequencias automaticas da foundation
**Depends on**: Nothing (first phase)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07, DS-08, DS-09, DS-10, DS-11, DS-12, DS-13, DS-14, DS-15, DS-16, DS-17, DS-18, DS-19
**Success Criteria** (what must be TRUE):
  1. Alterar um token semantico em globals.css (ex: `--color-surface`) reflete imediatamente em todos os componentes que o usam, tanto no tema light quanto no dark, sem nenhuma alteracao adicional
  2. O app carrega Inter, Lora e JetBrains Mono corretamente em um build Electron empacotado sem conexao com internet, com fallback visivel ausente
  3. Button, Input, Modal, Toast, ConfirmDialog, Skeleton, EmptyState e PageHeader renderizam identicos ao guia de identidade visual em light e dark — incluindo hover states, focus rings e estados de erro
  4. Os novos componentes Badge, StatusDot, Card, DataTable, Select, Checkbox e Textarea existem e sao importaveis via barrel export em `components/ui/index.ts`
  5. Nenhum arquivo de componente contem hex hardcoded (`#`) nem classes `causa-danger` fora dos contextos permitidos (prazo fatal, erro critico, falha de conector) — verificavel via ESLint
**Plans:** 6/6 plans complete

Plans:
- [ ] 01-01-PLAN.md — Tokens, fonts, ESLint hex rule, reduced-motion
- [ ] 01-02-PLAN.md — Refactor Button, Input, Modal (Radix), ConfirmDialog
- [ ] 01-03-PLAN.md — Audit Toast, Skeleton, EmptyState, PageHeader
- [ ] 01-04-PLAN.md — New components: Badge, StatusDot, Card, Select, Checkbox, Textarea
- [ ] 01-05-PLAN.md — New component: DataTable (sort, row click, zebra, responsive)
- [ ] 01-06-PLAN.md — Barrel export index.ts and full phase verification

### Phase 2: Layout Shell
**Goal**: Sidebar redesenhada e AppLayout com banner de prazo critico estao corretos em todas as 20 paginas antes de qualquer redesign de pagina individual
**Depends on**: Phase 1
**Requirements**: LY-01, LY-02, LY-03
**Success Criteria** (what must be TRUE):
  1. A sidebar exibe itens agrupados por secao com labels Inter 11px/600 em caixa alta, item ativo com fundo azul 8%, hover com fundo off-white — e a ordem dos itens de navegacao permanece identica a antes
  2. Todas as 20 paginas exibem page headers com titulo Inter 22px/700 e botoes de acao alinhados conforme o guia, sem nenhuma pagina usando o header antigo
  3. Quando existe um prazo com tier "fatal" (0-1 dia), um banner vermelho sticky aparece no topo da area de conteudo em todas as paginas, nao-dispensavel pelo usuario
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Sidebar user info footer + token audit, PageHeader breadcrumb prop + detail page migration
- [ ] 02-02-PLAN.md — DeadlineBanner component + polling hook + API function + AppLayout integration

### Phase 3: Core Feature Screens
**Goal**: Dashboard e listagens (processos, clientes, prazos) redesenhados com o sistema de urgencia de 4 tiers, countdowns relativos e graficos tematizados — as paginas de maior frequencia de uso entregam a promessa visual do produto
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, LIST-01, LIST-02, LIST-03, LIST-04, LIST-05
**Success Criteria** (what must be TRUE):
  1. O dashboard exibe KPI stat cards estilo Stripe com indicadores de tendencia e um heat map 2x2 de urgencia de prazos — os graficos Recharts mudam de cores corretamente ao alternar entre light e dark mode sem nenhum hex hardcoded
  2. Em qualquer listagem de prazos, cada linha mostra countdown relativo ("Hoje", "2 dias", "Proxima semana") na cor do tier de urgencia correspondente, e hover sobre o countdown exibe a data absoluta em tooltip
  3. Em listagens de processos, cada linha exibe o numero do processo em JetBrains Mono 13px e um status badge colorido (Ativo=azul, Suspenso=ambar, Arquivado=cinza, Encerrado=verde-agua), e clicar em qualquer parte da linha navega para o detalhe
  4. Todas as listagens funcionam sem scroll horizontal em uma janela 1366x768 a 100% de escala
**Plans:** 4/4 plans complete

Plans:
- [ ] 03-01-PLAN.md — Utility hooks and components: useChartTheme, PrazoCountdown, UrgencyHeatMap
- [ ] 03-02-PLAN.md — Dashboard rewrite: Stripe-style StatCards + UrgencyHeatMap + chart theming
- [ ] 03-03-PLAN.md — Listing migrations: processos, prazos, clientes to DataTable
- [ ] 03-04-PLAN.md — Full verification + visual checkpoint

### Phase 4: Detail Pages, Auth e Polish
**Goal**: Paginas de detalhe, login e splash completam a revisao visual com layouts profissionais e micro-animacoes com proposito — o app atinge qualidade visual Stripe/Vercel do primeiro clique ao ultimo
**Depends on**: Phase 3
**Requirements**: DET-01, DET-02, DET-03, AUTH-01, AUTH-02, ANIM-01, ANIM-02, ANIM-03, A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. A pagina de detalhe do processo exibe tabs URL-driven (Dados Gerais / Prazos / Movimentacoes / Documentos / Financeiro / Tarefas) — navegar diretamente para a URL de uma tab abre a tab correta, e o browser back/forward navega entre tabs
  2. A pagina de detalhe do cliente exibe resumo financeiro inline com total faturado, recebido e pendente com barra visual de progresso, e imprimir a pagina de detalhe do processo via dialogo do sistema gera um layout limpo sem sidebar nem navegacao
  3. A login page usa layout split-panel com painel esquerdo escuro + proposta de valor e painel direito com formulario, e a splash screen exibe fundo #0F1829, logo branco centralizado, tagline em Lora 16px e barra de progresso azul 2px
  4. Modais abrem com animacao scale(0.95→1) + opacity em 180ms e fecham com AnimatePresence; transicoes de pagina usam opacity + translateY(4px→0) em 150ms; rows de tabela aparecem com stagger de 20ms no primeiro load (cap 10 rows)
  5. Todos os textos e elementos interativos passam em contraste WCAG AA em ambos os temas, e todos os elementos interativos (botoes, inputs, links, rows) exibem focus ring visivel ao navegar por teclado
**Plans:** 6 plans (5 executed + 1 gap closure)

Plans:
- [ ] 04-01-PLAN.md — Processo detail tabs (URL-driven via useSearchParams)
- [ ] 04-02-PLAN.md — Login split-panel + splash screen refresh
- [ ] 04-03-PLAN.md — Cliente financial summary + print stylesheet
- [ ] 04-04-PLAN.md — Page transitions + row stagger + modal verification
- [ ] 04-05-PLAN.md — WCAG AA contrast audit + focus rings + visual checkpoint
- [ ] 04-06-PLAN.md — Gap closure: print sidebar hiding (DET-03) + row stagger wiring (ANIM-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design System Foundation | 6/6 | Complete   | 2026-03-15 |
| 2. Layout Shell | 2/2 | Complete   | 2026-03-15 |
| 3. Core Feature Screens | 4/4 | Complete   | 2026-03-16 |
| 4. Detail Pages, Auth e Polish | 5/6 | In Progress|  |
