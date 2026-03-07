import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import type http from 'node:http';
import { setupAutoUpdater } from './auto-updater.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ler topologia do instalador (gravada em causa-install.json)
function getInstallConfig(): { topologia: 'solo' | 'escritorio'; postgresUrl?: string } {
  const configPaths = [
    path.join(app.getPath('userData'), 'causa-install.json'),
    path.join(path.dirname(app.getPath('exe')), 'causa-install.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
        // Ignora arquivo corrompido
      }
    }
  }

  return { topologia: 'solo' };
}

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let apiServer: http.Server | null = null;

async function startApi() {
  const { startServer, logger } = await import('@causa/database');
  const dataDir = app.getPath('userData');

  logger.info('Electron', 'Iniciando API...', {
    dataDir,
    exePath: app.getPath('exe'),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  });

  // Garantir que o diretório de dados existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  apiServer = await startServer({ cwd: dataDir, port: 3456 });
  logger.info('Electron', `API iniciada. Dados em: ${dataDir}`);

  // Capturar erros não tratados no processo para diagnóstico
  process.on('uncaughtException', (err) => {
    logger.error('Electron', 'Exceção não capturada', {
      error: err.message,
      stack: err.stack,
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Electron', 'Promise rejection não tratada', {
      reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : String(reason),
    });
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash', 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  });
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  const installConfig = getInstallConfig();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: `CAUSA — ${installConfig.topologia === 'solo' ? 'Solo' : 'Escritório'}`,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Em desenvolvimento, carrega do Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Quando a janela principal estiver pronta, fecha o splash
  mainWindow.once('ready-to-show', () => {
    // Garante um tempo mínimo de exibição do splash (1.5s)
    const MIN_SPLASH_MS = 1500;
    const elapsed = Date.now() - splashStartTime;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    setTimeout(() => {
      splashWindow?.close();
      mainWindow?.show();
    }, remaining);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

let splashStartTime = 0;

// IPC: expor config do instalador para o renderer
ipcMain.handle('get-install-config', () => {
  return getInstallConfig();
});

app.whenReady().then(async () => {
  // Exibe splash enquanto carrega
  createSplashWindow();
  splashStartTime = Date.now();

  try {
    await startApi();
  } catch (err) {
    console.error('[CAUSA] Falha ao iniciar API:', err);
  }

  createWindow();
  if (mainWindow) {
    setupAutoUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (apiServer) {
    apiServer.close();
    apiServer = null;
  }
});
