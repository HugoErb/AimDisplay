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

	// ➕ chrono pour forcer 2.5s mini
	private bootStart = 0;
	private navigated = false;

	constructor(private supabase: SupabaseService, protected commonService: CommonService) {}

	async ngOnInit() {
		this.bootStart = Date.now();

		const api: any = (window as any).deeplink;

		// 1) Vérifier les mises à jour (synchrone + timeout filet de sécu)
		try {
			if (api?.checkForUpdates) {
				await this.withTimeout(Promise.resolve(api.checkForUpdates()), 10000);
			}
		} catch {
			// on ignore l'erreur updater
		} finally {
			this.updateDone = true;
		}

		// 2) Vérifier la session
		try {
			const { data } = await (this.supabase as any).supabase.auth.getSession();
			this.isLogged = !!data?.session;
		} catch {
			this.isLogged = false;
		} finally {
			this.sessionDone = true;
		}

		// 3) Router avec durée minimale de 2.5s
		this.tryFinish();
	}

	private tryFinish() {
		if (this.navigated) return;
		if (!(this.updateDone && this.sessionDone)) return;

		const elapsed = Date.now() - this.bootStart;
		const wait = Math.max(0, 2000 - elapsed); // 2.0s minimum

		setTimeout(() => {
			if (this.navigated) return;
			this.navigated = true;

			const target = this.isLogged ? 'home' : 'login';
			this.commonService.redirectTo(target);
		}, wait);
	}

	// Filet de sécurité pour ne jamais rester coincé sur l’updater
	private withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T | undefined> {
		return new Promise((resolve) => {
			const t = setTimeout(() => resolve(undefined), ms);
			p.then(
				(v) => {
					clearTimeout(t);
					resolve(v);
				},
				() => {
					clearTimeout(t);
					resolve(undefined);
				}
			);
		});
	}
}
