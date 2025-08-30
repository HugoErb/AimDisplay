const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged; // dev si lancé via npm run electron:dev
const shouldOpenDevtools = process.env.ELECTRON_OPEN_DEVTOOLS === '0'; // active la console ou non

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // sécurité
      nodeIntegration: false,   // sécurité
      sandbox: true
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');         // ng serve
    if (shouldOpenDevtools) win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Angular 17+ (builder par défaut) -> dist/<app>/browser/index.html
    const indexPath = path.join(__dirname, '..', 'dist', '<NOM_DU_PROJET>', 'browser', 'index.html');
    win.loadFile(indexPath);
  }

  win.removeMenu();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
