import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
	selector: 'app-display',
	standalone: true,
	imports: [AutoCompleteModule],
	templateUrl: './display.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DisplayComponent {
	shooterCompetitionName: string = '';
	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];

	/**
	 * Filtre les compétitions en fonction de la recherche de compétition entrée.
	 * @param event - L'événement contenant la recherche de compétition entrée.
	 */
	filterCompetition(event: any): void {
		const filtered: any[] = [];
		const query: string = event.query.toLowerCase();

		for (const competition of this.competitions) {
			if (competition.name.toLowerCase().includes(query)) {
				filtered.push(competition);
			}
		}

		this.filteredCompetitions = filtered;
	}
}
