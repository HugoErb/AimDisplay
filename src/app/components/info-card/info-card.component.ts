import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@Component({
	selector: 'app-info-card',
	standalone: true,
	imports: [],
	templateUrl: './info-card.component.html',
	styles: [`:host { display: block; height: 100%; }`],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InfoCardComponent {
	@Input() title: string = '';
	@Input() icon: string = '';
}
