import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';

@Component({
	selector: 'app-redirect-link',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './redirect-link.component.html',
})
export class RedirectLinkComponent {
	@Input() target: string = '';
	@Input() forceLight: boolean = false;

	constructor(private commonService: CommonService) {}

	redirectTo(): void {
		if (this.target) {
			this.commonService.redirectTo(this.target);
		}
	}
}
