import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('causaElectron', {
  getInstallConfig: () => ipcRenderer.invoke('get-install-config'),
  getApiStatus: () => ipcRenderer.invoke('get-api-status'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Auto-updater
  checkForUpdate: () => ipcRenderer.invoke('update-check'),
  restartAndUpdate: () => ipcRenderer.invoke('update-restart'),
  getUpdateStatus: () => ipcRenderer.invoke('update-get-status'),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const handler = (_event: unknown, status: unknown) => callback(status);
    ipcRenderer.on('update-status', handler);
    return () => { ipcRenderer.removeListener('update-status', handler); };
  },
});
