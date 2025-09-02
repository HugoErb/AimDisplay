// electron/main.js
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const SCHEME = 'aimdisplay';
const APP_ID = 'com.example.aimdisplay'; // aligne avec build.appId dans package.json
const APP_DIR_NAME = 'AimDisplay'; // nom du dossier Angular dans dist/
const isDev = !app.isPackaged;
const shouldOpenDevtools = isDev && process.env.ELECTRON_OPEN_DEVTOOLS === '1';

let win = null;
let pendingDeepLink = null;

// ---------- utils ----------
function sendDeepLink(url) {
  if (!url) return;
  if (win && win.webContents) {
    if (win.isMinimized()) win.restore();
    win.focus();
    win.webContents.send('deeplink', url);
  } else {
    pendingDeepLink = url;
  }
}

function resolveIndexFile() {
  // Essaie plusieurs emplacements possibles pour Angular (browser/legacy)
  const candidates = [
    path.join(__dirname, '..', 'dist', APP_DIR_NAME, 'browser', 'index.html'),
    path.join(__dirname, '..', 'dist', APP_DIR_NAME, 'index.html'),
    path.join(process.resourcesPath, 'dist', APP_DIR_NAME, 'browser', 'index.html'),
    path.join(process.resourcesPath, 'dist', APP_DIR_NAME, 'index.html'),
  ];
  return candidates.find(fs.existsSync);
}

// ---------- display window (AJOUT) ----------
function openRankingWindow(competitionId, competitionName) {
  const route = `/ranking/${encodeURIComponent(competitionId)}/${encodeURIComponent(competitionName)}`;

  const winDisplay = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // cache le menu de cette fenêtre
  winDisplay.setMenuBarVisibility(false);
  if (process.platform !== 'darwin') winDisplay.removeMenu();

  if (isDev) {
    // DEV : on passe la route au dev-server via ?route=...
    winDisplay.loadURL(`http://localhost:4200/#${route}`); 
  } else {
    // PROD : on charge index.html avec la query ?route=...
    const indexFile = resolveIndexFile();
    if (!indexFile) {
      console.error('[display] index.html introuvable');
    } else {
      winDisplay.loadFile(indexFile, { hash: route });
    }
  }

  winDisplay.once('ready-to-show', () => { winDisplay.maximize(); winDisplay.show(); });
  return winDisplay;
}

// ---------- window ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true, // cache la barre de menu
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Supprime le menu (Windows/Linux) et évite l’apparition avec Alt
  win.setMenuBarVisibility(false);
  if (process.platform !== 'darwin') win.removeMenu();

  // Charger l'app
  if (isDev) {
    // Adapte si tu utilises un port différent en dev
    win.loadURL('http://localhost:4200').catch(console.error);
  } else {
    const indexFile = resolveIndexFile();
    if (!indexFile) {
      console.error('[electron] index.html introuvable dans dist/');
    } else {
      win.loadFile(indexFile).catch(console.error);
    }
  }

  win.once('ready-to-show', () => {
    win.show();
    if (shouldOpenDevtools) win.webContents.openDevTools({ mode: 'detach' });
  });

  // Ouvre les liens http(s) à l’extérieur (évite nouvelles fenêtres blanches)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (/^https?:\/\//i.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

// ---------- single instance & deep links ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    // Windows/Linux : l’URL du protocole arrive dans argv
    const urlArg = argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
    if (urlArg) sendDeepLink(urlArg);
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// macOS : deep link quand l’app est fermée
app.on('open-url', (event, url) => {
  event.preventDefault();
  sendDeepLink(url);
});

// Renderer demande le deeplink initial (si l’app a été lancée par lien)
ipcMain.handle('getInitialDeepLink', () => {
  const u = pendingDeepLink;
  pendingDeepLink = null;
  return u;
});

// (AJOUT) Ouvrir la fenêtre "ranking" depuis le renderer
ipcMain.handle('display-open-ranking', async (_evt, { competitionId, competitionName }) => {
  openRankingWindow(competitionId, competitionName);
});

// ---------- ready ----------
app.whenReady().then(() => {
  // Supprime le menu global (toutes fenêtres)
  Menu.setApplicationMenu(null);

  // Nécessaire sur Windows pour un enregistrement propre du protocole
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
  }

  // Enregistre le protocole (dev et prod)
  try { app.removeAsDefaultProtocolClient(SCHEME); } catch {}
  const ok = isDev && process.platform === 'win32'
    ? app.setAsDefaultProtocolClient(SCHEME, process.execPath, [path.resolve(process.argv[1] || '')])
    : app.setAsDefaultProtocolClient(SCHEME);
  console.log('[protocol]', SCHEME, ok ? 'registered' : 'failed');

  createWindow();

  // 1er démarrage via lien (Windows)
  if (process.platform === 'win32') {
    const urlArg = process.argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
    if (urlArg) sendDeepLink(urlArg);
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
