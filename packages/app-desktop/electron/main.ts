import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import type http from 'node:http';
import { setupAutoUpdater } from './auto-updater.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Retorna o diretório de dados compartilhado do CAUSA.
 * Windows: C:\ProgramData\CAUSA SISTEMAS\CAUSA
 * Linux/macOS: usa o userData padrão do Electron (fallback)
 *
 * ProgramData é acessível por todos os usuários do sistema,
 * permitindo que múltiplos usuários Windows compartilhem os dados.
 */
function getSharedDataDir(): string {
  if (process.platform === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    return path.join(programData, 'CAUSA SISTEMAS', 'CAUSA');
  }
  return app.getPath('userData');
}

// Ler topologia do instalador (gravada em causa-install.json)
function getInstallConfig(): { topologia: 'solo' | 'escritorio'; postgresUrl?: string } {
  const configPaths = [
    path.join(getSharedDataDir(), 'causa-install.json'),
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
let apiStarted = false;

async function startApi() {
  const { startServer, logger, setLogDirectory } = await import('@causa/database');
  const dataDir = getSharedDataDir();

  // Configurar diretório de logs para o diretório compartilhado
  setLogDirectory(dataDir);

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
  apiStarted = true;
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
    width: 1280,
    height: 720,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    center: true,
    focusable: true,
    backgroundColor: '#0F1829',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash', 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
    splashWindow?.focus();
  });
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/** Envia status de progresso para o splash via executeJavaScript */
function updateSplashStatus(percent: number, text: string) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  splashWindow.webContents.executeJavaScript(
    `if (typeof setProgress === 'function') setProgress(${percent}, ${JSON.stringify(text)});`
  ).catch(() => { /* splash pode já ter fechado */ });
}

function createWindow() {
  const installConfig = getInstallConfig();

  // Remover barra de menus (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'icon.ico'),
    title: `CAUSA — ${installConfig.topologia === 'solo' ? 'Solo' : 'Escritório'}`,
    autoHideMenuBar: true,
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

  // Quando a janela principal estiver pronta, aguarda o splash antes de mostrar
  mainWindow.once('ready-to-show', () => {
    // Garante que o splash fique visível por no mínimo 3 segundos
    const MIN_SPLASH_MS = 3000;
    const FADE_OUT_MS = 200;
    const elapsed = Date.now() - splashStartTime;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    setTimeout(() => {
      updateSplashStatus(100, 'Pronto!');

      // Fade out do splash antes de mostrar a janela principal
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(
          `document.body.classList.add('fade-out');`
        ).catch(() => {});

        setTimeout(() => {
          splashWindow?.close();
          mainWindow?.show();
          mainWindow?.focus();
        }, FADE_OUT_MS);
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
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

// IPC: informar ao renderer se a API iniciou
ipcMain.handle('get-api-status', () => {
  return { started: apiStarted };
});

app.whenReady().then(async () => {
  // Exibe splash enquanto carrega
  createSplashWindow();
  splashStartTime = Date.now();

  try {
    updateSplashStatus(20, 'Carregando módulos...');
    await startApi();
    updateSplashStatus(90, 'Preparando interface...');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : '';
    console.error('[CAUSA] Falha ao iniciar API:', errorMsg);

    // Tenta escrever o erro em um arquivo de log emergencial
    try {
      const logDir = path.join(getSharedDataDir(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFile = path.join(logDir, `causa-crash-${new Date().toISOString().slice(0, 10)}.log`);
      fs.appendFileSync(
        logFile,
        `[${new Date().toISOString()}] [FATAL] Falha ao iniciar API:\n${errorMsg}\n${errorStack}\n\n`,
      );
    } catch {
      // Se nem isso funcionar, não tem mais o que fazer
    }

    // Mostrar diálogo de erro para o usuário
    dialog.showErrorBox(
      'CAUSA — Erro ao iniciar',
      `Não foi possível iniciar o serviço interno da aplicação.\n\n` +
        `Erro: ${errorMsg}\n\n` +
        `Logs: ${path.join(getSharedDataDir(), 'logs')}\n\n` +
        `Tente reiniciar a aplicação. Se o problema persistir, verifique se outra instância do CAUSA não está rodando.`,
    );
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
