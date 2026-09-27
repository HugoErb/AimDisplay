// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// API deeplink exposée au renderer
contextBridge.exposeInMainWorld("deeplink", {
	on: (cb) => ipcRenderer.on("deeplink", (_e, url) => cb(url)),
	getInitial: () => ipcRenderer.invoke("getInitialDeepLink"),
	checkForUpdates: () => ipcRenderer.invoke("updater:check"),
	applyUpdateNow: () => ipcRenderer.invoke("updater:applyNow"),
});

contextBridge.exposeInMainWorld('display', {
  openRanking: (competitionId, competitionName) =>
    ipcRenderer.invoke('display-open-ranking', { competitionId, competitionName }),
});

contextBridge.exposeInMainWorld("appInfo", {
	getVersion: () => ipcRenderer.invoke("app:getVersion"),
});

// (optionnel mais pratique) détecter Electron côté Angular
contextBridge.exposeInMainWorld('electronAPI', {
	isElectron: true,
	savePdf: (fileName, data) => ipcRenderer.invoke('pdf:save', { fileName, data }),
	showItemInFolder: (filePath) => ipcRenderer.invoke('pdf:showItemInFolder', filePath),
});
