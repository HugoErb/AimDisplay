import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from './../services/common.service';
import { APP_ICONS } from '../constants/icons';
import { environment } from '../../environments/environment';

@Component({
	selector: 'app-splash-screen',
	templateUrl: './splash_screen.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SplashScreenComponent implements OnInit {
	protected readonly icons = APP_ICONS;
	// Délai d'affichage minimal en millisecondes
	private static readonly MIN_SPLASH_DELAY = 2000;
	private static readonly CONNECTIVITY_TIMEOUT = 5000;

	protected errorMessage: string | null = null;

	private updateDone = false;
	private sessionDone = false;
	private isLogged = false;
	private bootStart = 0;
	private navigated = false;

	constructor(private supabase: SupabaseService, protected commonService: CommonService) {}

	async ngOnInit() {
		this.bootStart = Date.now();

		// 1) Vérification connexion internet avant tout
		const isOnline = await this.checkConnectivity();
		if (!isOnline) {
			this.errorMessage = 'Aucune connexion internet. Vérifiez votre réseau et réessayez.';
			return;
		}

		const api: any = (window as any).deeplink;

		// Lancement en parallèle des tâches de démarrage
		try {
			await Promise.all([
				// 2) Check update (non-bloquant s'il échoue ou n'existe pas)
				(async () => {
					try {
						await api?.checkForUpdates?.();
					} catch (e) {
						console.warn('[splash] check updates failed', e);
					} finally {
						this.updateDone = true;
					}
				})(),

				// 3) Récupération de la session
				(async () => {
					try {
						const { data, error } = await this.supabase.getSession();
						if (error) throw error;
						this.isLogged = !!data?.session;
					} catch (e) {
						console.error('[splash] session check failed', e);
						this.isLogged = false;
						this.errorMessage = 'Impossible de vérifier votre session.';
					} finally {
						this.sessionDone = true;
					}
				})(),
			]);
		} catch (e) {
			// Sécurité au cas où Promise.all crasherait (peu probable avec les catch internes)
			this.updateDone = true;
			this.sessionDone = true;
		}

		// 4) Tenter de finir (respectera le délai minimal)
		this.tryFinish();
	}

	/**
	 * Vérifie la connectivité réseau en tentant de joindre le serveur Supabase.
	 */
	private async checkConnectivity(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				SplashScreenComponent.CONNECTIVITY_TIMEOUT
			);
			await fetch(environment.supabase.url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
			clearTimeout(timeoutId);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Réinitialise l'état et relance la séquence de démarrage.
	 */
	protected async retry() {
		this.errorMessage = null;
		this.updateDone = false;
		this.sessionDone = false;
		this.isLogged = false;
		this.navigated = false;
		await this.ngOnInit();
	}

	/**
	 * Tente de finaliser l'affichage du Splash Screen.
	 * Vérifie que toutes les tâches (updates, session) sont terminées et que le délai
	 * minimal a été respecté avant de rediriger ou d'appliquer une mise à jour.
	 */
	private tryFinish() {
		if (this.navigated) return;
		if (!(this.updateDone && this.sessionDone)) return;

		const elapsed = Date.now() - this.bootStart;
		const wait = Math.max(0, SplashScreenComponent.MIN_SPLASH_DELAY - elapsed);

		setTimeout(async () => {
			// 1) tenter d'appliquer MAJ maintenant (si dispo, l'app redémarre ici)
			const api: any = (window as any).deeplink;
			const res = await api?.applyUpdateNow?.();
			if (res === 'restarting') return;

			// 2) sinon on redirige
			const target = this.isLogged ? 'home' : 'login';
			this.commonService.redirectTo(target);
		}, wait);
	}
}
