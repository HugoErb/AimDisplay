import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
	constructor(private authService: AuthService, private router: Router) {}

	/**
	 * Garde d’activation pour les routes protégées.
	 * Si l’accès est autorisé, résout `true`. Sinon, retourne un `UrlTree`
	 * afin que le Routeur gère la redirection proprement.
	 *
	 * @param route - Instantané de la route actuelle (non utilisé ici).
	 * @param state - État du routeur contenant notamment l’URL cible.
	 * @returns Promesse résolue avec `true` si autorisé, ou un `UrlTree` de redirection.
	 */
	async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
		return this.checkAccess(state.url);
	}

	/**
	 * Garde d’activation pour les routes enfants protégées.
	 * Si l’accès est autorisé, résout `true`. Sinon, retourne un `UrlTree`
	 * afin que le Routeur gère la redirection proprement.
	 *
	 * @param route - Instantané de la route enfant (non utilisé ici).
	 * @param state - État du routeur incluant l’URL cible.
	 * @returns Promesse résolue avec `true` si autorisé, ou un `UrlTree` de redirection.
	 */
	async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
		return this.checkAccess(state.url);
	}

	/**
	 * Vérifie l’accès à une route protégée.
	 *
	 * Règles appliquées :
	 *  - Autorise sans session le flux de récupération de mot de passe (`/reset-password`).
	 *  - Attend la session réelle depuis l’AuthService (évite les faux négatifs au démarrage).
	 *  - Si une session existe, l’accès est accordé (`true`).
	 *  - Sinon, renvoie un `UrlTree` vers `/login` avec un paramètre `redirect`
	 *    contenant l’URL cible, afin que la redirection soit gérée proprement
	 *    par le routeur (sans navigation impérative).
	 *
	 * @param targetUrl - L’URL complète de destination (utilisée pour le paramètre `redirect`).
	 * @returns Promesse résolue avec `true` si l’accès est autorisé, sinon un `UrlTree` vers `/login`.
	 */
	private async checkAccess(targetUrl: string): Promise<boolean | UrlTree> {
		// Accès libre pour le flux de récupération de mot de passe
		if (targetUrl.startsWith('/reset-password')) {
			return true;
		}

		// On attend la session réelle
		const session = await this.authService.getCurrentSession?.();

		if (session) {
			return true;
		}

		// Pas connecté → on laisse le Router rediriger (pas de navigate imperatif)
		return this.router.createUrlTree(['/login'], { queryParams: { redirect: targetUrl } });
	}
}
