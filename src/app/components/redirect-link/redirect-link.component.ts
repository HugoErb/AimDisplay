import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';

@Component({
	selector: 'app-redirect-link',
	standalone: true,
	imports: [CommonModule],
	template: `
		<span (click)="redirectTo()" class="redirect-link" [class.force-light]="forceLight">
			<ng-content></ng-content>
		</span>
	`,
	styles: [
		`
			.redirect-link {
				color: var(--color-prime-blue);
				font-weight: 500;
				cursor: pointer;
				transition: color 0.2s;
			}

			.redirect-link:hover {
				color: var(--color-hover-prime-blue);
				text-decoration: underline;
			}

			/* On n'applique le style sombre que si on n'est PAS en force-light */
			:host-context(.dark) .redirect-link:not(.force-light),
			:host(.dark) .redirect-link:not(.force-light) {
				color: var(--color-prime-blue-light);
			}

			:host-context(.dark) .redirect-link:not(.force-light):hover,
			:host(.dark) .redirect-link:not(.force-light):hover {
				color: var(--color-hover-prime-blue-light);
			}
		`,
	],
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
