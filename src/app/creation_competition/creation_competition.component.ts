import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-creation-competition',
	standalone: true,
	imports: [FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationCompetitionComponent {
	constructor(protected commonService: CommonService) {}

	// Variables de création d'une compétition
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	competitionDate: string = '';
	competitionName: string = '';
	prixInscription: number | null = null;
	prixCategSup: number | null = null;

	/**
	 * Permet de créer une compétition à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async createCompetition(): Promise<void> {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

		if (await this.commonService.createData(this.inputLabelMap)) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}
