import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-info-card',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './info-card.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InfoCardComponent {
	@Input() title: string = '';
	@Input() icon: string = '';
}
