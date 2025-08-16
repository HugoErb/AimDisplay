import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';
import { Club } from '../interfaces/club';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
	selector: 'app-creation-club',
	standalone: true,
	imports: [CommonModule, InputTextModule, FormsModule],
	templateUrl: './creation_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationClubComponent {
	constructor(
		protected commonService: CommonService,
		private supabase: SupabaseService,
		private route: ActivatedRoute,
		private location: Location
	) {}

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	clubName: string = '';
	clubCity: string = '';
	isSaving: boolean = false;

	// Variables de modification d'un club
	editingClub: Club | null = null;
	isEditMode = false;

	async ngOnInit(): Promise<void> {
		// Est-ce qu’on est en mode édition ? (présence d’un paramètre :id)
		const idParam = this.route.snapshot.paramMap.get('id');
		const isEditRequested = idParam !== null;

		// Si édition demandée, on valide les données passées via state
		if (isEditRequested) {
			const id = Number(idParam);
			const clubFromState = history.state?.club as Club | undefined;

			if (clubFromState && Number.isFinite(id) && clubFromState.id === id) {
				this.isEditMode = true;
				this.editingClub = clubFromState;
				this.clubName = clubFromState.name ?? '';
				this.clubCity = clubFromState.city ?? '';
				return;
			}

			// Édition demandée mais données manquantes → revenir en arrière
			this.commonService.showSwalToast("Impossible d'ouvrir l'édition du club (données manquantes).", 'error');
			this.location.back();
			return;
		}

		// Pas d’édition demandée → on reste en mode création (pas de redirection)
		this.isEditMode = false;
		this.editingClub = null;
	}

	/**
	 * Soumet le formulaire du club automatiquement entre création et édition selon l’état courant.
	 *
	 * @returns {Promise<void>} Promesse résolue lorsque l’opération (création ou mise à jour) est terminée.
	 */
	async submitClub(): Promise<void> {
		if (this.isEditMode) {
			await this.updateClub();
		} else {
			await this.createClub();
		}
	}

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
			} finally {
				this.isSaving = false;
			}
		}
	}

	/**
	 * Met à jour le club sélectionné (mode édition) à partir des champs du formulaire.
	 * Effectue d'abord la validation des inputs, puis si la mise à jour réussit,
	 * réinitialise les champs et sort du mode édition.
	 *
	 * @returns {Promise<void>} Promesse résolue une fois la mise à jour effectuée et le formulaire réinitialisé.
	 */
	async updateClub(): Promise<void> {
		this.isSaving = true;

		// Validation des champs
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (!areInputsValid) {
			this.isSaving = false;
			return;
		}

		try {
			if (!this.editingClub?.id) {
				throw new Error('Aucun club sélectionné pour la modification.');
			}

			const trimmedName = (this.clubName ?? '').trim();
			const trimmedCity = (this.clubCity ?? '').trim();

			await this.supabase.updateClubById(this.editingClub.id, {
				name: trimmedName,
				city: trimmedCity,
			});

			// Reset + sortie du mode édition (comme après create)
			this.commonService.redirectTo('modification_club');
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la mise à jour du club', 'error');
		} finally {
			this.isSaving = false;
		}
	}
}
