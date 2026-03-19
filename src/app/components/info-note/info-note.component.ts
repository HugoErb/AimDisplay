import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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
export class InfoNoteComponent {}
