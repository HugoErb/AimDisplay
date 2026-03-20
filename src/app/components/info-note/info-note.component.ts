import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { APP_ICONS } from '../../constants/icons';

@Component({
	selector: 'app-info-note',
	standalone: true,
	imports: [],
	templateUrl: './info-note.component.html',
	styles: [
		`
			:host {
				display: block;
			}
		`,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InfoNoteComponent {
	protected readonly icons = APP_ICONS;
}
