const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('causaElectron', {
    getInstallConfig: () => ipcRenderer.invoke('get-install-config'),
    getApiStatus: () => ipcRenderer.invoke('get-api-status'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    // Auto-updater
    checkForUpdate: () => ipcRenderer.invoke('update-check'),
    respondToUpdate: (choice) => ipcRenderer.invoke('update-respond', choice),
    restartAndUpdate: () => ipcRenderer.invoke('update-restart'),
    getUpdateStatus: () => ipcRenderer.invoke('update-get-status'),
    onUpdateStatus: (callback) => {
        const handler = (_event, status) => callback(status);
        ipcRenderer.on('update-status', handler);
        return () => { ipcRenderer.removeListener('update-status', handler); };
    },
    // Log do renderer → main process (para diagnóstico)
    logToMain: (level, message) => ipcRenderer.send('renderer-log', level, message),
    // Config (causa-config.json)
    getGhToken: () => ipcRenderer.invoke('get-gh-token'),
    setGhToken: (token) => ipcRenderer.invoke('set-gh-token', token),
});
