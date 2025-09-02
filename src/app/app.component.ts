import { Component, NgZone } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './app.component.html',
})
export class AppComponent {
	theme: string | null = '';
	title = 'AimDisplay';

	constructor(private config: PrimeNG, private translateService: TranslateService, private router: Router, private ngZone: NgZone) {}

	ngOnInit() {
		// i18n
		this.translateService.addLangs(['fr']);
		this.translateService.setDefaultLang('fr');
		this.translate('fr');

		// ----- DEEPLINK (Electron) -----
		const api = (window as any).deeplink as { getInitial: () => Promise<string | null>; on: (cb: (u: string) => void) => void } | undefined;

		if (api) {
			// App lancée par un lien (appli fermée)
			api.getInitial().then((u) => {
				if (u) this.handleDeepLink(u);
			});

			// App déjà ouverte (2e clic sur un lien)
			api.on((u) => {
				void this.handleDeepLink(u);
			});
		}
	}

	private handleDeepLink(url: string): void {
		// Tokens possibles en fragment (#...) ou en query (?...)
		const fragOrQuery = url.includes('#') ? url.substring(url.indexOf('#') + 1) : url.includes('?') ? url.substring(url.indexOf('?') + 1) : '';

		const params = new URLSearchParams(fragOrQuery);
		const type = params.get('type');
		const access = params.get('access_token');
		const refresh = params.get('refresh_token');

		if (type === 'recovery' && access && refresh) {
			// Navigue dans la zone Angular (sinon l’UI ne bouge pas)
			this.ngZone.run(() => {
				void this.router.navigate(['reset-password'], {
					queryParams: { access_token: access, refresh_token: refresh },
					replaceUrl: true, // évite de garder les tokens dans l’historique
				});
			});
		}
	}

	translate(lang: string) {
		this.translateService.use(lang);
		this.translateService.get('primeng').subscribe((res) => this.config.setTranslation(res));
	}
}
