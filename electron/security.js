function isHttpUrl(url) {
	return /^https?:\/\//i.test(url);
}

function createExternalNavigationHandler(openExternal) {
	return {
		handleWindowOpen(url) {
			if (isHttpUrl(url)) {
				openExternal(url);
			}
			return { action: "deny" };
		},
		handleWillNavigate(event, url) {
			if (isHttpUrl(url)) {
				event.preventDefault();
				openExternal(url);
			}
		},
	};
}

function createSavedPathRegistry() {
	const savedPaths = new Set();
	return {
		add(filePath) {
			if (typeof filePath === "string" && filePath.trim()) {
				savedPaths.add(filePath);
			}
		},
		has(filePath) {
			return typeof filePath === "string" && Boolean(filePath.trim()) && savedPaths.has(filePath);
		},
	};
}

module.exports = {
	createExternalNavigationHandler,
	createSavedPathRegistry,
};
