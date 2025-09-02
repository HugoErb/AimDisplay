// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_DIR_NAME = 'AimDisplay'; // nom dans dist/
const isDev = !app.isPackaged;
const openDevtools = process.env.ELECTRON_OPEN_DEVTOOLS === '1';

// Icône
function getIcon() {
  if (isDev) return path.join(__dirname, '..', 'src', 'assets', 'img', 'logo.png'); // ton PNG/SVG en dev
  if (process.platform === 'win32') return path.join(process.resourcesPath, 'icons', 'icon.ico');
  if (process.platform === 'darwin') return path.join(process.resourcesPath, 'icons', 'icon.icns');
  return path.join(process.resourcesPath, 'icons', 'icon.png');
}

// Où se trouve index.html
function resolveIndexHtml() {
  const devPath = path.join(__dirname, '..', 'dist', APP_DIR_NAME, 'browser', 'index.html');
  const prodPath = path.join(__dirname, 'dist', APP_DIR_NAME, 'browser', 'index.html'); // quand packagé
  return fs.existsSync(devPath) ? devPath : prodPath;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: getIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Petits logs utiles si ça reste blanc
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error('did-fail-load', code, desc, url);
  });
  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[renderer]', msg);
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
    if (openDevtools) win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const index = resolveIndexHtml(); // baseHref "./" => OK avec loadFile
    win.loadFile(index);
  }

  win.removeMenu();
}

app.setAppUserModelId('com.aimdisplay.app');
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
