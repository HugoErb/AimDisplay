import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-creation-club',
	standalone: true,
	imports: [CommonModule, InputTextModule, FormsModule],
	templateUrl: './creation_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationClubComponent {
	constructor(protected commonService: CommonService) {}

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	clubName: string = '';
	clubCity: string = '';

	/**
	 * Permet de créer un club à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async createClub(): Promise<void> {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

		if (await this.commonService.sendMail(this.inputLabelMap)) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}
