// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const SCHEME = 'aimdisplay';
const APP_DIR_NAME = 'AimDisplay';              // nom de ton dossier dist
const isDev = !app.isPackaged;
const shouldOpenDevtools = process.env.ELECTRON_OPEN_DEVTOOLS === '1';

let mainWin = null;
let pendingDeepLink = null;

// -------- Utils
function getIcon() {
  if (isDev) return path.join(__dirname, '..', 'src', 'assets', 'img', 'logo.png');
  if (process.platform === 'win32') return path.join(process.resourcesPath, 'icons', 'logo.ico');
  if (process.platform === 'darwin') return path.join(process.resourcesPath, 'icons', 'logo.icns');
  return path.join(process.resourcesPath, 'icons', 'logo.png');
}

function resolveIndexHtml() {
  // Angular 17+ (builder) -> dist/<app>/browser/index.html
  const devPath  = path.join(__dirname, '..', 'dist', APP_DIR_NAME, 'browser', 'index.html');
  const prodPath = path.join(__dirname, 'dist', APP_DIR_NAME, 'browser', 'index.html');
  return fs.existsSync(devPath) ? devPath : prodPath;
}

function sendDeepLink(url) {
  // Envoie l’URL au renderer (Angular) qui fera la navigation / lecture du hash
  if (mainWin && mainWin.webContents) {
    mainWin.webContents.send('deeplink', url);
  } else {
    // si la fenêtre n'est pas encore prête on mémorise
    pendingDeepLink = url;
  }
}

// -------- Single instance + protocole
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Windows (et Linux) : l’URL est dans argv de la 2e instance
  app.on('second-instance', (_event, argv) => {
    const urlArg = argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
    if (urlArg) sendDeepLink(urlArg);
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });

  // macOS : l’URL arrive ici
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url && url.startsWith(`${SCHEME}://`)) sendDeepLink(url);
  });
}

// S’enregistrer comme handler du schéma custom
function registerProtocol() {
  // En dev, Electron est lancé via "electron.exe … app", il faut ces paramètres
  if (isDev && process.platform === 'win32') {
    app.setAsDefaultProtocolClient(SCHEME, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(SCHEME);
  }
}

// -------- Fenêtre
function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: getIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // on montre quand c'est prêt
  });

  mainWin.once('ready-to-show', () => mainWin.show());

  mainWin.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('did-fail-load:', code, desc, url);
  });
  mainWin.webContents.on('console-message', (_e, level, msg) => {
    console.log('[renderer]', msg);
  });

  if (isDev) {
    mainWin.loadURL('http://localhost:4200');
    if (shouldOpenDevtools) mainWin.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = resolveIndexHtml(); // baseHref: "./" dans angular.json
    mainWin.loadFile(indexPath);
  }

  mainWin.removeMenu();

  // Si un deep-link était arrivé avant la création de la fenêtre
  if (pendingDeepLink) {
    sendDeepLink(pendingDeepLink);
    pendingDeepLink = null;
  }
}

app.setAppUserModelId('com.aimdisplay.app');

app.whenReady().then(() => {
  registerProtocol();
  createWindow();

  // Windows : si l’appli est lancée via un deep-link (premier démarrage)
  if (process.platform === 'win32') {
    const urlArg = process.argv.find(a => typeof a === 'string' && a.startsWith(`${SCHEME}://`));
    if (urlArg) sendDeepLink(urlArg);
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
