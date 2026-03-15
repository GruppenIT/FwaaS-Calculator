# CAUSA — Revisao UX/UI

## What This Is

Revisao completa da experiencia visual (UX/UI) do CAUSA, um ERP juridico on-premise (Electron + React) para escritorios de advocacia brasileiros. O objetivo e transformar uma interface funcional mas datada em um produto visualmente profissional, moderno e confiavel — inspirado na estetica de Stripe/Vercel, com gradientes sutis, micro-animacoes e cards com profundidade.

## Core Value

A interface deve transmitir seriedade juridica combinada com modernidade, fazendo advogados confiarem no sistema desde o primeiro contato visual — sem parecer amador, sem parecer generico.

## Requirements

### Validated

<!-- Capacidades existentes no codebase atual -->

- ✓ Dashboard com metricas e graficos (recharts) — existing
- ✓ Gestao de processos judiciais (listagem + detalhe) — existing
- ✓ Gestao de clientes (listagem + detalhe) — existing
- ✓ Controle de prazos processuais — existing
- ✓ Agenda — existing
- ✓ Financeiro (honorarios) — existing
- ✓ Despesas — existing
- ✓ Documentos — existing
- ✓ Tarefas — existing
- ✓ Timesheet — existing
- ✓ Contatos — existing
- ✓ Conectores com tribunais (PJe, e-SAJ) — existing
- ✓ Integracoes externas — existing
- ✓ RBAC com 6 papeis — existing
- ✓ Autenticacao JWT (login/refresh) — existing
- ✓ Setup wizard (topologia solo/escritorio) — existing
- ✓ Dark mode basico — existing
- ✓ Auto-update via electron-updater — existing
- ✓ Backup com indicador visual — existing
- ✓ Busca global — existing
- ✓ Sidebar fixa de navegacao — existing
- ✓ Splash screen — existing
- ✓ Componentes base: Button, Input, Modal, Toast, ConfirmDialog, Skeleton, EmptyState, PageHeader — existing

### Active

<!-- Escopo desta revisao UX/UI -->

- [ ] Refatorar design system completo (cores, tipografia, espacamento, sombras) alinhado ao guia de identidade visual CAUSA
- [ ] Implementar dark mode de alta qualidade (nao apenas inversao de cores — superficies, contrastes e hierarquia pensados para dark)
- [ ] Redesenhar dashboard com hierarquia visual clara (prazos criticos, movimentacoes, KPIs)
- [ ] Redesenhar listagens (processos, clientes, prazos) com densidade de informacao adequada
- [ ] Redesenhar paginas de detalhe (processo, cliente) com layout profissional
- [ ] Redesenhar sidebar com agrupamento por secoes, estados ativos e hover conforme guia
- [ ] Redesenhar login page com estetica profissional
- [ ] Refatorar todos os componentes UI base (Button, Input, Modal, Toast, etc.) para seguir tokens do guia
- [ ] Implementar sistema de alertas visuais por urgencia de prazo (informativo/atencao/urgente/fatal)
- [ ] Adicionar micro-animacoes com proposito (transicoes de pagina, hover, modais) conforme guia
- [ ] Revisar formularios (espacamento, labels, estados de erro/foco)
- [ ] Revisar tabelas (zebrado, bordas, responsividade em 1366x768)
- [ ] Revisar empty states com mensagens adequadas para advogados
- [ ] Redesenhar splash screen conforme especificacao do guia
- [ ] Revisar page headers para consistencia tipografica
- [ ] Garantir acessibilidade WCAG AA nos dois temas
- [ ] Documentar componentes e tokens CSS atualizados

### Out of Scope

- Mudancas em logica de negocio/backend — somente visual
- Redesign de navegacao/rotas — manter estrutura atual
- Novos modulos ou funcionalidades — apenas melhorar o que existe
- Redesign do logo/icone — manter identidade visual existente
- Mobile/responsive — app e desktop-only (min 1366x768)

## Context

- **Stack frontend**: React 19 + TypeScript + Tailwind CSS 4 + Vite 7 + Lucide Icons
- **Plataforma**: Electron 33 para Windows (on-premise)
- **Telas existentes**: 20 paginas (dashboard, processos, clientes, prazos, agenda, financeiro, despesas, documentos, tarefas, timesheet, contatos, conectores, configuracoes, integracoes, login, setup, server-error, usuarios)
- **Componentes UI base**: 13 componentes em `components/ui/` + 3 em `components/layout/`
- **Guia de identidade visual**: documento completo com paleta, tipografia, tokens CSS, regras de componentes, animacoes e proibicoes — deve ser seguido como lei
- **Resolucao alvo**: 1366x768 (notebook padrao de escritorios juridicos brasileiros)
- **Publico**: advogados, estagiarios, secretarias, socios — perfis nao-tecnicos
- **Referencia estetica**: Stripe/Vercel — gradientes sutis, micro-animacoes, cards com profundidade

## Constraints

- **Identidade visual**: Seguir rigorosamente o documento `CAUSA_identidade_visual.md` (paleta, tipografia, tokens, proibicoes)
- **Vermelho reservado**: EXCLUSIVO para prazo fatal, erro critico, falha de conector — nunca decorativo
- **Fontes offline**: Inter, Lora, JetBrains Mono devem ser self-hosted (sem CDN em runtime)
- **Title bar nativa**: Nao customizar — manter title bar do Windows
- **Resolucao minima**: 1366x768 a 100% de escala
- **Preto puro proibido**: Usar Grafite `#1E1E2E` para texto, nunca `#000000`
- **Gradientes no logo proibidos**: Logo sempre em cor solida
- **Animacoes com proposito**: Nenhuma animacao puramente decorativa
- **Icones Lucide only**: Nao misturar bibliotecas de icones

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dark mode com qualidade igual ao light | Advogados trabalham muitas horas; dark mode nao pode ser "cidadao de segunda classe" | — Pending |
| Estetica Stripe/Vercel como referencia | Combina profissionalismo com modernidade sem ser corporativo demais | — Pending |
| Escopo completo (todas as telas) | Interface parcialmente atualizada gera inconsistencia visual pior que antes | — Pending |
| Respeitar guia de identidade visual como lei | Documento ja aprovado pela equipe fundadora — nao renegociar decisoes de design | — Pending |

---
*Last updated: 2026-03-15 after initialization*
