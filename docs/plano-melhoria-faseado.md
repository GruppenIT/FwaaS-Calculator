# CAUSA — Plano de Melhoria Faseado (AS-IS → TO-BE)

Baseado na análise comparativa entre a [arquitetura atual (AS-IS)](./arquitetura-tecnica.md) e o [documento TO-BE](./causa-tobe-arquitetura.docx).

---

## Resumo Executivo

| Indicador | AS-IS | TO-BE | Delta |
|-----------|:-----:|:-----:|:-----:|
| Campos totais | ~73 | ~253 | +180 |
| Módulos com CRUD | 7 | 13 | +6 |
| Permissões RBAC | 18 | 34 | +16 |
| Tabelas no banco | 12 | 17 | +5 novas |

O plano divide a evolução em **4 fases** priorizando: (1) enriquecimento do que já existe, (2) módulos novos essenciais, (3) módulos complementares, (4) analytics e automação.

---

## Fase 1 — Enriquecimento do MVP (módulos existentes)

> **Objetivo:** Adicionar campos NOVO e ENRIQUECIDO aos módulos que já possuem CRUD completo.
> Nenhuma tabela nova. Migrations aditivas (ADD COLUMN). Sem quebra de API.

### 1.1 Clientes — +18 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.1.1 | Migration: adicionar colunas à tabela `clientes` | Backend | `nomeSocial`, `rg`, `rgOrgaoEmissor`, `dataNascimento`, `nacionalidade`, `estadoCivil`, `profissao`, `emailSecundario`, `telefoneSecundario`, `whatsapp`, `enderecoComercial`, `observacoes`, `origemCaptacao`, `indicadoPor`, `statusCliente`, `dataContrato`, `contatoPreferencial`, `tags`, `updatedAt` |
| 1.1.2 | Migration: adicionar campo `pais` ao subobjeto `endereco` | Backend | `endereco.pais` (default: "Brasil") |
| 1.1.3 | Atualizar schema Drizzle + tipos shared | Backend | Enums: `estadoCivil`, `origemCaptacao`, `statusCliente`, `contatoPreferencial` |
| 1.1.4 | Atualizar Zod validation (`createClienteSchema`) | Shared | Adicionar novos campos ao schema de validação |
| 1.1.5 | Atualizar `ClienteService` (criar, atualizar, listar, buscar) | Backend | Incluir novos campos nas queries. Buscar também por `whatsapp`, `tags` |
| 1.1.6 | Atualizar formulário `ClienteModal` (frontend) | Frontend | Organizar em seções: Dados Pessoais, Contato, Endereço, Comercial |
| 1.1.7 | Atualizar lista de clientes (colunas/filtros) | Frontend | Filtro por `statusCliente`, `origemCaptacao`, `tags` |

**Enums novos a criar:**
```
estadoCivil: solteiro | casado | divorciado | viuvo | uniao_estavel | separado
origemCaptacao: indicacao | site | oab | redes_sociais | google | outro
statusCliente: prospecto | ativo | inativo | encerrado
contatoPreferencial: email | telefone | whatsapp
```

### 1.2 Processos — +26 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.2.1 | Migration: adicionar colunas à tabela `processos` | Backend | `numeroAntigo`, `clienteQualidade`, `advogadosSecundarios`, `grau`, `comarca`, `vara`, `juiz`, `classeProcessual`, `classeDescricao`, `assuntoPrincipal`, `assuntoDescricao`, `subarea`, `rito`, `prioridade`, `segredoJustica`, `justicaGratuita`, `valorCondenacao`, `dataDistribuicao`, `dataTransitoJulgado`, `dataEncerramento`, `processoRelacionadoId`, `tipoRelacao`, `tags`, `observacoes`, `advogadoContrario`, `oabContrario`, `updatedAt` |
| 1.2.2 | Enriquecer enums existentes | Backend | `plataforma` += `tucujuris`, `sei`, `outro`; `area` += `familia`, `consumidor`, `ambiental`, `administrativo`, `outro`; `fase` += `cumprimento_sentenca`, `liquidacao`; `status` += `suspenso`, `baixado` |
| 1.2.3 | Enriquecer `ParteProcessual` | Backend | += `qualificacao`, `email`, `telefone`, `advogadoNome`, `advogadoOab`, `isPessoaJuridica`; `tipo` += `assistente`, `litisconsorte`, `amicus_curiae` |
| 1.2.4 | Atualizar schema Drizzle + tipos shared | Backend | Novos enums: `grau`, `rito`, `prioridade`, `clienteQualidade`, `tipoRelacao` |
| 1.2.5 | Atualizar Zod validation | Shared | `createProcessoSchema` com novos campos |
| 1.2.6 | Atualizar `ProcessoService` | Backend | Queries com novos campos, FK auto-referencial `processoRelacionadoId` |
| 1.2.7 | Atualizar formulário `ProcessoModal` | Frontend | Seções: Dados Básicos, Tribunal/Jurisdição, Partes, Valores, Relacionamentos |
| 1.2.8 | Atualizar `ProcessoDetailPage` | Frontend | Exibir novos campos, processos relacionados |
| 1.2.9 | Atualizar lista de processos (filtros) | Frontend | Filtro por `grau`, `area`, `status`, `prioridade`, `comarca` |

**Enums novos a criar:**
```
grau: primeiro | segundo | superior | stf
rito: ordinario | sumario | sumarissimo | especial | juizado
prioridadeProcesso: normal | idoso | deficiente | grave_enfermidade | reu_preso
clienteQualidade: autor | reu | terceiro | interessado
tipoRelacao: apenso | incidental | recurso | execucao_provisoria
```

### 1.3 Movimentações — +8 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.3.1 | Migration: adicionar colunas à tabela `movimentacoes` | Backend | `teor`, `urgente`, `geraPrazo`, `prazoGeradoId`, `linkExterno`, `lidoPor`, `lidoAt`, `documentoAnexoId` |
| 1.3.2 | Enriquecer enum `tipo` | Backend | += `acordao`, `citacao`, `decisao_interlocutoria`, `distribuicao`, `juntada`, `certidao` |
| 1.3.3 | Enriquecer enum `origem` | Backend | += `conector_eproc`, `diario_oficial` (valores já parcialmente existentes) |
| 1.3.4 | Criar endpoints CRUD de movimentações | Backend | `POST /api/processos/:id/movimentacoes`, `PUT /api/movimentacoes/:id`, `DELETE /api/movimentacoes/:id` |
| 1.3.5 | Atualizar frontend de movimentações | Frontend | Expandir lista com teor, link externo, flag urgente. Botão "Marcar como lido" grava `lidoPor`/`lidoAt` |

### 1.4 Prazos — +15 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.4.1 | Migration: adicionar colunas à tabela `prazos` | Backend | `dataInicio`, `diasPrazo`, `tipoContagem`, `categoriaPrazo`, `prioridade`, `fatal`, `suspenso`, `motivoSuspensao`, `dataSuspensao`, `dataRetomada`, `responsaveisSecundarios`, `observacoes`, `dataCumprimento`, `cumpridoPor` |
| 1.4.2 | Enriquecer enums | Backend | `tipoPrazo` += `tributario`, `administrativo`, `contratual`; `status` += `suspenso`; alertas: `[15, 7, 3, 1]` |
| 1.4.3 | Atualizar `PrazoService` | Backend | Lógica de cálculo: `dataFatal = dataInicio + diasPrazo` (úteis/corridos). Gravar `dataCumprimento`/`cumpridoPor` ao mudar status |
| 1.4.4 | Atualizar formulário/lista de prazos | Frontend | Seções: contagem automática, suspensão, prioridade. Filtro por `categoriaPrazo`, `fatal`, `prioridade` |

**Enums novos a criar:**
```
tipoContagem: uteis | corridos
categoriaPrazo: contestacao | recurso | manifestacao | pagamento | cumprimento | diligencia | pericia | outros
prioridadePrazo: baixa | normal | alta | urgente
```

### 1.5 Financeiro (Honorários) — +8 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.5.1 | Migration: adicionar colunas à tabela `honorarios` | Backend | `descricao`, `valorBaseExito`, `parcelamento`, `numeroParcelas`, `contratoDocumentoId`, `indiceCorrecao`, `observacoes`, `updatedAt` |
| 1.5.2 | Enriquecer enums | Backend | `tipo` += `sucumbencia`, `dativos`, `misto`; `status` → `proposta`, `contratado`, `em_andamento`, `encerrado` |
| 1.5.3 | Renomear `valor` → `valorTotal` | Backend | Migration de rename + atualizar service/api/frontend |
| 1.5.4 | Atualizar `FinanceiroService` | Backend | Suporte aos novos campos, validação parcelamento |
| 1.5.5 | Atualizar formulário/lista de honorários | Frontend | Campo parcelamento condicional, índice de correção |

**Enums novos a criar:**
```
indiceCorrecao: ipca | igpm | inpc | selic | nenhum
```

### 1.6 Agenda — +11 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.6.1 | Migration: adicionar colunas à tabela `agenda` | Backend | `descricao`, `diaInteiro`, `clienteId`, `linkVideoconferencia`, `cor`, `recorrencia`, `lembretes`, `status`, `resultado`, `criadoPor` |
| 1.6.2 | Enriquecer enums | Backend | `tipo` += `pericia`, `mediacao`, `conciliacao`, `depoimento`, `juri`, `outro`; `participantes` → `[{ userId, nome, confirmado }]` |
| 1.6.3 | Atualizar `AgendaService` | Backend | Suporte a recorrência, status, resultado |
| 1.6.4 | Atualizar formulário/calendário | Frontend | Cor, link videoconferência, status, recorrência |

**Enums novos a criar:**
```
statusAgenda: agendado | confirmado | realizado | cancelado | reagendado
```

### 1.7 Usuários — +10 campos

| # | Tarefa | Tipo | Campos |
|---|--------|------|--------|
| 1.7.1 | Migration: adicionar colunas à tabela `users` | Backend | `oabTipo`, `telefone`, `areaAtuacao`, `especialidade`, `taxaHoraria`, `dataAdmissao`, `certificadoA1Validade`, `certificadoA3Configurado`, `avatarPath`, `updatedAt` |
| 1.7.2 | Atualizar `AuthService.createUser()` | Backend | Aceitar novos campos |
| 1.7.3 | Atualizar formulário `UsuarioModal` | Frontend | Seções: Dados, OAB, Profissional, Certificados |

**Enums novos a criar:**
```
oabTipo: pleno | suplementar | estagiario
areaAtuacao: civel | trabalhista | previdenciario | criminal | tributario | familia | empresarial | outro
```

---

## Fase 2 — Módulos Novos Essenciais

> **Objetivo:** Criar as 2 tabelas e módulos novos classificados como MVP no TO-BE.
> Requer criação de schemas, services, endpoints, permissões e telas completas.

### 2.1 Módulo: Tarefas (novo) — 17 campos

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 2.1.1 | Criar schema Drizzle `tarefas` | Backend | Tabela com 17 campos (SQLite + PG) |
| 2.1.2 | Migration SQL | Backend | CREATE TABLE |
| 2.1.3 | Tipos shared + Zod schema | Shared | `CreateTarefaInput`, enums `prioridadeTarefa`, `statusTarefa`, `categoriaTarefa` |
| 2.1.4 | Criar `TarefaService` | Backend | CRUD: criar, listar, obterPorId, atualizar, excluir. JOIN com processos, clientes, users |
| 2.1.5 | Endpoints API | Backend | `GET/POST /api/tarefas`, `GET/PUT/DELETE /api/tarefas/:id` |
| 2.1.6 | Permissões RBAC | Backend | Seed: `tarefas:criar`, `tarefas:ler_todos`, `tarefas:ler_proprios`, `tarefas:editar_todos` |
| 2.1.7 | Tela de listagem `TarefasPage` | Frontend | Lista com filtros por status, prioridade, responsável, processo |
| 2.1.8 | Modal `TarefaModal` | Frontend | Formulário completo |
| 2.1.9 | Sidebar + Router | Frontend | Adicionar seção TAREFAS |

**Objeto: `tarefas`**

| Campo | Tipo | Obr. | Status |
|-------|------|:----:|--------|
| id | text (UUID) | — | PK |
| titulo | text | Sim | max 500 |
| descricao | text | Nao | |
| processoId | text (FK) | Nao | FK → processos.id |
| clienteId | text (FK) | Nao | FK → clientes.id |
| criadoPor | text (FK) | Sim | FK → users.id |
| responsavelId | text (FK) | Sim | FK → users.id |
| prioridade | enum | Sim | baixa, normal, alta, urgente; default: normal |
| status | enum | Sim | pendente, em_andamento, concluida, cancelada; default: pendente |
| categoria | enum | Nao | peticao, pesquisa, ligacao, reuniao, revisao, diligencia, administrativo, outro |
| dataLimite | text (ISO) | Nao | |
| dataConclusao | text (ISO) | Nao | |
| tempoEstimadoMin | integer | Nao | |
| tempoGastoMin | integer | Nao | calculado do timesheet (fase 3) |
| observacoes | text | Nao | |
| createdAt | text (ISO) | Sim | |
| updatedAt | text (ISO) | Nao | |

### 2.2 Módulo: Documentos (endpoints) — +6 campos

> O schema já existe no AS-IS. Esta fase implementa os endpoints e enriquece campos.

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 2.2.1 | Migration: adicionar colunas | Backend | `descricao`, `categoria`, `tags`, `confidencial`, `dataReferencia` |
| 2.2.2 | Criar `DocumentoService` | Backend | CRUD: upload (multipart), listar, obterPorId, excluir. Hash SHA-256 no upload |
| 2.2.3 | Endpoints API | Backend | `GET/POST /api/documentos`, `GET/DELETE /api/documentos/:id`, `GET /api/documentos/:id/download` |
| 2.2.4 | Permissões RBAC | Backend | Seed: `documentos:upload`, `documentos:ler_todos`, `documentos:confidencial` |
| 2.2.5 | Tela de documentos | Frontend | Lista com filtros, upload drag-and-drop, preview |
| 2.2.6 | Integrar na detail de processo | Frontend | Aba/seção documentos no detalhe do processo |

**Enums novos a criar:**
```
categoriaDocumento: peticao | procuracao | contrato | substabelecimento | certidao | laudo_pericial | comprovante | sentenca | acordao | ata_audiencia | correspondencia | nota_fiscal | outro
```

---

## Fase 3 — Módulos Complementares (v1.0)

> **Objetivo:** Módulos novos classificados como v1.0 no TO-BE.

### 3.1 Módulo: Parcelas (novo) — 15 campos

> Dependência: Fase 1.5 (honorários enriquecidos com `parcelamento`).

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 3.1.1 | Criar schema Drizzle `parcelas` | Backend | 15 campos |
| 3.1.2 | Migration SQL | Backend | CREATE TABLE |
| 3.1.3 | Criar `ParcelaService` | Backend | CRUD. Geração automática de N parcelas ao criar honorário parcelado |
| 3.1.4 | Endpoints API | Backend | `GET /api/honorarios/:id/parcelas`, `PUT /api/parcelas/:id`, `POST /api/parcelas/:id/pagar` |
| 3.1.5 | Permissões RBAC | Backend | `parcelas:gerenciar` |
| 3.1.6 | Tela de parcelas | Frontend | Sub-tela dentro de honorários. Status visual (pendente/pago/atrasado) |

**Objeto: `parcelas`**

| Campo | Tipo | Obr. | Status |
|-------|------|:----:|--------|
| id | text (UUID) | — | PK |
| honorarioId | text (FK) | Sim | FK → honorarios.id |
| numeroParcela | integer | Sim | sequencial |
| valor | real | Sim | |
| vencimento | text (ISO) | Sim | |
| status | enum | Sim | pendente, pago, atrasado, cancelado; default: pendente |
| dataPagamento | text (ISO) | Nao | |
| valorPago | real | Nao | |
| formaPagamento | enum | Nao | pix, boleto, transferencia, dinheiro, cartao, cheque, deposito |
| comprovanteDocId | text (FK) | Nao | FK → documentos.id |
| juros | real | Nao | |
| multa | real | Nao | |
| desconto | real | Nao | |
| observacoes | text | Nao | |
| createdAt | text (ISO) | Sim | |

### 3.2 Módulo: Despesas (novo) — 15 campos

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 3.2.1 | Criar schema Drizzle `despesas` | Backend | 15 campos |
| 3.2.2 | Migration SQL | Backend | CREATE TABLE |
| 3.2.3 | Criar `DespesaService` | Backend | CRUD. JOIN com processos, clientes, users |
| 3.2.4 | Endpoints API | Backend | `GET/POST /api/despesas`, `GET/PUT/DELETE /api/despesas/:id` |
| 3.2.5 | Permissões RBAC | Backend | `despesas:criar`, `despesas:ler_todos`, `despesas:aprovar` |
| 3.2.6 | Tela de despesas | Frontend | Lista, filtros, totalizadores por status |

**Objeto: `despesas`**

| Campo | Tipo | Obr. | Status |
|-------|------|:----:|--------|
| id | text (UUID) | — | PK |
| processoId | text (FK) | Nao | FK → processos.id |
| clienteId | text (FK) | Nao | FK → clientes.id |
| tipo | enum | Sim | custas_judiciais, pericia, diligencia, correspondente, copia_autenticada, cartorio, deslocamento, correio, publicacao, outra |
| descricao | text | Sim | |
| valor | real | Sim | |
| data | text (ISO) | Sim | |
| antecipado_por | enum | Sim | escritorio, cliente |
| reembolsavel | boolean | Nao | default: true |
| reembolsado | boolean | Nao | default: false |
| dataReembolso | text (ISO) | Nao | |
| comprovanteDocId | text (FK) | Nao | FK → documentos.id |
| responsavelId | text (FK) | Sim | FK → users.id |
| status | enum | Sim | pendente, pago, reembolsado, cancelado; default: pendente |
| createdAt | text (ISO) | Sim | |

### 3.3 Módulo: Contatos Externos (novo) — 16 campos

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 3.3.1 | Criar schema Drizzle `contatos` | Backend | 16 campos |
| 3.3.2 | Migration SQL | Backend | CREATE TABLE |
| 3.3.3 | Criar `ContatoService` | Backend | CRUD + busca por nome/tipo/comarca |
| 3.3.4 | Endpoints API | Backend | `GET/POST /api/contatos`, `GET/PUT/DELETE /api/contatos/:id` |
| 3.3.5 | Permissões RBAC | Backend | `contatos:gerenciar` |
| 3.3.6 | Tela de contatos | Frontend | Lista com filtros por tipo, comarca, avaliação |

**Objeto: `contatos`**

| Campo | Tipo | Obr. | Status |
|-------|------|:----:|--------|
| id | text (UUID) | — | PK |
| nome | text | Sim | max 300 |
| tipo | enum | Sim | correspondente, perito, testemunha, oficial_justica, mediador, tradutor, contador, fornecedor, outro |
| cpfCnpj | text | Nao | |
| oabNumero | text | Nao | |
| oabSeccional | text | Nao | |
| email | text | Nao | |
| telefone | text | Nao | |
| whatsapp | text | Nao | |
| especialidade | text | Nao | |
| comarcasAtuacao | JSON (array) | Nao | |
| endereco | JSON | Nao | |
| observacoes | text | Nao | |
| avaliacao | integer | Nao | 1–5 |
| ativo | boolean | Sim | default: true |
| createdAt | text (ISO) | Sim | |

---

## Fase 4 — Analytics e Automação (v1.5)

> **Objetivo:** Timesheet, dashboard enriquecido e automações.

### 4.1 Módulo: Timesheet (novo) — 15 campos

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 4.1.1 | Criar schema Drizzle `timesheets` | Backend | 15 campos |
| 4.1.2 | Migration SQL | Backend | CREATE TABLE |
| 4.1.3 | Criar `TimesheetService` | Backend | CRUD. Cálculo automático: `valorCalculado = duracaoMinutos/60 * taxaHorariaAplicada` |
| 4.1.4 | Endpoints API | Backend | `GET/POST /api/timesheets`, `GET/PUT/DELETE /api/timesheets/:id`, `POST /api/timesheets/:id/aprovar` |
| 4.1.5 | Permissões RBAC | Backend | `timesheet:registrar`, `timesheet:ler_todos`, `timesheet:ler_proprios`, `timesheet:aprovar` |
| 4.1.6 | Tela de timesheet | Frontend | Lista agrupada por dia, timer integrado, resumo mensal |
| 4.1.7 | Feature flag | Backend | `moduleKeys: ["TS-2026-CAUSA-..."]` |

**Objeto: `timesheets`**

| Campo | Tipo | Obr. | Status |
|-------|------|:----:|--------|
| id | text (UUID) | — | PK |
| userId | text (FK) | Sim | FK → users.id |
| processoId | text (FK) | Nao | FK → processos.id |
| clienteId | text (FK) | Nao | FK → clientes.id |
| tarefaId | text (FK) | Nao | FK → tarefas.id |
| data | text (ISO) | Sim | |
| duracaoMinutos | integer | Sim | |
| descricao | text | Sim | |
| tipoAtividade | enum | Sim | peticao, pesquisa_jurisprudencia, reuniao_cliente, audiencia, diligencia, revisao, analise_documental, telefonema, email, administrativo, deslocamento, outro |
| faturavel | boolean | Sim | default: true |
| taxaHorariaAplicada | real | Nao | |
| valorCalculado | real | Nao | auto |
| aprovado | boolean | Nao | default: false |
| aprovadoPor | text (FK) | Nao | FK → users.id |
| createdAt | text (ISO) | Sim | |

### 4.2 Dashboard Enriquecido

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 4.2.1 | Atualizar endpoint `GET /api/dashboard` | Backend | Novos indicadores: `clientesAtivos` (com filtro statusCliente), `prazosFatais7d`, `prazosFataisHoje`, `tarefasPendentes`, `movimentacoesNaoLidas`, `audienciasSemana` |
| 4.2.2 | Card: "Tarefas pendentes (meu)" | Frontend | COUNT tarefas do user logado |
| 4.2.3 | Card: "Movimentações não lidas" | Frontend | COUNT movimentacoes.lido = false |
| 4.2.4 | Seção: "Audiências da semana" | Frontend | Lista de eventos tipo audiência/júri nos próximos 7 dias |
| 4.2.5 | Seção: "A receber (atrasado)" | Frontend | SUM parcelas.valor WHERE status = 'atrasado' — com alerta visual |
| 4.2.6 | Gráfico: Timeline de atividade | Frontend | Últimas 20 movimentações/tarefas/prazos cumpridos |
| 4.2.7 | Gráfico: Produtividade (timesheet) | Frontend | Horas faturáveis vs não-faturáveis (30 dias) |

### 4.3 Automações

| # | Tarefa | Tipo | Detalhe |
|---|--------|------|---------|
| 4.3.1 | Cálculo automático de prazo fatal | Backend | `dataFatal = dataInicio + diasPrazo` excluindo fins de semana/feriados para dias úteis |
| 4.3.2 | Geração automática de prazos a partir de movimentações | Backend | Quando `movimentacao.geraPrazo = true`, criar prazo e gravar `prazoGeradoId` |
| 4.3.3 | Marcação automática de parcelas atrasadas | Backend | Job/cron: parcelas com `vencimento < hoje AND status = 'pendente'` → status `atrasado` |
| 4.3.4 | Prioridade automática por idade | Backend | Se cliente.dataNascimento indica 60+, setar `processo.prioridade = 'idoso'` |

---

## Resumo de Permissões a Adicionar (por fase)

### Fase 2

| Permissão | admin | socio | advog. | estag. | secret. | financ. |
|-----------|:-----:|:-----:|:------:|:------:|:-------:|:-------:|
| `tarefas:criar` | x | x | x | x | x | |
| `tarefas:ler_todos` | x | x | | | x | |
| `tarefas:ler_proprios` | x | x | x | x | x | |
| `tarefas:editar_todos` | x | x | | | | |
| `documentos:upload` | x | x | x | x | x | |
| `documentos:ler_todos` | x | x | x | x | x | x |
| `documentos:confidencial` | x | x | | | | |

### Fase 3

| Permissão | admin | socio | advog. | estag. | secret. | financ. |
|-----------|:-----:|:-----:|:------:|:------:|:-------:|:-------:|
| `despesas:criar` | x | x | x | | x | x |
| `despesas:ler_todos` | x | x | | | | x |
| `despesas:aprovar` | x | x | | | | |
| `parcelas:gerenciar` | x | x | | | | x |
| `contatos:gerenciar` | x | x | x | | x | |

### Fase 4

| Permissão | admin | socio | advog. | estag. | secret. | financ. |
|-----------|:-----:|:-----:|:------:|:------:|:-------:|:-------:|
| `timesheet:registrar` | x | x | x | x | | |
| `timesheet:ler_todos` | x | x | | | | x |
| `timesheet:ler_proprios` | x | x | x | x | | |
| `timesheet:aprovar` | x | x | | | | |

---

## Diagrama de Relacionamentos (TO-BE completo)

```
users ──────┬── 1:N ── processos (advogadoResponsavelId)
            ├── 1:N ── clientes (createdBy)
            ├── 1:N ── prazos (responsavelId, cumpridoPor)
            ├── 1:N ── documentos (uploadedBy)
            ├── 1:N ── tarefas (responsavelId, criadoPor)       [FASE 2]
            ├── 1:N ── timesheets (userId, aprovadoPor)          [FASE 4]
            ├── 1:N ── despesas (responsavelId)                  [FASE 3]
            ├── 1:N ── movimentacoes (lidoPor)                   [FASE 1]
            ├── 1:N ── auditLog (userId)
            └── N:1 ── roles (roleId)

clientes ───┬── 1:N ── processos (clienteId)
            ├── 1:N ── honorarios (clienteId)
            ├── 1:N ── documentos (clienteId)
            ├── 1:N ── tarefas (clienteId)                      [FASE 2]
            ├── 1:N ── despesas (clienteId)                     [FASE 3]
            ├── 1:N ── timesheets (clienteId)                   [FASE 4]
            └── 1:N ── agenda (clienteId)                       [FASE 1]

processos ──┬── 1:N ── movimentacoes (processoId)
            ├── 1:N ── prazos (processoId)
            ├── 1:N ── honorarios (processoId)
            ├── 1:N ── documentos (processoId)
            ├── 1:N ── agenda (processoId)
            ├── 1:N ── connectorLogs (processoId)
            ├── 1:N ── tarefas (processoId)                     [FASE 2]
            ├── 1:N ── despesas (processoId)                    [FASE 3]
            ├── 1:N ── timesheets (processoId)                  [FASE 4]
            └── N:1 ── processos (processoRelacionadoId)        [FASE 1 auto-ref]

honorarios ── 1:N ── parcelas (honorarioId)                     [FASE 3]

movimentacoes ── 1:1 ── prazos (prazoGeradoId)                  [FASE 1]

tarefas ───── 1:N ── timesheets (tarefaId)                      [FASE 4]

documentos ──┬── referenciado por parcelas (comprovanteDocId)   [FASE 3]
             ├── referenciado por despesas (comprovanteDocId)    [FASE 3]
             ├── referenciado por honorarios (contratoDocId)     [FASE 1]
             └── referenciado por movimentacoes (documentoAnexoId) [FASE 1]

roles ──── N:N ── permissions (via rolePermissions)
```

---

## Checklist de Execução

- [ ] **Fase 1** — Enriquecimento do MVP
  - [ ] 1.1 Clientes (+18 campos)
  - [ ] 1.2 Processos (+26 campos)
  - [ ] 1.3 Movimentações (+8 campos, CRUD novo)
  - [ ] 1.4 Prazos (+15 campos)
  - [ ] 1.5 Financeiro (+8 campos)
  - [ ] 1.6 Agenda (+11 campos)
  - [ ] 1.7 Usuários (+10 campos)
- [ ] **Fase 2** — Módulos Novos Essenciais
  - [ ] 2.1 Tarefas (17 campos, módulo completo)
  - [ ] 2.2 Documentos (endpoints + 6 campos)
- [ ] **Fase 3** — Módulos Complementares
  - [ ] 3.1 Parcelas (15 campos, módulo completo)
  - [ ] 3.2 Despesas (15 campos, módulo completo)
  - [ ] 3.3 Contatos Externos (16 campos, módulo completo)
- [ ] **Fase 4** — Analytics e Automação
  - [ ] 4.1 Timesheet (15 campos, módulo completo)
  - [ ] 4.2 Dashboard Enriquecido
  - [ ] 4.3 Automações (cálculo de prazos, parcelas atrasadas, prioridade por idade)
