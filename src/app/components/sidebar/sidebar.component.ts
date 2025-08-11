import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'app-sidebar',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './sidebar.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent {
	constructor(
		protected commonService: CommonService, protected authService: AuthService
	) {}
    
    avatarUrl: string | undefined = ';'

    async ngOnInit() {
            this.avatarUrl = await this.authService.getSignedAvatarUrl();
        }
}
