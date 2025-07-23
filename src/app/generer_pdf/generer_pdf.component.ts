import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { CommonService } from '../services/common.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';

@Component({
	selector: 'app-generer-pdf',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './generer_pdf.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenererPDFComponent {
	constructor(protected commonService: CommonService, private pdfGeneratorService: PdfGeneratorService) {}

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();

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

	/**
	 * Permet de lancer la génération du PDF à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie et le PDF et télécharger sur le PC de l'utilisateur.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async generatePDF(): Promise<void> {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

		if (
			(await this.commonService.validateInputs(this.inputLabelMap, false)) &&
			(await this.pdfGeneratorService.generateAndDownloadPDF(this.inputLabelMap))
		) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}
