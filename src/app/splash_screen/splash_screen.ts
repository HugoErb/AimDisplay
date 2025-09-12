import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'app-splash-screen',
	templateUrl: './splash_screen.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SplashScreenComponent implements OnInit, OnDestroy {
	statusMsg = 'Chargement en cours...';
	progressPct: number | null = null;
	private resolvedUpdate = false;
	private isLogged = false;

	constructor(private router: Router, private supabase: SupabaseService) {}

	async ngOnInit() {
		// 1) écouter les messages d’update (Electron seulement)
		(window as any).electronAPI?.onUpdateStatus((status: string) => {
			if (status === 'available') this.statusMsg = 'Mise à jour disponible. Téléchargement…';
			if (status === 'error') {
				this.statusMsg = 'Impossible de vérifier les mises à jour.';
				this.resolvedUpdate = true;
				this.tryFinish();
			}
			if (status === 'none') {
				this.resolvedUpdate = true;
				this.tryFinish();
			}
			if (status === 'downloaded') this.statusMsg = 'Installation de la mise à jour…';
		});
		(window as any).electronAPI?.onUpdateProgress((pct: number) => (this.progressPct = pct ?? null));

		// 2) déclencher la vérification de MAJ (si Electron)
		(window as any).electronAPI?.checkForUpdates?.();

		// 3) charger la session Supabase en parallèle
		try {
			const { data } = await (this.supabase as any).supabase.auth.getSession();
			this.isLogged = !!data?.session;
		} catch {
			this.isLogged = false;
		} finally {
			this.tryFinish();
		}
	}

	private tryFinish() {
		// Si pas d’Electron, on route tout de suite
		if (!(window as any).electronAPI) {
			this.router.navigateByUrl(this.isLogged ? '/home' : '/login');
			return;
		}
		// En Electron : on attend la réponse d’update (none/error) avant de router.
		if (!this.resolvedUpdate) return;

		this.router.navigateByUrl(this.isLogged ? '/home' : '/login');
		(window as any).electronAPI?.rendererReady?.();
	}

	ngOnDestroy() {}
}
