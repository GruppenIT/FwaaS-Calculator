# Plano: Feature de Backup do Banco de Dados

## Visão Geral

Adicionar à página de Configurações uma seção completa de **Backup Automático** do banco de dados SQLite (`causa.db`), com agendamento flexível, múltiplos destinos (local, rede, Google Drive), histórico de 30 dias, e notificação discreta na interface.

---

## 1. BACKEND — Rotas e Lógica de Backup

### 1.1 Modelo de dados no `AppConfig` (`api-server.ts`)

Adicionar ao `AppConfig`:

```ts
interface BackupDestination {
  id: string;           // UUID
  type: 'local' | 'network' | 'google_drive';
  path?: string;        // Para local/network: caminho absoluto
  enabled: boolean;
}

interface BackupSchedule {
  trigger: 'on_open' | 'first_open_day' | 'daily' | 'weekly';
  delayMinutes?: number;    // Atraso em minutos (para on_open / first_open_day)
  dailyTime?: string;       // "HH:mm" (para trigger === 'daily')
  weeklyDay?: number;       // 0-6 (dom-sáb) (para trigger === 'weekly')
  weeklyTime?: string;      // "HH:mm"
}

interface BackupConfig {
  enabled: boolean;
  schedule: BackupSchedule;
  destinations: BackupDestination[];
  retentionDays: number;  // default 30
}
```

Persistido em `causa.config.json` no campo `backup`.

### 1.2 Tabela de log de backups

Criar tabela SQLite `backup_logs`:

```sql
CREATE TABLE IF NOT EXISTS backup_logs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  destination_id TEXT NOT NULL,
  destination_type TEXT NOT NULL,
  destination_path TEXT,
  status TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'success' | 'error'
  error_message TEXT,
  file_size_bytes INTEGER,
  file_name TEXT
);
```

### 1.3 Rotas API novas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/backup/config` | Retorna config de backup |
| `PUT` | `/api/backup/config` | Salva config de backup |
| `POST` | `/api/backup/run` | Executa backup manual |
| `GET` | `/api/backup/logs` | Lista últimos 30 dias de logs |
| `GET` | `/api/backup/status` | Status do backup em andamento (polling) |

### 1.4 Lógica de execução do backup

1. Copiar `causa.db` para um arquivo temporário com nome `causa_backup_YYYY-MM-DD_HHmm.db`
2. Para cada destino habilitado, copiar o arquivo:
   - **Local/Rede**: `fs.copyFile()` para o caminho configurado
   - **Google Drive**: Upload via `driveService.uploadFile()` na pasta `CAUSA/Backups` (criar se não existir via `resolveFolderPath`)
3. Registrar resultado (sucesso/falha) por destino na tabela `backup_logs`
4. Limpar backups antigos (> retentionDays) nos destinos locais/rede

### 1.5 Agendador de backup

No `api-server.ts`, após inicialização dos serviços:

- Registrar intervalo (`setInterval` de 60s) que verifica se é hora de executar backup com base na config
- Rastrear `lastBackupDate` em memória para evitar duplicação
- Para triggers `on_open` e `first_open_day`: endpoint chamado pelo Electron main no startup (via IPC → API)

---

## 2. FRONTEND — Seção de Backup na Configurações

### 2.1 Nova seção `BackupSection` em `configuracoes-page.tsx`

Adicionar como um novo card, entre "Banco de dados" e o botão "Salvar". Componente próprio: `BackupSection`.

### 2.2 Layout UX da seção (visão de produto)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗄️ Backup do Banco de Dados                                    │
│ Proteja seus dados com backups automáticos do banco SQLite.     │
│                                                                 │
│ ┌─ Backup automático ─────────────────────── [  Toggle ON  ] ─┐│
│ │                                                              ││
│ │  Quando fazer o backup?                                      ││
│ │  ┌──────────────────────────────────────────────────────┐    ││
│ │  │ ○ A cada abertura do sistema                        │    ││
│ │  │     Atraso: [ 5 ] minutos                           │    ││
│ │  │ ○ Na primeira abertura do dia                       │    ││
│ │  │     Atraso: [ 5 ] minutos                           │    ││
│ │  │ ○ Diariamente às [ 08:00 ]                          │    ││
│ │  │ ○ Semanalmente: [ Segunda ] às [ 08:00 ]            │    ││
│ │  └──────────────────────────────────────────────────────┘    ││
│ │                                                              ││
│ │  Destinos do backup                                          ││
│ │  ┌──────────────────────────────────────────────────────┐    ││
│ │  │ ☑ Pasta local      C:\Backups\CAUSA     [Alterar]   │    ││
│ │  │ ☐ Pasta de rede    \\server\backups      [Alterar]   │    ││
│ │  │ ☐ Google Drive      CAUSA/Backups                    │    ││
│ │  │   ⚠ Google Drive não está integrado.                │    ││
│ │  │     Configure em Integrações.                        │    ││
│ │  └──────────────────────────────────────────────────────┘    ││
│ │                                                              ││
│ │  [ 💾 Fazer backup agora ]                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─ Histórico de backups (últimos 30 dias) ─── [Atualizar] ───┐│
│ │                                                              ││
│ │  14/03/2026 08:05                                            ││
│ │    ✅ Pasta local — causa_backup_2026-03-14_0805.db (42 MB) ││
│ │    ✅ Google Drive — causa_backup_2026-03-14_0805.db         ││
│ │                                                              ││
│ │  13/03/2026 08:02                                            ││
│ │    ✅ Pasta local — causa_backup_2026-03-13_0802.db (41 MB) ││
│ │    ❌ Google Drive — Erro: token expirado                   ││
│ │                                                              ││
│ │  (mostra até 30 dias, agrupado por data/hora)                ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─ Como restaurar um backup? ─────────────────────────────────┐│
│ │  1. Feche o CAUSA completamente                              ││
│ │  2. Navegue até a pasta de dados:                            ││
│ │     C:\ProgramData\CAUSA SISTEMAS\CAUSA\                     ││
│ │  3. Renomeie o arquivo "causa.db" para "causa.db.old"        ││
│ │  4. Copie o arquivo de backup desejado para esta pasta       ││
│ │  5. Renomeie o backup para "causa.db"                        ││
│ │  6. Abra o CAUSA novamente                                   ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Detalhes de UX

- **Toggle ON/OFF** habilita/desabilita backup automático
- **Radio buttons** para escolha de gatilho de agendamento
- **Campos condicionais**: atraso em minutos aparece só para `on_open`/`first_open_day`; horário aparece só para `daily`/`weekly`; seletor de dia aparece só para `weekly`
- **Destinos** são checkboxes; cada um pode ser habilitado individualmente
- Para **Google Drive**, verificar `api.getGoogleDriveStatus()`:
  - Se não integrado: exibir alerta amarelo "Google Drive não está integrado. Configure na tela de Integrações."
  - Se integrado: exibir caminho `CAUSA/Backups` (não editável)
- Para **Local/Rede**: campo de texto para caminho, com valor default sugerido
- **Botão "Fazer backup agora"**: executa backup manual, mostra notificação discreta
- **Histórico**: tabela/lista agrupada por timestamp de execução, com status por destino
- **Instruções de restauração**: collapsible, texto simples e direto

### 2.4 Notificação discreta de backup em andamento

Componente `BackupIndicator` — um pequeno "bullet" fixo no canto inferior direito (acima dos toasts, z-index 90):

```
┌──────────────────────────────┐
│  ⟳ Backup em andamento...   │   ← durante execução
└──────────────────────────────┘

┌──────────────────────────────┐
│  ✓ Backup concluído         │   ← some após 3s
└──────────────────────────────┘

┌──────────────────────────────┐
│  ⚠ Backup parcial (1/2 ok)  │   ← se algum destino falhou, some após 5s
└──────────────────────────────┘
```

- Não bloqueia a interface
- Fica abaixo na hierarquia visual (z-index menor que toasts)
- Auto-some após conclusão (3-5s)
- Polling via `GET /api/backup/status` quando backup está ativo

---

## 3. ARQUIVOS A CRIAR/MODIFICAR

### Backend (`packages/database/src/`)
1. **`api-server.ts`** — Adicionar: `BackupConfig` no `AppConfig`, rotas `/api/backup/*`, agendador de backup, lógica de cópia + upload
2. **Nova migration** — `CREATE TABLE backup_logs`

### Frontend (`packages/app-desktop/src/`)
3. **`pages/configuracoes/backup-section.tsx`** — (NOVO) Componente completo da seção de backup
4. **`pages/configuracoes/configuracoes-page.tsx`** — Importar e renderizar `<BackupSection />`
5. **`components/ui/backup-indicator.tsx`** — (NOVO) Indicador discreto no canto inferior direito
6. **`lib/api.ts`** — Adicionar endpoints: `getBackupConfig`, `updateBackupConfig`, `runBackup`, `getBackupLogs`, `getBackupStatus`
7. **`App.tsx` ou layout principal** — Renderizar `<BackupIndicator />` globalmente

---

## 4. ETAPAS DE IMPLEMENTAÇÃO

1. Criar migration para tabela `backup_logs`
2. Adicionar `BackupConfig` ao `AppConfig` e rotas backend
3. Implementar lógica de backup (cópia local + upload Drive)
4. Implementar agendador no api-server
5. Adicionar endpoints no `api.ts` frontend
6. Criar componente `BackupSection`
7. Criar componente `BackupIndicator`
8. Integrar na página de Configurações e no layout global
