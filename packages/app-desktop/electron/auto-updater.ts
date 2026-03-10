import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { BrowserWindow, ipcMain } from 'electron';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseNotes?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

let mainWin: BrowserWindow | null = null;
let currentStatus: UpdateStatus = { state: 'idle' };

function sendStatus(status: UpdateStatus) {
  currentStatus = status;
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send('update-status', status);
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  mainWin = mainWindow;

  // Não verificar em desenvolvimento
  if (process.env.VITE_DEV_SERVER_URL) return;

  // Autenticação para repositório privado GitHub
  // O token é embutido em build time via electron-builder (extraHeaders no publish)
  // ou lido da variável de ambiente GH_TOKEN
  const ghToken = process.env.GH_TOKEN ?? '';
  if (ghToken) {
    autoUpdater.requestHeaders = {
      Authorization: `token ${ghToken}`,
    };
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendStatus({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    const status: UpdateStatus = { state: 'available', version: info.version };
    if (typeof info.releaseNotes === 'string') status.releaseNotes = info.releaseNotes;
    sendStatus(status);
  });

  autoUpdater.on('update-not-available', () => {
    sendStatus({ state: 'not-available' });
  });

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
    sendStatus({
      state: 'downloaded',
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[CAUSA] Erro ao verificar atualizações:', err.message);
    sendStatus({ state: 'error', error: err.message });
  });

  // IPC handlers
  ipcMain.handle('update-check', async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      sendStatus({ state: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  });

  ipcMain.handle('update-download', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.handle('update-install', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('update-get-status', () => {
    return currentStatus;
  });

  // Verificar atualizações 5 segundos após iniciar
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[CAUSA] Falha ao verificar atualizações:', err.message);
    });
  }, 5000);
}
