import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { CommonService } from '../services/common.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
	constructor(private authService: AuthService, private commonService: CommonService) {}

	/**
	 * Vérifie si l'utilisateur est autorisé à activer la route demandée.
	 * Utilisé directement sur les routes simples (sans enfants).
	 *
	 * @returns `true` si l'accès est autorisé, sinon déclenche une redirection vers /login.
	 */
	canActivate(): boolean | UrlTree {
		return this.checkAccess();
	}

	/**
	 * Vérifie si l'utilisateur est autorisé à activer les routes enfants.
	 * Utilisé sur les modules ou composants qui contiennent plusieurs routes internes.
	 *
	 * @returns `true` si l'accès aux enfants est autorisé, sinon déclenche une redirection vers /login.
	 */
	canActivateChild(): boolean | UrlTree {
		return this.checkAccess();
	}

	/**
	 * Règle commune pour déterminer si l'utilisateur peut accéder à une route protégée.
	 *
	 * Logique appliquée :
	 *  - Laisse passer /reset-password même si l'utilisateur n'est pas connecté (pour le flux de récupération Supabase).
	 *  - Autorise l'accès si l'utilisateur est connecté (`AuthService.isLoggedIn()` retourne `true`).
	 *  - Sinon, redirige vers la page /login et bloque l'accès.
	 *
	 * @returns `true` si l'accès est autorisé, sinon `false` (après redirection).
	 */
	private checkAccess(): boolean {
		// Exception : page de reset accessible même sans session
		if (typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password')) {
			return true;
		}

		// Autoriser si connecté
		if (this.authService.isLoggedIn()) {
			return true;
		}

		// Sinon → rediriger vers login
		this.commonService.redirectTo('login');
		return false;
	}
}
