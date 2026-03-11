import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain } from 'electron';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

interface ReleaseAsset {
  name: string;
  url: string; // API URL (requires Accept: application/octet-stream)
  browser_download_url: string;
  size: number;
}

interface ReleaseInfo {
  tag: string;
  body: string;
  assets: ReleaseAsset[];
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
 * com o token mais recente.
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

/** Busca a última release do GitHub via API (incluindo assets) */
function fetchLatestRelease(): Promise<ReleaseInfo | null> {
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
  resolve: (val: ReleaseInfo | null) => void,
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
      const json = JSON.parse(data) as {
        tag_name?: string;
        body?: string;
        assets?: Array<{ name: string; url: string; browser_download_url: string; size: number }>;
      };
      if (json.tag_name) {
        const assets = (json.assets ?? []).map((a) => ({
          name: a.name,
          url: a.url,
          browser_download_url: a.browser_download_url,
          size: a.size,
        }));
        logToFile('INFO', `Release encontrada: ${json.tag_name}`, {
          assets: assets.map((a) => a.name),
        });
        resolve({ tag: json.tag_name, body: json.body ?? '', assets });
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
 * Baixa um asset da release do GitHub diretamente (sem electron-updater).
 * Para repositórios privados, usa a API URL com Accept: application/octet-stream.
 */
function downloadAssetDirect(asset: ReleaseAsset, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ghToken = getGhToken();
    const startTime = Date.now();
    let transferred = 0;

    // Para repos privados, usar a API URL com Accept: octet-stream
    // Para repos públicos, browser_download_url funciona
    const downloadUrl = new URL(ghToken ? asset.url : asset.browser_download_url);
    const headers: Record<string, string> = {
      'User-Agent': `CAUSA/${app.getVersion()}`,
    };
    if (ghToken) {
      headers.Authorization = `token ${ghToken}`;
      headers.Accept = 'application/octet-stream';
    }

    logToFile('INFO', `Baixando ${asset.name} (${(asset.size / 1024 / 1024).toFixed(1)} MB)...`);

    function doRequest(url: URL) {
      const req = https.get(
        { hostname: url.hostname, path: url.pathname + url.search, headers: { ...headers } },
        (res) => {
          // GitHub API retorna 302 redirect para o download real
          if (res.statusCode === 302 || res.statusCode === 301) {
            const location = res.headers.location;
            if (location) {
              doRequest(new URL(location));
            } else {
              reject(new Error('Redirect sem Location header'));
            }
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} ao baixar ${asset.name}`));
            return;
          }

          const totalSize = asset.size || parseInt(res.headers['content-length'] ?? '0', 10);
          const file = fs.createWriteStream(destPath);

          res.on('data', (chunk: Buffer) => {
            transferred += chunk.length;
            const percent = totalSize > 0 ? (transferred / totalSize) * 100 : 0;
            const elapsed = (Date.now() - startTime) / 1000;
            const bytesPerSecond = elapsed > 0 ? transferred / elapsed : 0;
            sendStatus({
              state: 'downloading',
              percent,
              bytesPerSecond,
              transferred,
              total: totalSize,
            });
          });

          res.pipe(file);

          file.on('finish', () => {
            file.close();
            logToFile('INFO', `Download concluído: ${asset.name} (${(transferred / 1024 / 1024).toFixed(1)} MB)`);
            resolve();
          });

          file.on('error', (err) => {
            fs.unlinkSync(destPath);
            reject(err);
          });
        },
      );

      req.on('error', reject);
      req.setTimeout(300000, () => { // 5 min timeout
        req.destroy();
        reject(new Error('Timeout ao baixar instalador (5min)'));
      });
    }

    doRequest(downloadUrl);
  });
}

/**
 * Verifica se há atualização e, se houver, inicia o download automaticamente.
 * Fluxo: checking → downloading (com progresso) → downloaded → restart
 *
 * Tenta primeiro via electron-updater (requer latest.yml na release).
 * Se falhar, faz download direto do .exe via GitHub API.
 */
async function checkAndAutoUpdate(): Promise<void> {
  sendStatus({ state: 'checking' });

  const release = await fetchLatestRelease();
  if (!release) {
    const ghToken = getGhToken();
    if (!ghToken) {
      sendStatus({
        state: 'error',
        error: 'Não foi possível verificar atualizações. Repositório privado requer GH_TOKEN (configure em Configurações > Atualizações).',
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
    sendStatus({
      state: 'downloaded',
      version: remoteVersion,
      ...(release.body ? { releaseNotes: release.body } : {}),
    });
    return;
  }

  // Verificar se latest.yml existe nos assets (indica que electron-updater pode funcionar)
  const hasLatestYml = release.assets.some((a) => a.name === 'latest.yml');

  if (hasLatestYml) {
    try {
      const token = refreshToken();
      logToFile('INFO', `Tentando download via electron-updater (token: ${token ? 'presente' : 'AUSENTE'})`);
      // Guardar release para fallback caso electron-updater falhe assincronamente
      // (ex: erro de verificação de assinatura após download concluído)
      pendingRelease = { release, version: remoteVersion };
      await autoUpdater.checkForUpdates();
      return; // Progresso e conclusão tratados pelos event listeners
    } catch (err) {
      pendingRelease = null;
      logToFile('WARN', `electron-updater falhou, tentando download direto: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    logToFile('WARN', 'latest.yml não encontrado nos assets da release — usando download direto');
  }

  // Fallback: download direto do .exe
  await downloadDirectFallback(release, remoteVersion);
}

/** Baixa o instalador diretamente dos assets da release do GitHub */
async function downloadDirectFallback(release: ReleaseInfo, remoteVersion: string): Promise<void> {
  const setupAsset = release.assets.find((a) =>
    a.name.toLowerCase().endsWith('.exe') && a.name.toLowerCase().includes('setup'),
  );

  if (!setupAsset) {
    logToFile('ERROR', 'Nenhum instalador .exe encontrado nos assets da release', {
      assets: release.assets.map((a) => a.name),
    });
    sendStatus({
      state: 'error',
      version: remoteVersion,
      error: 'Instalador não encontrado na release. Verifique se o CI publicou os artefatos.',
    });
    return;
  }

  try {
    const tempDir = path.join(app.getPath('temp'), 'causa-update');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const installerPath = path.join(tempDir, setupAsset.name);

    await downloadAssetDirect(setupAsset, installerPath);

    logToFile('INFO', `Instalador baixado: ${installerPath}`);
    sendStatus({
      state: 'downloaded',
      version: remoteVersion,
      ...(release.body ? { releaseNotes: release.body } : {}),
    });

    // Guardar o caminho do instalador para usar no restart
    downloadedInstallerPath = installerPath;
  } catch (err) {
    logToFile('ERROR', 'Erro ao baixar instalador diretamente', {
      error: err instanceof Error ? err.message : String(err),
    });
    sendStatus({
      state: 'error',
      version: remoteVersion,
      error: `Erro ao baixar atualização: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

/** Caminho do instalador baixado via download direto (null = usar electron-updater) */
let downloadedInstallerPath: string | null = null;

/** Guarda a release atual para o fallback poder usar quando electron-updater falha assincronamente */
let pendingRelease: { release: ReleaseInfo; version: string } | null = null;

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
    const ghToken = refreshToken();
    if (ghToken) {
      logToFile('INFO', 'GH_TOKEN configurado para electron-updater (env + headers)');
    } else {
      logToFile('WARN', 'GH_TOKEN não encontrado — configure via Configurações > Atualizações');
    }
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;

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
      pendingRelease = null; // Download com sucesso, não precisa de fallback
      logToFile('INFO', `Atualização v${info.version} baixada e pronta.`);
      sendStatus({
        state: 'downloaded',
        version: info.version,
        ...(typeof info.releaseNotes === 'string' ? { releaseNotes: info.releaseNotes } : {}),
      });
    });

    autoUpdater.on('error', (err) => {
      logToFile('ERROR', `Erro electron-updater: ${err.message}`);
      // Se há uma release pendente, tentar fallback via download direto
      // Isso cobre erros assíncronos como falha na verificação de assinatura digital
      if (pendingRelease) {
        const { release, version } = pendingRelease;
        pendingRelease = null;
        logToFile('INFO', 'Iniciando fallback via download direto após erro do electron-updater');
        downloadDirectFallback(release, version).catch((fallbackErr) => {
          logToFile('ERROR', 'Fallback de download direto também falhou', {
            error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
          });
        });
      }
    });
  }

  // IPC: verificar atualização manualmente
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

    if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
      // Instalador baixado via download direto — executar NSIS silenciosamente
      logToFile('INFO', `Executando instalador: ${downloadedInstallerPath}`);
      spawn(downloadedInstallerPath, ['/S', '--updated'], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      setImmediate(() => app.quit());
    } else {
      // Instalador baixado via electron-updater
      setImmediate(() => autoUpdater.quitAndInstall(true, true));
    }
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
