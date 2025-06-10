import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-display',
	standalone: true,
	imports: [AutoCompleteModule],
	templateUrl: './display.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DisplayComponent {
    constructor(protected commonService: CommonService) {}

	shooterCompetitionName: string = '';
	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];
}
