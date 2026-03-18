import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from './../services/common.service';

@Component({
	selector: 'app-splash-screen',
	templateUrl: './splash_screen.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SplashScreenComponent implements OnInit {
	// Délai d'affichage minimal en millisecondes
	private static readonly MIN_SPLASH_DELAY = 2000;

	private updateDone = false;
	private sessionDone = false;
	private isLogged = false;
	private bootStart = 0;
	private navigated = false;

	constructor(private supabase: SupabaseService, protected commonService: CommonService) {}

	async ngOnInit() {
		this.bootStart = Date.now();

		const api: any = (window as any).deeplink;

		// Lancement en parallèle des tâches de démarrage
		try {
			await Promise.all([
				// 1) Check update (non-bloquant s'il échoue ou n'existe pas)
				(async () => {
					try {
						await api?.checkForUpdates?.();
					} catch (e) {
						console.warn('[splash] check updates failed', e);
					} finally {
						this.updateDone = true;
					}
				})(),

				// 2) Récupération de la session
				(async () => {
					try {
						const { data } = await this.supabase.getSession();
						this.isLogged = !!data?.session;
					} catch (e) {
						console.error('[splash] session check failed', e);
						this.isLogged = false;
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

		// 3) Tenter de finir (respectera le délai minimal)
		this.tryFinish();
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
