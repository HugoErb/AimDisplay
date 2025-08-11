import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
	selector: 'app-creation-club',
	standalone: true,
	imports: [CommonModule, InputTextModule, FormsModule],
	templateUrl: './creation_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationClubComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService) {}

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	clubName: string = '';
	clubCity: string = '';
    isSaving:boolean = false;

	/**
	 * Permet de créer un club à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async createClub(): Promise<void> {
        this.isSaving = false;
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
        const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (areInputsValid) {
            try {
                const club = await this.supabase.createClub({
                    name: this.clubName,
                    city: this.clubCity,
                });
			    this.commonService.resetInputFields(this.inputFields);
            }
            finally {
                this.isSaving = false;
            }
		}
	}
}
