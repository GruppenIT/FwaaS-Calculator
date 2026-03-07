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
let apiServer: http.Server | null = null;

async function startApi() {
  const { startServer } = await import('@causa/database');
  const dataDir = app.getPath('userData');

  // Garantir que o diretório de dados existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  apiServer = await startServer({ cwd: dataDir, port: 3456 });
  console.log(`[CAUSA] API iniciada. Dados em: ${dataDir}`);
}

function createWindow() {
  const installConfig = getInstallConfig();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC: expor config do instalador para o renderer
ipcMain.handle('get-install-config', () => {
  return getInstallConfig();
});

app.whenReady().then(async () => {
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
