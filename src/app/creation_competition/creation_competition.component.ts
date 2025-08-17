import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Competition } from '../interfaces/competition';
import { SupabaseService } from '../services/supabase.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
	selector: 'app-creation-competition',
	standalone: true,
	imports: [FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationCompetitionComponent {
	constructor(
		protected commonService: CommonService,
		private supabase: SupabaseService,
		private route: ActivatedRoute,
		private location: Location
	) {}

	isSaving: boolean = false;

	// Variables de création d'une compétition
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	competitionDate: string | Date | (Date | null)[] = '';
	competitionName: string = '';
	prixInscription: number | null = null;
	prixCategSup: number | null = null;

	// Variables de modification d'une competition
	editingCompetition: Competition | null = null;
	isEditMode = false;

	async ngOnInit(): Promise<void> {
		const idParam = this.route.snapshot.paramMap.get('id');
		const isEditRequested = idParam !== null;

		if (isEditRequested) {
			const id = Number(idParam);
			const competitionFromState = history.state?.competition as Competition | undefined;

			if (competitionFromState && Number.isFinite(id) && competitionFromState.id === id) {
				this.isEditMode = true;
				this.editingCompetition = competitionFromState;

				this.competitionName = competitionFromState.name ?? '';

				// Alimentation du p-calendar (Date ou [Date, Date])
				const start = this.toDateSafe(competitionFromState.startDate);
				const end = this.toDateSafe(competitionFromState.endDate);

				if (start && end) {
					this.competitionDate = this.isSameYMD(start, end) ? start : [start, end];
				} else if (start) {
					this.competitionDate = start;
				} else {
					this.competitionDate = '';
				}

				this.prixInscription = competitionFromState.price ?? '';
				this.prixCategSup = competitionFromState.supCategoryPrice ?? '';
				return;
			}

			this.commonService.showSwalToast("Impossible d'ouvrir l'édition de la competition (données manquantes).", 'error');
			this.location.back();
			return;
		}

		// Mode création
		this.isEditMode = false;
		this.editingCompetition = null;
		this.competitionDate = ''; // champ vide
	}

	/**
	 * Convertit prudemment une valeur en `Date`.
	 * Accepte :
	 * - un objet `Date` (retourné tel quel s’il est valide),
	 * - une chaîne (`YYYY-MM-DD`, ISO 8601, etc.) parsée via le constructeur `Date`,
	 * - `null` ou `undefined` (retourne `null`).
	 *
	 * @param input Valeur à convertir (`Date`, chaîne, `null` ou `undefined`).
	 * @returns Une instance `Date` valide, ou `null` si la conversion échoue ou si l’entrée est vide.
	 */
	private toDateSafe(input: Date | string | null | undefined): Date | null {
		if (!input) return null;
		if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
		const d = new Date(input);
		return isNaN(d.getTime()) ? null : d;
	}

	/**
	 * Compare deux dates **au jour près** (AAAA-MM-JJ), en ignorant l’heure et la timezone.
	 *
	 * @param a Première date (supposée valide).
	 * @param b Deuxième date (supposée valide).
	 * @returns `true` si `a` et `b` sont le même AAAA-MM-JJ, sinon `false`.
	 */
	private isSameYMD(a: Date, b: Date): boolean {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	/**
	 * Soumet le formulaire de la compétition automatiquement entre création et édition selon l’état courant.
	 *
	 * @returns {Promise<void>} Promesse résolue lorsque l’opération (création ou mise à jour) est terminée.
	 */
	async submitCompetition(): Promise<void> {
		if (this.isEditMode) {
			await this.updateCompetition();
		} else {
			await this.createCompetition();
		}
	}

	/**
	 * Permet de créer une compétition à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async createCompetition(): Promise<void> {
		this.isSaving = true;
		try {
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
			const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
			if (areInputsValid) {
				const { startISO, endISO } = this.parseDateRange(this.competitionDate);
				await this.supabase.createCompetition({
					name: this.competitionName,
					startDate: startISO,
					endDate: endISO,
					prixInscription: this.prixInscription ?? 0,
					prixCategSup: this.prixCategSup ?? 0,
				});
				this.commonService.resetInputFields(this.inputFields);
			}
		} finally {
			this.isSaving = false;
		}
	}

	/**
	 * Convertit une entrée de date (string/Date/Date[]) en début et fin au format 'YYYY-MM-DD'.
	 *
	 * @param input Chaîne "jj/mm/aa[aa]" ou "jj/mm/aa[aa] - jj/mm/aa[aa]" ou Date/Date[] (range).
	 * @return Objet contenant startISO et endISO au format 'YYYY-MM-DD'.
	 */
	private parseDateRange(input: string | Date | (Date | null)[]): { startISO: string; endISO: string } {
		if (Array.isArray(input)) {
			const [a, b] = input;
			if (a instanceof Date && b instanceof Date) {
				return { startISO: this.toIsoDate(a), endISO: this.toIsoDate(b) };
			}
			if (a instanceof Date && !b) {
				const iso = this.toIsoDate(a);
				return { startISO: iso, endISO: iso };
			}
			throw new Error('Merci de sélectionner au moins une date.');
		}

		// Date simple
		if (input instanceof Date) {
			const iso = this.toIsoDate(input);
			return { startISO: iso, endISO: iso };
		}

		// Chaîne "dd/mm/yy[yy]" ou "dd/mm/yy[yy] - dd/mm/yy[yy]"
		const raw = (input ?? '').toString().trim();
		if (!raw) throw new Error('Merci de renseigner la date de la compétition.');

		const parts = raw.includes('-') ? raw.split('-').map((p) => p.trim()) : [raw, raw];
		if (parts.length !== 2) {
			throw new Error('Format invalide. Utilisez "jj/mm/aaaa" ou "jj/mm/aaaa - jj/mm/aaaa".');
		}

		const start = this.parseFrDate(parts[0]);
		const end = this.parseFrDate(parts[1]);
		return { startISO: this.toIsoDate(start), endISO: this.toIsoDate(end) };
	}

	/**
	 * Convertit une date au format français "jj/mm/aa[aa]" en objet Date.
	 *
	 * @param stringDate Chaîne au format "jj/mm/aa" ou "jj/mm/aaaa".
	 * @return L’objet Date correspondant.
	 */
	private parseFrDate(stringDate: string): Date {
		const match = stringDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
		if (!match) throw new Error(`Date invalide: "${stringDate}". Attendu: jj/mm/aa[aa].`);
		const dd = parseInt(match[1], 10);
		const mm = parseInt(match[2], 10);
		let year = parseInt(match[3], 10);
		if (match[3].length === 2) year = year >= 70 ? 1900 + year : 2000 + year;
		return new Date(year, mm - 1, dd);
	}

	/**
	 * Formate un objet Date en chaîne 'YYYY-MM-DD' (sans heure).
	 *
	 * @param date Date à formater.
	 * @return Chaîne ISO au format 'YYYY-MM-DD'.
	 */
	private toIsoDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * Met à jour la competition sélectionnée (mode édition) à partir des champs du formulaire.
	 * Effectue d'abord la validation des inputs, puis si la mise à jour réussit,
	 * réinitialise les champs et sort du mode édition.
	 *
	 * @returns {Promise<void>} Promesse résolue une fois la mise à jour effectuée et le formulaire réinitialisé.
	 */
	async updateCompetition(): Promise<void> {
		this.isSaving = true;

		// Validation des champs
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (!areInputsValid) {
			this.isSaving = false;
			return;
		}

		try {
			if (!this.editingCompetition?.id) {
				throw new Error('Aucun club sélectionné pour la modification.');
			}

			// Récupération de la date de début et de fin de compétition
			const { startISO, endISO } = this.parseDateRange(this.competitionDate);

			await this.supabase.updateCompetitionById(this.editingCompetition?.id, {
				name: (this.competitionName ?? '').trim(),
				startDate: startISO,
				endDate: endISO,
				price: this.prixInscription ?? 0,
				supCategoryPrice: this.prixCategSup ?? 0,
			});

			// Reset + sortie du mode édition (comme après create)
			this.commonService.redirectTo('modification_competition');
		} catch (e: any) {
			this.commonService.showSwalToast(e?.message ?? 'Erreur lors de la mise à jour.', 'error');
		} finally {
			this.isSaving = false;
		}
	}
}
