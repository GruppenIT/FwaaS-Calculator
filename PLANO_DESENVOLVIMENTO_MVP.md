# PLANO DE DESENVOLVIMENTO — MVP
## Sistema On-Premise de Gestão para Escritórios de Advocacia

> **Para o agente de coding:** Este documento é o plano mestre de desenvolvimento do produto.
> Leia-o integralmente, analise as fases, dependências e decisões técnicas descritas, e ao final
> sugira como iniciaremos a **Fase 1 — Fundação**, detalhando os primeiros artefatos a criar,
> a estrutura de pastas do repositório e o primeiro comando a executar.

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Topologias de Implantação](#2-topologias-de-implantação)
3. [Arquitetura de Sistema](#3-arquitetura-de-sistema)
4. [Modelo de Dados — Visão Inicial](#4-modelo-de-dados--visão-inicial)
5. [RBAC — Controle de Acesso Baseado em Papéis](#5-rbac--controle-de-acesso-baseado-em-papéis)
6. [Modelo de Conectores e Regra de Execução Local](#6-modelo-de-conectores-e-regra-de-execução-local)
7. [Fases de Desenvolvimento](#7-fases-de-desenvolvimento)
8. [Stack Tecnológica Definida](#8-stack-tecnológica-definida)
9. [Padrões de Segurança e Boas Práticas](#9-padrões-de-segurança-e-boas-práticas)
10. [Estrutura do Repositório](#10-estrutura-do-repositório)
11. [Definition of Done por Fase](#11-definition-of-done-por-fase)
12. [Decisões em Aberto](#12-decisões-em-aberto)

---

## 1. Visão Geral do Produto

**Nome provisório:** JurisLocal  
**Versão alvo deste plano:** MVP v0.1 → v1.0  
**Desenvolvedor principal:** Rodrigo S. da Rocha (com Claude Code)  
**Validação jurídica:** Michele Fagundes  
**Validação de UX/mercado:** Diana Rocha  

### Proposta central

ERP jurídico instalado **na máquina do escritório** — sem dados trafegando para servidores de terceiros. Com automação de consulta e peticionamento nos principais tribunais brasileiros (PJe, e-SAJ, eProc), rodando via serviço Windows no computador do advogado responsável por cada processo.

---

## 2. Topologias de Implantação

O sistema deve suportar **duas topologias** escolhidas no momento da instalação, sem necessidade de mudança de software:

### Topologia A — Solo (Notebook Único)

```
┌─────────────────────────────────────┐
│           Notebook do Advogado      │
│                                     │
│  ┌──────────┐   ┌────────────────┐  │
│  │  App     │   │ Serviço Windows│  │
│  │  Desktop │   │ (Conector/     │  │
│  │ (Electron│   │  Scheduler)    │  │
│  │  /Tauri) │   └────────────────┘  │
│  └────┬─────┘           │           │
│       │                 │           │
│  ┌────▼─────────────────▼────────┐  │
│  │   SQLite (arquivo local)      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- Banco de dados: **SQLite** (arquivo único em pasta de dados da aplicação)
- Sem dependência de rede local
- Portátil por natureza — backup = copiar o arquivo `.db`
- Ideal para: advogado autônomo, sócio único

### Topologia B — Escritório (Rede Local / Multi-Usuário)

```
┌──────────────────────┐     ┌──────────────────────┐
│  Notebook Advogado 1 │     │  Notebook Advogado 2 │
│                      │     │                      │
│  ┌────────────────┐  │     │  ┌────────────────┐  │
│  │  App Desktop   │  │     │  │  App Desktop   │  │
│  └───────┬────────┘  │     │  └───────┬────────┘  │
│  ┌───────▼────────┐  │     │          │           │
│  │ Serviço Windows│  │     │  (Sem serviço        │
│  │ (Conector — só │  │     │   de conector —      │
│  │ processos dele)│  │     │   não é responsável) │
│  └───────┬────────┘  │     │          │           │
└──────────┼───────────┘     └──────────┼───────────┘
           │   Rede Local (TCP/IP)       │
           └──────────────┬─────────────┘
                          │
             ┌────────────▼────────────┐
             │   Servidor Local        │
             │   (Mini-PC / NAS)       │
             │                         │
             │  ┌─────────────────┐    │
             │  │  PostgreSQL     │    │
             │  │  (Docker)       │    │
             │  └─────────────────┘    │
             └─────────────────────────┘
```

- Banco de dados: **PostgreSQL** em container Docker no servidor local
- Cada advogado instala o App Desktop + Serviço Windows no seu notebook
- O **Serviço de Conectores** roda **apenas na máquina do advogado responsável** pelo processo
- Todos os dados gravados/lidos do PostgreSQL central são acessíveis por qualquer usuário autorizado
- Ideal para: escritórios de 2 a 20 advogados

### Regra Crítica de Execução de Conectores

> **O serviço de automação de tribunal para um processo X só roda na máquina do advogado que é o "responsável" por X.**
>
> Motivo: o certificado digital A1/A3 do advogado responsável está vinculado à sua máquina. A automação de peticionamento ou consulta autenticada **exige o certificado daquele advogado específico**.
>
> Implicação de design: o serviço Windows de cada máquina consulta o banco central, filtra apenas os processos onde `processo.advogado_responsavel_id = usuario_logado.id`, e executa os conectores somente para esses processos.

---

## 3. Arquitetura de Sistema

### 3.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES DO SISTEMA                       │
├────────────────────┬────────────────────────────────────────────┤
│ COMPONENTE         │ DESCRIÇÃO                                  │
├────────────────────┼────────────────────────────────────────────┤
│ app-desktop        │ Electron/Tauri. UI React. Lógica de negócio│
│                    │ Conecta ao banco (local ou remoto via TCP) │
├────────────────────┼────────────────────────────────────────────┤
│ windows-service    │ Serviço Windows (node-windows / NSSM).     │
│                    │ Scheduler de automação. Executa conectores │
│                    │ dos processos do advogado local.           │
│                    │ Expõe API REST local (localhost:PORT)       │
│                    │ para comunicação com o app-desktop.        │
├────────────────────┼────────────────────────────────────────────┤
│ connectors         │ Módulos independentes por tribunal.        │
│                    │ Playwright (headless). Cada conector é     │
│                    │ um plugin versionado separadamente.        │
├────────────────────┼────────────────────────────────────────────┤
│ database-engine    │ SQLite (solo) ou PostgreSQL (escritório).  │
│                    │ Mesma interface de acesso via ORM (Drizzle)│
├────────────────────┼────────────────────────────────────────────┤
│ update-service     │ Verifica repositório próprio (GitHub       │
│                    │ Releases ou S3). Valida assinatura do      │
│                    │ binário. Aplica update sem reinstalação.   │
├────────────────────┼────────────────────────────────────────────┤
│ installer          │ NSIS (Windows). Instala app + serviço +    │
│                    │ configura topologia escolhida.             │
└────────────────────┴────────────────────────────────────────────┘
```

### 3.2 Comunicação entre Componentes

```
app-desktop  ←──IPC / REST localhost──→  windows-service
     │                                         │
     │ Drizzle ORM                             │ Drizzle ORM
     ▼                                         ▼
  SQLite (solo)                         PostgreSQL (escritório)
  ou PostgreSQL via TCP

windows-service  ──Playwright──→  Tribunal (PJe, e-SAJ, eProc...)
                 ←── HTML/dados ──
```

---

## 4. Modelo de Dados — Visão Inicial

> **Nota para o agente:** O schema completo será definido e gerado via migrations Drizzle durante a Fase 1. As entidades abaixo são o ponto de partida.

### Entidades Principais

```
users                    # Usuários do sistema (advogados e outros)
├── id (uuid)
├── nome
├── email
├── oab_numero           # NULL para não-advogados
├── oab_seccional
├── role_id (→ roles)
├── certificado_a1_path  # Caminho local do .pfx (nunca gravado no banco)
├── ativo
└── created_at

roles                    # Papéis RBAC
├── id (uuid)
├── nome                 # ex: socio, advogado, estagiario, secretaria, financeiro
├── descricao
└── is_system_role       # papéis padrão não podem ser excluídos

permissions              # Permissões atômicas
├── id (uuid)
├── recurso              # ex: processos, clientes, financeiro, conectores
├── acao                 # ex: criar, ler, editar, excluir, executar
└── descricao

role_permissions         # N:N roles ↔ permissions
├── role_id
└── permission_id

clientes
├── id (uuid)
├── tipo                 # PF / PJ
├── nome / razao_social
├── cpf_cnpj
├── email, telefone
├── endereco (jsonb)
└── created_by (→ users)

processos
├── id (uuid)
├── numero_cnj           # formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
├── cliente_id (→ clientes)
├── advogado_responsavel_id (→ users)  ← CHAVE para roteamento do conector
├── tribunal_sigla       # ex: TJSP, TRF3, TRT2
├── plataforma           # ex: pje, esaj, eproc, projudi
├── area                 # civel, trabalhista, previdenciario...
├── fase                 # conhecimento, recursal, execucao...
├── status               # ativo, arquivado, encerrado
├── polo_ativo           # jsonb: partes
├── polo_passivo         # jsonb: partes
├── valor_causa
├── ultimo_sync_at       # última vez que o conector buscou dados
└── created_at

movimentacoes
├── id (uuid)
├── processo_id (→ processos)
├── data_movimento
├── descricao
├── tipo                 # despacho, sentenca, intimacao, publicacao...
├── origem               # manual | conector_pje | conector_esaj ...
├── lido                 # boolean — advogado marcou como lido
└── created_at

prazos
├── id (uuid)
├── processo_id (→ processos)
├── movimentacao_id (→ movimentacoes) # origem do prazo (pode ser NULL)
├── descricao
├── data_fatal
├── tipo_prazo           # NCPC, CLT, JEC...
├── status               # pendente, cumprido, perdido
├── responsavel_id (→ users)
└── alertas_enviados     # jsonb: {dias: [7,3,1], enviados: [...]}

honorarios
├── id (uuid)
├── processo_id / cliente_id
├── tipo                 # fixo, exito, por_hora
├── valor
├── percentual_exito
├── status               # pendente, recebido, inadimplente
└── vencimento

agenda
├── id (uuid)
├── titulo
├── tipo                 # audiencia, diligencia, reuniao, prazo
├── data_hora_inicio
├── data_hora_fim
├── processo_id (nullable)
├── participantes        # jsonb: [user_id, ...]
└── local

documentos
├── id (uuid)
├── processo_id / cliente_id
├── nome
├── caminho_local        # path relativo à pasta de dados do escritório
├── tipo_mime
├── tamanho_bytes
├── versao
├── hash_sha256          # integridade do arquivo
└── uploaded_by (→ users)

connector_logs
├── id (uuid)
├── processo_id (→ processos)
├── conector_nome        # pje_trf, esaj_tjsp...
├── maquina_hostname     # hostname da máquina que executou
├── status               # sucesso, erro, timeout, captcha
├── detalhes             # jsonb: erro, movimentações encontradas...
├── duracao_ms
└── executado_at

licencas
├── id (uuid)
├── chave_licenca        # hash assinado verificado pelo update-service
├── plano                # solo, escritorio, equipe
├── seats_contratados
├── validade_ate
└── features_ativas      # jsonb: lista de módulos liberados
```

---

## 5. RBAC — Controle de Acesso Baseado em Papéis

### 5.1 Design do Sistema

O RBAC segue o modelo **Role → Permissions** com granularidade por `recurso + ação`. Papéis padrão são criados automaticamente na instalação (seed). O sistema permite criação de papéis customizados pelo sócio administrador.

### 5.2 Papéis Padrão do Sistema

| Papel | Descrição | Pode ser excluído? |
|---|---|---|
| `admin` | Sócio administrador. Acesso total. Gerencia usuários, licença e configurações. | Não |
| `socio` | Sócio sem privilégios de admin. Acesso total a todos os processos e financeiro. | Não |
| `advogado` | Acesso pleno a processos próprios. Leitura de processos da equipe. Sem acesso a financeiro de terceiros. | Não |
| `estagiario` | Leitura de processos atribuídos. Sem peticionamento. Sem acesso financeiro. | Não |
| `secretaria` | Gestão de agenda, clientes, documentos. Sem acesso a financeiro nem conectores. | Não |
| `financeiro` | Acesso exclusivo ao módulo financeiro. Leitura de processos (sem movimentações). | Não |

### 5.3 Matriz de Permissões Iniciais

| Recurso → Ação | admin | socio | advogado | estagiario | secretaria | financeiro |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `processos:criar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `processos:ler_todos` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `processos:ler_proprios` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `processos:editar` | ✅ | ✅ | ✅ (próprios) | ❌ | ❌ | ❌ |
| `processos:excluir` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `conectores:executar` | ✅ | ✅ | ✅ (próprios) | ❌ | ❌ | ❌ |
| `financeiro:ler` | ✅ | ✅ | ✅ (próprios) | ❌ | ❌ | ✅ |
| `financeiro:editar` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `clientes:criar` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `clientes:ler` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `usuarios:gerenciar` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `licenca:gerenciar` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `relatorios:financeiros` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `agenda:gerenciar_todos` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### 5.4 Regras de Negócio RBAC

1. **Escopo de dados:** A permissão `processos:ler_proprios` implica que a query sempre filtrará `WHERE advogado_responsavel_id = :userId` ou `WHERE processo_id IN (SELECT processo_id FROM processo_participantes WHERE user_id = :userId)`.

2. **Propagação para conectores:** Um advogado só pode acionar manualmente o conector de um processo se for o `advogado_responsavel` daquele processo.

3. **Imutabilidade de papéis sistema:** Os papéis marcados como `is_system_role = true` não podem ter seu nome ou permissões-base alterados. O admin pode criar papéis adicionais customizados.

4. **Auditoria:** Toda alteração de permissões, criação/remoção de usuários e mudança de responsável em processos deve gerar registro em tabela `audit_log` com `user_id`, `acao`, `recurso`, `recurso_id`, `timestamp` e `payload_anterior` (JSON).

5. **Primeiro usuário:** Durante a instalação/setup inicial, o primeiro usuário criado recebe automaticamente o papel `admin` e não pode ser removido enquanto for o único admin ativo.

---

## 6. Modelo de Conectores e Regra de Execução Local

### 6.1 Interface de Conector

Cada conector é um módulo Node.js que implementa a interface `IConector`:

```typescript
interface IConector {
  nome: string;           // 'pje_trf' | 'esaj_tjsp' | 'eproc_trf4'
  plataforma: string;     // 'pje' | 'esaj' | 'eproc'
  versao: string;         // semver
  tribunaisSuportados: string[];  // ['TRF1','TRF2','TRF3','TRF4','TRF5','TRF6']

  // Verifica se o conector consegue conectar ao tribunal
  testarConexao(config: ConfigConector): Promise<ResultadoTeste>;

  // Busca movimentações novas desde a última sincronização
  buscarMovimentacoes(
    processo: ProcessoMinimo,
    certificado: CertificadoConfig,
    ultimoSync: Date
  ): Promise<Movimentacao[]>;

  // Futuro (v1.5+): peticionamento eletrônico
  peticionar?(
    processo: ProcessoMinimo,
    documento: Buffer,
    certificado: CertificadoConfig
  ): Promise<ResultadoPeticionamento>;
}
```

### 6.2 Fluxo de Execução do Serviço Windows

```
[Serviço Windows — roda no notebook do advogado]

A cada X minutos (configurável, padrão: 30min):

1. Consultar banco → buscar processos WHERE:
   - advogado_responsavel_id = ID_DO_USUARIO_DESTA_MAQUINA
   - status = 'ativo'
   - (ultimo_sync_at IS NULL OR ultimo_sync_at < NOW() - INTERVAL '30 minutes')

2. Para cada processo:
   a. Identificar plataforma (pje, esaj, eproc...)
   b. Carregar conector correspondente
   c. Carregar certificado A1 da máquina local (NUNCA do banco)
   d. Executar conector.buscarMovimentacoes()
   e. Gravar movimentações novas no banco
   f. Atualizar processo.ultimo_sync_at
   g. Gravar connector_log (sucesso ou erro)
   h. Se nova intimação → trigger de alerta (toast no app + registro em prazos)

3. Reportar status ao app-desktop via REST local (localhost:PORTA)
```

### 6.3 Gerenciamento de Certificado Digital

- O caminho do certificado A1 (`.pfx`) é configurado **por usuário, por máquina**, armazenado em `app_config` local (não no banco central).
- A **senha do certificado** é armazenada no **Windows Credential Manager** (nunca em arquivo, nunca no banco).
- Certificados A3 (smartcard/token): suporte planejado para v1.5 via PKCS#11. No MVP, documentar como limitação conhecida.
- O serviço nunca transmite o certificado para nenhum destino externo.

---

## 7. Fases de Desenvolvimento

---

### FASE 0 — Fundação (Semanas 1–4)

**Objetivo:** Repositório estruturado, ambiente de desenvolvimento estável, decisões técnicas documentadas, primeiros schemas validados.

#### Tarefas

- [ ] **F0.1** — Criar repositório GitHub com estrutura de pastas definida neste documento
- [ ] **F0.2** — Configurar monorepo com `pnpm workspaces` (packages: `app-desktop`, `windows-service`, `connectors`, `shared`, `installer`)
- [ ] **F0.3** — Configurar TypeScript estrito em todos os pacotes (`strict: true`, `noImplicitAny`, `exactOptionalPropertyTypes`)
- [ ] **F0.4** — Configurar ESLint + Prettier com regras unificadas
- [ ] **F0.5** — Configurar Vitest para testes unitários
- [ ] **F0.6** — Decisão de stack desktop: **prototipar conector PJe em Electron E Tauri** — Rodrigo decide com base no resultado real de acesso a certificado A1
- [ ] **F0.7** — Definir schema inicial Drizzle ORM (entidades da Seção 4)
- [ ] **F0.8** — Criar primeira migration para SQLite (modo solo)
- [ ] **F0.9** — Criar primeira migration para PostgreSQL (modo escritório)
- [ ] **F0.10** — Seed de dados: papéis e permissões padrão (Seção 5)
- [ ] **F0.11** — Protótipo de UI: tela de setup inicial (escolha de topologia)
- [ ] **F0.12** — Configurar CI (GitHub Actions): lint + testes a cada push

#### Entregáveis

- Repositório GitHub com README, estrutura de pastas e CI funcionando
- Schema de banco documentado e migrations funcionando (SQLite + PostgreSQL)
- Decisão de Electron vs Tauri documentada em `docs/decisoes/ADR-001-framework-desktop.md`
- Primeiro protótipo de tela (setup wizard)

#### Validações

- Michele: revisar entidades de dados jurídicos (nomenclaturas, campos obrigatórios)
- Diana: revisar fluxo do setup wizard (experiência do primeiro acesso)

---

### FASE 1 — MVP Core (Semanas 5–14)

**Objetivo:** Sistema funcional com ERP jurídico básico, dois conectores P1 ativos, instalável em modo solo. Validação com 10 escritórios beta.

#### Módulo 1.1 — Autenticação e RBAC

- [ ] **1.1.1** — Tela de login local (email + senha — sem OAuth externo)
- [ ] **1.1.2** — Hash de senha com `bcrypt` (custo ≥ 12)
- [ ] **1.1.3** — Sessão por JWT assinado localmente (chave gerada na instalação, armazenada em Windows Credential Manager)
- [ ] **1.1.4** — Middleware RBAC no backend do app-desktop: verificar `permission` antes de cada operação
- [ ] **1.1.5** — Tela de gestão de usuários (admin)
- [ ] **1.1.6** — Tela de gestão de papéis e permissões (admin)
- [ ] **1.1.7** — Setup wizard: criação do primeiro usuário admin
- [ ] **1.1.8** — Audit log: registrar todas as ações sensíveis

#### Módulo 1.2 — ERP Core

- [ ] **1.2.1** — CRUD de Clientes (PF e PJ) com validação de CPF/CNPJ
- [ ] **1.2.2** — CRUD de Processos com número CNJ validado
- [ ] **1.2.3** — Vinculação processo ↔ cliente ↔ advogado responsável
- [ ] **1.2.4** — Timeline de movimentações por processo
- [ ] **1.2.5** — Módulo de Prazos: cadastro manual + alertas escalonados (7, 3, 1 dia)
- [ ] **1.2.6** — Agenda unificada (visualização mensal/semanal)
- [ ] **1.2.7** — Módulo financeiro básico: honorários e contas a receber
- [ ] **1.2.8** — Dashboard inicial: processos ativos, prazos próximos, pendências

#### Módulo 1.3 — Conectores P1

- [ ] **1.3.1** — Interface `IConector` implementada e testada
- [ ] **1.3.2** — Conector PJe (TRFs 1–6): busca de movimentações e intimações
- [ ] **1.3.3** — Conector e-SAJ / TJSP: busca de movimentações e certidões
- [ ] **1.3.4** — Configuração de certificado A1 por usuário (UI + Windows Credential Manager)
- [ ] **1.3.5** — Serviço Windows: instalação, start/stop, schedule configurável
- [ ] **1.3.6** — API REST local (localhost): status do serviço, logs, fila de execução
- [ ] **1.3.7** — UI de status dos conectores: última execução, erros, progresso
- [ ] **1.3.8** — Testes dos conectores com processos reais de Michele Fagundes

#### Módulo 1.4 — Instalador

- [ ] **1.4.1** — Instalador NSIS para Windows (modo solo)
- [ ] **1.4.2** — Setup wizard de topologia (solo vs escritório)
- [ ] **1.4.3** — Criação automática do serviço Windows no modo solo
- [ ] **1.4.4** — Desinstalador limpo (remove serviço, mantém dados)

#### Entregáveis da Fase 1

- Aplicativo instalável no Windows em modo solo
- 2 conectores P1 funcionando em condições reais
- RBAC completo com os 6 papéis padrão
- 10 escritórios beta instalados e usando
- NPS ≥ 7 após 2 semanas de uso

---

### FASE 2 — v1.0 Lançamento Público (Semanas 15–22)

**Objetivo:** Topologia escritório (multi-usuário + PostgreSQL), conector trabalhista, módulo de documentos, lançamento público.

#### Módulo 2.1 — Topologia Escritório

- [ ] **2.1.1** — Configurar conexão com PostgreSQL remoto (TCP, SSL opcional)
- [ ] **2.1.2** — Adaptar Drizzle ORM para PostgreSQL sem alterar a lógica de negócio
- [ ] **2.1.3** — Installer: modo escritório (configurar IP/porta do servidor)
- [ ] **2.1.4** — Docker Compose para servidor local (PostgreSQL + volume de dados)
- [ ] **2.1.5** — Guia de instalação do servidor (mini-PC / NAS) em linguagem não-técnica
- [ ] **2.1.6** — Sincronização: `ultimo_sync_at` por máquina para evitar conflito de conectores

#### Módulo 2.2 — Conector Trabalhista

- [ ] **2.2.1** — Conector PJe Trabalhista (TRTs): movimentações, leilões, perícias
- [ ] **2.2.2** — Campos específicos de processo trabalhista (CTPS, reclamatória, TRCT...)

#### Módulo 2.3 — Módulo de Documentos

- [ ] **2.3.1** — Upload e download de documentos por processo/cliente
- [ ] **2.3.2** — Armazenamento em pasta local do servidor (modo escritório) ou notebook (modo solo)
- [ ] **2.3.3** — Hash SHA-256 por documento (integridade)
- [ ] **2.3.4** — Versionamento de documentos
- [ ] **2.3.5** — Busca full-text nos documentos (SQLite FTS5 / PostgreSQL tsvector)

#### Módulo 2.4 — Update Service

- [ ] **2.4.1** — Serviço de verificação de atualizações (GitHub Releases)
- [ ] **2.4.2** — Validação de assinatura criptográfica do binário antes de instalar
- [ ] **2.4.3** — Verificação de licença antes de aplicar update
- [ ] **2.4.4** — Atualização silenciosa de conectores (sem reinstalar o app)

#### Módulo 2.5 — Licenciamento

- [ ] **2.5.1** — Validação de chave de licença (offline-first com revalidação semanal)
- [ ] **2.5.2** — Controle de seats ativos vs contratados
- [ ] **2.5.3** — Tela de status da licença (validade, plano, seats)
- [ ] **2.5.4** — Bloqueio gracioso: aviso 30 dias antes da expiração, modo somente-leitura após

#### Entregáveis da Fase 2

- Instalador Windows para modo escritório
- Conector trabalhista (TRT) ativo
- Módulo de documentos completo
- Update service funcionando
- Página de vendas + checkout ativo
- 50 licenças vendidas

---

### FASE 3 — v1.5 Expansão (Semanas 23–28)

- Conectores P2: TJRS, TJSC, TJPR, TJMG
- Módulo de IA (opt-in, chave própria do escritório)
- Suporte a certificado A3 (PKCS#11)
- Backup criptografado opcional
- Relatórios financeiros avançados

### FASE 4 — v2.0 (Semanas 29–36)

- Portal do cliente (web, hospedado pelo escritório)
- App mobile leve (consulta + aprovação de prazos)
- API de integração para escritórios com sistemas próprios

---

## 8. Stack Tecnológica Definida

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Framework Desktop** | Electron (MVP) → avaliar Tauri em v2.0 | Velocidade de dev; Rodrigo domina Node.js |
| **Frontend** | React + TypeScript + Tailwind CSS | Padrão maduro; reutilizável em futuro web |
| **ORM** | Drizzle ORM | Type-safe; suporta SQLite e PostgreSQL com mesma API |
| **Banco Solo** | SQLite via `better-sqlite3` | Zero config; arquivo portátil |
| **Banco Escritório** | PostgreSQL 16 em Docker | Robusto; suporte a JSONB; escala horizontal |
| **Automação Web** | Playwright (headless Chromium) | Mantido Microsoft; melhor suporte a certificados |
| **Serviço Windows** | `node-windows` + PM2 ou NSSM | Registro como serviço Windows nativo |
| **Validação** | Zod | Type-safe runtime validation; integra com Drizzle |
| **Testes** | Vitest + Playwright Test | Unitários + E2E dos conectores |
| **Monorepo** | pnpm workspaces | Performance; workspace protocol |
| **CI/CD** | GitHub Actions | Lint, testes, build, release automatizado |
| **Instalador** | Electron Builder (NSIS) | Gera instalador .exe assinado |
| **Code Signing** | `electron-builder` + certificado EV | Binários assinados; evita alertas SmartScreen |
| **Gerenciamento de segredos locais** | Windows Credential Manager via `keytar` | Senhas de certificado nunca em arquivo |
| **Build** | Vite (frontend) + esbuild (services) | Velocidade de build |

---

## 9. Padrões de Segurança e Boas Práticas

### 9.1 Regras Inegociáveis

1. **Nenhum dado de processo ou cliente sai da rede local** — exceto quando o usuário aciona IA opt-in com sua própria chave, com consentimento explícito por sessão.

2. **Senhas nunca em texto plano** — bcrypt com custo ≥ 12. Nunca em log, nunca em arquivo de config.

3. **Certificados digitais nunca no banco de dados** — apenas o caminho do arquivo. Senha do certificado no Windows Credential Manager via `keytar`.

4. **Toda entrada do usuário validada com Zod** antes de chegar ao banco.

5. **Queries parametrizadas sempre** — Drizzle ORM garante por padrão. Nenhuma query com string concatenada.

6. **Audit log imutável** — a tabela `audit_log` não tem UPDATE nem DELETE. Apenas INSERT. Verificado por policy no PostgreSQL (modo escritório) e por trigger no SQLite (modo solo).

7. **JWT local assinado com chave gerada na instalação** — chave em Windows Credential Manager. Token expira em 8h. Refresh token com rotação a cada uso.

8. **Atualizações verificadas por assinatura criptográfica** — binário baixado pelo update-service é verificado antes de ser executado.

9. **Logs de conectores sem dados sensíveis** — `connector_logs` armazena status e erros técnicos, nunca conteúdo de petições ou dados de partes.

### 9.2 Considerações LGPD

- O `admin` do escritório é o **operador** dos dados; o escritório é o **controlador**.
- Nenhum dado pessoal de clientes do escritório é processado pela empresa desenvolvedora.
- O módulo de IA exibe aviso de consentimento a cada sessão até o usuário optar por não exibir novamente.
- Funcionalidade futura: exportação de dados por cliente (direito de acesso, Art. 18 LGPD).

---

## 10. Estrutura do Repositório

```
jurislocal/                          # raiz do monorepo
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # lint + testes em todo PR
│       └── release.yml              # build + code signing + GitHub Release
│
├── packages/
│   ├── shared/                      # tipos TypeScript compartilhados, Zod schemas,
│   │   ├── src/                     # utilitários, constantes
│   │   │   ├── types/
│   │   │   │   ├── processo.ts
│   │   │   │   ├── usuario.ts
│   │   │   │   ├── rbac.ts
│   │   │   │   └── conector.ts
│   │   │   ├── schemas/             # Zod schemas (validação runtime)
│   │   │   └── constants/
│   │   └── package.json
│   │
│   ├── database/                    # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema/              # definição das tabelas
│   │   │   │   ├── usuarios.ts
│   │   │   │   ├── processos.ts
│   │   │   │   ├── rbac.ts
│   │   │   │   └── ...
│   │   │   ├── migrations/          # arquivos gerados pelo drizzle-kit
│   │   │   ├── seeds/               # papéis padrão, permissões padrão
│   │   │   └── client.ts            # factory: retorna SQLite ou PostgreSQL client
│   │   └── package.json
│   │
│   ├── connectors/                  # módulos de automação de tribunais
│   │   ├── src/
│   │   │   ├── interface.ts         # IConector
│   │   │   ├── pje-trf/             # conector PJe para TRFs
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.ts          # login com certificado A1
│   │   │   │   ├── movimentacoes.ts
│   │   │   │   └── pje-trf.test.ts
│   │   │   ├── esaj-tjsp/           # conector e-SAJ/TJSP
│   │   │   │   └── ...
│   │   │   └── registry.ts          # mapa plataforma → conector
│   │   └── package.json
│   │
│   ├── windows-service/             # serviço Windows de automação
│   │   ├── src/
│   │   │   ├── main.ts              # entry point do serviço
│   │   │   ├── scheduler.ts         # agenda execuções
│   │   │   ├── executor.ts          # roda conectores para processos do advogado local
│   │   │   ├── certificate.ts       # acessa certificado A1 via keytar
│   │   │   └── api-local.ts         # REST API localhost para comunicação com app
│   │   ├── install-service.ts       # registra como serviço Windows
│   │   ├── uninstall-service.ts
│   │   └── package.json
│   │
│   └── app-desktop/                 # aplicação Electron
│       ├── electron/
│       │   ├── main.ts              # processo principal Electron
│       │   ├── preload.ts           # bridge IPC segura
│       │   └── ipc-handlers/        # handlers de IPC por domínio
│       ├── src/                     # React frontend
│       │   ├── pages/
│       │   │   ├── setup/           # wizard instalação
│       │   │   ├── login/
│       │   │   ├── dashboard/
│       │   │   ├── processos/
│       │   │   ├── clientes/
│       │   │   ├── agenda/
│       │   │   ├── financeiro/
│       │   │   ├── conectores/
│       │   │   └── configuracoes/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── store/               # Zustand ou Jotai
│       │   └── lib/
│       │       ├── rbac.ts          # hooks de verificação de permissão no frontend
│       │       └── api.ts           # chamadas IPC para o processo principal
│       ├── electron-builder.config.js
│       └── package.json
│
├── docs/
│   ├── decisoes/
│   │   ├── ADR-001-framework-desktop.md
│   │   ├── ADR-002-banco-de-dados.md
│   │   └── ADR-003-conectores-headless.md
│   ├── arquitetura/
│   │   └── visao-geral.md
│   └── onboarding/
│       └── guia-instalacao-escritorio.md
│
├── scripts/
│   ├── setup-dev.sh                 # configura ambiente de desenvolvimento
│   └── seed-dev-data.ts             # dados de teste para desenvolvimento
│
├── .env.example                     # variáveis de ambiente (sem valores sensíveis)
├── .gitignore
├── pnpm-workspace.yaml
├── package.json                     # root: scripts globais
├── tsconfig.base.json               # config TS base compartilhada
└── PLANO_DESENVOLVIMENTO_MVP.md     # este documento
```

---

## 11. Definition of Done por Fase

### Fase 0 — Concluída quando:
- [ ] Repositório público no GitHub com CI verde
- [ ] Schema de banco criado e migrations rodando (SQLite e PostgreSQL)
- [ ] Seed de papéis/permissões padrão executando sem erros
- [ ] Decisão de Electron vs Tauri documentada em ADR-001
- [ ] Michele validou as entidades jurídicas do schema

### Fase 1 (MVP) — Concluída quando:
- [ ] Instalador funciona em Windows 10 e 11 (64-bit)
- [ ] 10 escritórios beta instalados com dados reais
- [ ] Conectores PJe TRF e e-SAJ TJSP executando sem erros por 7 dias consecutivos
- [ ] RBAC: todos os 6 papéis padrão funcionando e testados
- [ ] NPS da fase beta ≥ 7
- [ ] Zero vulnerabilidades críticas no audit de segurança (npm audit)

### Fase 2 (v1.0) — Concluída quando:
- [ ] Topologia escritório funcionando com ≥ 2 notebooks em rede local
- [ ] Update service atualizando conectores sem reinstalação
- [ ] Licenciamento validado (offline + revalidação semanal)
- [ ] Conector TRT ativo e testado
- [ ] 50 licenças vendidas

---

## 12. Decisões em Aberto

| # | Decisão | Opções | Prazo | Responsável |
|---|---|---|---|---|
| D1 | Framework desktop: Electron vs Tauri | Prototipar ambos com conector PJe | Semana 3 | Rodrigo |
| D2 | Gerenciador de estado React: Zustand vs Jotai vs TanStack Query | Avaliar complexidade real do estado | Semana 5 | Rodrigo |
| D3 | Comunicação app ↔ serviço Windows: REST localhost vs IPC nativo vs Named Pipes | Avaliar latência e facilidade de debug | Semana 6 | Rodrigo |
| D4 | Estratégia de licenciamento offline: JWT assinado local vs fingerprint de hardware | Avaliar UX em caso de troca de máquina | Semana 8 | Rodrigo + Diana |
| D5 | Distribuição do instalador: GitHub Releases vs site próprio vs ambos | Depende da estratégia de compra | Semana 12 | Diana + Rodrigo |

---

## Próximos Passos Imediatos

```
Semana 1:
  - [ ] Criar repositório GitHub: github.com/[org]/jurislocal
  - [ ] Fazer commit deste arquivo como PLANO_DESENVOLVIMENTO_MVP.md
  - [ ] Configurar pnpm workspaces com a estrutura de packages
  - [ ] Configurar TypeScript base + ESLint + Prettier
  - [ ] Criar package `database` com schema Drizzle inicial

Semana 2:
  - [ ] Primeira migration SQLite rodando
  - [ ] Seed de roles/permissions executando
  - [ ] Início do protótipo Electron com tela de login
  - [ ] Diana + Michele recrutam os 10 escritórios beta
```

---

> **Para o agente de coding:** Você leu o plano completo.
>
> Agora, analise as tarefas da **Fase 0** e da **Fase 1 — Módulo 1.1 (Autenticação e RBAC)**.
> Considere as decisões técnicas, a estrutura de pastas, o schema de banco e os padrões de segurança descritos.
>
> Sugira como iniciaremos a **primeira sessão de desenvolvimento**:
> 1. Qual o primeiro comando a executar no terminal?
> 2. Quais os primeiros 3 arquivos a criar e com qual conteúdo inicial?
> 3. Existe alguma dependência de instalação (Node.js, pnpm, Docker) que deve ser verificada antes de começar?
> 4. Há algum ponto do plano que você recomenda ajustar antes de iniciar o código?

---

*Versão 1.0 · Março de 2026 · Rodrigo S. da Rocha · Confidencial*
