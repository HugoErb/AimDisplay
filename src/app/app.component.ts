import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { ThemeService } from './services/theme.service';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './app.component.html',
})
export class AppComponent {
	theme: string | null = '';
	title = 'AimDisplay';

	constructor(private config: PrimeNG, private translateService: TranslateService, private themeService: ThemeService) {}

	ngOnInit() {
		this.translateService.addLangs(['fr']);
		this.translateService.setDefaultLang('fr');
		this.translate('fr');

		this.themeService.getTheme();
	}

	translate(lang: string) {
		this.translateService.use(lang);
		this.translateService.get('primeng').subscribe((res) => this.config.setTranslation(res));
	}
}
