import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './home.component.html',
})
export class HomeComponent {
	constructor(protected commonService: CommonService) {}
}
