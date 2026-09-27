// electron/main.js
const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const { createExternalNavigationHandler, createSavedPathRegistry } = require("./security");

const SCHEME = "aimdisplay";
const APP_ID = "com.example.aimdisplay"; // aligne avec build.appId dans package.json
const APP_DIR_NAME = "AimDisplay"; // nom du dossier Angular dans dist/
const isDev = !app.isPackaged;
const shouldOpenDevtools = isDev && process.env.ELECTRON_OPEN_DEVTOOLS === "1";

let win = null;
let pendingDeepLink = null;
const savedPdfPaths = createSavedPathRegistry();

// ---------- utils ----------
/**
 * Envoie un lien profond a la fenetre principale ou le conserve en attente.
 */
function sendDeepLink(url) {
	if (!url) return;
	if (win && win.webContents) {
		if (win.isMinimized()) win.restore();
		win.focus();
		win.webContents.send("deeplink", url);
	} else {
		pendingDeepLink = url;
	}
}

/**
 * Recherche le fichier index.html genere pour l'application Angular.
 */
function resolveIndexFile() {
	const candidates = [
		path.join(__dirname, "..", "dist", APP_DIR_NAME, "browser", "index.html"),
		path.join(__dirname, "..", "dist", APP_DIR_NAME, "index.html"),
		path.join(process.resourcesPath, "dist", APP_DIR_NAME, "browser", "index.html"),
		path.join(process.resourcesPath, "dist", APP_DIR_NAME, "index.html"),
	];
	return candidates.find(fs.existsSync);
}

/**
 * Force les liens externes a s'ouvrir hors de la fenetre Electron.
 */
function hardenExternalNavigation(browserWindow) {
	const handler = createExternalNavigationHandler((url) => shell.openExternal(url), isAppUrl);
	browserWindow.webContents.setWindowOpenHandler(({ url }) => handler.handleWindowOpen(url));
	browserWindow.webContents.on("will-navigate", (event, url) => handler.handleWillNavigate(event, url));
}

/**
 * Indique si une URL appartient a l'application (dev-server en dev, index.html local en prod).
 */
function isAppUrl(url) {
	if (isDev) return url.startsWith("http://localhost:4200");
	const indexFile = resolveIndexFile();
	if (!indexFile) return false;
	const appUrl = pathToFileURL(indexFile).href;
	return url === appUrl || url.startsWith(`${appUrl}#`) || url.startsWith(`${appUrl}?`);
}

// ---------- display window ----------
/**
 * Ouvre une fenetre dediee a l'affichage du classement.
 */
function openRankingWindow(competitionId, competitionName) {
	const route = `/ranking/${encodeURIComponent(competitionId)}/${encodeURIComponent(competitionName)}`;

	const winDisplay = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	// cache le menu de cette fenêtre
	winDisplay.setMenuBarVisibility(false);
	if (process.platform !== "darwin") winDisplay.removeMenu();
	hardenExternalNavigation(winDisplay);

	if (isDev) {
		// DEV : on passe la route au dev-server via ?route=...
		winDisplay.loadURL(`http://localhost:4200/#${route}`);
	} else {
		// PROD : on charge index.html avec la query ?route=...
		const indexFile = resolveIndexFile();
		if (!indexFile) {
			console.error("[display] index.html introuvable");
		} else {
			winDisplay.loadFile(indexFile, { hash: route });
		}
	}

	winDisplay.once("ready-to-show", () => {
		winDisplay.maximize();
		winDisplay.show();
	});
	return winDisplay;
}

// ---------- window ----------
/**
 * Cree et configure la fenetre principale Electron.
 */
function createWindow() {
	win = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		autoHideMenuBar: true, // cache la barre de menu
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	win.once("ready-to-show", () => {
		win.maximize(); // ← ouvre directement maximisé
		win.show();
	});

	// Supprime le menu (Windows/Linux) et évite l’apparition avec Alt
	win.setMenuBarVisibility(false);
	if (process.platform !== "darwin") win.removeMenu();

	// Charger l'app
	if (isDev) {
		win.loadURL("http://localhost:4200").catch(console.error);
	} else {
		const indexFile = resolveIndexFile();
		if (!indexFile) {
			console.error("[electron] index.html introuvable dans dist/");
		} else {
			win.loadFile(indexFile).catch(console.error);
		}
	}

	win.once("ready-to-show", () => {
		win.show();
		if (shouldOpenDevtools) win.webContents.openDevTools({ mode: "detach" });
	});

	// Ouvre les liens http(s) à l’extérieur (évite nouvelles fenêtres blanches)
	hardenExternalNavigation(win);
}

// ---------- single instance & deep links ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
} else {
	app.on("second-instance", (_event, argv) => {
		// Windows/Linux : l’URL du protocole arrive dans argv
		const urlArg = argv.find((a) => typeof a === "string" && a.startsWith(`${SCHEME}://`));
		if (urlArg) sendDeepLink(urlArg);
		if (win) {
			if (win.isMinimized()) win.restore();
			win.focus();
		}
	});
}

// macOS : deep link quand l’app est fermée
app.on("open-url", (event, url) => {
	event.preventDefault();
	sendDeepLink(url);
});

// Renderer demande le deeplink initial (si l’app a été lancée par lien)
ipcMain.handle("getInitialDeepLink", () => {
	const u = pendingDeepLink;
	pendingDeepLink = null;
	return u;
});

// Ouvrir la fenêtre "ranking" depuis le renderer
ipcMain.handle("display-open-ranking", async (_evt, { competitionId, competitionName }) => {
	openRankingWindow(competitionId, competitionName);
});

ipcMain.handle("pdf:save", async (_evt, { fileName, data }) => {
	const result = await dialog.showSaveDialog(win, {
		title: "Enregistrer le PDF",
		defaultPath: fileName,
		filters: [{ name: "PDF", extensions: ["pdf"] }],
	});

	if (result.canceled || !result.filePath) return null;

	const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
	await fs.promises.writeFile(result.filePath, buffer);
	savedPdfPaths.add(result.filePath);
	return result.filePath;
});

ipcMain.handle("pdf:showItemInFolder", async (_evt, filePath) => {
	if (savedPdfPaths.has(filePath)) {
		shell.showItemInFolder(filePath);
	}
});

let updateAvailable = false;
let updateDownloaded = false;
let installing = false;

autoUpdater.on("update-available", () => {
	updateAvailable = true;
});
autoUpdater.on("update-not-available", () => {
	updateAvailable = false;
	updateDownloaded = false;
});
autoUpdater.on("update-downloaded", () => {
	updateDownloaded = true;
});
autoUpdater.on("error", (e) => console.error("[updater] error:", e));

ipcMain.handle("updater:check", async () => {
	if (isDev) return { status: "skip" };
	updateAvailable = false;
	updateDownloaded = false;
	try {
		// renvoie vite ; le téléchargement continue en fond si MAJ
		const result = await autoUpdater.checkForUpdates();
		updateAvailable = Boolean(result?.isUpdateAvailable);
		return { status: updateAvailable ? "available" : "none" };
	} catch {
		return { status: "error" };
	}
});

const UPDATE_DOWNLOAD_TIMEOUT_MS = 60_000;

/**
 * Attend la fin du telechargement de la MAJ. Resout `true` si telechargee, `false` si delai depasse,
 * rejette en cas d'erreur. Les ecouteurs sont toujours retires.
 */
function waitForUpdateDownload(timeoutMs) {
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer);
			autoUpdater.removeListener("update-downloaded", onDownloaded);
			autoUpdater.removeListener("error", onError);
		};
		const onDownloaded = () => {
			cleanup();
			resolve(true);
		};
		const onError = (e) => {
			cleanup();
			reject(e);
		};
		const timer = setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeoutMs);
		autoUpdater.on("update-downloaded", onDownloaded);
		autoUpdater.on("error", onError);
	});
}

ipcMain.handle("updater:applyNow", async () => {
	if (isDev) return "noop";
	if (!updateAvailable) return "none";

	try {
		// si pas encore téléchargée, on attend ici (avec un délai maximal pour ne pas bloquer le démarrage)
		if (!updateDownloaded) {
			const downloaded = await waitForUpdateDownload(UPDATE_DOWNLOAD_TIMEOUT_MS);
			if (!downloaded) {
				// Téléchargement trop long : on laisse démarrer l'app, la MAJ s'installera à la fermeture
				autoUpdater.autoInstallOnAppQuit = true;
				return "timeout";
			}
		}

		if (!installing) {
			installing = true;
			autoUpdater.quitAndInstall(); // redémarre et installe une seule fois
		}
		return "restarting";
	} catch (e) {
		console.error("[updater] apply failed:", e);
		updateAvailable = false;
		updateDownloaded = false;
		installing = false;
		return "error";
	}
});

ipcMain.handle("app:getVersion", () => app.getVersion());

// ---------- ready ----------
app.whenReady().then(() => {
	// Supprime le menu global (toutes fenêtres)
	Menu.setApplicationMenu(null);

	// Nécessaire sur Windows pour un enregistrement propre du protocole
	if (process.platform === "win32") {
		app.setAppUserModelId(APP_ID);
	}

	// Enregistre le protocole (dev et prod)
	try {
		app.removeAsDefaultProtocolClient(SCHEME);
	} catch {}
	const ok =
		isDev && process.platform === "win32"
			? app.setAsDefaultProtocolClient(SCHEME, process.execPath, [path.resolve(process.argv[1] || "")])
			: app.setAsDefaultProtocolClient(SCHEME);
	console.log("[protocol]", SCHEME, ok ? "registered" : "failed");

	createWindow();

	// check MAJ au lancement (prod uniquement)
	if (!isDev) {
		autoUpdater.logger = log;
		autoUpdater.logger.transports.file.level = "info";
		autoUpdater.autoDownload = true;
		autoUpdater.autoInstallOnAppQuit = false; // on contrôle le moment d'installation
		autoUpdater.setFeedURL({ provider: "github", owner: "HugoErb", repo: "AimDisplay" });
	}

	// 1er démarrage via lien (Windows)
	if (process.platform === "win32") {
		const urlArg = process.argv.find((a) => typeof a === "string" && a.startsWith(`${SCHEME}://`));
		if (urlArg) sendDeepLink(urlArg);
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
