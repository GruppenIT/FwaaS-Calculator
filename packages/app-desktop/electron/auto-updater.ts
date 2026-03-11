import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain } from 'electron';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'downloading' | 'downloaded' | 'restarting' | 'error' | 'not-available';
  version?: string;
  releaseNotes?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

const GITHUB_OWNER = 'GruppenIT';
const GITHUB_REPO = 'FwaaS-Calculator';

let mainWin: BrowserWindow | null = null;
let currentStatus: UpdateStatus = { state: 'idle' };
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// --- Logging para arquivo (independente do logger do database) ---

function getLogDir(): string {
  if (process.platform === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    return path.join(programData, 'CAUSA SISTEMAS', 'CAUSA', 'logs');
  }
  return path.join(app.getPath('userData'), 'logs');
}

function logToFile(level: string, message: string, data?: unknown): void {
  const line = data !== undefined
    ? `[${new Date().toISOString()}] [${level}] [AutoUpdater] ${message} ${JSON.stringify(data)}`
    : `[${new Date().toISOString()}] [${level}] [AutoUpdater] ${message}`;

  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }

  try {
    const dir = getLogDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const date = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(path.join(dir, `causa-${date}.log`), line + '\n');
  } catch {
    // Falha silenciosa
  }
}

function sendStatus(status: UpdateStatus) {
  currentStatus = status;
  logToFile('INFO', `Status: ${status.state}`, {
    version: status.version,
    error: status.error,
    percent: status.percent != null ? Math.round(status.percent) : undefined,
  });
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send('update-status', status);
  }
}

/** Compara versões semver simples. Retorna true se remote > local */
function isNewerVersion(remote: string, local: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const r = parse(remote);
  const l = parse(local);
  for (let i = 0; i < 3; i++) {
    if ((r[i] ?? 0) > (l[i] ?? 0)) return true;
    if ((r[i] ?? 0) < (l[i] ?? 0)) return false;
  }
  return false;
}

/**
 * Lê o GH_TOKEN de múltiplas fontes:
 * 1. Arquivo causa-config.json no diretório de dados (campo ghToken)
 * 2. Variável de ambiente GH_TOKEN
 * 3. Arquivo .gh-token na raiz do app (extraResources)
 *
 * NOTA: NÃO checa process.env.GH_TOKEN primeiro, pois ele pode ter
 * sido setado por nós mesmos numa leitura anterior (ficaria stale).
 * Sempre relê a fonte primária (config file) para pegar atualizações
 * feitas pelo usuário via UI.
 */
function getGhToken(): string {
  // 1. Arquivo de config compartilhado (atualizado pela UI)
  try {
    const dataDir = process.platform === 'win32'
      ? path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'CAUSA SISTEMAS', 'CAUSA')
      : app.getPath('userData');
    const configPath = path.join(dataDir, 'causa-config.json');
    logToFile('DEBUG', `Procurando token em: ${configPath}`);
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.ghToken) {
        logToFile('DEBUG', 'Token encontrado em causa-config.json');
        return config.ghToken as string;
      }
    }
  } catch (err) {
    logToFile('WARN', `Erro ao ler causa-config.json: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. Variável de ambiente (set externamente, ex: CI)
  if (process.env.GH_TOKEN) {
    logToFile('DEBUG', 'Token encontrado em process.env.GH_TOKEN');
    return process.env.GH_TOKEN;
  }

  // 3. Arquivo .gh-token na raiz do app (incluído via extraResources no build)
  try {
    const resourcesPath = (app as { isPackaged?: boolean }).isPackaged
      ? path.join(process.resourcesPath, '.gh-token')
      : path.join(app.getAppPath(), '.gh-token');
    logToFile('DEBUG', `Procurando token em: ${resourcesPath}`);
    if (fs.existsSync(resourcesPath)) {
      const token = fs.readFileSync(resourcesPath, 'utf-8').trim();
      if (token) {
        logToFile('DEBUG', 'Token encontrado em .gh-token');
        return token;
      }
    }
  } catch {
    // Ignorar
  }

  logToFile('DEBUG', 'Nenhum token encontrado em nenhuma fonte');
  return '';
}

/**
 * Atualiza process.env.GH_TOKEN e autoUpdater.requestHeaders
 * com o token mais recente. Deve ser chamado antes de cada operação
 * do electron-updater.
 */
function refreshToken(): string {
  const ghToken = getGhToken();
  if (ghToken) {
    process.env.GH_TOKEN = ghToken;
    if (!isDev) {
      autoUpdater.requestHeaders = { Authorization: `token ${ghToken}` };
    }
  }
  return ghToken;
}

/** Busca a última release do GitHub via API */
function fetchLatestRelease(): Promise<{ tag: string; body: string } | null> {
  return new Promise((resolve) => {
    const ghToken = getGhToken();
    const headers: Record<string, string> = {
      'User-Agent': `CAUSA/${app.getVersion()}`,
      Accept: 'application/vnd.github.v3+json',
    };
    if (ghToken) {
      headers.Authorization = `token ${ghToken}`;
    }

    logToFile('INFO', `Consultando GitHub API (token: ${ghToken ? 'presente' : 'AUSENTE'})`);

    const req = https.get(
      {
        hostname: 'api.github.com',
        path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        headers,
      },
      (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (location) {
            const url = new URL(location);
            https.get(
              { hostname: url.hostname, path: url.pathname + url.search, headers },
              (res2) => handleResponse(res2, resolve),
            ).on('error', (err) => {
              logToFile('ERROR', `Erro no redirect: ${err.message}`);
              resolve(null);
            });
          } else {
            logToFile('ERROR', 'Redirect sem Location header');
            resolve(null);
          }
          return;
        }
        handleResponse(res, resolve);
      },
    );

    req.on('error', (err) => {
      logToFile('ERROR', `Erro de rede ao consultar GitHub API: ${err.message}`);
      resolve(null);
    });

    req.setTimeout(15000, () => {
      logToFile('ERROR', 'Timeout ao consultar GitHub API (15s)');
      req.destroy();
      resolve(null);
    });
  });
}

function handleResponse(
  res: import('node:http').IncomingMessage,
  resolve: (val: { tag: string; body: string } | null) => void,
) {
  let data = '';
  res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      const hint = res.statusCode === 404
        ? 'Repositório privado sem token ou nenhuma release publicada. Configure GH_TOKEN.'
        : res.statusCode === 403
          ? 'Rate limit excedido ou token inválido.'
          : `HTTP ${res.statusCode}`;
      logToFile('ERROR', `GitHub API retornou ${res.statusCode}: ${hint}`, {
        body: data.slice(0, 300),
      });
      resolve(null);
      return;
    }
    try {
      const json = JSON.parse(data) as { tag_name?: string; body?: string };
      if (json.tag_name) {
        logToFile('INFO', `Release encontrada: ${json.tag_name}`);
        resolve({ tag: json.tag_name, body: json.body ?? '' });
      } else {
        logToFile('WARN', 'Resposta sem tag_name');
        resolve(null);
      }
    } catch {
      logToFile('ERROR', 'Erro ao parsear resposta JSON');
      resolve(null);
    }
  });
}

/**
 * Verifica se há atualização e, se houver, inicia o download automaticamente.
 * Fluxo: checking → downloading (com progresso) → downloaded → restart
 */
async function checkAndAutoUpdate(): Promise<void> {
  sendStatus({ state: 'checking' });

  const release = await fetchLatestRelease();
  if (!release) {
    const ghToken = getGhToken();
    if (!ghToken) {
      sendStatus({
        state: 'error',
        error: 'Não foi possível verificar atualizações. Repositório privado requer GH_TOKEN (configure em causa-config.json ou variável de ambiente).',
      });
    } else {
      sendStatus({
        state: 'error',
        error: 'Não foi possível conectar ao servidor de atualizações. Verifique sua conexão com a internet e o GH_TOKEN.',
      });
    }
    return;
  }

  const currentVersion = app.getVersion();
  const remoteVersion = release.tag.replace(/^v/, '');

  logToFile('INFO', `Versão atual: ${currentVersion}, última release: ${remoteVersion}`);

  if (!isNewerVersion(remoteVersion, currentVersion)) {
    sendStatus({ state: 'not-available' });
    return;
  }

  // Atualização disponível — iniciar download automaticamente
  logToFile('INFO', `Atualização ${remoteVersion} disponível. Iniciando download...`);

  if (isDev) {
    // Em dev, apenas notifica — não baixa
    sendStatus({
      state: 'downloaded',
      version: remoteVersion,
      ...(release.body ? { releaseNotes: release.body } : {}),
    });
    return;
  }

  try {
    // Atualizar token antes de chamar electron-updater (pode ter sido configurado via UI)
    const token = refreshToken();
    logToFile('INFO', `Iniciando download via electron-updater (token: ${token ? 'presente' : 'AUSENTE'})`);

    // electron-updater: checa e baixa
    await autoUpdater.checkForUpdates();
    // O download começa automaticamente (autoDownload = true)
    // Progresso e conclusão são tratados pelos event listeners abaixo
  } catch (err) {
    logToFile('ERROR', 'Erro ao baixar atualização', {
      error: err instanceof Error ? err.message : String(err),
    });
    sendStatus({
      state: 'error',
      version: remoteVersion,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  mainWin = mainWindow;

  logToFile('INFO', 'Auto-updater inicializado', {
    version: app.getVersion(),
    isDev,
    platform: process.platform,
    arch: process.arch,
  });

  // Configurar electron-updater
  if (!isDev) {
    // Tentar carregar token agora (será recarregado antes de cada check)
    const ghToken = refreshToken();
    if (ghToken) {
      logToFile('INFO', 'GH_TOKEN configurado para electron-updater (env + headers)');
    } else {
      logToFile('WARN', 'GH_TOKEN não encontrado — configure via Configurações > Atualizações');
    }
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false; // Nós controlamos quando instalar

    autoUpdater.on('download-progress', (progress) => {
      sendStatus({
        state: 'downloading',
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      logToFile('INFO', `Atualização v${info.version} baixada e pronta.`);
      sendStatus({
        state: 'downloaded',
        version: info.version,
        ...(typeof info.releaseNotes === 'string' ? { releaseNotes: info.releaseNotes } : {}),
      });
    });

    autoUpdater.on('error', (err) => {
      logToFile('ERROR', `Erro electron-updater: ${err.message}`);
      sendStatus({
        state: 'error',
        error: err.message,
      });
    });
  }

  // IPC: verificar atualização manualmente (botão na tela de configurações)
  ipcMain.handle('update-check', async () => {
    try {
      await checkAndAutoUpdate();
    } catch (err) {
      logToFile('ERROR', 'Erro no IPC update-check', {
        error: err instanceof Error ? err.message : String(err),
      });
      sendStatus({ state: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  });

  // IPC: reiniciar e aplicar atualização
  ipcMain.handle('update-restart', () => {
    if (isDev) {
      logToFile('INFO', 'Dev mode — simulando restart');
      return;
    }
    sendStatus({ state: 'restarting' });
    // quitAndInstall fecha o app e executa o instalador silenciosamente
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
  });

  // IPC: obter status atual
  ipcMain.handle('update-get-status', () => {
    return currentStatus;
  });

  // Verificar atualizações 5 segundos após iniciar
  setTimeout(() => {
    checkAndAutoUpdate().catch((err) => {
      logToFile('ERROR', 'Falha ao verificar atualizações no startup', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, 5000);
}
