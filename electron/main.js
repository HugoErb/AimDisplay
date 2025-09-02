// electron/main.js
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const SCHEME = 'aimdisplay';
const APP_DIR_NAME = 'AimDisplay'; // le dossier Angular dans dist/
const isDev = !app.isPackaged;
const shouldOpenDevtools = process.env.ELECTRON_OPEN_DEVTOOLS !== '0';

let win = null;
let pendingDeepLink = null;

// ————— util —————
function sendDeepLink(url) {
  if (!url) return;
  if (win && win.webContents) {
    win.webContents.send('deeplink', url);
  } else {
    pendingDeepLink = url;
  }
}

// ————— single instance + réception deeplink (Windows/Linux) —————
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.on('second-instance', (_e, argv) => {
  const urlArg = argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
  if (urlArg) sendDeepLink(urlArg);
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ————— macOS : ouverture via protocole —————
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (url?.startsWith(`${SCHEME}://`)) sendDeepLink(url);
});

// ————— API pour le renderer —————
ipcMain.handle('getInitialDeepLink', () => pendingDeepLink);

// ————— fenêtre —————
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Ouvre les liens http(s) à l’extérieur (et ne crée pas de fenêtre blanche)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    // bloque les navigations externes
    if (/^https?:\/\//i.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.on('did-finish-load', () => {
    if (shouldOpenDevtools && isDev) win.webContents.openDevTools({ mode: 'detach' });
    if (pendingDeepLink) {
      sendDeepLink(pendingDeepLink);
      pendingDeepLink = null;
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
  } else {
    const p1 = path.join(__dirname, '..', 'dist', APP_DIR_NAME, 'browser', 'index.html');
    const p2 = path.join(__dirname, 'dist', APP_DIR_NAME, 'browser', 'index.html');
    win.loadFile(fs.existsSync(p1) ? p1 : p2);
  }
}

// ————— ready —————
app.whenReady().then(() => {
  // Nettoie une éventuelle entrée précédente et enregistre le protocole
  try { app.removeAsDefaultProtocolClient(SCHEME); } catch {}
  if (isDev && process.platform === 'win32') {
    app.setAsDefaultProtocolClient(SCHEME, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(SCHEME);
  }

  createWindow();

  // 1er démarrage via lien (Windows)
  if (process.platform === 'win32') {
    const urlArg = process.argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
    if (urlArg) sendDeepLink(urlArg);
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
