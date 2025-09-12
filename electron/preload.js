// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// API deeplink exposée au renderer
contextBridge.exposeInMainWorld("deeplink", {
	on: (cb) => ipcRenderer.on("deeplink", (_e, url) => cb(url)),
	getInitial: () => ipcRenderer.invoke("getInitialDeepLink"),
	checkForUpdates: () => ipcRenderer.invoke("updater:check"),
	onUpdateStatus: (cb) => ipcRenderer.on("updater:status", (_e, status) => cb?.(status)),
	onUpdateProgress: (cb) => ipcRenderer.on("updater:progress", (_e, pct) => cb?.(pct)),
	rendererReady: () => ipcRenderer.send("renderer-ready"),
});

contextBridge.exposeInMainWorld('display', {
  openRanking: (competitionId, competitionName) =>
    ipcRenderer.invoke('display-open-ranking', { competitionId, competitionName }),
});

// (optionnel mais pratique) détecter Electron côté Angular
contextBridge.exposeInMainWorld('electronAPI', { isElectron: true });
