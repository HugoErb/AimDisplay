import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-generer-pdf',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './generer_pdf.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenererPDFComponent {
	constructor(protected commonService: CommonService) {}
	// Variables de sélection de tab
	selectedTab: 'competition' | 'tireur' = 'competition';

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
	 * Change l'onglet actuellement sélectionné dans l'interface utilisateur.
	 *
	 * @param tab - Le nom de l'onglet à activer, soit 'competition' soit 'tireur'.
	 *              Cela met à jour la propriété `selectedTab` utilisée pour afficher le contenu associé.
	 */
	switchTab(tab: 'competition' | 'tireur') {
		this.selectedTab = tab;
	}
}
