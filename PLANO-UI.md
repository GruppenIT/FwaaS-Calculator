# Plano de Implementação UI — CAUSA ERP

## Fase 1 — Infraestrutura de UX ✅
- [x] Componente Toast / sistema de notificações
- [x] Componente ConfirmDialog (confirmação de exclusão)
- [x] Componente Modal genérico com suporte a edição
- [x] Loading skeletons para tabelas

## Fase 2 — CRUD Completo (editar + excluir com feedback) ✅
- [x] Modal de edição de Cliente
- [x] Modal de edição de Processo
- [x] Modal de edição de Prazo (campos completos + status)
- [x] Modal de edição de Honorário (campos completos + status)
- [x] Exclusão com confirmação em todos os CRUDs
- [x] Toast de sucesso/erro em todas as operações

## Fase 3 — Views de Detalhe e Vínculos ✅
- [x] Tela de detalhe do Processo (dados + prazos + movimentações + honorários vinculados)
- [x] Tela de detalhe do Cliente (dados + processos vinculados)
- [x] Movimentações visíveis no frontend (listagem na tela de detalhe do processo)
- [x] Links de navegação: CNJ clicável na lista, nome do cliente clicável
- [x] Rotas /app/processos/:id e /app/clientes/:id

## Fase 4 — Dashboard Funcional
- [ ] Prazos vencendo hoje/semana no dashboard
- [ ] Resumo financeiro (pendente/recebido/inadimplente do mês)
- [ ] Contadores (total de processos ativos, clientes, prazos pendentes)
- [ ] Alertas visuais para prazos urgentes

## Fase 5 — Filtros, Busca e Relatórios
- [ ] Filtros avançados em processos (status, área, tribunal, período)
- [ ] Filtros por período em honorários
- [ ] Busca global (barra no header)
- [ ] Exportação CSV básica (clientes, processos, honorários)
