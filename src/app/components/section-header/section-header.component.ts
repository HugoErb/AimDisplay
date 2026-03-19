import { Component, Input } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-section-header',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './section-header.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppSectionHeaderComponent {
	@Input() title: string = '';
	@Input() subtitle: string = '';
	@Input() icon: string = '';
}
