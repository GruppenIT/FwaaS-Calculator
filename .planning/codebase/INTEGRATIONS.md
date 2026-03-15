# External Integrations

**Analysis Date:** 2026-03-15

## APIs & External Services

**Google Drive:**
- Service: File storage and document management
  - SDK/Client: `googleapis` v144.0.0
  - Auth methods:
    - OAuth 2.0 (any Google account — Gmail or Workspace)
    - Service Account with domain-wide delegation (Workspace only)
  - Implementation: `packages/database/src/services/google-drive.ts`
  - Configuration: Via `/api/google-drive/config` endpoint
  - Token persistence: Automatic refresh token handling with callback to config file

**Telegram:**
- Service: Bot notifications and alerts
  - SDK/Client: Native HTTPS API (no SDK package)
  - Auth: Bot token (stored in config)
  - Implementation: `packages/database/src/services/telegram.ts`
  - Configuration: Via `/api/telegram/config` endpoint
  - Features: Daily summaries, alerts on aging parcelas, chat discovery

**Document Connectors:**
- Services: ESAJ (Projeto-e) and PJe (Poder Judiciário Eletrônico) mock implementations
  - Implementation: `packages/connectors/src/esaj-mock.ts`, `packages/connectors/src/pje-mock.ts`
  - Current status: Mock implementations (not live)
  - Registry: `packages/connectors/src/registry.ts`

## Data Storage

**Databases:**
- SQLite 3 (better-sqlite3 v11.0.0)
  - Topology: solo (single-user, local machine)
  - Connection: File-based at `causa.db` (default location)
  - Client: Drizzle ORM
  - Migrations: `packages/database/src/migrations/` (auto-generated)

- PostgreSQL (node-postgres v8.13.0)
  - Topology: escritório (multi-user, office setup)
  - Connection: Via `CAUSA_POSTGRES_URL` env var
    - Format: `postgresql://user:password@host:5432/dbname`
  - Client: Drizzle ORM
  - Migrations: `packages/database/src/migrations-pg/` (auto-generated)

**File Storage:**
- Google Drive (primary integration)
- Local filesystem (backup destinations, logs)
- Network paths (backup destinations via UNC paths)

**Caching:**
- In-memory map for Google Drive folder IDs (per instance)
- No persistent caching layer (stateless design)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no external provider)
  - Implementation: `packages/database/src/services/auth.ts`
  - Token type: JWT with subject (user ID), email, role, and jti (JWT ID)
  - Access token: Short-lived (from code, configurable)
  - Refresh token: Long-lived
  - Secret: Stored in config file as `jwtSecret`

**RBAC (Role-Based Access Control):**
- Roles: admin, operacional, etc.
- Permissions: Per-resource access control
- Implementation: `packages/database/src/services/rbac.ts`

## Monitoring & Observability

**Logging:**
- File-based logs (JSON format in production, pretty format in console)
- Location: `C:\ProgramData\CAUSA SISTEMAS\CAUSA\logs\` (Windows) or app userData path
- Framework: Custom logger with zerolog-inspired API (`packages/database/src/logger.ts`)
- Rotation: Auto-rotated daily

**Error Tracking:**
- None detected (errors logged to file only)

**Event Logging:**
- Backup execution history: `backup_logs` table
- Connector sync logs: `connector_logs` table
- Audit trail: `audit_log` table

## CI/CD & Deployment

**Hosting:**
- Desktop (Electron) deployed via GitHub Releases
- Installer: Windows MSI via electron-builder and WiX Toolset
- No server deployment detected

**Auto-Update Mechanism:**
- electron-updater v6.3.9
- Strategy: GitHub Releases assets (binary + YAML metadata)
- User choice on update (install now, install later, ignore)
- Background and foreground download modes

**Installer:**
- electron-builder v25.0.0
- Target: Windows (MSI)
- Config: `packages/installer/electron-builder.yml`

## Environment Configuration

**Required env vars for operation:**
- `CAUSA_TOPOLOGIA` - solo or escritorio
- `NODE_ENV` - development or production
- `CAUSA_SERVICE_PORT` - (Optional, default: 9473)
- `CAUSA_SYNC_INTERVAL` - (Optional, default: 30 minutes)
- `CAUSA_POSTGRES_URL` - (Required only in escritório mode)

**Secrets location:**
- Runtime config file at `causa.config.json` (JSON, unencrypted, local filesystem)
  - Contains: jwtSecret, Google Drive OAuth tokens, Telegram bot token, backup config
  - Initialized by setup wizard on first run
  - Never committed to git

**Google Drive OAuth Credentials:**
- OAuth Client ID and Secret: Stored in config file
- OAuth tokens (access + refresh): Persisted and auto-refreshed
- Service Account JSON: Path stored in config, file stored separately

**Telegram Bot Token:**
- Stored in config file under `telegram.botToken`

## API Endpoints

**Authentication:**
- `POST /api/setup` - Initial setup (config creation)
- `POST /api/login` - User login (returns access + refresh tokens)
- `POST /api/refresh` - Refresh access token

**User Management:**
- `GET /api/me` - Current user info
- `GET /api/usuarios` - List users
- `POST /api/usuarios` - Create user
- `GET|PUT|DELETE /api/usuarios/:id` - User operations

**Core Resources:**
- `GET|POST /api/clientes` - Clients
- `GET|PUT|DELETE /api/clientes/:id` - Client detail
- `GET|POST /api/processos` - Cases
- `GET|PUT|DELETE /api/processos/:id` - Case detail
- `GET|POST /api/tarefas` - Tasks
- `GET|POST /api/agenda` - Calendar events
- `GET|POST /api/documentos` - Documents
- `GET|POST /api/financeiro` - Financial records
- `GET|POST /api/despesas` - Expenses
- `GET|POST /api/contatos` - Contacts
- `GET|POST /api/timesheets` - Time tracking

**Google Drive Integration:**
- `GET /api/google-drive/config` - Get current config
- `PUT /api/google-drive/config` - Update config
- `POST /api/google-drive/oauth/url` - Generate OAuth authorization URL
- `GET /api/google-drive/oauth/callback` - OAuth callback handler
- `POST /api/google-drive/disconnect` - Remove Google Drive config
- `GET /api/google-drive/status` - Check connection status
- `POST /api/google-drive/sync` - Sync single document
- `POST /api/google-drive/sync-all` - Sync all documents
- `GET /api/google-drive/unclassified` - List unclassified files
- `POST /api/google-drive/classify` - Classify document to cliente/processo
- `POST /api/google-drive/sync-folders` - Sync folder structure

**Telegram Integration:**
- `GET /api/telegram/config` - Get current config
- `PUT /api/telegram/config` - Update config
- `POST /api/telegram/test` - Test connection
- `GET /api/telegram/updates` - Get recent chat messages (for discovering chat_id)
- `POST /api/telegram/send-summary` - Send daily summary message
- `POST /api/telegram/disconnect` - Remove Telegram config

**Backup & Restore:**
- `GET /api/backup/config` - Get backup configuration
- `PUT /api/backup/config` - Update backup schedule and destinations
- `POST /api/backup/run` - Trigger backup immediately
- `GET /api/backup/status` - Get current backup status
- `POST /api/backup/notify-open` - Notify system that app opened (triggers on_open backup)
- `GET /api/backup/history` - Backup execution history
- `GET /api/backup/restore` - Restore from backup

**System:**
- `GET /api/health` - Health check
- `GET /api/features` - Active modules/features list
- `GET /api/roles` - Available roles

## Webhooks & Callbacks

**Incoming:**
- `POST /api/google-drive/oauth/callback` - OAuth 2.0 redirect URI

**Outgoing:**
- Google Drive: Automatic folder structure sync when documents uploaded
- Telegram: Bot message sending (text notifications)
- Backup: Compressed file uploads to Google Drive or network destinations

## Data Import/Export

**Document Formats:**
- DOCX: Imported via Google Drive, converted to HTML with mammoth
- Images: Stored in Google Drive (caso/cliente folders)
- PDFs: Stored in Google Drive

**Backup Format:**
- Database dump: SQLite `.db` or PostgreSQL dump
- Compression: gzip (single `.gz` file)
- Destinations: Local filesystem, network shares, Google Drive

---

*Integration audit: 2026-03-15*
