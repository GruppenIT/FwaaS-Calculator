import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain } from 'electron';
import https from 'node:https';

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

function sendStatus(status: UpdateStatus) {
  currentStatus = status;
  console.log(`[CAUSA] Update status: ${status.state}`, status.version ?? '', status.error ?? '');
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

/** Busca a última release do GitHub via API */
function fetchLatestRelease(): Promise<{ tag: string; body: string } | null> {
  return new Promise((resolve) => {
    const ghToken = process.env.GH_TOKEN ?? '';
    const headers: Record<string, string> = {
      'User-Agent': `CAUSA/${app.getVersion()}`,
      Accept: 'application/vnd.github.v3+json',
    };
    if (ghToken) {
      headers.Authorization = `token ${ghToken}`;
    }

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
            ).on('error', () => resolve(null));
          } else {
            resolve(null);
          }
          return;
        }
        handleResponse(res, resolve);
      },
    );

    req.on('error', (err) => {
      console.error('[CAUSA] Erro ao consultar GitHub API:', err.message);
      resolve(null);
    });

    req.setTimeout(15000, () => {
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
      console.error(`[CAUSA] GitHub API retornou ${res.statusCode}: ${data.slice(0, 200)}`);
      resolve(null);
      return;
    }
    try {
      const json = JSON.parse(data) as { tag_name?: string; body?: string };
      if (json.tag_name) {
        resolve({ tag: json.tag_name, body: json.body ?? '' });
      } else {
        resolve(null);
      }
    } catch {
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
    // Falha silenciosa na verificação — não bloqueia o usuário
    sendStatus({ state: 'idle' });
    return;
  }

  const currentVersion = app.getVersion();
  const remoteVersion = release.tag.replace(/^v/, '');

  console.log(`[CAUSA] Versão atual: ${currentVersion}, última release: ${remoteVersion}`);

  if (!isNewerVersion(remoteVersion, currentVersion)) {
    sendStatus({ state: 'not-available' });
    return;
  }

  // Atualização disponível — iniciar download automaticamente
  console.log(`[CAUSA] Atualização ${remoteVersion} disponível. Iniciando download...`);

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
    // electron-updater: checa e baixa
    await autoUpdater.checkForUpdates();
    // O download começa automaticamente (autoDownload = true)
    // Progresso e conclusão são tratados pelos event listeners abaixo
  } catch (err) {
    console.error('[CAUSA] Erro ao baixar atualização:', err);
    sendStatus({
      state: 'error',
      version: remoteVersion,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  mainWin = mainWindow;

  // Configurar electron-updater
  if (!isDev) {
    const ghToken = process.env.GH_TOKEN ?? '';
    if (ghToken) {
      autoUpdater.requestHeaders = { Authorization: `token ${ghToken}` };
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
      console.log(`[CAUSA] Atualização v${info.version} baixada e pronta.`);
      sendStatus({
        state: 'downloaded',
        version: info.version,
        ...(typeof info.releaseNotes === 'string' ? { releaseNotes: info.releaseNotes } : {}),
      });
    });

    autoUpdater.on('error', (err) => {
      console.error('[CAUSA] Erro electron-updater:', err.message);
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
      sendStatus({ state: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  });

  // IPC: reiniciar e aplicar atualização
  ipcMain.handle('update-restart', () => {
    if (isDev) {
      console.log('[CAUSA] Dev mode — simulando restart');
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
      console.error('[CAUSA] Falha ao verificar atualizações no startup:', err);
    });
  }, 5000);
}
