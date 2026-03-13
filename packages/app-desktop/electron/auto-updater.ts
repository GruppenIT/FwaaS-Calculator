import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain } from 'electron';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export type UpdateUserChoice = 'install-now' | 'install-later' | 'ignore';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'restarting' | 'error' | 'not-available';
  version?: string;
  releaseNotes?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
  /** Se true, o download está ocorrendo em segundo plano (sem overlay) */
  background?: boolean;
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
              background: backgroundMode,
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
 * Lança o instalador NSIS com elevação de privilégio (UAC) via VBScript.
 * Usa Shell.Application.ShellExecute com verbo "runas" — a forma mais
 * confiável de solicitar elevação no Windows, funciona em qualquer contexto.
 * O instalador roda com /S (silent) e --updated (aguarda app fechar).
 */
function launchInstallerElevated(installerPath: string): void {
  // Escapar backslashes e aspas para VBScript
  const escapedPath = installerPath.replace(/\\/g, '\\\\').replace(/"/g, '""');
  const vbsContent = [
    'Set objShell = CreateObject("Shell.Application")',
    `objShell.ShellExecute "${escapedPath}", "--updated", "", "runas", 1`,
  ].join('\r\n');

  const vbsPath = path.join(app.getPath('temp'), 'causa-update-elevate.vbs');
  fs.writeFileSync(vbsPath, vbsContent, 'utf-8');

  logToFile('INFO', `Lançando instalador via VBScript: ${vbsPath}`);
  logToFile('DEBUG', `VBScript conteúdo: ${vbsContent}`);

  const child = spawn('wscript.exe', [vbsPath], {
    detached: true,
    stdio: 'ignore',
  });

  child.on('error', (err) => {
    logToFile('ERROR', `Erro ao executar wscript: ${err.message}`);
  });

  child.unref();
  logToFile('INFO', 'wscript.exe lançado para elevação do instalador');
}

/** Se true, o download atual é em segundo plano (não mostra overlay) */
let backgroundMode = false;

/** Release disponível aguardando decisão do usuário */
let availableRelease: { release: ReleaseInfo; version: string } | null = null;

/**
 * Verifica se há atualização disponível.
 * Fluxo: checking → available (aguarda usuário) → downloading → downloaded → restart
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

  logToFile('INFO', `Atualização ${remoteVersion} disponível. Aguardando decisão do usuário.`);

  // Se já temos um instalador baixado para esta versão, ir direto para downloaded
  if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
    logToFile('INFO', `Instalador já disponível em: ${downloadedInstallerPath}`);
    sendStatus({
      state: 'downloaded',
      version: remoteVersion,
      ...(release.body ? { releaseNotes: release.body } : {}),
    });
    return;
  }

  // Guardar release e notificar UI para perguntar ao usuário
  availableRelease = { release, version: remoteVersion };
  sendStatus({
    state: 'available',
    version: remoteVersion,
    ...(release.body ? { releaseNotes: release.body } : {}),
  });
}

/**
 * Inicia o download da atualização (chamado após decisão do usuário).
 * @param background Se true, baixa em segundo plano sem overlay.
 */
async function startDownload(background: boolean): Promise<void> {
  if (!availableRelease) {
    logToFile('ERROR', 'startDownload chamado sem release disponível');
    return;
  }

  const { release, version } = availableRelease;
  backgroundMode = background;

  logToFile('INFO', `Iniciando download (modo: ${background ? 'segundo plano' : 'imediato'})...`);

  if (isDev) {
    sendStatus({
      state: 'downloaded',
      version,
      background,
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
      pendingRelease = { release, version };
      await autoUpdater.checkForUpdates();
      return;
    } catch (err) {
      pendingRelease = null;
      logToFile('WARN', `electron-updater falhou, tentando download direto: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    logToFile('WARN', 'latest.yml não encontrado nos assets da release — usando download direto');
  }

  // Fallback: download direto do .exe
  await downloadDirectFallback(release, version);
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
    const tempDir = getUpdateDir();
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const installerPath = path.join(tempDir, setupAsset.name);

    // Verificar se o instalador já foi baixado anteriormente (mesma versão e arquivo válido)
    const persisted = loadPersistedInstaller();
    if (persisted && persisted.version === remoteVersion && persisted.installerPath === installerPath) {
      logToFile('INFO', `Usando instalador já baixado: ${installerPath}`);
      downloadedInstallerPath = installerPath;
      sendStatus({
        state: 'downloaded',
        version: remoteVersion,
        background: backgroundMode,
        ...(release.body ? { releaseNotes: release.body } : {}),
      });
      return;
    }

    await downloadAssetDirect(setupAsset, installerPath);

    logToFile('INFO', `Instalador baixado: ${installerPath}`);

    // Guardar o caminho do instalador para usar no restart e persistir para próxima sessão
    downloadedInstallerPath = installerPath;
    persistInstallerPath(installerPath, remoteVersion);

    sendStatus({
      state: 'downloaded',
      version: remoteVersion,
      background: backgroundMode,
      ...(release.body ? { releaseNotes: release.body } : {}),
    });
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

/** Diretório padrão para downloads de atualização */
function getUpdateDir(): string {
  return path.join(app.getPath('temp'), 'causa-update');
}

/** Arquivo de metadados que persiste o caminho do instalador entre sessões */
function getInstallerMetaPath(): string {
  return path.join(getUpdateDir(), 'installer-meta.json');
}

/** Salva o caminho do instalador baixado em disco para sobreviver a reinícios */
function persistInstallerPath(installerPath: string, version: string): void {
  try {
    const metaPath = getInstallerMetaPath();
    fs.writeFileSync(metaPath, JSON.stringify({ installerPath, version }), 'utf-8');
    logToFile('DEBUG', `Caminho do instalador persistido: ${installerPath}`);
  } catch (err) {
    logToFile('WARN', `Falha ao persistir caminho do instalador: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Carrega o caminho do instalador de uma sessão anterior, se existir e o arquivo for válido */
function loadPersistedInstaller(): { installerPath: string; version: string } | null {
  try {
    const metaPath = getInstallerMetaPath();
    if (!fs.existsSync(metaPath)) return null;
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { installerPath?: string; version?: string };
    if (meta.installerPath && meta.version && fs.existsSync(meta.installerPath)) {
      // Verificar se o arquivo tem tamanho razoável (> 10 MB para um instalador)
      const stats = fs.statSync(meta.installerPath);
      if (stats.size > 10 * 1024 * 1024) {
        logToFile('INFO', `Instalador já baixado encontrado: ${meta.installerPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB, v${meta.version})`);
        return { installerPath: meta.installerPath, version: meta.version };
      }
      logToFile('WARN', `Instalador encontrado mas tamanho suspeito: ${stats.size} bytes`);
    }
  } catch (err) {
    logToFile('WARN', `Falha ao carregar instalador persistido: ${err instanceof Error ? err.message : String(err)}`);
  }
  return null;
}

/** Remove os metadados e arquivo do instalador persistido */
function clearPersistedInstaller(): void {
  try {
    const metaPath = getInstallerMetaPath();
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  } catch {
    // Falha silenciosa
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
    const ghToken = refreshToken();
    if (ghToken) {
      logToFile('INFO', 'GH_TOKEN configurado para electron-updater (env + headers)');
    } else {
      logToFile('WARN', 'GH_TOKEN não encontrado — configure via Configurações > Atualizações');
    }
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('download-progress', (progress) => {
      sendStatus({
        state: 'downloading',
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
        background: backgroundMode,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      pendingRelease = null;
      logToFile('INFO', `Atualização v${info.version} baixada e pronta (background: ${backgroundMode}).`);
      sendStatus({
        state: 'downloaded',
        version: info.version,
        background: backgroundMode,
        ...(typeof info.releaseNotes === 'string' ? { releaseNotes: info.releaseNotes } : {}),
      });
    });

    // Quando electron-updater detectar atualização, iniciar download manualmente
    autoUpdater.on('update-available', () => {
      logToFile('INFO', 'electron-updater: update-available, iniciando download...');
      autoUpdater.downloadUpdate().catch((err) => {
        logToFile('ERROR', `Erro ao iniciar download via electron-updater: ${err instanceof Error ? err.message : String(err)}`);
      });
    });

    autoUpdater.on('error', (err) => {
      logToFile('ERROR', `Erro electron-updater: ${err.message}`);
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

  // Carregar instalador persistido de sessão anterior
  const persisted = loadPersistedInstaller();
  if (persisted) {
    const currentVersion = app.getVersion();
    if (isNewerVersion(persisted.version, currentVersion)) {
      downloadedInstallerPath = persisted.installerPath;
      logToFile('INFO', `Instalador da sessão anterior carregado: v${persisted.version} em ${persisted.installerPath}`);
    } else {
      logToFile('INFO', 'Instalador persistido não é mais necessário (versão já atualizada), removendo...');
      clearPersistedInstaller();
    }
  }

  // Instalar automaticamente ao fechar o app se o download foi em segundo plano
  app.on('before-quit', () => {
    if (backgroundMode && downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
      logToFile('INFO', `Instalando atualização em segundo plano ao fechar: ${downloadedInstallerPath}`);
      try {
        launchInstallerElevated(downloadedInstallerPath);
        clearPersistedInstaller();
      } catch (err) {
        logToFile('ERROR', `Falha ao executar instalador no before-quit: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

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

  // IPC: resposta do usuário à atualização disponível
  ipcMain.handle('update-respond', async (_event, choice: UpdateUserChoice) => {
    logToFile('INFO', `Usuário escolheu: ${choice}`);
    if (choice === 'ignore') {
      availableRelease = null;
      sendStatus({ state: 'idle' });
      return;
    }
    try {
      await startDownload(choice === 'install-later');
    } catch (err) {
      logToFile('ERROR', 'Erro ao iniciar download após escolha do usuário', {
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
      const installerToRun = downloadedInstallerPath;
      const stats = fs.statSync(installerToRun);
      logToFile('INFO', `Executando instalador: ${installerToRun} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

      // Limpar referência para evitar que before-quit execute novamente
      downloadedInstallerPath = null;
      clearPersistedInstaller();

      // Lançar instalador com elevação via VBScript (ShellExecute runas).
      // O --updated faz o NSIS aguardar o app fechar antes de instalar.
      // Lançamos ANTES de quit para que o UAC dialog tenha contexto de janela.
      launchInstallerElevated(installerToRun);

      // Dar tempo para o UAC dialog aparecer, depois fechar o app.
      // O instalador aguarda (--updated) o app fechar para prosseguir.
      setTimeout(() => app.quit(), 1500);
    } else {
      // Instalador baixado via electron-updater
      logToFile('INFO', 'Usando electron-updater quitAndInstall');
      setImmediate(() => autoUpdater.quitAndInstall(true, true));
    }
  });

  // IPC: obter status atual
  ipcMain.handle('update-get-status', () => {
    logToFile('DEBUG', `IPC update-get-status chamado, retornando: ${currentStatus.state}`);
    return currentStatus;
  });

  // Re-enviar status quando a página terminar de carregar
  // Isso garante que o React receba o status mesmo se o check terminou
  // antes do React montar os listeners.
  mainWindow.webContents.on('did-finish-load', () => {
    logToFile('INFO', `Página carregou (did-finish-load). Status atual: ${currentStatus.state}`);
    if (currentStatus.state !== 'idle') {
      // Pequeno delay para garantir que React montou os listeners
      setTimeout(() => {
        logToFile('INFO', `Re-enviando status após page load: ${currentStatus.state}`);
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.send('update-status', currentStatus);
        }
      }, 2000);
    }
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
