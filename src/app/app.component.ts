import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
})
export class AppComponent {
    title = 'AimDisplay';

    constructor(private translateService: TranslateService) {}

    ngOnInit() {
        this.translateService.addLangs(['fr']);
        this.translateService.setDefaultLang('fr');
        this.translate('fr');

        let theme = localStorage.getItem('theme');
        if (theme !== 'dark' && theme !== 'light') {
            localStorage.setItem('theme', 'light');
            theme = 'light';
        }
    }

    translate(lang: string) {
        // this.translateService.use(lang);
        // this.translateService
        //   .get('primeng')
        //   .subscribe((res) => this.config.setTranslation(res));
    }
}
