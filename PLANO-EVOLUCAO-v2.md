# CAUSA — Plano de Evolução v2

> **Visão**: O advogado brasileiro não precisa mais se conectar a dezenas de tribunais.
> O Escritório Digital do CNJ já faz isso. O **CAUSA** se posiciona como o sistema que
> garante: **"Nunca perca nenhum prazo dos seus processos!"** — trazendo diferenciais
> na gestão do dia a dia, organização documental, alertas inteligentes e IA assistiva.

---

## Sumário das Frentes

| # | Frente | Prioridade | Dependência |
|---|--------|-----------|-------------|
| 1 | Integração CNJ Escritório Digital | Alta (ad-hoc) | Certificado A1 da advogada |
| 2 | Google Drive — Gestão Documental | Alta | Google Cloud Console |
| 3 | Alertas de Prazos (Agenda + Telegram) | Alta | Google/Microsoft OAuth + Bot Telegram |
| 4 | Tabela de Honorários e Serviços | Média | — |
| 5 | IA Assistente do Escritório | Média | Chave de API do advogado |

---

## 1. Integração CNJ — Escritório Digital

### 1.1 Contexto

O [Escritório Digital do CNJ](https://www.cnj.jus.br/sistemas/escritorio-digital/) é um sistema
que "conversa" com todos os tribunais brasileiros via o padrão **MNI 2.2.2** (Modelo Nacional de
Interoperabilidade). Permite consultar andamento, receber intimações, enviar petições e controlar
prazos — tudo em um só ambiente.

**Impacto**: Ao consumir dados do Escritório Digital, eliminamos a necessidade de múltiplos
conectores individuais (PJe, e-SAJ, Projudi, etc.). O CAUSA deixa de precisar manter dezenas
de integrações e passa a ter **um único ponto de entrada** para todos os tribunais.

### 1.2 Autenticação

- **Certificado Digital A1** (já previsto na tela de configurações do CAUSA)
- O Escritório Digital aceita login via certificado digital do advogado (ICP-Brasil)
- Alternativa: login com CPF + senha (menos comum em automações)

### 1.3 Operações disponíveis via MNI

| Operação | Descrição |
|----------|-----------|
| `ConsultarAvisosPendentes` | Intimações e citações pendentes de leitura |
| `ConsultarProcesso` | Dados completos de um processo (partes, movimentações, documentos) |
| `ConsultarTeorComunicacao` | Conteúdo de uma intimação/citação |

### 1.4 Plano de implementação

> **Nota**: Esta frente será executada **ad-hoc** no escritório da advogada parceira,
> com acesso ao certificado digital real.

**Etapa 1 — Pesquisa e prototipagem (no escritório)**
- [ ] Capturar as chamadas SOAP/REST que o Escritório Digital faz aos tribunais
- [ ] Identificar endpoints MNI e formatos de request/response
- [ ] Criar POC de consulta com o certificado A1 da advogada
- [ ] Documentar a estrutura de dados retornada (mapeamento → schema do CAUSA)

**Etapa 2 — Conector CNJ no CAUSA**
- [ ] Novo conector `cnj-escritorio-digital` em `packages/database/src/services/`
- [ ] Tela de configuração: upload do certificado A1 + senha do certificado
- [ ] Armazenamento seguro do certificado (criptografado em disco, nunca no DB)
- [ ] Sync automático: ao ativar, o CAUSA importa todos os processos vinculados ao OAB do advogado

**Etapa 3 — Sincronização contínua**
- [ ] Job periódico (configurável: a cada 30min, 1h, 2h) que consulta `ConsultarAvisosPendentes`
- [ ] Para cada aviso: verificar se o processo já existe no CAUSA, criar se não existir
- [ ] Importar movimentações novas automaticamente
- [ ] Marcar prazos automaticamente a partir de intimações recebidas
- [ ] Notificar o advogado sobre novas intimações (toast + badge no sidebar)

**Etapa 4 — Depreciação dos conectores individuais**
- [ ] Manter conectores existentes como fallback
- [ ] Na tela de Conectores, exibir badge "Recomendado: Escritório Digital CNJ"

### 1.5 Fontes complementares

- [API Pública DataJud](https://www.cnj.jus.br/sistemas/datajud/api-publica/) — metadados públicos de processos (não requer certificado)
- [PDPJ-Br](https://docs.pdpj.jus.br/) — plataforma REST do judiciário (contato: integracaopdpj@cnj.jus.br)
- [MNI 2.2.2](https://www.cnj.jus.br/sistemas/escritorio-digital/como-funciona/) — especificação de interoperabilidade

---

## 2. Google Drive — Gestão Documental

### 2.1 Visão geral

Substituir o armazenamento de documentos em banco de dados (campo `conteudo` base64 na tabela
`documentos`) por uma integração com Google Drive. Isso traz:

- **Escalabilidade**: sem limite prático de armazenamento
- **Colaboração**: pastas compartilhadas com o cliente
- **Organização**: estrutura de pastas padronizada e navegável
- **Segurança**: documentos ficam na conta Google do escritório

### 2.2 Estrutura de pastas

```
Google Drive do Escritório
└── CAUSA/
    ├── João da Silva/
    │   ├── Indexados/
    │   │   ├── _Geral/                          ← Docs vinculados só ao cliente
    │   │   │   ├── RG - João da Silva.pdf
    │   │   │   └── Comprovante Residência.pdf
    │   │   └── 0001234-56.2025.8.26.0100/       ← Pasta por processo (nº CNJ)
    │   │       ├── Petição Inicial.pdf
    │   │       ├── Procuração.pdf
    │   │       └── Sentença.docx
    │   └── Compartilhados/                       ← Compartilhada com o cliente
    │       └── (arquivos enviados pelo cliente aparecem aqui)
    │
    ├── Maria Souza/
    │   ├── Indexados/
    │   │   ├── _Geral/
    │   │   └── 0009876-12.2024.5.02.0001/
    │   └── Compartilhados/
    │
    └── _Configuração/                            ← Metadados do CAUSA (não compartilhar)
        └── causa-sync.json
```

### 2.3 Fluxo de trabalho

**Upload pelo sistema (advogado):**
1. Advogado faz upload via modal do CAUSA (já existente)
2. Sistema envia arquivo para `CAUSA/{Cliente}/Indexados/{Processo ou _Geral}/`
3. Registra no banco apenas: `id`, `nome`, `driveFileId`, `drivePath`, `processoId`, `clienteId`, metadados
4. Conteúdo não fica mais no SQLite/PG

**Upload pelo cliente (via pasta compartilhada):**
1. Advogado compartilha a pasta `Compartilhados` do cliente com o email do cliente
2. Cliente sobe arquivos na pasta (via Google Drive web/app)
3. CAUSA monitora a pasta via polling ou webhook (`changes.watch`)
4. Novos arquivos aparecem em **"Documentos Recebidos"** (nova tela)

**Classificação de documento recebido:**
1. Advogado abre "Documentos Recebidos"
2. Para cada arquivo: define categoria, vincula a processo (ou só ao cliente), adiciona descrição
3. Ao classificar → arquivo move de `Compartilhados/` para `Indexados/{destino}/`
4. Item sai da lista de "Documentos Recebidos"

**Visualização com caminho físico:**
- Na visualização de qualquer documento, exibir botão **"Ver caminho no Drive"**
- Ao clicar, exibe um breadcrumb: `CAUSA > João da Silva > Indexados > 0001234-56... > Petição Inicial.pdf`
- Com link clicável que abre a pasta no Google Drive (URL `https://drive.google.com/drive/folders/{id}`)

### 2.4 Configuração (tela de Configurações gerais)

Nova seção **"Google Drive"** na página de configurações:

```
┌─────────────────────────────────────────────────────┐
│  Google Drive                                        │
│                                                      │
│  Conecte uma conta Google Drive para armazenar       │
│  documentos do escritório.                           │
│                                                      │
│  Status: ● Conectado (fulano@gmail.com)              │
│  Pasta raiz: CAUSA                                   │
│                                                      │
│  [Reconectar]  [Desconectar]                        │
│                                                      │
│  ☑ Monitorar pasta Compartilhados a cada 5 min      │
│  ☑ Criar estrutura de pastas automaticamente         │
└─────────────────────────────────────────────────────┘
```

### 2.5 Implementação técnica

**Backend (packages/database):**
- [ ] Novo serviço `google-drive.ts` com:
  - OAuth2 flow (scope: `drive.file` — acesso apenas a arquivos criados pelo app)
  - `criarEstruturaPastas(clienteNome)` — cria `Indexados/`, `_Geral/`, `Compartilhados/`
  - `uploadArquivo(parentFolderId, nome, conteudo, mimeType)` → retorna `fileId`
  - `moverArquivo(fileId, novoParentId)`
  - `compartilharPasta(folderId, emailCliente, role='reader')`
  - `listarArquivosNovos(folderId, pageToken?)` — polling de novos arquivos
  - `obterCaminhoCompleto(fileId)` → array de breadcrumbs com `{nome, driveUrl}`
  - `downloadArquivo(fileId)` → stream
- [ ] Migração: adicionar colunas `drive_file_id`, `drive_path` em `documentos`
- [ ] Migração: tornar `conteudo` nullable (manter para fallback/offline)
- [ ] Tabela `drive_config`: `{ id, accessToken, refreshToken, email, pastaRaizId, createdAt }`
- [ ] Tabela `documentos_recebidos`: `{ id, driveFileId, nomeArquivo, clienteId, pastaOrigem, status, createdAt }`

**Frontend (packages/app-desktop):**
- [ ] Seção "Google Drive" na página de configurações
- [ ] Botão OAuth2 "Conectar Google Drive" → redirect flow
- [ ] Nova página "Documentos Recebidos" no sidebar
- [ ] Card de classificação com dropdowns (categoria, processo)
- [ ] No DocumentoViewer: breadcrumb com caminho no Drive
- [ ] No upload de documento: enviar para Drive em vez de base64 no DB

**API (api-server.ts):**
- [ ] `GET /api/drive/auth-url` — gera URL do OAuth2
- [ ] `GET /api/drive/callback?code=...` — troca code por token
- [ ] `GET /api/drive/status` — status da conexão
- [ ] `DELETE /api/drive/disconnect` — desconecta
- [ ] `GET /api/documentos-recebidos` — lista arquivos pendentes de classificação
- [ ] `POST /api/documentos-recebidos/:id/classificar` — classifica e move

### 2.6 Dependências

```
googleapis          ← Google APIs client (Drive, OAuth2)
```

---

## 3. Alertas de Prazos — Agenda + Telegram

### 3.1 Visão geral

O diferencial central do CAUSA: **"Nunca perca nenhum prazo!"**

Dois canais de alerta:
1. **Agenda** (Google Calendar ou Microsoft 365) — compromisso automático
2. **Telegram Bot** — mensagens de alerta pontual e resumos periódicos

### 3.2 Sincronização com Agenda (Google Calendar / Microsoft 365)

**Configuração do usuário** (tela "Meu Perfil / Minha Conta"):

```
┌─────────────────────────────────────────────────────┐
│  Sincronização de Agenda                             │
│                                                      │
│  Provedor: ○ Google Calendar  ○ Microsoft 365        │
│                                                      │
│  Status: ● Conectado (advogado@gmail.com)            │
│                                                      │
│  Antecedência para alertas de prazo:                 │
│  [  10  ] dias antes do vencimento                   │
│                                                      │
│  ☑ Criar compromisso automaticamente para prazos     │
│  ☐ Incluir prazos cumpridos na agenda                │
│                                                      │
│  [Reconectar]  [Desconectar]                        │
└─────────────────────────────────────────────────────┘
```

**Formato do evento na agenda:**

```
Título:   ⚖️ PRAZO: {Descrição do prazo} — {nº CNJ}
Quando:   {data do prazo - X dias de antecedência} (dia inteiro)
Lembrete: 1 dia antes + 2 horas antes
Detalhes:
  Processo: {número CNJ completo}
  Cliente: {nome do cliente}
  Tipo: {categoria do prazo}
  Vencimento: {data fatal}
  Fatal: Sim/Não

  Observações: {observações do prazo, se houver}

  ─────────────────────────
  Gerado automaticamente pelo CAUSA
  Não edite este evento — ele será atualizado pelo sistema.
```

**Lógica de sync:**
- Ao criar/atualizar prazo → criar/atualizar evento na agenda
- Ao cumprir prazo → marcar evento como "Cumprido ✓" no título + riscar
- Ao excluir prazo → remover evento
- Armazenar `calendarEventId` no registro do prazo para referência

**Implementação técnica:**

| Item | Google Calendar | Microsoft 365 |
|------|-----------------|---------------|
| Auth | OAuth2 via `googleapis` | OAuth2 via `@azure/msal-node` |
| Scope | `calendar.events` | `Calendars.ReadWrite` |
| Criar evento | `calendar.events.insert()` | `POST /me/calendar/events` |
| Atualizar | `calendar.events.update()` | `PATCH /me/calendar/events/{id}` |
| Excluir | `calendar.events.delete()` | `DELETE /me/calendar/events/{id}` |

### 3.3 Telegram Bot — Alertas e Resumos

**Configuração geral** (tela de Configurações do sistema — admin):

```
┌─────────────────────────────────────────────────────┐
│  Telegram Bot                                        │
│                                                      │
│  Token do Bot: [••••••••••••••••••••]  [👁]          │
│  (Crie um bot via @BotFather no Telegram)            │
│                                                      │
│  Tipos de notificação:                               │
│  ☑ Alertas pontuais de prazo                         │
│  ☑ Resumo diário (08:00)                             │
│  ☐ Resumo semanal (segunda, 08:00)                   │
│                                                      │
│  Status: ● Bot conectado (@CausaAlertasBot)          │
│  [Testar envio]  [Desconectar]                      │
└─────────────────────────────────────────────────────┘
```

**Configuração do usuário** (no cadastro do usuário, campo já previsto ou novo):
- Campo `telegramChatId` — o usuário inicia conversa com o bot e envia `/start`, o bot registra o chat_id

**Tipos de mensagem:**

**a) Alerta pontual de prazo:**
```
⚠️ *PRAZO EM 3 DIAS*

📋 Prazo: Apresentar contestação
📁 Processo: 0001234-56.2025.8.26.0100
👤 Cliente: João da Silva
📅 Vencimento: 30/03/2026
🔴 Fatal: Sim

_Abra o CAUSA para mais detalhes._
```

**b) Resumo diário (enviado às 08:00):**
```
📋 *Resumo de Prazos — 20/03/2026*

🔴 *Vencendo hoje (2):*
  • Apresentar contestação — 0001234-56... (João da Silva) [FATAL]
  • Juntar documentos — 0009876-12... (Maria Souza)

🟡 *Próximos 3 dias (1):*
  • Audiência de conciliação — 0005555-78... (Pedro Santos) — 23/03

🟢 *Próximos 7 dias (3):*
  • Prazo para recurso — ... — 25/03
  • Manifestação — ... — 27/03
  • Perícia — ... — 27/03

Total: 6 prazos pendentes
```

**c) Resumo semanal (enviado segunda-feira, 08:00):**
```
📋 *Resumo Semanal — 16/03 a 22/03/2026*

Semana anterior: 4 prazos cumpridos, 0 perdidos ✅

📅 *Esta semana (5 prazos):*
  Seg 16/03: —
  Ter 17/03: Apresentar contestação (0001234...)
  Qua 18/03: —
  Qui 19/03: Juntar documentos (0009876...)
  Sex 20/03: Audiência (0005555...), Recurso (0003333...)

⚠️ *Próxima semana (2 prazos):*
  25/03: Perícia (0007777...)
  27/03: Manifestação (0008888...)
```

### 3.4 Implementação técnica

**Backend:**
- [ ] Novo serviço `calendar-sync.ts` — abstrai Google Calendar e Microsoft Graph
- [ ] Novo serviço `telegram-bot.ts` — usa `node-telegram-bot-api`
- [ ] Novo serviço `prazo-alertas.ts` — orquestra os alertas
- [ ] Scheduler (cron interno): verifica prazos a cada hora; envia resumos nos horários configurados
- [ ] Migração: `user_integrations` — `{ userId, provider, accessToken, refreshToken, config }`
- [ ] Migração: `prazos` → adicionar `calendarEventId`
- [ ] Migração: `users` → adicionar `telegramChatId`
- [ ] Migração: `configuracoes` → adicionar `telegramBotToken`, `telegramResumoConfig`

**Frontend:**
- [ ] Nova seção "Sincronização de Agenda" na página de perfil do usuário
- [ ] Botões OAuth2 "Conectar Google" / "Conectar Microsoft 365"
- [ ] Campo de antecedência (dias)
- [ ] Seção "Telegram Bot" nas configurações gerais (admin)
- [ ] Campo `Telegram Chat ID` no cadastro/perfil do usuário

**API:**
- [ ] `GET /api/user/calendar/auth-url?provider=google|microsoft`
- [ ] `GET /api/user/calendar/callback?code=...&provider=...`
- [ ] `GET /api/user/calendar/status`
- [ ] `PUT /api/user/calendar/config` — salva preferências (antecedência, etc.)
- [ ] `DELETE /api/user/calendar/disconnect`
- [ ] `POST /api/configuracoes/telegram/test` — envia mensagem de teste
- [ ] `GET /api/telegram/webhook` — endpoint para o bot receber `/start`

### 3.5 Dependências

```
googleapis                     ← Google Calendar API
@azure/msal-node              ← Microsoft OAuth2
@microsoft/microsoft-graph-client  ← Microsoft Graph API
node-telegram-bot-api          ← Telegram Bot API
node-cron                      ← Scheduler para resumos
```

---

## 4. Tabela de Honorários e Serviços

### 4.1 Visão geral

O advogado mantém uma tabela de serviços e preços, tendo sempre como referência
a tabela de honorários mínimos da OAB de sua seccional. Isso facilita a elaboração
de propostas e contratos.

### 4.2 Fluxo

**Importação da tabela OAB:**
1. Admin vai em Configurações > Tabela de Honorários OAB
2. Seleciona a seccional (SP, MG, PR, GO, PE, DF, BA, AL, etc.)
3. Faz upload do PDF da tabela da OAB (disponível nos sites das seccionais)
4. Sistema extrai os itens via parsing (ou admin cadastra manualmente)
5. Itens da OAB ficam como referência (somente leitura)

**Tabela própria do escritório:**
1. Nova página "Serviços e Honorários" no sidebar
2. Lista de serviços com colunas:
   - Serviço/Ação (ex: "Consultoria jurídica", "Defesa em ação cível", etc.)
   - Valor OAB (referência, somente leitura)
   - Valor do Escritório (editável)
   - Tipo de cobrança (fixo, por hora, percentual, êxito)
   - Observações
3. Botão "Aceitar valor OAB" que copia o valor da OAB para o campo do escritório
4. Botão "Novo Serviço" para adicionar itens que não existem na tabela OAB

### 4.3 Tela de configuração — Importação OAB

```
┌─────────────────────────────────────────────────────┐
│  Tabela de Honorários da OAB                         │
│                                                      │
│  Seccional: [ OAB/SP ▼ ]                            │
│                                                      │
│  Tabela importada: Sim (247 itens)                   │
│  Última atualização: 15/01/2026                      │
│                                                      │
│  [Reimportar PDF]  [Limpar tabela OAB]              │
│                                                      │
│  Fonte: oabsp.org.br/tabela-honorarios              │
└─────────────────────────────────────────────────────┘
```

### 4.4 Tela principal — Serviços e Honorários

```
┌──────────────────────────────────────────────────────────────────────┐
│  Serviços e Honorários                    [+ Novo Serviço]          │
│                                                                      │
│  🔍 Buscar serviço...                                               │
│  Categoria: [Todas ▼]                                                │
│                                                                      │
│  ┌────────────────────┬───────────┬──────────────┬──────────┐       │
│  │ Serviço            │ Valor OAB │ Meu Valor    │ Tipo     │       │
│  ├────────────────────┼───────────┼──────────────┼──────────┤       │
│  │ Consultoria hora   │ R$ 350,00 │ R$ 400,00    │ Por hora │       │
│  │ Ação cível simples │ R$ 4.500  │ [Aceitar OAB]│ Fixo     │       │
│  │ Defesa trabalhista │ R$ 5.000  │ R$ 6.000,00  │ Fixo     │       │
│  │ Inventário         │ R$ 8.000  │ R$ 10.000,00 │ Fixo     │       │
│  │ Divórcio consensual│ R$ 3.500  │ R$ 3.500,00  │ Fixo     │       │
│  └────────────────────┴───────────┴──────────────┴──────────┘       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.5 Implementação técnica

**Schema:**
```sql
-- Itens importados da OAB (referência, somente leitura pelo sistema)
CREATE TABLE honorarios_oab (
  id TEXT PRIMARY KEY,
  seccional TEXT NOT NULL,         -- 'SP', 'MG', 'PR', etc.
  categoria TEXT,                   -- 'cível', 'trabalhista', 'família', etc.
  descricao TEXT NOT NULL,         -- Nome do serviço
  valorMinimo REAL,                -- Valor sugerido pela OAB
  unidade TEXT,                    -- 'fixo', 'por_hora', 'percentual'
  observacoes TEXT,
  importadoEm TEXT NOT NULL
);

-- Tabela própria do escritório
CREATE TABLE servicos (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT,
  honorarioOabId TEXT REFERENCES honorarios_oab(id),  -- Link para referência OAB
  valorOab REAL,                   -- Snapshot do valor OAB (para quando não há link)
  valorEscritorio REAL,           -- Valor definido pelo escritório
  tipoCobranca TEXT NOT NULL,     -- 'fixo', 'por_hora', 'percentual', 'exito'
  observacoes TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Backend:**
- [ ] Serviço `honorarios-oab.ts` — parser de PDF da tabela OAB (com fallback manual)
- [ ] Serviço `servicos.ts` — CRUD de serviços do escritório
- [ ] API: `POST /api/honorarios-oab/importar` (upload PDF)
- [ ] API: `GET /api/honorarios-oab` (listar itens OAB)
- [ ] API: `GET/POST/PUT/DELETE /api/servicos`

**Frontend:**
- [ ] Nova página "Serviços e Honorários" no sidebar
- [ ] Seção "Tabela OAB" nas configurações
- [ ] Modal de upload/importação de PDF
- [ ] Tabela editável com comparação OAB vs. valor próprio

### 4.6 Dependências

```
pdf-parse          ← Extração de texto de PDF (para parsing da tabela OAB)
```

---

## 5. IA Assistente do Escritório

### 5.1 Princípios fundamentais

> A IA **nunca produz material pelo advogado**. Ela é sempre um **assistente que sugere melhorias**.
> O advogado mantém 100% do controle e responsabilidade sobre o trabalho.

**Guardrails:**
- IA não gera petições, contratos ou peças jurídicas do zero
- IA não toma decisões — apenas sugere
- Todas as sugestões vêm com disclaimer claro
- Histórico de interações auditável
- Prompt system robusto com limitações explícitas

### 5.2 Configuração (tela de Configurações gerais)

```
┌─────────────────────────────────────────────────────┐
│  Assistente de IA                                    │
│                                                      │
│  Provedor: ○ OpenAI  ○ Google Gemini  ○ Claude       │
│                                                      │
│  Chave de API: [••••••••••••••••••••]  [👁]          │
│  Modelo: [ gpt-4o ▼ ]                               │
│                                                      │
│  Status: ● Conectado (saldo disponível)              │
│  [Testar conexão]                                    │
│                                                      │
│  ⚠️ A IA é um assistente. Todas as sugestões        │
│  devem ser revisadas pelo advogado antes do uso.     │
└─────────────────────────────────────────────────────┘
```

### 5.3 Funcionalidades do assistente

**a) Revisão de Petição:**
- Advogado seleciona documento (PDF/DOCX) ou cola texto
- IA analisa e retorna sugestões de melhoria:
  - Clareza e coesão textual
  - Fundamentação jurídica (sugere artigos/leis relevantes)
  - Formatação e padronização
  - Pontos fracos da argumentação
- Exibição: diff-like (texto original vs. sugestão) — advogado aceita ou rejeita cada sugestão

**b) Busca de Jurisprudência:**
- Advogado descreve a tese ou seleciona um processo
- Configura escopo: UF do processo, outras UFs, tribunais superiores
- IA busca e resume jurisprudências relevantes
- Retorno: lista de decisões com ementa resumida, tribunal, data, e relevância estimada
- **Importante**: IA indica claramente quando não encontra resultados; nunca inventa citações

**c) Resumo de Movimentações:**
- Para processos com muitas movimentações, IA gera resumo cronológico
- Destaca pontos críticos, decisões e prazos

**d) Análise de Risco:**
- Com base nas movimentações e dados do processo, IA estima pontos de atenção
- Ex: "O prazo de contestação vence em 5 dias e ainda não há petição vinculada"

### 5.4 Interface — Chat lateral

```
┌──────────────────────────────────────────────────────┐
│  🤖 Assistente CAUSA                    [Contexto ▼] │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Analisei a petição "Contestação - João".      │   │
│  │                                                │   │
│  │ 📌 Sugestões encontradas (4):                 │   │
│  │                                                │   │
│  │ 1. § 3º, linha 12: A fundamentação cita o     │   │
│  │    Art. 319 do CPC, mas o artigo correto para  │   │
│  │    a matéria seria o Art. 335.                  │   │
│  │    [Aceitar] [Ignorar]                         │   │
│  │                                                │   │
│  │ 2. § 5º: Considere adicionar referência à      │   │
│  │    Súmula 297 do TST para fortalecer o          │   │
│  │    argumento sobre prescrição.                  │   │
│  │    [Aceitar] [Ignorar]                         │   │
│  │                                                │   │
│  │ ⚠️ Sugestões geradas por IA. Revise antes     │   │
│  │ de utilizar em peças jurídicas.                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Digite sua pergunta...]              [Enviar]      │
└──────────────────────────────────────────────────────┘
```

### 5.5 Implementação técnica

**Backend:**
- [ ] Serviço `ai-assistant.ts` — abstração multi-provedor:
  - `OpenAIProvider` — usa `openai` npm
  - `GeminiProvider` — usa `@google/generative-ai`
  - `ClaudeProvider` — usa `@anthropic-ai/sdk`
- [ ] System prompt robusto com guardrails jurídicos brasileiros
- [ ] Rate limiting por usuário (evitar uso excessivo de tokens)
- [ ] Logging de todas as interações (auditoria)
- [ ] Migração: `configuracoes` → adicionar `aiProvider`, `aiApiKey` (criptografada), `aiModel`
- [ ] Migração: `ai_interactions` → log de interações

**Frontend:**
- [ ] Seção "Assistente de IA" nas configurações
- [ ] Componente `AiChatPanel` — painel lateral de chat
- [ ] Botão "Revisar com IA" no DocumentoViewer
- [ ] Botão "Buscar Jurisprudência" na página de detalhe do processo
- [ ] Componente `AiSuggestionDiff` — exibe sugestões com aceitar/rejeitar

**API:**
- [ ] `POST /api/ai/chat` — enviar mensagem para IA (com contexto)
- [ ] `POST /api/ai/review-document` — revisão de documento
- [ ] `POST /api/ai/search-jurisprudencia` — busca guiada
- [ ] `GET /api/ai/interactions` — histórico de interações
- [ ] `POST /api/ai/test-connection` — testar chave de API

### 5.6 System Prompt (resumo dos guardrails)

```
Você é o Assistente CAUSA, um auxiliar jurídico para advogados brasileiros.

REGRAS INVIOLÁVEIS:
1. Você NUNCA redige peças jurídicas, petições ou contratos.
2. Você APENAS sugere melhorias em textos existentes.
3. Você NUNCA inventa jurisprudências, súmulas ou artigos de lei.
4. Quando não souber, diga "Não encontrei referência confiável".
5. Toda sugestão deve citar a fonte (lei, súmula, artigo).
6. Você não substitui o advogado — suas sugestões devem ser
   revisadas antes de qualquer uso.
7. Você não fornece opinião sobre chances de sucesso de uma causa.
8. Você responde APENAS sobre direito brasileiro.
```

### 5.7 Dependências

```
openai                    ← OpenAI API client
@google/generative-ai     ← Google Gemini API
@anthropic-ai/sdk         ← Claude API
```

---

## 6. Ordem de Execução Sugerida

### Fase 1 — Fundações (Sprint 1-2)
1. **Google Drive** — Configuração OAuth + estrutura de pastas + upload
2. **Telegram Bot** — Configuração do bot + alertas pontuais de prazo

### Fase 2 — Alertas completos (Sprint 3-4)
3. **Agenda Google/Microsoft** — Sync de prazos para agenda do advogado
4. **Telegram** — Resumos diários e semanais
5. **Documentos Recebidos** — Monitoramento da pasta compartilhada

### Fase 3 — Diferenciação (Sprint 5-6)
6. **Tabela de Honorários** — Importação OAB + tabela própria
7. **IA Assistente** — Revisão de petição + busca de jurisprudência

### Fase 4 — CNJ (Ad-hoc)
8. **Escritório Digital CNJ** — Quando houver acesso ao certificado

---

## 7. Impacto na Arquitetura Atual

### Migrations necessárias
- `documentos` → `drive_file_id`, `drive_path`, `conteudo` nullable
- `users` → `telegram_chat_id`, `calendar_provider`, `calendar_config`
- `prazos` → `calendar_event_id`
- `configuracoes` → `drive_config`, `telegram_config`, `ai_config`
- Novas tabelas: `user_integrations`, `honorarios_oab`, `servicos`, `documentos_recebidos`, `ai_interactions`

### Novos módulos no sidebar
- Documentos Recebidos (dentro de Documentos ou separado)
- Serviços e Honorários
- Assistente IA (painel lateral, não página)

### Configurações — Reorganização
Dividir configurações em:
- **Configurações Gerais** (admin): Topologia, Google Drive, Telegram Bot, IA, Tabela OAB
- **Minha Conta** (cada usuário): Agenda (Google/Microsoft), Antecedência de alertas, Telegram Chat ID, Tema

---

*Plano elaborado com a visão de UX, Engenharia de Produto e Segurança.*
*Data: Março/2026*
