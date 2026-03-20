import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { CommonService } from '../services/common.service';

import { RedirectLinkComponent } from '../components/redirect-link/redirect-link.component';
import { AppSectionHeaderComponent } from '../components/section-header/section-header.component';
import { APP_ICONS } from '../constants/icons';

@Component({
	selector: 'app-help',
	standalone: true,
	imports: [CommonModule, RedirectLinkComponent, AppSectionHeaderComponent],
	templateUrl: './help.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HelpComponent implements OnInit {
	protected readonly icons = APP_ICONS;
	darkMode: boolean = false;

	constructor(private themeService: ThemeService, protected commonService: CommonService) {}

	ngOnInit(): void {
		this.darkMode = this.themeService.getTheme() === 'dark';
	}
}
