// src/app/deep-link.bootstrap.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';

declare global {
	interface Window {
		deeplink?: {
			on(cb: (url: string) => void): void;
			getInitial(): Promise<string | null>;
		};
	}
}

function extractTokens(u: string) {
	const frag = u.includes('#') ? u.slice(u.indexOf('#') + 1) : u.includes('?') ? u.slice(u.indexOf('?') + 1) : '';
	const p = new URLSearchParams(frag);
	return {
		type: p.get('type'),
		access: p.get('access_token'),
		refresh: p.get('refresh_token') ?? undefined,
	};
}

export function setupDeepLink(router = inject(Router)) {
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

	// Démarrage à froid (appli lancée par lien)
	window.deeplink?.getInitial().then((u) => {
		if (u) {
			void handle(u);
		}
	});

	// Appli déjà ouverte (second clic)
	window.deeplink?.on((u) => {
		void handle(u);
	});
}
