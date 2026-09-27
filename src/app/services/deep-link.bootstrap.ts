// src/app/deep-link.bootstrap.ts
import { inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Extrait les jetons depuis une URL de lien profond.
 */
function extractTokens(u: string) {
	const frag = u.includes('#') ? u.slice(u.indexOf('#') + 1) : u.includes('?') ? u.slice(u.indexOf('?') + 1) : '';
	const p = new URLSearchParams(frag);
	return {
		type: p.get('type'),
		access: p.get('access_token'),
		refresh: p.get('refresh_token') ?? undefined,
	};
}

/**
 * Configure la prise en charge des liens profonds.
 */
export function setupDeepLink(router = inject(Router), zone = inject(NgZone)) {
	/**
	 * Traite une URL de lien profond.
	 */
	async function handle(u: string) {
		const { type, access, refresh } = extractTokens(u);

		// Email confirmation
		if (type === 'signup') {
			await router.navigate(['/login'], { queryParams: { verified: 1 }, replaceUrl: true });
			return;
		}

		// Reset password (réception des tokens)
		if (type === 'recovery' && access && refresh) {
			await router.navigate(['/reset-password'], {
				queryParams: { access_token: access, refresh_token: refresh },
				replaceUrl: true,
			});
			return;
		}
	}

	// Les callbacks IPC arrivent hors de la zone Angular : on y revient pour que l'UI se mette à jour
	const run = (u: string) => zone.run(() => void handle(u));

	// Démarrage à froid (appli lancée par lien)
	window.deeplink?.getInitial().then((u) => {
		if (u) run(u);
	});

	// Appli déjà ouverte (second clic)
	window.deeplink?.on(run);
}
