import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-generer-pdf',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './generer_pdf.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenererPDFComponent {
	// Variables de sélection de tab
	selectedTab: 'competition' | 'tireur' = 'competition';
	switchTab(tab: 'competition' | 'tireur') {
		this.selectedTab = tab;
	}

	//Variables de selection d'entité à exporter
	selectedCompetitionName: string = '';
	selectedShooterName: { name: string } | null = null;
	selectedShooterCompetitionName: { name: string } | null = null;

	// Variables de liste
	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];
	shooters: any[] = [{ name: 'Pierre' }, { name: 'Paul' }, { name: 'Jacques' }];
	filteredShooters: any[] = [];

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

	/**
	 * Filtre les compétitions en fonction de la recherche de compétition entrée.
	 * @param event - L'événement contenant la recherche de compétition entrée.
	 */
	filterShooter(event: any): void {
		const filtered: any[] = [];
		const query: string = event.query.toLowerCase();

		for (const shooter of this.shooters) {
			if (shooter.name.toLowerCase().includes(query)) {
				filtered.push(shooter);
			}
		}

		this.filteredShooters = filtered;
	}
}
