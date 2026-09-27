import { Component, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { OverlayScrollbars } from 'overlayscrollbars';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './app.component.html',
})
export class AppComponent {
	theme: string | null = '';
	title = 'AimDisplay';

	constructor(private config: PrimeNG, private translateService: TranslateService, private ngZone: NgZone) {}

	/**
	 * Initialise le composant.
	 */
	ngOnInit() {
		this.ngZone.runOutsideAngular(() => {
			OverlayScrollbars(document.body, {
				scrollbars: {
					theme: 'os-theme-custom',
					autoHide: 'never',
				},
			});
		});

		// i18n
		this.translateService.addLangs(['fr']);
		this.translateService.setDefaultLang('fr');
		this.translate('fr');

		// Les liens profonds (Electron) sont gérés par setupDeepLink (app.config.ts)
	}

	/**
	 * Applique la langue demandee et les traductions PrimeNG.
	 */
	translate(lang: string) {
		this.translateService.use(lang);
		this.translateService.get('primeng').subscribe((res) => this.config.setTranslation(res));
	}
}
