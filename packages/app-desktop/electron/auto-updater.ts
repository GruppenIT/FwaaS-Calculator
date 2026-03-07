import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Não verificar em desenvolvimento
  if (process.env.VITE_DEV_SERVER_URL) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Atualização disponível',
        message: `Uma nova versão do CAUSA está disponível: v${info.version}`,
        detail:
          'Deseja baixar e instalar a atualização agora?\n\nO CAUSA será reiniciado após a instalação.',
        buttons: ['Atualizar agora', 'Depois'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Atualização pronta',
        message: 'A atualização foi baixada com sucesso.',
        detail: 'O CAUSA será reiniciado para aplicar a atualização.',
        buttons: ['Reiniciar agora', 'Reiniciar depois'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', (err) => {
    console.error('[CAUSA] Erro ao verificar atualizações:', err.message);
  });

  // Verificar atualizações 5 segundos após iniciar
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[CAUSA] Falha ao verificar atualizações:', err.message);
    });
  }, 5000);
}
