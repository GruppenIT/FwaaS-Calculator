import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import https from 'node:https';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseNotes?: string;
  releaseUrl?: string;
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
function fetchLatestRelease(): Promise<{ tag: string; body: string; url: string } | null> {
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
        // Follow redirects
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
  resolve: (val: { tag: string; body: string; url: string } | null) => void,
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
      const json = JSON.parse(data) as { tag_name?: string; body?: string; html_url?: string };
      if (json.tag_name) {
        resolve({
          tag: json.tag_name,
          body: json.body ?? '',
          url: json.html_url ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        });
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

/** Verifica atualizações via GitHub API */
async function checkViaGitHubAPI(): Promise<void> {
  sendStatus({ state: 'checking' });

  const release = await fetchLatestRelease();
  if (!release) {
    sendStatus({ state: 'error', error: 'Não foi possível conectar ao GitHub. Verifique sua conexão.' });
    return;
  }

  const currentVersion = app.getVersion();
  const remoteVersion = release.tag.replace(/^v/, '');

  console.log(`[CAUSA] Versão atual: ${currentVersion}, última release: ${remoteVersion}`);

  if (isNewerVersion(remoteVersion, currentVersion)) {
    sendStatus({
      state: 'available',
      version: remoteVersion,
      ...(release.body ? { releaseNotes: release.body } : {}),
      releaseUrl: release.url,
    });
  } else {
    sendStatus({ state: 'not-available' });
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  mainWin = mainWindow;

  // Configurar electron-updater para download (apenas em produção)
  if (!isDev) {
    const ghToken = process.env.GH_TOKEN ?? '';
    if (ghToken) {
      autoUpdater.requestHeaders = { Authorization: `token ${ghToken}` };
    }
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

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
      sendStatus({ state: 'downloaded', version: info.version });
    });

    autoUpdater.on('error', (err) => {
      console.error('[CAUSA] Erro electron-updater:', err.message);
      // Se falhar o download, mostra o link para baixar manualmente
      if (currentStatus.releaseUrl && currentStatus.version) {
        sendStatus({
          state: 'available',
          version: currentStatus.version,
          releaseUrl: currentStatus.releaseUrl,
          error: 'Falha no download automático. Use o link para baixar manualmente.',
        });
      } else {
        sendStatus({ state: 'error', error: err.message });
      }
    });
  }

  // IPC handlers — SEMPRE registrados (dev e prod)
  ipcMain.handle('update-check', async () => {
    try {
      await checkViaGitHubAPI();
    } catch (err) {
      sendStatus({ state: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  });

  ipcMain.handle('update-download', async () => {
    if (isDev) {
      // Em dev, abrir a página de releases no navegador
      const url = currentStatus.releaseUrl
        ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      shell.openExternal(url);
      return;
    }

    try {
      await autoUpdater.checkForUpdates(); // electron-updater precisa checar antes de baixar
      autoUpdater.downloadUpdate();
    } catch (err) {
      // Fallback: abrir página de download no navegador
      console.error('[CAUSA] Falha ao baixar atualização:', err);
      const url = currentStatus.releaseUrl
        ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      shell.openExternal(url);
      sendStatus({
        state: 'available',
        ...(currentStatus.version ? { version: currentStatus.version } : {}),
        releaseUrl: url,
        error: 'Download automático falhou. Abrindo página de download...',
      });
    }
  });

  ipcMain.handle('update-install', () => {
    if (!isDev) {
      autoUpdater.quitAndInstall();
    }
  });

  ipcMain.handle('update-get-status', () => {
    return currentStatus;
  });

  ipcMain.handle('update-open-release', () => {
    const url = currentStatus.releaseUrl
      ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    shell.openExternal(url);
  });

  // Verificar atualizações 5 segundos após iniciar
  setTimeout(() => {
    checkViaGitHubAPI().catch((err) => {
      console.error('[CAUSA] Falha ao verificar atualizações no startup:', err);
    });
  }, 5000);
}
