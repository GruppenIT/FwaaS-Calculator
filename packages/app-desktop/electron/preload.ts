import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('causaElectron', {
  getInstallConfig: () => ipcRenderer.invoke('get-install-config'),
  getApiStatus: () => ipcRenderer.invoke('get-api-status'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
