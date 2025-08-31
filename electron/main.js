const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const shouldOpenDevtools = process.env.ELECTRON_OPEN_DEVTOOLS === '1';

// aide: chemin vers une ressource selon dev/prod
function assetPathDev(...p) {
  // main.js est généralement dans ./electron ; on remonte à la racine
  return path.join(__dirname, '..', ...p);
}
function assetPathProd(...p) {
  // en production, les ressources vivent dans process.resourcesPath
  return path.join(process.resourcesPath, ...p);
}

function getWindowIcon() {
  if (isDev) {
    // ton logo pendant le dev
    return assetPathDev('src', 'assets', 'img', 'logo.png');
  }
  // en prod, privilégie un format adapté à l'OS
  if (process.platform === 'win32') return assetPathProd('icons', 'icon.ico');
  if (process.platform === 'darwin') return assetPathProd('icons', 'icon.icns');
  return assetPathProd('icons', 'icon.png'); // linux
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getWindowIcon(), // <-- icône de la fenêtre
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
    if (shouldOpenDevtools) win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Angular 17+ (builder par défaut) -> dist/<app>/browser/index.html
    const indexPath = path.join(__dirname, '..', 'dist', '<AimDisplay>', 'browser', 'index.html');
    win.loadFile(indexPath);
  }

  win.removeMenu();
}

// Pour un bon affichage de l'icône sur Windows (barre des tâches)
app.setAppUserModelId('com.aimdisplay.app');

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
