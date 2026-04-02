import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { APP_ICONS } from '../../constants/icons';

import { RedirectLinkComponent } from '../redirect-link/redirect-link.component';

@Component({
	selector: 'app-sidebar',
	standalone: true,
	imports: [CommonModule, RedirectLinkComponent],
	templateUrl: './sidebar.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent {
	protected readonly icons = APP_ICONS;
	avatarUrl$!: ReturnType<AuthService['avatarUrl$']['subscribe']> extends never ? any : typeof this.authService.avatarUrl$;

	constructor(protected commonService: CommonService, protected authService: AuthService) {
		this.avatarUrl$ = this.authService.avatarUrl$;
	}
}
