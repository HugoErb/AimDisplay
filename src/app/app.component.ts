import { AsyncPipe, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, NgClass],
	templateUrl: './app.component.html',
})
export class AppComponent {
	themeName: string = 'themeAimDisplay';
	theme: string | null = '';
	title = 'AimDisplay';

	constructor(private config: PrimeNG, private translateService: TranslateService) {}

	ngOnInit() {
		this.translateService.addLangs(['fr']);
		this.translateService.setDefaultLang('fr');
		this.translate('fr');

		this.theme = localStorage.getItem(this.themeName);
		if (this.theme !== 'dark' && this.theme !== 'light') {
			localStorage.setItem(this.themeName, 'light');
			this.theme = 'light';
		}
	}

	translate(lang: string) {
		this.translateService.use(lang);
		this.translateService.get('primeng').subscribe((res) => this.config.setTranslation(res));
	}
}
