import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
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

	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	shooterCompetitionName: string = '';
	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];

	/**
	 * Permet de lancer l'affichage à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si l'affichage réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que l'affichage est effectué et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async launchDisplay(): Promise<void> {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

		if (await this.commonService.createData(this.inputLabelMap)) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}
