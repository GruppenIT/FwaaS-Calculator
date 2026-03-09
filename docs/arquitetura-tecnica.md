# CAUSA — Documentação Técnica

Estrutura completa do produto: módulos, objetos, campos, relacionamentos, operações CRUD e constraints.

---

## Sumário

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Módulo: Autenticação & RBAC](#módulo-autenticação--rbac)
3. [Módulo: Usuários](#módulo-usuários)
4. [Módulo: Clientes](#módulo-clientes)
5. [Módulo: Processos](#módulo-processos)
6. [Módulo: Movimentações](#módulo-movimentações)
7. [Módulo: Prazos](#módulo-prazos)
8. [Módulo: Financeiro (Honorários)](#módulo-financeiro-honorários)
9. [Módulo: Agenda](#módulo-agenda)
10. [Módulo: Documentos](#módulo-documentos)
11. [Módulo: Conectores](#módulo-conectores)
12. [Módulo: Licenças](#módulo-licenças)
13. [Módulo: Auditoria](#módulo-auditoria)
14. [Módulo: Dashboard](#módulo-dashboard)
15. [Módulo: Configurações](#módulo-configurações)
16. [Feature Flags](#feature-flags)
17. [Matriz de Permissões](#matriz-de-permissões)
18. [Constraints e Regras de Negócio](#constraints-e-regras-de-negócio)

---

## Visão Geral da Arquitetura

| Camada | Tecnologia | Pacote |
|--------|-----------|--------|
| Frontend Desktop | React + Vite + Tailwind | `packages/app-desktop` |
| API HTTP | Node.js `http` nativo | `packages/database/src/api-server.ts` |
| ORM | Drizzle ORM | `packages/database/src/schema/` |
| Banco (solo) | SQLite | `causa.db` |
| Banco (escritório) | PostgreSQL | URL configurável |
| Tipos compartilhados | TypeScript | `packages/shared` |
| Conectores tribunais | Playwright/Puppeteer | `packages/connectors` |
| Serviço Windows | Node.js | `packages/windows-service` |

**Topologias suportadas:**
- `solo` — advogado autônomo, SQLite local
- `escritorio` — múltiplos usuários, PostgreSQL em rede

---

## Módulo: Autenticação & RBAC

### Objeto: `roles`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| nome | text | UNIQUE, NOT NULL |
| descricao | text | — |
| isSystemRole | boolean | default: `false` |

### Objeto: `permissions`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| recurso | text | NOT NULL |
| acao | text | NOT NULL |
| descricao | text | — |

### Objeto: `rolePermissions`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| roleId | text | FK → `roles.id`, PK composta |
| permissionId | text | FK → `permissions.id`, PK composta |

### Papéis do sistema (seed)

| Papel | Descrição |
|-------|-----------|
| `admin` | Sócio administrador. Acesso total. |
| `socio` | Sócio sem privilégios de admin. |
| `advogado` | Acesso pleno a processos próprios. |
| `estagiario` | Leitura de processos atribuídos. |
| `secretaria` | Gestão de agenda, clientes, documentos. |
| `financeiro` | Acesso exclusivo ao módulo financeiro. |

### Operações — `AuthService`

| Operação | Método | Descrição |
|----------|--------|-----------|
| Login | `login(email, senha)` | Retorna `{ accessToken, refreshToken }` |
| Refresh | `refreshAccessToken(refreshToken)` | Gera novos tokens |
| Verificar token | `verifyToken(token)` | Valida JWT, retorna payload |
| Criar usuário | `createUser(input)` | Hash bcrypt (cost 12), gera UUID |
| Permissões | `getUserPermissions(userId)` | JOIN users → roles → rolePermissions → permissions |

**Tokens JWT:**
- Access token: expira em **8 horas**
- Refresh token: expira em **7 dias**
- Payload: `{ sub, email, role, iat, exp }`

### Operações — `RbacService`

| Operação | Método | Descrição |
|----------|--------|-----------|
| Verificar 1 permissão | `checkPermission(user, permission)` | Boolean, com cache |
| Verificar TODAS | `checkAllPermissions(user, perms[])` | AND lógico |
| Verificar ALGUMA | `checkAnyPermission(user, perms[])` | OR lógico |
| Listar permissões | `listPermissions(user)` | Array de strings |
| Limpar cache | `clearCache(userId?)` | Invalida cache RBAC |

**Cache:** Map em memória `<userId, Set<permissionString>>`, invalidado ao alterar papel.

---

## Módulo: Usuários

### Objeto: `users`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| nome | text | NOT NULL, min 2, max 200 |
| email | text | UNIQUE, NOT NULL, formato email |
| senhaHash | text | NOT NULL (bcrypt, cost 12) |
| oabNumero | text | nullable, max 10 |
| oabSeccional | text | nullable, 2 caracteres (UF) |
| roleId | text | FK → `roles.id`, NOT NULL |
| certificadoA1Path | text | nullable |
| ativo | boolean | default: `true` |
| createdAt | text | NOT NULL, ISO string |

### Formulário: Criar Usuário

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Nome | sim | min 2, max 200 caracteres |
| Email | sim | formato email válido |
| Senha | sim | min 8 caracteres |
| OAB Número | não | max 10 caracteres |
| OAB Seccional | não | 2 caracteres (UF) |
| Papel (role) | sim | select: advogado, sócio, estagiário, secretária, financeiro* |

\* O papel "financeiro" só aparece quando o módulo financeiro está ativado.

### Operações CRUD (via API)

| Operação | Endpoint | Permissão |
|----------|----------|-----------|
| Listar | `GET /api/usuarios` | `usuarios:gerenciar` |
| Criar | `POST /api/usuarios` | `usuarios:gerenciar` |
| Atualizar | `PUT /api/usuarios/:id` | `usuarios:gerenciar` |
| Desativar | `DELETE /api/usuarios/:id` | `usuarios:gerenciar` |

**Detalhes:**

- **Listar:** JOIN com `roles` para retornar nome do papel.
- **Criar:** Busca `role` por nome na tabela `roles`, cria usuário via `AuthService.createUser()`.
- **Atualizar:** Atualização parcial (nome, email, oabNumero, oabSeccional, ativo, role). Ao alterar `role`, busca roleId e limpa cache RBAC.
- **Desativar:** **Soft delete** — seta `ativo: false`. Limpa cache RBAC.

---

## Módulo: Clientes

### Objeto: `clientes`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| tipo | text | NOT NULL, enum: `PF`, `PJ` |
| nome | text | NOT NULL, min 2, max 300 |
| cpfCnpj | text | UNIQUE, nullable, apenas dígitos |
| email | text | nullable, formato email |
| telefone | text | nullable, max 20 |
| endereco | JSON | nullable, objeto estruturado |
| createdBy | text | FK → `users.id`, NOT NULL |
| createdAt | text | NOT NULL, ISO string |

**Subobjeto `endereco`:**

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| logradouro | string | não |
| numero | string | não |
| complemento | string | não |
| bairro | string | não |
| cidade | string | não |
| uf | string (2 chars) | não |
| cep | string | não |

### Formulário: Criar/Editar Cliente

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Tipo | sim | PF ou PJ |
| Nome | sim | min 2, max 300 |
| CPF/CNPJ | não | CPF: 11 dígitos c/ dígito verificador; CNPJ: 14 dígitos c/ dígito verificador |
| Email | não | formato email |
| Telefone | não | max 20 caracteres |
| Endereço | não | objeto com campos opcionais |

### Operações CRUD — `ClienteService`

| Operação | Método | Endpoint | Permissão |
|----------|--------|----------|-----------|
| Listar | `listar()` | `GET /api/clientes` | `clientes:ler_todos` |
| Buscar | `buscar(termo)` | `GET /api/clientes?q=termo` | `clientes:ler_todos` |
| Obter por ID | `obterPorId(id)` | `GET /api/clientes/:id` | `clientes:ler_todos` |
| Criar | `criar(input, userId)` | `POST /api/clientes` | `clientes:criar` |
| Atualizar | `atualizar(id, input)` | `PUT /api/clientes/:id` | `clientes:editar` |
| Excluir | `excluir(id)` | `DELETE /api/clientes/:id` | `clientes:excluir` |

**Detalhes:**

- **Buscar:** LIKE case-insensitive nos campos `nome`, `cpfCnpj` e `email`.
- **Criar:** Limpa CPF/CNPJ removendo caracteres não-numéricos. Grava `createdBy` com ID do usuário autenticado.
- **Atualizar:** Atualização parcial. Limpa CPF/CNPJ quando fornecido.
- **Excluir:** Hard delete.

---

## Módulo: Processos

### Objeto: `processos`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| numeroCnj | text | UNIQUE, NOT NULL, formato CNJ |
| clienteId | text | FK → `clientes.id`, NOT NULL |
| advogadoResponsavelId | text | FK → `users.id`, NOT NULL |
| tribunalSigla | text | NOT NULL, min 2, max 10 |
| plataforma | text | NOT NULL, enum: `pje`, `esaj`, `eproc`, `projudi` |
| area | text | NOT NULL, enum: `civel`, `trabalhista`, `previdenciario`, `criminal`, `tributario` |
| fase | text | NOT NULL, enum: `conhecimento`, `recursal`, `execucao` |
| status | text | NOT NULL, enum: `ativo`, `arquivado`, `encerrado`, default: `ativo` |
| poloAtivo | JSON | nullable, array de `ParteProcessual` |
| poloPassivo | JSON | nullable, array de `ParteProcessual` |
| valorCausa | real | nullable |
| ultimoSyncAt | text | nullable, ISO string |
| createdAt | text | NOT NULL, ISO string |

**Subobjeto `ParteProcessual`:**

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| nome | string | sim |
| cpfCnpj | string | não |
| tipo | enum | sim: `autor`, `reu`, `terceiro` |

**Formato `numeroCnj`:** `NNNNNNN-DD.AAAA.J.TT.OOOO` (regex: `^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$`)

### Formulário: Criar/Editar Processo

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Número CNJ | sim | formato CNJ (20 dígitos + separadores) |
| Cliente | sim | FK select de clientes |
| Advogado Responsável | sim | FK select de usuários |
| Tribunal | sim | select de tribunais (sigla) |
| Plataforma | sim | pje, esaj, eproc, projudi |
| Área | sim | cível, trabalhista, previdenciário, criminal, tributário |
| Fase | sim | conhecimento, recursal, execução |
| Valor da Causa | não | número positivo |
| Polo Ativo | não | array de partes |
| Polo Passivo | não | array de partes |

### Operações CRUD — `ProcessoService`

| Operação | Método | Endpoint | Permissão |
|----------|--------|----------|-----------|
| Listar | `listar(filtros?)` | `GET /api/processos` | `processos:ler_todos` ou `processos:ler_proprios` |
| Buscar | `buscar(termo, filtros?)` | `GET /api/processos?q=termo` | idem |
| Obter por ID | `obterPorId(id)` | `GET /api/processos/:id` | idem |
| Criar | `criar(input)` | `POST /api/processos` | `processos:criar` |
| Atualizar | `atualizar(id, input)` | `PUT /api/processos/:id` | `processos:editar` |
| Excluir | `excluir(id)` | `DELETE /api/processos/:id` | `processos:excluir` |

**Detalhes:**

- **Listar:** LEFT JOIN com `clientes` (clienteNome) e `users` (advogadoNome). Filtro opcional por `advogadoId` e `status`.
- **Buscar:** LIKE em `numeroCnj` e `clientes.nome`. Combina com filtros opcionais (AND).
- **Obter por ID:** Com `ler_proprios`, verifica se `advogadoResponsavelId === user.id`.
- **Excluir:** Hard delete.

### Subrecursos do Processo

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `GET /api/processos/:id/movimentacoes` | `listarMovimentacoes(processoId)` | Movimentações do processo |
| `GET /api/processos/:id/prazos` | `listarPrazos(processoId)` | Prazos do processo |
| `GET /api/processos/:id/honorarios` | `listarPorProcesso(processoId)` | Honorários do processo |

---

## Módulo: Movimentações

### Objeto: `movimentacoes`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| processoId | text | FK → `processos.id`, NOT NULL |
| dataMovimento | text | NOT NULL |
| descricao | text | NOT NULL |
| tipo | text | NOT NULL, enum: `despacho`, `sentenca`, `intimacao`, `publicacao`, `outros` |
| origem | text | NOT NULL, `manual` ou `conector_*` |
| lido | boolean | NOT NULL, default: `false` |
| createdAt | text | NOT NULL, ISO string |

### Operações CRUD

| Operação | Endpoint | Permissão |
|----------|----------|-----------|
| Listar por processo | `GET /api/processos/:id/movimentacoes` | `processos:ler_todos` ou `processos:ler_proprios` |

Movimentações são criadas automaticamente pelos conectores ou manualmente. Atualmente sem endpoints de criação/edição/exclusão via API.

---

## Módulo: Prazos

### Objeto: `prazos`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| processoId | text | FK → `processos.id`, NOT NULL |
| movimentacaoId | text | FK → `movimentacoes.id`, nullable |
| descricao | text | NOT NULL |
| dataFatal | text | NOT NULL |
| tipoPrazo | text | NOT NULL, enum: `ncpc`, `clt`, `jec`, `outros` |
| status | text | NOT NULL, enum: `pendente`, `cumprido`, `perdido`, default: `pendente` |
| responsavelId | text | FK → `users.id`, NOT NULL |
| alertasEnviados | JSON | nullable, `{ dias: number[], enviados: string[] }` |

### Formulário: Criar/Editar Prazo

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Processo | sim | FK select de processos |
| Descrição | sim | texto |
| Data Fatal | sim | data |
| Tipo de Prazo | sim | ncpc, clt, jec, outros |
| Responsável | sim | FK select de usuários |

### Operações CRUD — `PrazoService`

| Operação | Método | Endpoint | Permissão |
|----------|--------|----------|-----------|
| Listar | `listar(filtros?)` | `GET /api/prazos` | `processos:ler_todos` ou `processos:ler_proprios` |
| Obter por ID | `obterPorId(id)` | `GET /api/prazos/:id` | idem |
| Criar | `criar(input)` | `POST /api/prazos` | `processos:editar` |
| Atualizar | `atualizar(id, input)` | `PUT /api/prazos/:id` | `processos:editar` |
| Excluir | `excluir(id)` | `DELETE /api/prazos/:id` | `processos:excluir` |

**Detalhes:**

- **Listar:** LEFT JOIN com `processos` (numeroCnj) e `users` (responsavelNome). Filtro opcional por `status` e `responsavelId`. Com `ler_proprios`, filtra automaticamente `responsavelId = user.id`.
- **Obter por ID:** Com `ler_proprios`, verifica se `responsavelId === user.id`.
- **Criar:** Gera config de alertas padrão `{ dias: [7, 3, 1], enviados: [] }`.
- **Excluir:** Hard delete.

---

## Módulo: Financeiro (Honorários)

> **Nota:** Este módulo está oculto por padrão (feature flag). Ver [Feature Flags](#feature-flags).

### Objeto: `honorarios`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| processoId | text | FK → `processos.id`, nullable |
| clienteId | text | FK → `clientes.id`, nullable |
| tipo | text | NOT NULL, enum: `fixo`, `exito`, `por_hora` |
| valor | real | NOT NULL |
| percentualExito | real | nullable, 0–100 |
| status | text | NOT NULL, enum: `pendente`, `recebido`, `inadimplente`, default: `pendente` |
| vencimento | text | nullable, ISO string |
| createdAt | text | NOT NULL, ISO string |

### Formulário: Criar/Editar Honorário

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Processo | não | FK select de processos |
| Cliente | não | FK select de clientes |
| Tipo | sim | fixo, êxito, por hora |
| Valor | sim | número positivo |
| Percentual de Êxito | não | 0–100 (apenas para tipo êxito) |
| Vencimento | não | data |

### Operações CRUD — `FinanceiroService`

| Operação | Método | Endpoint | Permissão |
|----------|--------|----------|-----------|
| Listar | `listar(advogadoId?)` | `GET /api/honorarios` | `financeiro:ler_todos` ou `financeiro:ler_proprios` |
| Listar por processo | `listarPorProcesso(processoId)` | `GET /api/processos/:id/honorarios` | `processos:ler_todos` ou `processos:ler_proprios` |
| Obter por ID | `obterPorId(id)` | `GET /api/honorarios/:id` | `financeiro:ler_todos` ou `financeiro:ler_proprios` |
| Criar | `criar(input)` | `POST /api/honorarios` | `financeiro:editar` |
| Atualizar | `atualizar(id, input)` | `PUT /api/honorarios/:id` | `financeiro:editar` |
| Excluir | `excluir(id)` | `DELETE /api/honorarios/:id` | `financeiro:editar` |

**Detalhes:**

- **Listar:** LEFT JOIN com `processos` (numeroCnj) e `clientes` (clienteNome). Com `ler_proprios`, filtra por `processos.advogadoResponsavelId = user.id`.
- **Excluir:** Hard delete.

---

## Módulo: Agenda

### Objeto: `agenda`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| titulo | text | NOT NULL |
| tipo | text | NOT NULL, enum: `audiencia`, `diligencia`, `reuniao`, `prazo` |
| dataHoraInicio | text | NOT NULL |
| dataHoraFim | text | nullable |
| processoId | text | FK → `processos.id`, nullable |
| participantes | JSON | nullable, array de strings |
| local | text | nullable |
| createdAt | text | NOT NULL, ISO string |

### Formulário: Criar/Editar Evento

| Campo | Obrigatório | Validação |
|-------|:-----------:|-----------|
| Título | sim | texto |
| Tipo | sim | audiência, diligência, reunião, prazo |
| Data/Hora Início | sim | datetime |
| Data/Hora Fim | não | datetime |
| Processo | não | FK select de processos |
| Participantes | não | array de nomes |
| Local | não | texto |

### Operações CRUD — `AgendaService`

| Operação | Método | Endpoint | Permissão |
|----------|--------|----------|-----------|
| Listar | `listar(filtros?)` | `GET /api/agenda` | `agenda:gerenciar_todos` |
| Obter por ID | `obterPorId(id)` | `GET /api/agenda/:id` | `agenda:gerenciar_todos` |
| Criar | `criar(input)` | `POST /api/agenda` | `agenda:gerenciar_todos` |
| Atualizar | `atualizar(id, input)` | `PUT /api/agenda/:id` | `agenda:gerenciar_todos` |
| Excluir | `excluir(id)` | `DELETE /api/agenda/:id` | `agenda:gerenciar_todos` |

**Detalhes:**

- **Listar:** LEFT JOIN com `processos` (numeroCnj). Filtro opcional por range de datas (`inicio`, `fim`).
- **Excluir:** Hard delete.

---

## Módulo: Documentos

### Objeto: `documentos`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| processoId | text | FK → `processos.id`, nullable |
| clienteId | text | FK → `clientes.id`, nullable |
| nome | text | NOT NULL |
| caminhoLocal | text | NOT NULL |
| tipoMime | text | NOT NULL |
| tamanhoBytes | integer | NOT NULL |
| versao | integer | NOT NULL, default: `1` |
| hashSha256 | text | NOT NULL |
| uploadedBy | text | FK → `users.id`, NOT NULL |
| createdAt | text | NOT NULL, ISO string |

> Módulo definido no schema mas sem endpoints de API ou service implementados no MVP.

---

## Módulo: Conectores

### Objeto: `connectorLogs`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| processoId | text | FK → `processos.id`, NOT NULL |
| conectorNome | text | NOT NULL |
| maquinaHostname | text | NOT NULL |
| status | text | NOT NULL, enum: `sucesso`, `erro`, `timeout`, `captcha` |
| detalhes | JSON | nullable |
| duracaoMs | integer | NOT NULL |
| executadoAt | text | NOT NULL, ISO string |

### Interface `IConector`

| Propriedade | Tipo | Descrição |
|------------|------|-----------|
| nome | string | Nome do conector |
| plataforma | Plataforma | pje, esaj, eproc, projudi |
| versao | string | Versão semântica |
| tribunaisSuportados | string[] | Lista de siglas de tribunais |
| testarConexao | método | Testa acesso ao tribunal |
| buscarMovimentacoes | método | Baixa movimentações do processo |
| peticionar | método | (Opcional) Peticionamento eletrônico |

### Tribunais Suportados

**P1 (MVP):** TRF1–TRF6 (PJe), TJSP (ESAJ)

**P2 (v1.5):** TJRS, TJSC (EPROC), TJPR (PROJUDI), TJMG (PJe)

---

## Módulo: Licenças

### Objeto: `licencas`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| chaveLicenca | text | UNIQUE, NOT NULL |
| plano | text | NOT NULL, enum: `causa_solo`, `causa_escritorio`, `causa_equipe` |
| seatsContratados | integer | NOT NULL, default: `1` |
| validadeAte | text | NOT NULL |
| featuresAtivas | JSON | nullable, array de feature flags |

### Planos

| Plano | Nome | Max Seats | Topologia |
|-------|------|:---------:|-----------|
| `causa_solo` | CAUSA Solo | 1 | solo |
| `causa_escritorio` | CAUSA Escritório | 20 | escritorio |
| `causa_equipe` | CAUSA Equipe | 100 | escritorio |

> Módulo definido no schema mas sem endpoints de API dedicados no MVP.

---

## Módulo: Auditoria

### Objeto: `auditLog`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | text | PK, UUID |
| userId | text | FK → `users.id`, NOT NULL |
| acao | text | NOT NULL |
| recurso | text | NOT NULL |
| recursoId | text | nullable |
| payloadAnterior | JSON | nullable |
| createdAt | text | NOT NULL, ISO string |

### Operações — `AuditService`

| Operação | Método | Descrição |
|----------|--------|-----------|
| Registrar | `registrar(entry)` | Append-only. Sem UPDATE ou DELETE. |

---

## Módulo: Dashboard

### Endpoint: `GET /api/dashboard`

**Permissão:** qualquer usuário autenticado.

**Dados retornados:**

| Campo | Tipo | Origem |
|-------|------|--------|
| processosAtivos | number | `COUNT(processos WHERE status = 'ativo')` |
| clientes | number | `COUNT(clientes)` |
| prazosPendentes | number | `COUNT(prazos WHERE status = 'pendente')` |
| prazosFatais | number | Fixo `0` (placeholder) |
| honorariosPendentes | number | `SUM(honorarios.valor WHERE status = 'pendente')` |

No frontend, o dashboard também carrega:
- **Prazos urgentes:** prazos pendentes com data fatal nos próximos 7 dias
- **Resumo financeiro:** totais por status (pendente, recebido, inadimplente) — apenas se módulo financeiro ativo

---

## Módulo: Configurações

### Endpoint: `GET /api/configuracoes`

**Permissão:** `licenca:gerenciar`

**Retorno:** `{ topologia, dbPath }`

### Endpoint: `PUT /api/configuracoes`

**Permissão:** `licenca:gerenciar`

**Aceita:** `{ topologia: 'solo' | 'escritorio' }`

### Arquivo `causa.config.json`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| jwtSecret | string | 128 caracteres hex (64 bytes aleatórios) |
| topologia | string | `solo` ou `escritorio` |
| dbPath | string | Caminho do banco SQLite |
| postgresUrl | string? | URL do PostgreSQL (apenas escritório) |
| moduleKeys | string[]? | Códigos de ativação de módulos |

---

## Feature Flags

O módulo financeiro está **desabilitado por padrão** no MVP. Ativação via config:

```json
{
  "moduleKeys": ["FIN-2026-CAUSA-7F3A9B"]
}
```

### Endpoint: `GET /api/features`

**Permissão:** qualquer usuário autenticado.

**Retorno:** `{ financeiro: boolean }`

### Pontos de ocultação quando `financeiro = false`

| Local | Comportamento |
|-------|-------------|
| Sidebar | Seção "FINANCEIRO" oculta |
| Router | Rota `/app/financeiro` não registrada |
| Dashboard | Stat card "A receber" oculto; card "Resumo financeiro" oculto |
| Processo detalhe | Seção "Honorários" oculta |
| Modal de usuário | Papel "Financeiro" removido do select |

---

## Matriz de Permissões

| Permissão | admin | socio | advogado | estagiario | secretaria | financeiro |
|-----------|:-----:|:-----:|:--------:|:----------:|:----------:|:----------:|
| `processos:criar` | x | x | x | | | |
| `processos:ler_todos` | x | x | | | x | x |
| `processos:ler_proprios` | x | x | x | x | x | x |
| `processos:editar` | x | x | x | | | |
| `processos:excluir` | x | x | | | | |
| `clientes:criar` | x | x | x | | x | |
| `clientes:ler_todos` | x | x | x | x | x | x |
| `clientes:editar` | x | x | x | | x | |
| `clientes:excluir` | x | x | | | | |
| `financeiro:ler_todos` | x | x | | | | x |
| `financeiro:ler_proprios` | | | x | | | |
| `financeiro:editar` | x | x | | | | x |
| `conectores:executar` | x | x | x | | | |
| `usuarios:gerenciar` | x | | | | | |
| `licenca:gerenciar` | x | | | | | |
| `relatorios:gerenciar` | x | x | | | | x |
| `agenda:gerenciar_todos` | x | x | | | x | |
| `tema:alternar` | x | x | x | x | x | x |

---

## Constraints e Regras de Negócio

### Constraints implementadas

| # | Regra | Entidade | Local |
|---|-------|----------|-------|
| 1 | **Não é possível excluir o próprio usuário** | Usuário | `api-server.ts` — endpoint `DELETE /api/usuarios/:id` retorna erro 400 se `id === user.id` |
| 2 | **Usuários são desativados, não deletados** (soft delete) | Usuário | `api-server.ts` — seta `ativo: false` em vez de deletar, preservando integridade referencial |
| 3 | **Usuário desativado não consegue fazer login** | Autenticação | `auth.ts` — `login()` verifica `ativo === true`, lança "Usuário desativado." |
| 4 | **Usuário desativado não consegue renovar token** | Autenticação | `auth.ts` — `refreshAccessToken()` verifica `ativo === true`, lança "Usuário não encontrado ou desativado." |
| 5 | **Email deve ser único** | Usuário | `auth.ts` — `createUser()` verifica existência antes de inserir, lança "Email já cadastrado." |
| 6 | **CPF/CNPJ deve ser único** | Cliente | Schema DB — constraint `UNIQUE` na coluna `cpfCnpj` |
| 7 | **Número CNJ deve ser único** | Processo | Schema DB — constraint `UNIQUE` na coluna `numeroCnj` |
| 8 | **Cache RBAC é invalidado ao alterar papel** | Usuário | `api-server.ts` — chama `clearCache(userId)` ao atualizar `roleId` |
| 9 | **Cache RBAC é invalidado ao desativar usuário** | Usuário | `api-server.ts` — chama `clearCache(userId)` ao soft-delete |
| 10 | **`ler_proprios` filtra por advogado responsável** | Processo | `api-server.ts` — se user só tem `processos:ler_proprios`, filtra por `advogadoId = user.id` |
| 11 | **`ler_proprios` filtra por responsável** | Prazo | `api-server.ts` — se user só tem `processos:ler_proprios`, força `responsavelId = user.id` |
| 12 | **`ler_proprios` filtra por advogado do processo** | Honorário | `api-server.ts` — se user só tem `financeiro:ler_proprios`, filtra por `processos.advogadoResponsavelId = user.id` |
| 13 | **Audit log é append-only** | Auditoria | `AuditService` — apenas operação `INSERT`, sem UPDATE ou DELETE |
| 14 | **Prazos criados com alertas padrão** | Prazo | `PrazoService.criar()` — inicializa `alertasEnviados: { dias: [7, 3, 1], enviados: [] }` |
| 15 | **Setup só pode ser executado uma vez** | Sistema | `api-server.ts` — retorna 409 se `causa.config.json` já existe |

### Diagrama de Relacionamentos

```
users ──┬── 1:N ── processos (advogadoResponsavelId)
        ├── 1:N ── clientes (createdBy)
        ├── 1:N ── prazos (responsavelId)
        ├── 1:N ── documentos (uploadedBy)
        ├── 1:N ── auditLog (userId)
        └── N:1 ── roles (roleId)

clientes ──┬── 1:N ── processos (clienteId)
           ├── 1:N ── honorarios (clienteId)
           └── 1:N ── documentos (clienteId)

processos ──┬── 1:N ── movimentacoes (processoId)
            ├── 1:N ── prazos (processoId)
            ├── 1:N ── honorarios (processoId)
            ├── 1:N ── documentos (processoId)
            ├── 1:N ── agenda (processoId)
            └── 1:N ── connectorLogs (processoId)

movimentacoes ── 1:N ── prazos (movimentacaoId)

roles ──── N:N ── permissions (via rolePermissions)
```
