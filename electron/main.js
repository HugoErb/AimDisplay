// electron/main.js
const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

const PROJECT_NAME = 'AimDisplay';                 // nom du dossier dans dist/
const isDev = !app.isPackaged;
const shouldOpenDevtools = process.env.ELECTRON_OPEN_DEVTOOLS === '1';

// --- Icône fenêtre (dev : SVG du projet, prod : fichiers packagés) ------------
function getWindowIcon() {
  if (isDev) {
    // pendant le dev on peut viser directement ton SVG
    return path.join(__dirname, '..', 'src', 'assets', 'img', 'logo.svg');
  }
  // en prod, vise des icônes copiées par electron-builder dans resources/
  if (process.platform === 'win32') {
    return path.join(process.resourcesPath, 'icons', 'icon.ico');
  }
  if (process.platform === 'darwin') {
    return path.join(process.resourcesPath, 'icons', 'icon.icns');
  }
  return path.join(process.resourcesPath, 'icons', 'icon.png'); // linux
}

// --- Résolution du répertoire dist (dev/prod) ---------------------------------
function getDistDir() {
  // En dev, main.js est dans ./electron → dist est à ../dist/<app>/browser
  if (isDev) return path.join(__dirname, '..', 'dist', PROJECT_NAME, 'browser');
  // En prod, main.js est dans resources/app → dist est à ./dist/<app>/browser
  return path.join(__dirname, 'dist', PROJECT_NAME, 'browser');
}

// --- En prod, on sert via un protocole app:// pour respecter <base href="/"> ---
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

function registerAppProtocol(baseDir) {
  protocol.registerFileProtocol('app', (request, callback) => {
    try {
      const url = new URL(request.url);              // ex: app://index.html ou app:///assets/...
      // normalise et rejoint le chemin demandé dans dist/
      const target = path.normalize(path.join(baseDir, url.pathname));
      callback({ path: target });
    } catch (e) {
      console.error('Protocol error:', e);
      callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
    }
  });
}

// --- Fenêtre ------------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getWindowIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // si tu as un preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    // Dev : serveur Angular
    win.loadURL('http://localhost:4200');
    if (shouldOpenDevtools) win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Prod : fichiers statiques dist/ servis via app://
    const distDir = getDistDir();
    registerAppProtocol(distDir);
    // Charge index via schéma app:// ; <base href="/"> fonctionne
    win.loadURL('app://index.html');
  }

  // Menu minimal
  win.removeMenu();
}

// Pour l’icône barre des tâches Windows
app.setAppUserModelId('com.aimdisplay.app');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
