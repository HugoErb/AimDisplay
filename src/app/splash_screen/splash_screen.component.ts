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
	private updateDone = false;
	private sessionDone = false;
	private isLogged = false;

	// chrono pour forcer 2.5s mini
	private bootStart = 0;
	private navigated = false;

	constructor(private supabase: SupabaseService, protected commonService: CommonService) {}

	async ngOnInit() {
		this.bootStart = Date.now();

		// 1) Check update (retourne vite, download en arrière-plan s'il y a une MAJ)
		const api: any = (window as any).deeplink;
		try {
			await api?.checkForUpdates?.();
		} catch {}

		// 2) Session
		try {
			const { data } = await (this.supabase as any).supabase.auth.getSession();
			this.isLogged = !!data?.session;
		} catch {
			this.isLogged = false;
		} finally {
			this.updateDone = true;
			this.sessionDone = true;
		}

		// 3) Finir (2,5 s min)
		this.tryFinish();
	}

	private tryFinish() {
		if (this.navigated) return;
		if (!(this.updateDone && this.sessionDone)) return;

		const elapsed = Date.now() - this.bootStart;
		const wait = Math.max(0, 2500 - elapsed);

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
