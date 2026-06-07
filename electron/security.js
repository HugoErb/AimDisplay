/**
 * Indique si une URL utilise le protocole HTTP ou HTTPS.
 */
function isHttpUrl(url) {
	return /^https?:\/\//i.test(url);
}

/**
 * Cree les gestionnaires de navigation externe Electron.
 */
function createExternalNavigationHandler(openExternal) {
	return {
		/**
		 * Traite les demandes d'ouverture de nouvelle fenetre.
		 */
		handleWindowOpen(url) {
			if (isHttpUrl(url)) {
				openExternal(url);
			}
			return { action: "deny" };
		},
		/**
		 * Traite les navigations initiees dans la fenetre courante.
		 */
		handleWillNavigate(event, url) {
			if (isHttpUrl(url)) {
				event.preventDefault();
				openExternal(url);
			}
		},
	};
}

/**
 * Cree un registre des chemins de fichiers PDF sauvegardes.
 */
function createSavedPathRegistry() {
	const savedPaths = new Set();
	return {
		/**
		 * Ajoute un chemin valide au registre.
		 */
		add(filePath) {
			if (typeof filePath === "string" && filePath.trim()) {
				savedPaths.add(filePath);
			}
		},
		/**
		 * Indique si un chemin est present dans le registre.
		 */
		has(filePath) {
			return typeof filePath === "string" && Boolean(filePath.trim()) && savedPaths.has(filePath);
		},
	};
}

module.exports = {
	createExternalNavigationHandler,
	createSavedPathRegistry,
};
