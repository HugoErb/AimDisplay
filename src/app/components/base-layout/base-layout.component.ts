import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ThemeService } from '../../services/theme.service';

@Component({
	selector: 'app-base-layout',
	standalone: true,
	imports: [RouterOutlet, SidebarComponent],
	templateUrl: './base-layout.component.html',
})
export class BaseLayoutComponent {
	constructor(protected commonService: CommonService, private themeService: ThemeService) {}

	theme: string | null = '';

	ngOnInit() {
		this.themeService.getTheme();
	}
}
