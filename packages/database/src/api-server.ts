import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, type CausaDatabase, type SqliteDatabase, type PgDatabase, type DatabaseQueryBuilder } from './client.js';
import { getSchema, type CausaSchema } from './schema-provider.js';
import { AuthService } from './services/auth.js';
import { RbacService, type AuthenticatedUser } from './services/rbac.js';
import { ClienteService } from './services/clientes.js';
import { ProcessoService } from './services/processos.js';
import { FinanceiroService } from './services/financeiro.js';
import { AgendaService } from './services/agenda.js';
import { PrazoService } from './services/prazos.js';
import { TarefaService } from './services/tarefas.js';
import { DocumentoService } from './services/documentos.js';
import { ParcelaService } from './services/parcelas.js';
import { DespesaService } from './services/despesas.js';
import { ContatoService } from './services/contatos.js';
import { TimesheetService } from './services/timesheets.js';
import { GoogleDriveService, type OAuthTokens } from './services/google-drive.js';
import { TelegramService } from './services/telegram.js';
import { marcarParcelasAtrasadas, atualizarPrioridadePorIdade } from './services/automations.js';
import { setupDatabase, type SetupInput } from './services/setup.js';
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { count, eq, sum, and, lt, gte, lte, sql } from 'drizzle-orm';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { PermissionKey } from '@causa/shared';
import { createClienteSchema, createProcessoSchema } from '@causa/shared';
import { logger } from './logger.js';

const __apiDirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__apiDirname, 'migrations');
const MIGRATIONS_PG_DIR = path.resolve(__apiDirname, 'migrations-pg');

const DEFAULT_PORT = 3456;
const DB_PATH = 'causa.db';
const CONFIG_PATH = 'causa.config.json';

interface GoogleDriveConfig {
  authMode?: 'oauth' | 'service_account';
  // OAuth 2.0 (contas gratuitas e Workspace)
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthTokens?: OAuthTokens;
  // Service Account (Workspace com domain-wide delegation)
  serviceAccountJson: string;
  impersonateEmail?: string;
  // Comum
  rootFolderId?: string;
}

interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  dailySummaryEnabled?: boolean;
  alertDays?: number[];
}

interface BackupDestination {
  id: string;
  type: 'local' | 'network' | 'google_drive';
  path?: string;
  enabled: boolean;
}

interface BackupSchedule {
  trigger: 'on_open' | 'first_open_day' | 'daily' | 'weekly';
  delayMinutes?: number;
  dailyTime?: string;
  weeklyDay?: number;
  weeklyTime?: string;
}

interface BackupConfig {
  enabled: boolean;
  schedule: BackupSchedule;
  destinations: BackupDestination[];
  retentionDays: number;
}

interface BackupLogRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  destination_id: string;
  destination_type: string;
  destination_path: string | null;
  status: 'running' | 'success' | 'error';
  error_message: string | null;
  file_size_bytes: number | null;
  file_name: string | null;
}

interface BackupStatus {
  running: boolean;
  startedAt?: string;
  fileName?: string;
  completedDestinations: number;
  totalDestinations: number;
  results: Array<{
    destinationId: string;
    destinationType: string;
    status: 'running' | 'success' | 'error';
    error?: string;
  }>;
}

interface AppConfig {
  jwtSecret: string;
  topologia: 'solo' | 'escritorio';
  dbPath: string;
  postgresUrl?: string;
  moduleKeys?: string[];
  googleDrive?: GoogleDriveConfig;
  telegram?: TelegramBotConfig;
  backup?: BackupConfig;
}

/** Códigos de ativação de módulos opcionais */
const MODULE_CODES = { financeiro: 'FIN-2026-CAUSA-7F3A9B' } as const;

/** Cache das features ativas (lido do config no startup) */
let activeModuleKeys: string[] = [];

let db: CausaDatabase | null = null;
let schema: CausaSchema | null = null;
let authService: AuthService | null = null;
let rbacService: RbacService | null = null;
let clienteService: ClienteService | null = null;
let processoService: ProcessoService | null = null;
let financeiroService: FinanceiroService | null = null;
let agendaService: AgendaService | null = null;
let prazoService: PrazoService | null = null;
let tarefaService: TarefaService | null = null;
let documentoService: DocumentoService | null = null;
let parcelaService: ParcelaService | null = null;
let despesaService: DespesaService | null = null;
let contatoService: ContatoService | null = null;
let timesheetService: TimesheetService | null = null;
let driveService: GoogleDriveService | null = null;
let telegramService: TelegramService | null = null;

/** Callback para persistir tokens OAuth renovados */
function persistOAuthTokens(tokens: OAuthTokens): void {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return;
    const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    if (config.googleDrive) {
      config.googleDrive.oauthTokens = tokens;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
  } catch (err) {
    logger.error('GoogleDrive', 'Erro ao persistir tokens OAuth', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Inicializa GoogleDriveService a partir da configuração salva */
function initDriveFromConfig(gdConfig: GoogleDriveConfig): void {
  driveService = null;
  const mode = gdConfig.authMode ?? (gdConfig.serviceAccountJson ? 'service_account' : 'oauth');

  if (mode === 'oauth' && gdConfig.oauthClientId && gdConfig.oauthClientSecret && gdConfig.oauthTokens) {
    try {
      driveService = GoogleDriveService.fromOAuth(
        gdConfig.oauthClientId,
        gdConfig.oauthClientSecret,
        gdConfig.oauthTokens,
        persistOAuthTokens,
      );
    } catch (err) {
      logger.error('GoogleDrive', 'Erro ao inicializar OAuth', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (mode === 'service_account' && gdConfig.serviceAccountJson) {
    try {
      const creds = JSON.parse(gdConfig.serviceAccountJson);
      driveService = GoogleDriveService.fromServiceAccount(creds, gdConfig.impersonateEmail);
    } catch (err) {
      logger.error('GoogleDrive', 'Erro ao inicializar Service Account', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
let telegramAlertInterval: ReturnType<typeof setInterval> | null = null;

// === Backup state ===
let backupStatus: BackupStatus = {
  running: false,
  completedDestinations: 0,
  totalDestinations: 0,
  results: [],
};
let backupSchedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastBackupDate: string | null = null; // "YYYY-MM-DD" to avoid duplicate daily/weekly runs
let appOpenBackupDone = false; // for on_open trigger (once per session)

/** Execute backup of the database file to all enabled destinations */
async function executeBackup(): Promise<void> {
  if (backupStatus.running) {
    logger.warn('Backup', 'Backup já em andamento, ignorando execução duplicada');
    return;
  }

  const configRaw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config: AppConfig = JSON.parse(configRaw);
  const backupConfig = config.backup;
  if (!backupConfig?.enabled || backupConfig.destinations.length === 0) return;

  const enabledDests = backupConfig.destinations.filter((d) => d.enabled);
  if (enabledDests.length === 0) return;

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');
  const fileName = `causa_backup_${timestamp}.db`;
  const dbPath = config.dbPath || DB_PATH;
  const runId = now.toISOString();

  backupStatus = {
    running: true,
    startedAt: runId,
    fileName,
    completedDestinations: 0,
    totalDestinations: enabledDests.length,
    results: enabledDests.map((d) => ({
      destinationId: d.id,
      destinationType: d.type,
      status: 'running' as const,
    })),
  };

  logger.info('Backup', `Iniciando backup: ${fileName}`, { destinations: enabledDests.length });

  // Create temp copy of database (safe snapshot)
  const tmpPath = path.join(path.dirname(dbPath), `.backup_tmp_${Date.now()}.db`);
  try {
    // Use SQLite backup API via VACUUM INTO for a consistent snapshot
    if (db && config.topologia === 'solo') {
      (db as SqliteDatabase).run(sql.raw(`VACUUM INTO '${tmpPath.replace(/'/g, "''")}'`));
    } else {
      fs.copyFileSync(dbPath, tmpPath);
    }
  } catch (err) {
    logger.error('Backup', 'Erro ao criar snapshot do banco', {
      error: err instanceof Error ? err.message : String(err),
    });
    // Mark all destinations as error
    for (const dest of enabledDests) {
      insertBackupLog({
        id: crypto.randomUUID(),
        started_at: runId,
        finished_at: new Date().toISOString(),
        destination_id: dest.id,
        destination_type: dest.type,
        destination_path: dest.type === 'google_drive' ? 'CAUSA/Backups' : (dest.path ?? null),
        status: 'error',
        error_message: `Erro ao criar snapshot: ${err instanceof Error ? err.message : String(err)}`,
        file_size_bytes: null,
        file_name: fileName,
      });
    }
    backupStatus = { running: false, completedDestinations: 0, totalDestinations: 0, results: [] };
    return;
  }

  const fileSize = fs.statSync(tmpPath).size;

  // Process each destination
  for (let i = 0; i < enabledDests.length; i++) {
    const dest = enabledDests[i]!;
    const resultEntry = backupStatus.results[i]!;
    const logId = crypto.randomUUID();
    const logBase = {
      id: logId,
      started_at: runId,
      destination_id: dest.id,
      destination_type: dest.type,
      file_name: fileName,
      file_size_bytes: fileSize,
    };

    try {
      if (dest.type === 'local' || dest.type === 'network') {
        const destDir = dest.path ?? '';
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const destFile = path.join(destDir, fileName);
        fs.copyFileSync(tmpPath, destFile);
        logger.info('Backup', `Backup copiado para: ${destFile}`);
        insertBackupLog({
          ...logBase,
          finished_at: new Date().toISOString(),
          destination_path: destDir,
          status: 'success',
          error_message: null,
        });
      } else if (dest.type === 'google_drive') {
        if (!driveService) {
          throw new Error('Google Drive não está integrado. Configure em Integrações.');
        }
        const rootFolderId = config.googleDrive?.rootFolderId;
        if (!rootFolderId) {
          throw new Error('Google Drive: rootFolderId não configurado.');
        }
        // Navigate/create CAUSA/Backups folder
        const causaFolderId = await driveService.findOrCreateFolder('CAUSA', rootFolderId);
        const backupsFolderId = await driveService.findOrCreateFolder('Backups', causaFolderId);
        const content = fs.readFileSync(tmpPath);
        await driveService.uploadFile({
          name: fileName,
          mimeType: 'application/x-sqlite3',
          content,
          folderId: backupsFolderId,
        });
        logger.info('Backup', 'Backup enviado para Google Drive: CAUSA/Backups');
        insertBackupLog({
          ...logBase,
          finished_at: new Date().toISOString(),
          destination_path: 'CAUSA/Backups',
          status: 'success',
          error_message: null,
        });
      }

      resultEntry.status = 'success';
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Backup', `Erro ao copiar para destino ${dest.type}`, { error: errMsg });
      insertBackupLog({
        ...logBase,
        finished_at: new Date().toISOString(),
        destination_path: dest.type === 'google_drive' ? 'CAUSA/Backups' : (dest.path ?? null),
        status: 'error',
        error_message: errMsg,
      });
      resultEntry.status = 'error';
      resultEntry.error = errMsg;
    }

    backupStatus.completedDestinations = i + 1;
  }

  // Cleanup temp file
  try {
    fs.unlinkSync(tmpPath);
  } catch { /* ignore */ }

  // Cleanup old backups from local/network destinations
  cleanupOldBackups(enabledDests, backupConfig.retentionDays || 30);

  lastBackupDate = now.toISOString().slice(0, 10);
  logger.info('Backup', 'Backup concluído', {
    results: backupStatus.results.map((r) => `${r.destinationType}: ${r.status}`),
  });

  // Keep status for a few seconds so frontend can poll it, then reset
  setTimeout(() => {
    backupStatus = { running: false, completedDestinations: 0, totalDestinations: 0, results: [] };
  }, 10000);
}

/** Insert a backup log row using raw SQL (works with both SQLite topologies) */
function insertBackupLog(row: BackupLogRow): void {
  try {
    if (db) {
      (db as SqliteDatabase).run(
        sql`INSERT INTO backup_logs (id, started_at, finished_at, destination_id, destination_type, destination_path, status, error_message, file_size_bytes, file_name)
            VALUES (${row.id}, ${row.started_at}, ${row.finished_at}, ${row.destination_id}, ${row.destination_type}, ${row.destination_path}, ${row.status}, ${row.error_message}, ${row.file_size_bytes}, ${row.file_name})`,
      );
    }
  } catch (err) {
    logger.error('Backup', 'Erro ao inserir log de backup', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Remove backups older than retentionDays from local/network destinations */
function cleanupOldBackups(destinations: BackupDestination[], retentionDays: number): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  for (const dest of destinations) {
    if (dest.type === 'google_drive' || !dest.path) continue;
    try {
      if (!fs.existsSync(dest.path)) continue;
      const files = fs.readdirSync(dest.path).filter((f) => f.startsWith('causa_backup_') && f.endsWith('.db'));
      for (const file of files) {
        // Parse date from filename: causa_backup_YYYY-MM-DD_HHmm.db
        const match = file.match(/causa_backup_(\d{4}-\d{2}-\d{2})/);
        if (match?.[1]) {
          const fileDate = new Date(match[1]);
          if (fileDate < cutoff) {
            fs.unlinkSync(path.join(dest.path, file));
            logger.info('Backup', `Backup antigo removido: ${file}`);
          }
        }
      }
    } catch (err) {
      logger.warn('Backup', `Erro ao limpar backups antigos em ${dest.path}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Also cleanup old log rows from the database
  try {
    if (db) {
      const cutoffIso = cutoff.toISOString();
      (db as SqliteDatabase).run(
        sql`DELETE FROM backup_logs WHERE started_at < ${cutoffIso}`,
      );
    }
  } catch { /* ignore */ }
}

/** Start the backup scheduler that checks every minute if it's time to run */
function startBackupScheduler(): void {
  if (backupSchedulerInterval) clearInterval(backupSchedulerInterval);

  backupSchedulerInterval = setInterval(() => {
    try {
      if (!fs.existsSync(CONFIG_PATH)) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const bc = config.backup;
      if (!bc?.enabled) return;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (bc.schedule.trigger === 'daily') {
        const targetTime = bc.schedule.dailyTime || '08:00';
        if (currentTime === targetTime && lastBackupDate !== todayStr) {
          executeBackup().catch((err) => {
            logger.error('Backup', 'Erro no backup agendado', {
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }
      } else if (bc.schedule.trigger === 'weekly') {
        const targetDay = bc.schedule.weeklyDay ?? 1; // Monday default
        const targetTime = bc.schedule.weeklyTime || '08:00';
        if (now.getDay() === targetDay && currentTime === targetTime && lastBackupDate !== todayStr) {
          executeBackup().catch((err) => {
            logger.error('Backup', 'Erro no backup agendado', {
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }
      }
      // on_open and first_open_day are triggered by the frontend calling POST /api/backup/notify-open
    } catch { /* ignore scheduler errors */ }
  }, 60_000); // Check every minute

  logger.info('Backup', 'Agendador de backup iniciado');
}

function ensureService<T>(service: T | null, name: string): T {
  if (!service) {
    throw new Error(`Serviço ${name} não inicializado. Execute /api/setup primeiro.`);
  }
  return service;
}

function getDb(): DatabaseQueryBuilder {
  return ensureService(db, 'database') as unknown as DatabaseQueryBuilder;
}

function getAppSchema(): CausaSchema {
  return ensureService(schema, 'schema');
}

function getAuthService(): AuthService {
  return ensureService(authService, 'AuthService');
}

function getRbacService(): RbacService {
  return ensureService(rbacService, 'RbacService');
}

function getClienteService(): ClienteService {
  return ensureService(clienteService, 'ClienteService');
}

function getProcessoService(): ProcessoService {
  return ensureService(processoService, 'ProcessoService');
}

function getFinanceiroService(): FinanceiroService {
  return ensureService(financeiroService, 'FinanceiroService');
}

function getAgendaService(): AgendaService {
  return ensureService(agendaService, 'AgendaService');
}

function getPrazoService(): PrazoService {
  return ensureService(prazoService, 'PrazoService');
}

function getTarefaService(): TarefaService {
  return ensureService(tarefaService, 'TarefaService');
}

function getDocumentoService(): DocumentoService {
  return ensureService(documentoService, 'DocumentoService');
}

function getParcelaService(): ParcelaService {
  return ensureService(parcelaService, 'ParcelaService');
}

function getDespesaService(): DespesaService {
  return ensureService(despesaService, 'DespesaService');
}

function getContatoService(): ContatoService {
  return ensureService(contatoService, 'ContatoService');
}

function getTimesheetService(): TimesheetService {
  return ensureService(timesheetService, 'TimesheetService');
}

function initializeServices(database: CausaDatabase, s: CausaSchema, jwtSecret: string) {
  db = database;
  schema = s;
  authService = new AuthService(db, jwtSecret, schema);
  rbacService = new RbacService(authService);
  clienteService = new ClienteService(db, schema);
  processoService = new ProcessoService(db, schema);
  financeiroService = new FinanceiroService(db, schema);
  agendaService = new AgendaService(db, schema);
  prazoService = new PrazoService(db, schema);
  tarefaService = new TarefaService(db, schema);
  documentoService = new DocumentoService(db, schema);
  parcelaService = new ParcelaService(db, schema);
  despesaService = new DespesaService(db, schema);
  contatoService = new ContatoService(db, schema);
  timesheetService = new TimesheetService(db, schema);
}

function loadApp(): boolean {
  if (db) return true;
  if (!fs.existsSync(CONFIG_PATH)) return false;

  const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  activeModuleKeys = config.moduleKeys ?? [];

  // Inicializar Google Drive se configurado
  if (config.googleDrive) {
    initDriveFromConfig(config.googleDrive);
  }

  // Inicializar Telegram se configurado
  if (config.telegram?.botToken && config.telegram?.chatId) {
    telegramService = new TelegramService({
      botToken: config.telegram.botToken,
      chatId: config.telegram.chatId,
    });
  }

  const database = createDatabase({
    topologia: config.topologia,
    sqlitePath: config.dbPath,
    ...(config.postgresUrl ? { postgresUrl: config.postgresUrl } : {}),
  });

  // Aplicar migrations pendentes automaticamente (upgrade)
  try {
    if (config.topologia === 'solo') {
      logger.info('API', 'Aplicando migrations SQLite pendentes...');
      migrateSqlite(database as SqliteDatabase, { migrationsFolder: MIGRATIONS_DIR });
    } else {
      logger.info('API', 'Aplicando migrations PostgreSQL pendentes...');
      // PG migrate é async mas loadApp é sync — tratado no startServer
      pendingPgMigration = migratePg(database as PgDatabase, { migrationsFolder: MIGRATIONS_PG_DIR });
    }
    logger.info('API', 'Migrations aplicadas com sucesso');
  } catch (err) {
    logger.error('API', 'Erro ao aplicar migrations', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Fallback: garantir colunas essenciais caso migrations não tenham sido aplicadas corretamente
  if (config.topologia === 'solo') {
    try {
      const sqliteDb = database as SqliteDatabase;
      const cols = sqliteDb.all<{ name: string }>(sql`PRAGMA table_info(documentos)`);
      const colNames = new Set(cols.map((c) => c.name));

      if (!colNames.has('conteudo_texto')) {
        sqliteDb.run(sql`ALTER TABLE documentos ADD COLUMN conteudo_texto text`);
        logger.info('API', 'Coluna conteudo_texto adicionada via fallback');
      }
      if (!colNames.has('drive_file_id')) {
        sqliteDb.run(sql`ALTER TABLE documentos ADD COLUMN drive_file_id text`);
        logger.info('API', 'Coluna drive_file_id adicionada via fallback');
      }
      if (!colNames.has('drive_synced_at')) {
        sqliteDb.run(sql`ALTER TABLE documentos ADD COLUMN drive_synced_at text`);
        logger.info('API', 'Coluna drive_synced_at adicionada via fallback');
      }
    } catch (fallbackErr) {
      logger.error('API', 'Erro no fallback de colunas', {
        error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
      });
    }

    // Garantir tabela backup_logs
    try {
      const sqliteDb = database as SqliteDatabase;
      sqliteDb.run(sql`CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        destination_id TEXT NOT NULL,
        destination_type TEXT NOT NULL,
        destination_path TEXT,
        status TEXT DEFAULT 'running' NOT NULL,
        error_message TEXT,
        file_size_bytes INTEGER,
        file_name TEXT
      )`);
    } catch (backupTableErr) {
      logger.error('API', 'Erro ao criar tabela backup_logs', {
        error: backupTableErr instanceof Error ? backupTableErr.message : String(backupTableErr),
      });
    }
  }

  const s = getSchema(config.topologia);
  initializeServices(database, s, config.jwtSecret);
  return true;
}

/** Promise de migration PG pendente (PG migrate é async) */
let pendingPgMigration: Promise<void> | null = null;

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function error(res: http.ServerResponse, message: string, status = 400) {
  json(res, { error: message }, status);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString();
}

function extractToken(req: http.IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function getAuthenticatedUser(req: http.IncomingMessage): AuthenticatedUser | null {
  const token = extractToken(req);
  if (!token || !authService) return null;
  try {
    const payload = authService.verifyToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

async function requirePermission(
  res: http.ServerResponse,
  user: AuthenticatedUser,
  permission: PermissionKey,
): Promise<boolean> {
  if (!(await getRbacService().checkPermission(user, permission))) {
    error(res, `Permissão insuficiente: ${permission}`, 403);
    return false;
  }
  return true;
}

async function hasPermission(user: AuthenticatedUser, permission: PermissionKey): Promise<boolean> {
  return getRbacService().checkPermission(user, permission);
}

// Simple URL routing
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${DEFAULT_PORT}`);
  const method = req.method ?? 'GET';
  const path = url.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  try {
    // === Health check ===
    if (path === '/api/health') {
      const configured = fs.existsSync(CONFIG_PATH);
      return json(res, { ok: true, configured });
    }

    // === Setup ===
    if (path === '/api/setup' && method === 'POST') {
      if (fs.existsSync(CONFIG_PATH)) {
        logger.warn('API', 'Setup chamado mas sistema já está configurado');
        return error(res, 'Sistema já configurado.', 409);
      }

      logger.info('API', 'Recebida requisição de setup, lendo corpo...');
      let body: SetupInput;
      try {
        const rawBody = await readBody(req);
        logger.debug('API', 'Corpo da requisição recebido', { length: rawBody.length });
        body = JSON.parse(rawBody) as SetupInput;
        logger.info('API', 'Setup input parseado', {
          topologia: body.topologia,
          hasPostgresUrl: !!body.postgresUrl,
          adminEmail: body.admin?.email,
        });
      } catch (parseErr) {
        logger.error('API', 'Falha ao parsear corpo da requisição de setup', {
          error: parseErr instanceof Error ? parseErr.message : String(parseErr),
        });
        return error(res, 'Corpo da requisição inválido.', 400);
      }

      try {
        logger.info('API', 'Iniciando setupDatabase...');
        const result = await setupDatabase({
          topologia: body.topologia,
          dbPath: DB_PATH,
          ...(body.postgresUrl ? { postgresUrl: body.postgresUrl } : {}),
          admin: body.admin,
        });
        logger.info('API', 'setupDatabase concluído com sucesso', { adminId: result.adminId });

        // Persist config
        const config: AppConfig = {
          jwtSecret: result.jwtSecret,
          topologia: body.topologia,
          dbPath: DB_PATH,
          ...(body.postgresUrl ? { postgresUrl: body.postgresUrl } : {}),
        };
        logger.debug('API', 'Salvando causa.config.json...', { path: CONFIG_PATH });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        logger.info('API', 'Config salvo com sucesso');

        // Initialize services
        const s = getSchema(body.topologia);
        initializeServices(result.db, s, result.jwtSecret);
        logger.info('API', 'Serviços inicializados — setup completo');

        return json(res, { ok: true, adminId: result.adminId }, 201);
      } catch (setupErr) {
        logger.error('API', 'Falha durante o setup', {
          error: setupErr instanceof Error ? setupErr.message : String(setupErr),
          stack: setupErr instanceof Error ? setupErr.stack : undefined,
        });
        const message =
          setupErr instanceof Error ? setupErr.message : 'Erro durante o setup do sistema.';
        return error(res, message, 500);
      }
    }

    // All routes below require the app to be configured
    if (!loadApp()) {
      return error(res, 'Sistema não configurado. Execute /api/setup primeiro.', 503);
    }

    // === Auth ===
    if (path === '/api/login' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { email: string; senha: string };
      const tokens = await getAuthService().login(body.email, body.senha);
      return json(res, tokens);
    }

    if (path === '/api/refresh' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { refreshToken: string };
      const tokens = await getAuthService().refreshAccessToken(body.refreshToken);
      return json(res, tokens);
    }

    if (path === '/api/me' && method === 'GET') {
      const token = extractToken(req);
      if (!token) return error(res, 'Token não fornecido.', 401);
      const payload = getAuthService().verifyToken(token);
      const perms = await getAuthService().getUserPermissions(payload.sub);
      return json(res, { ...payload, permissions: perms });
    }

    // === Feature flags (autenticado) ===
    if (path === '/api/features' && method === 'GET') {
      const token = extractToken(req);
      if (!token) return error(res, 'Não autorizado.', 401);
      try {
        getAuthService().verifyToken(token);
      } catch {
        return error(res, 'Não autorizado.', 401);
      }
      return json(res, {
        financeiro: activeModuleKeys.includes(MODULE_CODES.financeiro),
        googleDrive: driveService !== null,
        telegram: telegramService !== null,
      });
    }

    // OAuth callback — sem autenticação (é chamado pelo redirect do Google)
    if (path === '/api/google-drive/oauth/callback' && method === 'GET') {
      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h2>Erro: codigo de autorizacao nao recebido.</h2><p>Feche esta janela e tente novamente.</p></body></html>');
        return;
      }
      try {
        const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        const clientId = config.googleDrive?.oauthClientId;
        const clientSecret = config.googleDrive?.oauthClientSecret;
        if (!clientId || !clientSecret) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<html><body><h2>Erro: Client ID/Secret nao configurados.</h2></body></html>');
          return;
        }
        const redirectUri = `http://localhost:${DEFAULT_PORT}/api/google-drive/oauth/callback`;
        const tokens = await GoogleDriveService.exchangeCode(clientId, clientSecret, code, redirectUri);

        if (!config.googleDrive) config.googleDrive = { serviceAccountJson: '' };
        config.googleDrive.authMode = 'oauth';
        config.googleDrive.oauthTokens = tokens;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        initDriveFromConfig(config.googleDrive);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2 style="color:#22c55e">Google Drive conectado com sucesso!</h2><p>Pode fechar esta janela e voltar ao CAUSA.</p><script>setTimeout(()=>window.close(),3000)</script></body></html>');
        return;
      } catch (err) {
        logger.error('GoogleDrive', 'Erro no OAuth callback', {
          error: err instanceof Error ? err.message : String(err),
        });
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body><h2>Erro ao conectar</h2><p>${err instanceof Error ? err.message : 'Erro desconhecido'}</p></body></html>`);
        return;
      }
    }

    // === Protected routes — require auth ===
    const user = getAuthenticatedUser(req);
    if (!user) {
      return error(res, 'Não autorizado.', 401);
    }

    // --- Clientes ---
    if (path === '/api/clientes' && method === 'GET') {
      if (!(await requirePermission(res, user, 'clientes:ler_todos'))) return;
      const termo = url.searchParams.get('q');
      const data = termo
        ? await getClienteService().buscar(termo)
        : await getClienteService().listar();
      return json(res, data);
    }

    if (path === '/api/clientes' && method === 'POST') {
      if (!(await requirePermission(res, user, 'clientes:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const validation = createClienteSchema.safeParse(body);
      if (!validation.success) {
        const msg = validation.error.issues.map((i) => i.message).join('; ');
        return error(res, msg, 400);
      }
      const id = await getClienteService().criar(validation.data, user.id);

      // Criar pasta Compartilhado no Drive para o novo cliente (assíncrono, não bloqueia)
      if (driveService) {
        try {
          const cConfig: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
          const rootId = cConfig.googleDrive?.rootFolderId;
          if (rootId) {
            driveService.resolveCompartilhadoFolder({
              rootFolderId: rootId,
              clienteNome: validation.data.nome,
              clienteTipo: validation.data.tipo,
              clienteCpfCnpj: validation.data.cpfCnpj ?? undefined,
            }).catch((err) => {
              logger.error('GoogleDrive', 'Erro ao criar pasta Compartilhado para novo cliente', {
                error: err instanceof Error ? err.message : String(err),
              });
            });
          }
        } catch { /* ignore config read error */ }
      }

      return json(res, { id }, 201);
    }

    const clienteMatch = path.match(/^\/api\/clientes\/([^/]+)$/);
    if (clienteMatch) {
      const id = clienteMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'clientes:ler_todos'))) return;
        const c = await getClienteService().obterPorId(id);
        if (!c) return error(res, 'Cliente não encontrado.', 404);
        return json(res, c);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'clientes:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getClienteService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'clientes:excluir'))) return;
        await getClienteService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Processos ---
    if (path === '/api/processos' && method === 'GET') {
      const canReadAll = await hasPermission(user, 'processos:ler_todos');
      const canReadOwn = await hasPermission(user, 'processos:ler_proprios');
      if (!canReadAll && !canReadOwn) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      // Se só tem ler_proprios, filtrar por advogado responsável
      const filtros = !canReadAll ? { advogadoId: user.id } : undefined;
      const termo = url.searchParams.get('q');
      const data = termo
        ? await getProcessoService().buscar(termo, filtros)
        : await getProcessoService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/processos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'processos:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const validation = createProcessoSchema.safeParse(body);
      if (!validation.success) {
        const msg = validation.error.issues.map((i) => i.message).join('; ');
        return error(res, msg, 400);
      }
      const id = await getProcessoService().criar(validation.data);
      return json(res, { id }, 201);
    }

    const processoMatch = path.match(/^\/api\/processos\/([^/]+)$/);
    if (processoMatch) {
      const id = processoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const p = await getProcessoService().obterPorId(id);
        if (!p) return error(res, 'Processo não encontrado.', 404);
        // Se só tem ler_proprios, verificar se é o advogado responsável
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          p.advogadoResponsavelId !== user.id
        ) {
          return error(res, 'Permissão insuficiente: processo não atribuído a você.', 403);
        }
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getProcessoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'processos:excluir'))) return;
        await getProcessoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Movimentações de Processo ---
    const movimentacoesMatch = path.match(/^\/api\/processos\/([^/]+)\/movimentacoes$/);
    if (movimentacoesMatch) {
      const processoId = movimentacoesMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const data = await getProcessoService().listarMovimentacoes(processoId);
        return json(res, data);
      }
      if (method === 'POST') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        const id = await getProcessoService().criarMovimentacao({ ...body, processoId });

        // 4.3.2 - Auto-generate prazo when geraPrazo=true
        if (body.geraPrazo) {
          try {
            const processo = await getProcessoService().obterPorId(processoId);
            const dataInicio = body.dataMovimento ?? new Date().toISOString().split('T')[0]!;
            const dataFatal = new Date(dataInicio);
            dataFatal.setDate(dataFatal.getDate() + 15); // Default 15 days
            const prazoId = await getPrazoService().criar({
              processoId,
              movimentacaoId: id,
              descricao: `Prazo gerado: ${body.descricao ?? 'Movimentação'}`,
              dataFatal: dataFatal.toISOString().split('T')[0]!,
              dataInicio,
              diasPrazo: 15,
              tipoPrazo: 'ncpc',
              prioridade: body.urgente ? 'alta' : 'normal',
              fatal: false,
              responsavelId: processo?.advogadoResponsavelId ?? user.id,
            });
            // Update movimentacao with prazoGeradoId
            await getProcessoService().atualizarMovimentacao(id, { prazoGeradoId: prazoId });
          } catch {
            // Non-critical: don't fail the movimentação creation
          }
        }

        return json(res, { id }, 201);
      }
    }

    // --- Movimentação individual ---
    const movIndividualMatch = path.match(/^\/api\/movimentacoes\/([^/]+)$/);
    if (movIndividualMatch) {
      const id = movIndividualMatch[1] ?? '';
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getProcessoService().atualizarMovimentacao(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'processos:excluir'))) return;
        await getProcessoService().excluirMovimentacao(id);
        return json(res, { ok: true });
      }
    }

    // --- Prazos de Processo ---
    const prazosProcessoMatch = path.match(/^\/api\/processos\/([^/]+)\/prazos$/);
    if (prazosProcessoMatch) {
      const processoId = prazosProcessoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const data = await getProcessoService().listarPrazos(processoId);
        return json(res, data);
      }
    }

    const honProcessoMatch = path.match(/^\/api\/processos\/([^/]+)\/honorarios$/);
    if (honProcessoMatch) {
      const processoId = honProcessoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente', 403);
        }
        const data = await getFinanceiroService().listarPorProcesso(processoId);
        return json(res, data);
      }
    }

    // --- Usuarios ---
    if (path === '/api/usuarios' && method === 'GET') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const s = getAppSchema();
      const data = await getDb()
        .select({
          id: s.users.id,
          nome: s.users.nome,
          email: s.users.email,
          oabNumero: s.users.oabNumero,
          oabSeccional: s.users.oabSeccional,
          oabTipo: s.users.oabTipo,
          telefone: s.users.telefone,
          role: s.roles.nome,
          areaAtuacao: s.users.areaAtuacao,
          especialidade: s.users.especialidade,
          taxaHoraria: s.users.taxaHoraria,
          dataAdmissao: s.users.dataAdmissao,
          certificadoA1Validade: s.users.certificadoA1Validade,
          certificadoA3Configurado: s.users.certificadoA3Configurado,
          ativo: s.users.ativo,
          createdAt: s.users.createdAt,
        })
        .from(s.users)
        .leftJoin(s.roles, eq(s.users.roleId, s.roles.id));
      return json(res, data);
    }

    if (path === '/api/usuarios' && method === 'POST') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const s = getAppSchema();
      const [role] = await getDb()
        .select()
        .from(s.roles)
        .where(eq(s.roles.nome, body.role as string));
      if (!role) return error(res, `Papel "${String(body.role)}" não encontrado.`, 400);
      const id = await getAuthService().createUser({
        nome: body.nome as string,
        email: body.email as string,
        senha: body.senha as string,
        ...(body.oabNumero ? { oabNumero: body.oabNumero as string } : {}),
        ...(body.oabSeccional ? { oabSeccional: body.oabSeccional as string } : {}),
        roleId: role.id,
      });
      return json(res, { id }, 201);
    }

    const usuarioMatch = path.match(/^\/api\/usuarios\/([^/]+)$/);
    if (usuarioMatch) {
      const id = usuarioMatch[1] ?? '';
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const s = getAppSchema();
        const updateData: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
        if (body.nome !== undefined) updateData.nome = body.nome;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.oabNumero !== undefined) updateData.oabNumero = body.oabNumero || null;
        if (body.oabSeccional !== undefined) updateData.oabSeccional = body.oabSeccional || null;
        if (body.oabTipo !== undefined) updateData.oabTipo = body.oabTipo || null;
        if (body.telefone !== undefined) updateData.telefone = body.telefone || null;
        if (body.areaAtuacao !== undefined) updateData.areaAtuacao = body.areaAtuacao || null;
        if (body.especialidade !== undefined) updateData.especialidade = body.especialidade || null;
        if (body.taxaHoraria !== undefined) updateData.taxaHoraria = body.taxaHoraria || null;
        if (body.dataAdmissao !== undefined) updateData.dataAdmissao = body.dataAdmissao || null;
        if (body.certificadoA1Validade !== undefined)
          updateData.certificadoA1Validade = body.certificadoA1Validade || null;
        if (body.certificadoA3Configurado !== undefined)
          updateData.certificadoA3Configurado = body.certificadoA3Configurado;
        if (body.ativo !== undefined) updateData.ativo = body.ativo;
        if (body.role !== undefined) {
          const [role] = await getDb()
            .select()
            .from(s.roles)
            .where(eq(s.roles.nome, body.role as string));
          if (!role) return error(res, `Papel "${String(body.role)}" não encontrado.`, 400);
          updateData.roleId = role.id;
        }
        if (Object.keys(updateData).length > 0) {
          await getDb().update(s.users).set(updateData).where(eq(s.users.id, id));
          // Limpar cache RBAC ao alterar papel do usuário
          if (updateData.roleId) getRbacService().clearCache(id);
        }
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
        // Não permitir auto-exclusão
        if (id === user.id) {
          return error(res, 'Não é possível excluir o próprio usuário.', 400);
        }
        const s = getAppSchema();
        // Desativar ao invés de deletar (soft delete) para preservar integridade referencial
        await getDb().update(s.users).set({ ativo: false }).where(eq(s.users.id, id));
        getRbacService().clearCache(id);
        return json(res, { ok: true });
      }
    }

    if (path === '/api/roles' && method === 'GET') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const s = getAppSchema();
      const data = await getDb().select({ id: s.roles.id, nome: s.roles.nome }).from(s.roles);
      return json(res, data);
    }

    // --- Honorários ---
    if (path === '/api/honorarios' && method === 'GET') {
      const canReadAllFinanceiro = await hasPermission(user, 'financeiro:ler_todos');
      const canReadOwnFinanceiro = await hasPermission(user, 'financeiro:ler_proprios');
      if (!canReadAllFinanceiro && !canReadOwnFinanceiro) {
        return error(res, 'Permissão insuficiente: financeiro:ler_todos', 403);
      }
      // Se só tem ler_proprios, filtrar pelos honorários dos processos do advogado
      const advogadoId = !canReadAllFinanceiro ? user.id : undefined;
      const data = await getFinanceiroService().listar(advogadoId);
      return json(res, data);
    }

    if (path === '/api/honorarios' && method === 'POST') {
      if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getFinanceiroService().criar(body);
      return json(res, { id }, 201);
    }

    const honorarioMatch = path.match(/^\/api\/honorarios\/([^/]+)$/);
    if (honorarioMatch) {
      const id = honorarioMatch[1] ?? '';
      if (method === 'GET') {
        const canReadAllFin = await hasPermission(user, 'financeiro:ler_todos');
        const canReadOwnFin = await hasPermission(user, 'financeiro:ler_proprios');
        if (!canReadAllFin && !canReadOwnFin) {
          return error(res, 'Permissão insuficiente: financeiro:ler_todos', 403);
        }
        const h = await getFinanceiroService().obterPorId(id);
        if (!h) return error(res, 'Honorário não encontrado.', 404);
        return json(res, h);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getFinanceiroService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
        await getFinanceiroService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Agenda ---
    if (path === '/api/agenda' && method === 'GET') {
      if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
      const inicio = url.searchParams.get('inicio') || undefined;
      const fim = url.searchParams.get('fim') || undefined;
      const filtros: { inicio?: string; fim?: string } = {};
      if (inicio) filtros.inicio = inicio;
      if (fim) filtros.fim = fim;
      const data = await getAgendaService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/agenda' && method === 'POST') {
      if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getAgendaService().criar(body);
      return json(res, { id }, 201);
    }

    const agendaMatch = path.match(/^\/api\/agenda\/([^/]+)$/);
    if (agendaMatch) {
      const id = agendaMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        const a = await getAgendaService().obterPorId(id);
        if (!a) return error(res, 'Evento não encontrado.', 404);
        return json(res, a);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        const body = JSON.parse(await readBody(req));
        await getAgendaService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        await getAgendaService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Prazos ---
    if (path === '/api/prazos' && method === 'GET') {
      const canReadAllProcessos = await hasPermission(user, 'processos:ler_todos');
      const canReadOwnProcessos = await hasPermission(user, 'processos:ler_proprios');
      if (!canReadAllProcessos && !canReadOwnProcessos) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      const filtrosPrazo: { status?: string; responsavelId?: string } = {};
      const statusParam = url.searchParams.get('status');
      const responsavelParam = url.searchParams.get('responsavelId');
      if (statusParam) filtrosPrazo.status = statusParam;
      if (responsavelParam) filtrosPrazo.responsavelId = responsavelParam;
      // Se só tem ler_proprios, filtrar pelos prazos do próprio usuário
      if (!canReadAllProcessos) {
        filtrosPrazo.responsavelId = user.id;
      }
      const data = await getPrazoService().listar(filtrosPrazo);
      return json(res, data);
    }

    if (path === '/api/prazos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'processos:editar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getPrazoService().criar(body);
      return json(res, { id }, 201);
    }

    const prazoMatch = path.match(/^\/api\/prazos\/([^/]+)$/);
    if (prazoMatch) {
      const id = prazoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const p = await getPrazoService().obterPorId(id);
        if (!p) return error(res, 'Prazo não encontrado.', 404);
        // Se só tem ler_proprios, verificar se é o responsável
        if (!(await hasPermission(user, 'processos:ler_todos')) && p.responsavelId !== user.id) {
          return error(res, 'Permissão insuficiente: prazo não atribuído a você.', 403);
        }
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getPrazoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'processos:excluir'))) return;
        await getPrazoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Tarefas ---
    if (path === '/api/tarefas' && method === 'GET') {
      const canReadAll = await hasPermission(user, 'tarefas:ler_todos');
      const canReadOwn = await hasPermission(user, 'tarefas:ler_proprios');
      if (!canReadAll && !canReadOwn) {
        return error(res, 'Permissão insuficiente: tarefas:ler_todos', 403);
      }
      const filtros: {
        status?: string;
        prioridade?: string;
        responsavelId?: string;
        processoId?: string;
      } = {};
      const statusParam = url.searchParams.get('status');
      const prioridadeParam = url.searchParams.get('prioridade');
      const processoIdParam = url.searchParams.get('processoId');
      if (statusParam) filtros.status = statusParam;
      if (prioridadeParam) filtros.prioridade = prioridadeParam;
      if (processoIdParam) filtros.processoId = processoIdParam;
      if (!canReadAll) {
        filtros.responsavelId = user.id;
      }
      const data = await getTarefaService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/tarefas' && method === 'POST') {
      if (!(await requirePermission(res, user, 'tarefas:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getTarefaService().criar({ ...body, criadoPor: user.id });
      return json(res, { id }, 201);
    }

    const tarefaMatch = path.match(/^\/api\/tarefas\/([^/]+)$/);
    if (tarefaMatch) {
      const id = tarefaMatch[1] ?? '';
      if (method === 'GET') {
        const canReadAllT = await hasPermission(user, 'tarefas:ler_todos');
        const canReadOwnT = await hasPermission(user, 'tarefas:ler_proprios');
        if (!canReadAllT && !canReadOwnT) {
          return error(res, 'Permissão insuficiente: tarefas:ler_todos', 403);
        }
        const t = await getTarefaService().obterPorId(id);
        if (!t) return error(res, 'Tarefa não encontrada.', 404);
        if (!canReadAllT && t.responsavelId !== user.id && t.criadoPor !== user.id) {
          return error(res, 'Permissão insuficiente: tarefa não atribuída a você.', 403);
        }
        return json(res, t);
      }
      if (method === 'PUT') {
        const canEditAll = await hasPermission(user, 'tarefas:editar_todos');
        const canReadOwnT = await hasPermission(user, 'tarefas:ler_proprios');
        if (!canEditAll && !canReadOwnT) {
          return error(res, 'Permissão insuficiente: tarefas:editar_todos', 403);
        }
        if (!canEditAll) {
          const t = await getTarefaService().obterPorId(id);
          if (!t || (t.responsavelId !== user.id && t.criadoPor !== user.id)) {
            return error(res, 'Permissão insuficiente: tarefa não atribuída a você.', 403);
          }
        }
        const body = JSON.parse(await readBody(req));
        await getTarefaService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'tarefas:editar_todos'))) return;
        await getTarefaService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Documentos ---
    if (path === '/api/documentos' && method === 'GET') {
      if (!(await requirePermission(res, user, 'documentos:ler_todos'))) return;
      const filtros: { processoId?: string; clienteId?: string; includeProcessoDocs?: boolean; categoria?: string; q?: string } = {};
      const processoIdParam = url.searchParams.get('processoId');
      const clienteIdParam = url.searchParams.get('clienteId');
      const includeProcessoDocsParam = url.searchParams.get('includeProcessoDocs');
      const categoriaParam = url.searchParams.get('categoria');
      const qParam = url.searchParams.get('q');
      if (processoIdParam) filtros.processoId = processoIdParam;
      if (clienteIdParam) filtros.clienteId = clienteIdParam;
      if (includeProcessoDocsParam === 'true') filtros.includeProcessoDocs = true;
      if (categoriaParam) filtros.categoria = categoriaParam;
      if (qParam) filtros.q = qParam;
      // Se não tem permissão confidencial, filtrar apenas não-confidenciais
      const canConfidencial = await hasPermission(user, 'documentos:confidencial');
      if (!canConfidencial) {
        const data = await getDocumentoService().listar({ ...filtros, confidencial: false });
        return json(res, data);
      }
      const data = await getDocumentoService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/documentos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'documentos:upload'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getDocumentoService().criar({ ...body, uploadedBy: user.id });
      return json(res, { id }, 201);
    }

    const documentoDownloadMatch = path.match(/^\/api\/documentos\/([^/]+)\/download$/);
    if (documentoDownloadMatch && method === 'GET') {
      if (!(await requirePermission(res, user, 'documentos:ler_todos'))) return;
      const id = documentoDownloadMatch[1] ?? '';
      const d = await getDocumentoService().obterConteudo(id);
      if (!d || !d.conteudo) return error(res, 'Conteúdo não encontrado.', 404);
      return json(res, { nome: d.nome, tipoMime: d.tipoMime, conteudo: d.conteudo });
    }

    const documentoMatch = path.match(/^\/api\/documentos\/([^/]+)$/);
    if (documentoMatch) {
      const id = documentoMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'documentos:ler_todos'))) return;
        const d = await getDocumentoService().obterPorId(id);
        if (!d) return error(res, 'Documento não encontrado.', 404);
        if (d.confidencial && !(await hasPermission(user, 'documentos:confidencial'))) {
          return error(res, 'Permissão insuficiente: documentos:confidencial', 403);
        }
        return json(res, d);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'documentos:upload'))) return;
        const body = JSON.parse(await readBody(req));
        await getDocumentoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'documentos:upload'))) return;
        await getDocumentoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Parcelas ---
    const parcelasHonMatch = path.match(/^\/api\/honorarios\/([^/]+)\/parcelas$/);
    if (parcelasHonMatch) {
      const honorarioId = parcelasHonMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'parcelas:gerenciar'))) return;
        const data = await getParcelaService().listarPorHonorario(honorarioId);
        return json(res, data);
      }
      if (method === 'POST') {
        if (!(await requirePermission(res, user, 'parcelas:gerenciar'))) return;
        const body = JSON.parse(await readBody(req));
        const ids = await getParcelaService().gerarParcelas(
          honorarioId,
          body.numeroParcelas,
          body.valorTotal,
          body.primeiroVencimento,
        );
        return json(res, { ids }, 201);
      }
    }

    const parcelaMatch = path.match(/^\/api\/parcelas\/([^/]+)$/);
    if (parcelaMatch) {
      const id = parcelaMatch[1] ?? '';
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'parcelas:gerenciar'))) return;
        const body = JSON.parse(await readBody(req));
        await getParcelaService().atualizar(id, body);
        return json(res, { ok: true });
      }
    }

    const parcelaPagarMatch = path.match(/^\/api\/parcelas\/([^/]+)\/pagar$/);
    if (parcelaPagarMatch && method === 'POST') {
      if (!(await requirePermission(res, user, 'parcelas:gerenciar'))) return;
      const id = parcelaPagarMatch[1] ?? '';
      const body = JSON.parse(await readBody(req));
      await getParcelaService().pagar(id, body);
      return json(res, { ok: true });
    }

    // --- Despesas ---
    if (path === '/api/despesas' && method === 'GET') {
      if (!(await requirePermission(res, user, 'despesas:ler_todos'))) return;
      const filtros: { processoId?: string; status?: string } = {};
      const processoIdParam = url.searchParams.get('processoId');
      const statusParam = url.searchParams.get('status');
      if (processoIdParam) filtros.processoId = processoIdParam;
      if (statusParam) filtros.status = statusParam;
      const data = await getDespesaService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/despesas' && method === 'POST') {
      if (!(await requirePermission(res, user, 'despesas:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getDespesaService().criar({ ...body, responsavelId: user.id });
      return json(res, { id }, 201);
    }

    const despesaMatch = path.match(/^\/api\/despesas\/([^/]+)$/);
    if (despesaMatch) {
      const id = despesaMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'despesas:ler_todos'))) return;
        const d = await getDespesaService().obterPorId(id);
        if (!d) return error(res, 'Despesa não encontrada.', 404);
        return json(res, d);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'despesas:ler_todos'))) return;
        const body = JSON.parse(await readBody(req));
        await getDespesaService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'despesas:aprovar'))) return;
        await getDespesaService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Contatos ---
    if (path === '/api/contatos' && method === 'GET') {
      if (!(await requirePermission(res, user, 'contatos:gerenciar'))) return;
      const filtros: { tipo?: string; busca?: string } = {};
      const tipoParam = url.searchParams.get('tipo');
      const buscaParam = url.searchParams.get('q');
      if (tipoParam) filtros.tipo = tipoParam;
      if (buscaParam) filtros.busca = buscaParam;
      const data = await getContatoService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/contatos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'contatos:gerenciar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getContatoService().criar(body);
      return json(res, { id }, 201);
    }

    const contatoMatch = path.match(/^\/api\/contatos\/([^/]+)$/);
    if (contatoMatch) {
      const id = contatoMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'contatos:gerenciar'))) return;
        const c = await getContatoService().obterPorId(id);
        if (!c) return error(res, 'Contato não encontrado.', 404);
        return json(res, c);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'contatos:gerenciar'))) return;
        const body = JSON.parse(await readBody(req));
        await getContatoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'contatos:gerenciar'))) return;
        await getContatoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Timesheets ---
    if (path === '/api/timesheets' && method === 'GET') {
      const canAll = await getRbacService().checkPermission(user, 'timesheet:ler_todos');
      const canOwn = await getRbacService().checkPermission(user, 'timesheet:ler_proprios');
      if (!canAll && !canOwn) {
        error(res, 'Permissão insuficiente: timesheet:ler_proprios', 403);
        return;
      }
      const filtros: { userId?: string; processoId?: string; data?: string } = {};
      if (!canAll) filtros.userId = user.id;
      const userParam = url.searchParams.get('userId');
      const processoParam = url.searchParams.get('processoId');
      const dataParam = url.searchParams.get('data');
      if (userParam) filtros.userId = userParam;
      if (processoParam) filtros.processoId = processoParam;
      if (dataParam) filtros.data = dataParam;
      const data = await getTimesheetService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/timesheets' && method === 'POST') {
      if (!(await requirePermission(res, user, 'timesheet:registrar'))) return;
      const body = JSON.parse(await readBody(req));
      body.userId = body.userId ?? user.id;
      const id = await getTimesheetService().criar(body);
      return json(res, { id }, 201);
    }

    const timesheetAprovarMatch = path.match(/^\/api\/timesheets\/([^/]+)\/aprovar$/);
    if (timesheetAprovarMatch && method === 'POST') {
      if (!(await requirePermission(res, user, 'timesheet:aprovar'))) return;
      const id = timesheetAprovarMatch[1] ?? '';
      await getTimesheetService().aprovar(id, user.id);
      return json(res, { ok: true });
    }

    const timesheetMatch = path.match(/^\/api\/timesheets\/([^/]+)$/);
    if (timesheetMatch) {
      const id = timesheetMatch[1] ?? '';
      if (method === 'GET') {
        const canAll = await getRbacService().checkPermission(user, 'timesheet:ler_todos');
        const canOwn = await getRbacService().checkPermission(user, 'timesheet:ler_proprios');
        if (!canAll && !canOwn) {
          error(res, 'Permissão insuficiente: timesheet:ler_proprios', 403);
          return;
        }
        const t = await getTimesheetService().obterPorId(id);
        if (!t) return error(res, 'Registro não encontrado.', 404);
        return json(res, t);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'timesheet:registrar'))) return;
        const body = JSON.parse(await readBody(req));
        await getTimesheetService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'timesheet:registrar'))) return;
        await getTimesheetService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Google Drive ---
    if (path === '/api/google-drive/config' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const gdConfig = config.googleDrive;
      return json(res, {
        authMode: gdConfig?.authMode ?? (gdConfig?.serviceAccountJson ? 'service_account' : 'oauth'),
        configured: !!(gdConfig?.oauthTokens || gdConfig?.serviceAccountJson),
        connected: driveService !== null,
        rootFolderId: gdConfig?.rootFolderId ?? null,
        impersonateEmail: gdConfig?.impersonateEmail ?? null,
        oauthClientId: gdConfig?.oauthClientId ?? null,
      });
    }

    if (path === '/api/google-drive/config' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as {
        authMode?: 'oauth' | 'service_account';
        oauthClientId?: string;
        oauthClientSecret?: string;
        serviceAccountJson?: string;
        rootFolderId?: string;
        impersonateEmail?: string;
      };
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (!config.googleDrive) {
        config.googleDrive = { serviceAccountJson: '' };
      }
      if (body.authMode !== undefined) config.googleDrive.authMode = body.authMode;
      if (body.oauthClientId !== undefined) config.googleDrive.oauthClientId = body.oauthClientId;
      if (body.oauthClientSecret !== undefined) config.googleDrive.oauthClientSecret = body.oauthClientSecret;
      if (body.serviceAccountJson !== undefined) config.googleDrive.serviceAccountJson = body.serviceAccountJson;
      if (body.rootFolderId !== undefined) config.googleDrive.rootFolderId = body.rootFolderId;
      if (body.impersonateEmail !== undefined) config.googleDrive.impersonateEmail = body.impersonateEmail || '';

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

      // Reinicializar o serviço
      initDriveFromConfig(config.googleDrive);
      return json(res, { ok: true });
    }

    // OAuth: gerar URL de autorização
    if (path === '/api/google-drive/oauth/url' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const clientId = config.googleDrive?.oauthClientId;
      const clientSecret = config.googleDrive?.oauthClientSecret;
      if (!clientId || !clientSecret) {
        return error(res, 'Configure o Client ID e Client Secret OAuth antes de conectar.', 400);
      }
      const redirectUri = `http://localhost:${DEFAULT_PORT}/api/google-drive/oauth/callback`;
      const authUrl = GoogleDriveService.getOAuthUrl(clientId, clientSecret, redirectUri);
      return json(res, { authUrl });
    }

    if (path === '/api/google-drive/status' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (!driveService) {
        return json(res, { connected: false });
      }
      const result = await driveService.testConnection();
      return json(res, { connected: result.ok, email: result.email, error: result.error });
    }

    if (path === '/api/google-drive/disconnect' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      delete config.googleDrive;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      driveService = null;
      return json(res, { ok: true });
    }

    if (path === '/api/google-drive/sync' && method === 'POST') {
      if (!(await requirePermission(res, user, 'documentos:upload'))) return;
      if (!driveService) {
        return error(res, 'Google Drive não conectado.', 400);
      }

      const body = JSON.parse(await readBody(req)) as { documentoId: string };
      const docService = getDocumentoService();
      const doc = await docService.obterPorId(body.documentoId);
      if (!doc) return error(res, 'Documento não encontrado.', 404);

      const conteudoData = await docService.obterConteudo(body.documentoId);
      if (!conteudoData?.conteudo) return error(res, 'Conteúdo do documento não disponível.', 404);

      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const rootFolderId = config.googleDrive?.rootFolderId;
      if (!rootFolderId) {
        return error(res, 'Configure o ID da pasta raiz do Google Drive antes de sincronizar.', 400);
      }

      try {
        // Resolver pasta de destino
        const folderId = await driveService.resolveFolderPath({
          rootFolderId,
          clienteNome: doc.clienteNome ?? undefined,
          clienteTipo: (doc as Record<string, unknown>).clienteTipo as string | undefined,
          clienteCpfCnpj: (doc as Record<string, unknown>).clienteCpfCnpj as string | undefined,
          numeroCnj: doc.numeroCnj ?? undefined,
        });

        const contentBuffer = Buffer.from(conteudoData.conteudo, 'base64');

        // Upload ou atualização
        const existingDriveId = (doc as Record<string, unknown>).driveFileId as string | null;
        let fileId: string;
        if (existingDriveId) {
          await driveService.updateFile(existingDriveId, {
            name: doc.nome,
            mimeType: doc.tipoMime,
            content: contentBuffer,
          });
          fileId = existingDriveId;
        } else {
          const result = await driveService.uploadFile({
            name: doc.nome,
            mimeType: doc.tipoMime,
            content: contentBuffer,
            folderId,
          });
          fileId = result.fileId;
        }

        // Atualizar registro no banco com driveFileId
        await docService.atualizar(body.documentoId, {});
        const dbq = getDb();
        const s = getAppSchema();
        await dbq
          .update(s.documentos)
          .set({
            driveFileId: fileId,
            driveSyncedAt: new Date().toISOString(),
          })
          .where(eq(s.documentos.id, body.documentoId));

        return json(res, { ok: true, fileId });
      } catch (err) {
        logger.error('GoogleDrive', 'Erro ao sincronizar documento', {
          documentoId: body.documentoId,
          error: err instanceof Error ? err.message : String(err),
        });
        return error(res, `Erro ao sincronizar: ${err instanceof Error ? err.message : 'erro desconhecido'}`, 500);
      }
    }

    if (path === '/api/google-drive/sync-all' && method === 'POST') {
      if (!(await requirePermission(res, user, 'documentos:upload'))) return;
      if (!driveService) {
        return error(res, 'Google Drive não conectado.', 400);
      }

      const syncAllConfig: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (!syncAllConfig.googleDrive?.rootFolderId) {
        return error(res, 'Configure o ID da pasta raiz do Google Drive antes de sincronizar.', 400);
      }
      const syncAllRootFolderId = syncAllConfig.googleDrive.rootFolderId;

      const dbq = getDb();
      const s = getAppSchema();

      // Buscar documentos que têm conteúdo mas não estão sincronizados
      const pending = await dbq
        .select({
          id: s.documentos.id,
          nome: s.documentos.nome,
          tipoMime: s.documentos.tipoMime,
          driveFileId: s.documentos.driveFileId,
        })
        .from(s.documentos)
        .where(
          and(
            sql`${s.documentos.conteudo} IS NOT NULL`,
            sql`${s.documentos.driveFileId} IS NULL`,
          ),
        );

      let synced = 0;
      let errors = 0;

      for (const doc of pending) {
        try {
          const conteudoData = await getDocumentoService().obterConteudo(doc.id);
          if (!conteudoData?.conteudo) continue;

          const docFull = await getDocumentoService().obterPorId(doc.id);
          if (!docFull) continue;

          const folderId = await driveService.resolveFolderPath({
            rootFolderId: syncAllRootFolderId,
            clienteNome: docFull.clienteNome ?? undefined,
            clienteTipo: (docFull as Record<string, unknown>).clienteTipo as string | undefined,
            clienteCpfCnpj: (docFull as Record<string, unknown>).clienteCpfCnpj as string | undefined,
            numeroCnj: docFull.numeroCnj ?? undefined,
          });

          const contentBuffer = Buffer.from(conteudoData.conteudo, 'base64');
          const result = await driveService.uploadFile({
            name: doc.nome,
            mimeType: doc.tipoMime,
            content: contentBuffer,
            folderId,
          });

          await dbq
            .update(s.documentos)
            .set({
              driveFileId: result.fileId,
              driveSyncedAt: new Date().toISOString(),
            })
            .where(eq(s.documentos.id, doc.id));

          synced++;
        } catch (err) {
          logger.error('GoogleDrive', `Erro ao sincronizar ${doc.nome}`, {
            error: err instanceof Error ? err.message : String(err),
          });
          errors++;
        }
      }

      return json(res, { ok: true, total: pending.length, synced, errors });
    }

    // Lista documentos não classificados das pastas "Compartilhado" no Drive
    if (path === '/api/google-drive/unclassified' && method === 'GET') {
      if (!(await requirePermission(res, user, 'documentos:ler_todos'))) return;
      if (!driveService) {
        return error(res, 'Google Drive não conectado.', 400);
      }

      const ucConfig: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const rootFolderId = ucConfig.googleDrive?.rootFolderId;
      if (!rootFolderId) {
        return error(res, 'Configure o ID da pasta raiz do Google Drive.', 400);
      }

      try {
        // Buscar driveFileIds já classificados no BD para filtrar
        const dbq = getDb();
        const s = getAppSchema();
        const classifiedRows = await dbq
          .select({ driveFileId: s.documentos.driveFileId })
          .from(s.documentos)
          .where(sql`${s.documentos.driveFileId} IS NOT NULL`);
        const classifiedIds = new Set(classifiedRows.map((r: { driveFileId: string | null }) => r.driveFileId));

        const folders = await driveService.listCompartilhadoFolders(rootFolderId);
        const result: Array<{
          clienteFolderName: string;
          compartilhadoId: string;
          files: Array<{ id: string; name: string; mimeType: string; webViewLink: string }>;
        }> = [];

        for (const folder of folders) {
          const allFiles = await driveService.listFiles(folder.compartilhadoId);
          // Filtrar arquivos já classificados (com registro no BD)
          const files = allFiles.filter((f) => !classifiedIds.has(f.id));
          if (files.length > 0) {
            result.push({
              clienteFolderName: folder.clienteFolderName,
              compartilhadoId: folder.compartilhadoId,
              files,
            });
          }
        }

        return json(res, result);
      } catch (err) {
        logger.error('GoogleDrive', 'Erro ao listar não classificados', {
          error: err instanceof Error ? err.message : String(err),
        });
        return error(res, `Erro ao listar: ${err instanceof Error ? err.message : 'erro desconhecido'}`, 500);
      }
    }

    // Classificar documento: mover arquivo no Drive para pasta do cliente ou processo + criar registro no BD
    if (path === '/api/google-drive/classify' && method === 'POST') {
      if (!(await requirePermission(res, user, 'documentos:upload'))) return;
      if (!driveService) {
        return error(res, 'Google Drive não conectado.', 400);
      }

      const body = JSON.parse(await readBody(req)) as {
        driveFileId: string;
        sourceParentId: string;
        clienteId: string;
        processoId?: string;
        keepOriginal?: boolean;
        // Metadados do documento
        fileName: string;
        mimeType?: string;
        descricao?: string;
        categoria?: string;
        confidencial?: boolean;
        dataReferencia?: string;
      };

      const clConfig: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const rootFolderId = clConfig.googleDrive?.rootFolderId;
      if (!rootFolderId) {
        return error(res, 'Configure o ID da pasta raiz do Google Drive.', 400);
      }

      try {
        // Buscar dados do cliente
        const clienteService = getClienteService();
        const cliente = await clienteService.obterPorId(body.clienteId);
        if (!cliente) return error(res, 'Cliente não encontrado.', 404);

        let numeroCnj: string | undefined;
        if (body.processoId) {
          const processoService = getProcessoService();
          const processo = await processoService.obterPorId(body.processoId);
          if (!processo) return error(res, 'Processo não encontrado.', 404);
          numeroCnj = processo.numeroCnj;
        }

        // Resolver pasta de destino
        const targetFolderId = await driveService.resolveFolderPath({
          rootFolderId,
          clienteNome: cliente.nome,
          clienteTipo: cliente.tipo,
          clienteCpfCnpj: cliente.cpfCnpj ?? undefined,
          numeroCnj,
        });

        if (body.keepOriginal) {
          // Manter na origem: adiciona pasta de destino sem remover a de origem
          await driveService.moveFile(body.driveFileId, targetFolderId);
        } else {
          // Mover: adiciona nova pasta e remove pasta antiga
          await driveService.moveFile(body.driveFileId, targetFolderId, body.sourceParentId);
        }

        // Criar registro do documento no banco de dados
        const docService = getDocumentoService();
        const docId = await docService.criar({
          nome: body.fileName,
          descricao: body.descricao,
          categoria: body.categoria,
          confidencial: body.confidencial,
          dataReferencia: body.dataReferencia,
          clienteId: body.clienteId,
          processoId: body.processoId,
          tipoMime: body.mimeType ?? 'application/octet-stream',
          tamanhoBytes: 0,
          hashSha256: '',
          uploadedBy: user.id,
        });

        // Marcar como sincronizado com Drive (driveFileId + driveSyncedAt)
        const dbq = getDb();
        const s = getAppSchema();
        await dbq
          .update(s.documentos)
          .set({ driveFileId: body.driveFileId, driveSyncedAt: new Date().toISOString() })
          .where(eq(s.documentos.id, docId));

        return json(res, { ok: true, documentoId: docId });
      } catch (err) {
        logger.error('GoogleDrive', 'Erro ao classificar documento', {
          error: err instanceof Error ? err.message : String(err),
        });
        return error(res, `Erro ao classificar: ${err instanceof Error ? err.message : 'erro desconhecido'}`, 500);
      }
    }

    // Sincronizar estrutura de pastas no Drive (criar Compartilhado para todos os clientes)
    if (path === '/api/google-drive/sync-folders' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (!driveService) {
        return error(res, 'Google Drive não conectado.', 400);
      }

      const sfConfig: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const rootFolderId = sfConfig.googleDrive?.rootFolderId;
      if (!rootFolderId) {
        return error(res, 'Configure o ID da pasta raiz do Google Drive.', 400);
      }

      try {
        // Limpar cache para garantir que as pastas sejam verificadas no Drive
        driveService.clearFolderCache();

        const clienteService = getClienteService();
        const allClientes = await clienteService.listar();
        let created = 0;
        const details: Array<{ nome: string; folderName: string; ok: boolean; error?: string }> = [];

        logger.info('GoogleDrive', `sync-folders: processando ${allClientes.length} clientes (rootFolderId=${rootFolderId})`);

        for (const cliente of allClientes) {
          const folderName = GoogleDriveService.buildClienteFolderName({
            clienteTipo: cliente.tipo,
            clienteNome: cliente.nome,
            clienteCpfCnpj: cliente.cpfCnpj ?? undefined,
          });
          try {
            await driveService.resolveCompartilhadoFolder({
              rootFolderId,
              clienteNome: cliente.nome,
              clienteTipo: cliente.tipo,
              clienteCpfCnpj: cliente.cpfCnpj ?? undefined,
            });
            created++;
            details.push({ nome: cliente.nome, folderName, ok: true });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            logger.error('GoogleDrive', `Erro ao criar pasta para cliente ${cliente.nome} (${folderName})`, {
              error: errMsg,
            });
            details.push({ nome: cliente.nome, folderName, ok: false, error: errMsg });
          }
        }

        logger.info('GoogleDrive', `sync-folders: concluído — ${created}/${allClientes.length} processados`, { details });
        return json(res, { ok: true, total: allClientes.length, created, details });
      } catch (err) {
        logger.error('GoogleDrive', 'Erro ao sincronizar pastas', {
          error: err instanceof Error ? err.message : String(err),
        });
        return error(res, `Erro: ${err instanceof Error ? err.message : 'erro desconhecido'}`, 500);
      }
    }

    // --- Telegram ---
    if (path === '/api/telegram/config' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const tgConfig = config.telegram;
      return json(res, {
        configured: !!tgConfig?.botToken && !!tgConfig?.chatId,
        botToken: tgConfig?.botToken ? `${tgConfig.botToken.slice(0, 8)}...` : null,
        chatId: tgConfig?.chatId ?? null,
        dailySummaryEnabled: tgConfig?.dailySummaryEnabled ?? false,
        alertDays: tgConfig?.alertDays ?? [15, 7, 3, 1],
      });
    }

    if (path === '/api/telegram/config' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as Partial<TelegramBotConfig>;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

      if (!config.telegram) {
        config.telegram = { botToken: '', chatId: '' };
      }
      if (body.botToken !== undefined) config.telegram.botToken = body.botToken;
      if (body.chatId !== undefined) config.telegram.chatId = body.chatId;
      if (body.dailySummaryEnabled !== undefined) config.telegram.dailySummaryEnabled = body.dailySummaryEnabled;
      if (body.alertDays !== undefined) config.telegram.alertDays = body.alertDays;

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

      // Reinicializar serviço
      if (config.telegram.botToken && config.telegram.chatId) {
        telegramService = new TelegramService({
          botToken: config.telegram.botToken,
          chatId: config.telegram.chatId,
        });
        startTelegramAlertJob(config.telegram);
      } else {
        telegramService = null;
        if (telegramAlertInterval) {
          clearInterval(telegramAlertInterval);
          telegramAlertInterval = null;
        }
      }

      return json(res, { ok: true });
    }

    if (path === '/api/telegram/test' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (!telegramService) {
        return error(res, 'Telegram não configurado.', 400);
      }
      const result = await telegramService.testConnection();
      if (result.ok) {
        await telegramService.sendMessage('✅ <b>CAUSA</b> — Bot conectado com sucesso!');
      }
      return json(res, result);
    }

    if (path === '/api/telegram/updates' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (!telegramService) {
        return error(res, 'Telegram não configurado. Salve o token do bot primeiro.', 400);
      }
      const updates = await telegramService.getUpdates();
      return json(res, updates);
    }

    if (path === '/api/telegram/send-summary' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (!telegramService) {
        return error(res, 'Telegram não configurado.', 400);
      }

      try {
        const summaryData = await buildDailySummary();
        const sent = await telegramService.sendDailySummary(summaryData);
        return json(res, { ok: sent });
      } catch (err) {
        return error(res, `Erro ao enviar resumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`, 500);
      }
    }

    if (path === '/api/telegram/disconnect' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      delete config.telegram;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      telegramService = null;
      if (telegramAlertInterval) {
        clearInterval(telegramAlertInterval);
        telegramAlertInterval = null;
      }
      return json(res, { ok: true });
    }

    // --- Backup ---
    if (path === '/api/backup/config' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const driveConnected = !!driveService;
      return json(res, {
        config: config.backup ?? {
          enabled: false,
          schedule: { trigger: 'first_open_day', delayMinutes: 5 },
          destinations: [],
          retentionDays: 30,
        },
        driveConnected,
      });
    }

    if (path === '/api/backup/config' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as BackupConfig;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      config.backup = body;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      // Restart scheduler
      startBackupScheduler();
      return json(res, { ok: true });
    }

    if (path === '/api/backup/run' && method === 'POST') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      if (backupStatus.running) {
        return error(res, 'Backup já em andamento.', 409);
      }
      // Run async — don't await
      executeBackup().catch((err) => {
        logger.error('Backup', 'Erro no backup manual', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      return json(res, { ok: true, message: 'Backup iniciado.' });
    }

    if (path === '/api/backup/status' && method === 'GET') {
      return json(res, backupStatus);
    }

    if (path === '/api/backup/logs' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffIso = cutoff.toISOString();
        const rows = (db as SqliteDatabase).all<BackupLogRow>(
          sql`SELECT * FROM backup_logs WHERE started_at >= ${cutoffIso} ORDER BY started_at DESC LIMIT 200`,
        );
        return json(res, rows);
      } catch (err) {
        return json(res, []);
      }
    }

    if (path === '/api/backup/notify-open' && method === 'POST') {
      // Called by frontend on app open to trigger on_open / first_open_day backups
      try {
        const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        const bc = config.backup;
        if (!bc?.enabled) return json(res, { ok: true, triggered: false });

        const todayStr = new Date().toISOString().slice(0, 10);
        let shouldRun = false;

        if (bc.schedule.trigger === 'on_open' && !appOpenBackupDone) {
          appOpenBackupDone = true;
          const delay = (bc.schedule.delayMinutes ?? 0) * 60_000;
          if (delay > 0) {
            setTimeout(() => {
              executeBackup().catch(() => {});
            }, delay);
            return json(res, { ok: true, triggered: true, delayed: true });
          }
          shouldRun = true;
        } else if (bc.schedule.trigger === 'first_open_day' && lastBackupDate !== todayStr) {
          const delay = (bc.schedule.delayMinutes ?? 0) * 60_000;
          if (delay > 0) {
            setTimeout(() => {
              executeBackup().catch(() => {});
            }, delay);
            return json(res, { ok: true, triggered: true, delayed: true });
          }
          shouldRun = true;
        }

        if (shouldRun) {
          executeBackup().catch(() => {});
          return json(res, { ok: true, triggered: true });
        }
        return json(res, { ok: true, triggered: false });
      } catch {
        return json(res, { ok: true, triggered: false });
      }
    }

    // --- Configurações ---
    if (path === '/api/configuracoes' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return json(res, {
        topologia: config.topologia,
        dbPath: config.dbPath,
      });
    }

    if (path === '/api/configuracoes' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as Partial<{ topologia: 'solo' | 'escritorio' }>;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (body.topologia) config.topologia = body.topologia;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      return json(res, { ok: true });
    }

    // --- GH Token (para auto-updater) ---
    // NOTA: O auto-updater do Electron lê de "causa-config.json" (com hífen),
    // que é diferente do CONFIG_PATH "causa.config.json" (com ponto) usado pela API.
    const GH_TOKEN_CONFIG = 'causa-config.json';

    if (path === '/api/gh-token' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      try {
        if (fs.existsSync(GH_TOKEN_CONFIG)) {
          const config = JSON.parse(fs.readFileSync(GH_TOKEN_CONFIG, 'utf-8')) as Record<string, unknown>;
          return json(res, { token: (config.ghToken as string) ?? '' });
        }
      } catch { /* ignorar */ }
      return json(res, { token: '' });
    }

    if (path === '/api/gh-token' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as { token: string };
      let config: Record<string, unknown> = {};
      try {
        if (fs.existsSync(GH_TOKEN_CONFIG)) {
          config = JSON.parse(fs.readFileSync(GH_TOKEN_CONFIG, 'utf-8')) as Record<string, unknown>;
        }
      } catch { /* ignorar */ }
      config.ghToken = body.token;
      fs.writeFileSync(GH_TOKEN_CONFIG, JSON.stringify(config, null, 2));
      logger.info('API', `GH_TOKEN salvo em ${GH_TOKEN_CONFIG}`, { hasToken: !!body.token });
      return json(res, { ok: true });
    }

    // --- Automações ---
    if (path === '/api/automations/run' && method === 'POST') {
      const database = ensureService(db, 'database');
      const s = getAppSchema();
      const parcelasAtualizadas = await marcarParcelasAtrasadas(database, s);
      const processosAtualizados = await atualizarPrioridadePorIdade(database, s);
      return json(res, { parcelasAtualizadas, processosAtualizados });
    }

    // --- Dashboard stats --- (qualquer usuário autenticado pode ver)
    if (path === '/api/dashboard' && method === 'GET') {
      const s = getAppSchema();
      const dbq = getDb();

      // Run automations silently on dashboard load
      const database = ensureService(db, 'database');
      try {
        await marcarParcelasAtrasadas(database, s);
        await atualizarPrioridadePorIdade(database, s);
      } catch {
        // Non-critical: don't fail dashboard if automations error
      }
      const [processosAtivos] = await dbq
        .select({ count: count() })
        .from(s.processos)
        .where(eq(s.processos.status, 'ativo'));
      const [totalClientes] = await dbq.select({ count: count() }).from(s.clientes);
      const [prazosPendentes] = await dbq
        .select({ count: count() })
        .from(s.prazos)
        .where(eq(s.prazos.status, 'pendente'));

      const [honorariosPendentes] = await dbq
        .select({ total: sum(s.honorarios.valor) })
        .from(s.honorarios)
        .where(eq(s.honorarios.status, 'pendente'));

      const [tarefasPendentes] = await dbq
        .select({ count: count() })
        .from(s.tarefas)
        .where(eq(s.tarefas.status, 'pendente'));

      const hoje = new Date().toISOString().split('T')[0]!;
      const [parcelasAtrasadas] = await dbq
        .select({ count: count() })
        .from(s.parcelas)
        .where(and(eq(s.parcelas.status, 'pendente'), lt(s.parcelas.vencimento, hoje)));

      // 4.2.3 - Movimentações não lidas
      const [movNaoLidas] = await dbq
        .select({ count: count() })
        .from(s.movimentacoes)
        .where(eq(s.movimentacoes.lido, false));

      // 4.2.4 - Audiências da semana
      const hojeDate = new Date();
      const diaSemana = hojeDate.getDay();
      const inicioSemana = new Date(hojeDate);
      inicioSemana.setDate(hojeDate.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      const inicioSemanaStr = inicioSemana.toISOString().split('T')[0]!;
      const fimSemanaStr = fimSemana.toISOString().split('T')[0]!;

      const audienciasSemana = await dbq
        .select({
          id: s.agenda.id,
          titulo: s.agenda.titulo,
          dataHoraInicio: s.agenda.dataHoraInicio,
          dataHoraFim: s.agenda.dataHoraFim,
          local: s.agenda.local,
          statusAgenda: s.agenda.statusAgenda,
          processoId: s.agenda.processoId,
          clienteId: s.agenda.clienteId,
        })
        .from(s.agenda)
        .where(
          and(
            eq(s.agenda.tipo, 'audiencia'),
            gte(s.agenda.dataHoraInicio, inicioSemanaStr),
            lte(s.agenda.dataHoraInicio, fimSemanaStr + 'T23:59:59'),
          ),
        );

      // 4.2.5 - Parcelas atrasadas com detalhes
      const parcelasAtrasadasList = await dbq
        .select({
          id: s.parcelas.id,
          valor: s.parcelas.valor,
          vencimento: s.parcelas.vencimento,
          numeroParcela: s.parcelas.numeroParcela,
          honorarioId: s.parcelas.honorarioId,
        })
        .from(s.parcelas)
        .where(and(eq(s.parcelas.status, 'pendente'), lt(s.parcelas.vencimento, hoje)));

      return json(res, {
        processosAtivos: processosAtivos?.count ?? 0,
        clientes: totalClientes?.count ?? 0,
        prazosPendentes: prazosPendentes?.count ?? 0,
        prazosFatais: 0,
        honorariosPendentes: Number(honorariosPendentes?.total ?? 0),
        tarefasPendentes: tarefasPendentes?.count ?? 0,
        parcelasAtrasadas: parcelasAtrasadas?.count ?? 0,
        movimentacoesNaoLidas: movNaoLidas?.count ?? 0,
        audienciasSemana,
        parcelasAtrasadasList,
      });
    }

    // 4.2.6 - Timeline de atividade (últimos 30 dias)
    if (path === '/api/dashboard/timeline' && method === 'GET') {
      const s = getAppSchema();
      const dbq = getDb();
      const hoje = new Date();
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 29);
      const inicioStr = inicio.toISOString().split('T')[0]!;

      const movimentacoesPorDia = await dbq
        .select({
          data: s.movimentacoes.dataMovimento,
          total: count(),
        })
        .from(s.movimentacoes)
        .where(gte(s.movimentacoes.dataMovimento, inicioStr))
        .groupBy(s.movimentacoes.dataMovimento);

      const prazosPorDia = await dbq
        .select({
          data: s.prazos.dataFatal,
          total: count(),
        })
        .from(s.prazos)
        .where(gte(s.prazos.dataFatal, inicioStr))
        .groupBy(s.prazos.dataFatal);

      const tarefasPorDia = await dbq
        .select({
          data: s.tarefas.createdAt,
          total: count(),
        })
        .from(s.tarefas)
        .where(gte(s.tarefas.createdAt, inicioStr));

      // Build a 30-day map
      const timeline: { data: string; movimentacoes: number; prazos: number; tarefas: number }[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        const dStr = d.toISOString().split('T')[0]!;
        const mov = movimentacoesPorDia.find((m: { data: string; total: number }) => m.data === dStr);
        const pz = prazosPorDia.find((p: { data: string; total: number }) => p.data === dStr);
        const tf = tarefasPorDia.find((t: { data: string | null; total: number }) => t.data?.startsWith(dStr));
        timeline.push({
          data: dStr,
          movimentacoes: mov?.total ?? 0,
          prazos: pz?.total ?? 0,
          tarefas: tf?.total ?? 0,
        });
      }
      return json(res, timeline);
    }

    // 4.2.7 - Produtividade/Timesheet (últimos 7 dias)
    if (path === '/api/dashboard/produtividade' && method === 'GET') {
      const s = getAppSchema();
      const dbq = getDb();
      const hoje = new Date();
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 6);
      const inicioStr = inicio.toISOString().split('T')[0]!;

      const timesheetPorDia = await dbq
        .select({
          data: s.timesheets.data,
          totalMinutos: sum(s.timesheets.duracaoMinutos),
        })
        .from(s.timesheets)
        .where(gte(s.timesheets.data, inicioStr))
        .groupBy(s.timesheets.data);

      const produtividade: { data: string; minutos: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        const dStr = d.toISOString().split('T')[0]!;
        const entry = timesheetPorDia.find((t: { data: string; totalMinutos: string | number | null }) => t.data === dStr);
        produtividade.push({
          data: dStr,
          minutos: Number(entry?.totalMinutos ?? 0),
        });
      }
      return json(res, produtividade);
    }

    // 404
    error(res, 'Rota não encontrada.', 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    logger.error('API', `Erro não tratado: ${method} ${path}`, {
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    });
    error(res, message, 500);
  }
}

// === Telegram helpers ===

/** Monta os dados do resumo diário a partir das queries do DB */
async function buildDailySummary() {
  const dbq = getDb();
  const s = getAppSchema();

  const hoje = new Date().toISOString().split('T')[0]!;
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0]!;
  const fimSemana = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!;

  // Prazos pendentes
  type PrazoSummaryRow = { id: string; descricao: string; dataFatal: string; numeroCnj: string | null; fatal: boolean; responsavelNome: string | null; alertasEnviados: unknown };

  const todosPrazos: PrazoSummaryRow[] = await dbq
    .select({
      id: s.prazos.id,
      descricao: s.prazos.descricao,
      dataFatal: s.prazos.dataFatal,
      numeroCnj: s.processos.numeroCnj,
      fatal: s.prazos.fatal,
      responsavelNome: s.users.nome,
      alertasEnviados: s.prazos.alertasEnviados,
    })
    .from(s.prazos)
    .leftJoin(s.processos, eq(s.prazos.processoId, s.processos.id))
    .leftJoin(s.users, eq(s.prazos.responsavelId, s.users.id))
    .where(and(eq(s.prazos.status, 'pendente'), lte(s.prazos.dataFatal, fimSemana)));

  const prazosHoje = todosPrazos.filter((p: PrazoSummaryRow) => p.dataFatal === hoje).length;
  const prazosAmanha = todosPrazos.filter((p: PrazoSummaryRow) => p.dataFatal === amanha).length;
  const prazosSemana = todosPrazos.filter((p: PrazoSummaryRow) => p.dataFatal > amanha && p.dataFatal <= fimSemana).length;

  const prazosProximos = todosPrazos
    .map((p: PrazoSummaryRow) => {
      const dias = Math.ceil((new Date(p.dataFatal + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime()) / 86400000);
      return { ...p, diasRestantes: dias };
    })
    .filter((p: PrazoSummaryRow & { diasRestantes: number }) => p.diasRestantes >= 0)
    .sort((a: { diasRestantes: number }, b: { diasRestantes: number }) => a.diasRestantes - b.diasRestantes);

  // Tarefas pendentes
  const [tarefasPend] = await dbq
    .select({ count: count() })
    .from(s.tarefas)
    .where(eq(s.tarefas.status, 'pendente'));

  // Movimentações não lidas
  const [movsNaoLidas] = await dbq
    .select({ count: count() })
    .from(s.movimentacoes)
    .where(eq(s.movimentacoes.lido, false));

  // Parcelas atrasadas
  const [parcelasAtr] = await dbq
    .select({ count: count() })
    .from(s.parcelas)
    .where(eq(s.parcelas.status, 'atrasado'));

  // Audiências da semana
  const audiencias = await dbq
    .select({
      titulo: s.agenda.titulo,
      dataHoraInicio: s.agenda.dataHoraInicio,
      local: s.agenda.local,
    })
    .from(s.agenda)
    .where(and(gte(s.agenda.dataHoraInicio, hoje), lte(s.agenda.dataHoraInicio, fimSemana)));

  return {
    prazosHoje,
    prazosAmanha,
    prazosSemana,
    tarefasPendentes: tarefasPend?.count ?? 0,
    movimentacoesNaoLidas: movsNaoLidas?.count ?? 0,
    parcelasAtrasadas: parcelasAtr?.count ?? 0,
    audienciasSemana: audiencias,
    prazosProximos: prazosProximos.map((p) => ({
      descricao: p.descricao,
      dataFatal: p.dataFatal,
      numeroCnj: p.numeroCnj,
      diasRestantes: p.diasRestantes,
      fatal: p.fatal,
    })),
  };
}

/** Verifica prazos e envia alertas via Telegram */
async function checkAndSendPrazoAlerts(alertDays: number[]) {
  if (!telegramService || !db || !schema) return;

  const dbq = db as unknown as DatabaseQueryBuilder;
  const s = schema;
  const hoje = new Date().toISOString().split('T')[0]!;

  // Buscar prazos pendentes
  const prazos = await dbq
    .select({
      id: s.prazos.id,
      descricao: s.prazos.descricao,
      dataFatal: s.prazos.dataFatal,
      numeroCnj: s.processos.numeroCnj,
      fatal: s.prazos.fatal,
      prioridade: s.prazos.prioridade,
      responsavelNome: s.users.nome,
      alertasEnviados: s.prazos.alertasEnviados,
    })
    .from(s.prazos)
    .leftJoin(s.processos, eq(s.prazos.processoId, s.processos.id))
    .leftJoin(s.users, eq(s.prazos.responsavelId, s.users.id))
    .where(eq(s.prazos.status, 'pendente'));

  for (const prazo of prazos) {
    const diasRestantes = Math.ceil(
      (new Date(prazo.dataFatal + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime()) / 86400000,
    );

    if (diasRestantes < 0) continue;

    // Checar se devemos enviar alerta para este número de dias
    const deveAlertar = alertDays.includes(diasRestantes);
    if (!deveAlertar) continue;

    // Checar se já enviamos alerta para este dia
    const enviados = prazo.alertasEnviados as { dias: number[]; enviados: string[] } | null;
    const jaEnviado = enviados?.enviados?.includes(`tg_${diasRestantes}`);
    if (jaEnviado) continue;

    // Enviar alerta
    const sent = await telegramService.sendPrazoAlert({
      descricao: prazo.descricao,
      dataFatal: prazo.dataFatal,
      numeroCnj: prazo.numeroCnj,
      responsavelNome: prazo.responsavelNome,
      diasRestantes,
      fatal: prazo.fatal,
      prioridade: prazo.prioridade,
    });

    if (sent) {
      // Marcar como enviado
      const newEnviados = enviados ?? { dias: alertDays, enviados: [] };
      newEnviados.enviados.push(`tg_${diasRestantes}`);
      await dbq
        .update(s.prazos)
        .set({ alertasEnviados: newEnviados })
        .where(eq(s.prazos.id, prazo.id));
    }
  }
}

/** Inicia job periódico de alertas Telegram */
function startTelegramAlertJob(config: TelegramBotConfig) {
  // Limpar intervalo anterior
  if (telegramAlertInterval) {
    clearInterval(telegramAlertInterval);
    telegramAlertInterval = null;
  }

  if (!config.botToken || !config.chatId) return;

  const alertDays = config.alertDays ?? [15, 7, 3, 1];

  // Verificar a cada hora
  telegramAlertInterval = setInterval(
    () => {
      checkAndSendPrazoAlerts(alertDays).catch((err) => {
        logger.error('Telegram', 'Erro no job de alertas', {
          error: err instanceof Error ? err.message : String(err),
        });
      });

      // Enviar resumo diário às 8h (se habilitado)
      if (config.dailySummaryEnabled) {
        const now = new Date();
        if (now.getHours() === 8 && now.getMinutes() < 30) {
          buildDailySummary()
            .then((data) => telegramService?.sendDailySummary(data))
            .catch((err) => {
              logger.error('Telegram', 'Erro ao enviar resumo diário', {
                error: err instanceof Error ? err.message : String(err),
              });
            });
        }
      }
    },
    30 * 60 * 1000, // 30 minutos
  );

  // Rodar imediatamente na primeira vez
  checkAndSendPrazoAlerts(alertDays).catch(() => {});

  logger.info('Telegram', 'Job de alertas iniciado', {
    alertDays,
    dailySummary: config.dailySummaryEnabled ?? false,
  });
}

export interface StartServerOptions {
  /** Diretório de trabalho onde o banco e config serão armazenados */
  cwd?: string;
  port?: number;
}

/**
 * Inicia o servidor da API CAUSA.
 * Retorna uma Promise que resolve com o http.Server quando estiver ouvindo.
 */
export async function startServer(options: StartServerOptions = {}): Promise<http.Server> {
  const port = options.port ?? DEFAULT_PORT;

  if (options.cwd) {
    process.chdir(options.cwd);
  }

  // Aguardar migration PG pendente (se houver) antes de aceitar requests
  if (pendingPgMigration) {
    try {
      await pendingPgMigration;
      logger.info('API', 'Migrations PostgreSQL aplicadas com sucesso');
    } catch (err) {
      logger.error('API', 'Erro ao aplicar migrations PostgreSQL', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    pendingPgMigration = null;
  }

  // Iniciar job de alertas Telegram se configurado
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.telegram?.botToken && config.telegram?.chatId) {
        startTelegramAlertJob(config.telegram);
      }
    } catch {
      // Non-critical
    }
  }

  // Iniciar agendador de backup
  startBackupScheduler();

  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);

    // Capturar erros não tratados para evitar crash silencioso
    server.on('error', (err) => {
      logger.error('API', 'Erro no servidor HTTP', {
        error: err.message,
        stack: err.stack,
      });
    });

    server.listen(port, () => {
      const configured = fs.existsSync(CONFIG_PATH);
      logger.info('API', `Servidor rodando em http://localhost:${port}`, {
        configured,
        cwd: process.cwd(),
        logDir: logger.getLogDirectory(),
      });
      resolve(server);
    });
  });
}

// Execução standalone (tsx src/api-server.ts)
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  startServer();
}
