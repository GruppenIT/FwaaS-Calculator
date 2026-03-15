# Requirements: CAUSA — Revisao UX/UI

**Defined:** 2026-03-15
**Core Value:** Interface que transmite seriedade juridica com modernidade — advogados confiam no sistema desde o primeiro contato visual

## v1 Requirements

Requirements para a revisao completa de UX/UI. Cada um mapeia para fases do roadmap.

### Design System

- [x] **DS-01**: Token system CSS completo com variaveis semanticas para cores, tipografia, espacamento, sombras e radius — corrigindo split @theme vs CSS vars
- [x] **DS-02**: Dark mode com 3 niveis de superficie distintos (background #0F0F1A / cards #1A1A2E / modais #22223A) e tokens semanticos dedicados
- [ ] **DS-03**: Componente Button refatorado conforme guia (Primary, Secondary, Danger, Ghost) com alturas 32/36/40px e hover states
- [ ] **DS-04**: Componente Input refatorado com estados de foco (border #2563A8 + shadow), erro (border #DC2626), e label posicionado conforme guia
- [ ] **DS-05**: Componente Modal refatorado com overlay rgba(0,0,0,0.4), largura 480-600px, border-radius 8px e suporte a AnimatePresence
- [x] **DS-06**: Componente Toast refatorado com variantes corretas (sucesso=verde-agua, erro=vermelho reservado, aviso=ambar, info=azul)
- [ ] **DS-07**: Componente ConfirmDialog refatorado usando Radix Dialog com focus trap e ARIA roles
- [x] **DS-08**: Componente Skeleton refatorado com animacao pulse alinhada aos tokens de cor
- [x] **DS-09**: Componente EmptyState refatorado com mensagens contextuais juridicas e icone Lucide
- [x] **DS-10**: Componente PageHeader refatorado com tipografia Inter 22px/700 e layout consistente (titulo + acoes)
- [ ] **DS-11**: Novo componente Badge para status pills (Ativo, Suspenso, Arquivado, Encerrado) com cores do sistema
- [ ] **DS-12**: Novo componente StatusDot para indicadores visuais de estado em listas
- [ ] **DS-13**: Novo componente Card com sombra, border e suporte a dark mode elevation
- [ ] **DS-14**: Novo componente DataTable reutilizavel com sort, hover row, click row, zebrado e suporte 1366x768
- [ ] **DS-15**: Novo componente Select acessivel via Radix Select com estilo conforme tokens
- [ ] **DS-16**: Novo componente Checkbox acessivel com estilo conforme tokens
- [ ] **DS-17**: Novo componente Textarea com estilo consistente aos Inputs
- [x] **DS-18**: Fontes Inter, Lora e JetBrains Mono self-hosted via Fontsource no bundle Electron (sem CDN)
- [x] **DS-19**: Todas as animacoes respeitam prefers-reduced-motion (WCAG AA)

### Layout

- [ ] **LY-01**: Sidebar redesenhada com agrupamento por secoes, labels Inter 11px/600 em caixa alta, item ativo com fundo azul 8%, hover com fundo off-white
- [ ] **LY-02**: Page headers consistentes em todas as 20 paginas com titulo Inter 22px/700, botoes de acao e breadcrumb quando aplicavel
- [ ] **LY-03**: Banner sticky de prazo critico no topo da area de conteudo quando existe prazo fatal (0-1 dia) — nao-dispensavel, cor vermelho reservado

### Dashboard

- [ ] **DASH-01**: KPI stat cards estilo Stripe com sparkline ou indicador de tendencia (±% vs mes anterior) para processos ativos, prazos da semana e honorarios pendentes
- [ ] **DASH-02**: Heat map de urgencia 2x2 grid: fatal-esta-semana / vence-este-mes / proximo / sem-prazo — com cores do sistema de 4 tiers
- [ ] **DASH-03**: Hook useChartTheme() que fornece cores dinamicas para Recharts baseado no tema atual (light/dark), eliminando hex hardcoded

### Listagens

- [ ] **LIST-01**: Numeros de processo em JetBrains Mono 13px em todas as listagens e detalhes (formato CNJ consistente)
- [ ] **LIST-02**: Countdown relativo de prazos nas linhas: "Hoje", "2 dias", "Proxima semana" com cor de urgencia do tier correspondente — data absoluta em tooltip
- [ ] **LIST-03**: Status badge inline em linhas de processo: pills coloridos para Ativo (azul), Suspenso (ambar), Arquivado (cinza), Encerrado (verde-agua)
- [ ] **LIST-04**: Linha inteira da tabela clicavel com hover highlight e focus ring acessivel (pointer cursor)
- [ ] **LIST-05**: Todas as listagens funcionam corretamente em 1366x768 sem scroll horizontal

### Detalhes

- [ ] **DET-01**: Pagina de detalhe do processo com layout em tabs: Dados Gerais / Prazos / Movimentacoes / Documentos / Financeiro / Tarefas — tabs URL-driven via React Router
- [ ] **DET-02**: Resumo financeiro inline na pagina de detalhe do cliente: total faturado, recebido, pendente com barra visual de progresso
- [ ] **DET-03**: CSS @media print para pagina de detalhe do processo — resumo limpo e imprimivel via dialogo de impressao do sistema

### Auth e Splash

- [ ] **AUTH-01**: Login page redesenhada em split-panel: painel esquerdo escuro com proposta de valor CAUSA + painel direito com formulario de login
- [ ] **AUTH-02**: Splash screen conforme guia: fundo #0F1829, logo CAUSA branco centralizado, tagline Lora 16px, barra de progresso azul 2px, versao no canto

### Animacoes

- [ ] **ANIM-01**: Modal abre com scale(0.95 → 1) + opacity(0 → 1) a partir do trigger (transform-origin), 180ms ease-out — com AnimatePresence para animacao de saida
- [ ] **ANIM-02**: Transicao entre paginas com opacity + translateY(4px → 0), 150ms ease-in-out — animar no render, nao no inicio da navegacao
- [ ] **ANIM-03**: Table rows aparecem com stagger de 20ms (cap 10 rows / 200ms total) no primeiro load da lista

### Acessibilidade

- [ ] **A11Y-01**: Contraste WCAG AA em ambos os temas (light e dark) para todos os textos e elementos interativos
- [ ] **A11Y-02**: Focus rings visiveis em todos os elementos interativos (botoes, inputs, links, rows de tabela)

## v2 Requirements

Deferidos para futuro release. Rastreados mas fora do roadmap atual.

### Interacao Avancada

- **INT-01**: Navegacao por teclado em tabelas (arrow keys, Enter para abrir, Esc para limpar busca)
- **INT-02**: Atalho N para criar novo registro na pagina de listagem ativa
- **INT-03**: Toggle de visibilidade de colunas em tabelas (processos e prazos)
- **INT-04**: Hover card com resumo do cliente ao passar mouse sobre nome em tabelas
- **INT-05**: Preferencia de ordenacao persistente em localStorage por tabela

### Visual Avancado

- **VIS-01**: Sidebar colapsavel para icon rail em 1024px
- **VIS-02**: Timeline de audit trail na pagina de detalhe do processo
- **VIS-03**: Sparklines reais com dados historicos nos KPI cards (requer snapshots)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mudancas em logica de negocio/backend | Escopo e somente visual — nenhuma alteracao em servicos, API ou banco |
| Redesign de rotas/navegacao | Manter estrutura de rotas atual do React Router |
| Novos modulos ou funcionalidades | Apenas melhorar o que ja existe |
| Redesign do logo/icone | Manter identidade visual existente |
| Mobile/responsive breakpoints | App e desktop-only (min 1366x768) |
| Custom title bar | Proibido pelo guia de identidade visual |
| Animacoes decorativas | Proibido pelo guia — toda animacao deve orientar o usuario |
| Vermelho como cor decorativa | Reservado exclusivamente para erro critico e prazo fatal |
| Onboarding tooltips/feature tours | Anti-feature — usuarios juridicos nao tem paciencia |
| Notification badges na sidebar | Anti-feature — cria loop de ansiedade |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 1 | Complete |
| DS-02 | Phase 1 | Complete |
| DS-03 | Phase 1 | Pending |
| DS-04 | Phase 1 | Pending |
| DS-05 | Phase 1 | Pending |
| DS-06 | Phase 1 | Complete |
| DS-07 | Phase 1 | Pending |
| DS-08 | Phase 1 | Complete |
| DS-09 | Phase 1 | Complete |
| DS-10 | Phase 1 | Complete |
| DS-11 | Phase 1 | Pending |
| DS-12 | Phase 1 | Pending |
| DS-13 | Phase 1 | Pending |
| DS-14 | Phase 1 | Pending |
| DS-15 | Phase 1 | Pending |
| DS-16 | Phase 1 | Pending |
| DS-17 | Phase 1 | Pending |
| DS-18 | Phase 1 | Complete |
| DS-19 | Phase 1 | Complete |
| LY-01 | Phase 2 | Pending |
| LY-02 | Phase 2 | Pending |
| LY-03 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| LIST-01 | Phase 3 | Pending |
| LIST-02 | Phase 3 | Pending |
| LIST-03 | Phase 3 | Pending |
| LIST-04 | Phase 3 | Pending |
| LIST-05 | Phase 3 | Pending |
| DET-01 | Phase 4 | Pending |
| DET-02 | Phase 4 | Pending |
| DET-03 | Phase 4 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| ANIM-01 | Phase 4 | Pending |
| ANIM-02 | Phase 4 | Pending |
| ANIM-03 | Phase 4 | Pending |
| A11Y-01 | Phase 4 | Pending |
| A11Y-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation — AUTH/ANIM/A11Y corrected from Phase 5 to Phase 4*
