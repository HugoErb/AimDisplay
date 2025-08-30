import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { CategoryGroup } from '../interfaces/category-group';
import { SupabaseService } from '../services/supabase.service';
import { Club } from '../interfaces/club';
import { ShooterCategory } from '../interfaces/shooter-category';
import { Weapon } from '../interfaces/weapon';
import { Distance } from '../interfaces/distance';
import { Competition } from '../interfaces/competition';
import { Shooter } from '../interfaces/shooter';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
	selector: 'app-creation-shooter',
	standalone: true,
	imports: [AutoCompleteModule, FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_shooter.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationShooterComponent {
	constructor(
		protected commonService: CommonService,
		private supabase: SupabaseService,
		private route: ActivatedRoute,
		private location: Location
	) {}

	isSaving: boolean = false;

	// Variables de récupération des champs du formulaire
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();

	// Variables de création d'un tireur
	shooterLastName: string = '';
	shooterFirstName: string = '';
	shooterEmail: string = '';
	shooterCompetitionName: string | Competition = '';
	shooterClubName: string | Club = '';
	categoryGroups: CategoryGroup[] = [this.createCategoryGroup()];

	// Variables de récupération des données depuis la BDD
	competitions: Competition[] = [];
	clubs: Club[] = [];
	weapons: Weapon[] = [];
	distances: Distance[] = [];
	shooterCategories: ShooterCategory[] = [];

	// Variables filtrées de récupération des données depuis la BDD
	filteredCompetitions: Competition[] = [];
	filteredClubs: Club[] = [];
	filteredWeapons: Weapon[] = [];
	filteredDistances: Distance[] = [];
	filteredShooterCategories: ShooterCategory[] = [];

	// Variables de modification d'un tireur
	isEditMode = false;
	editingShooter: Shooter | null = null;

	async ngOnInit(): Promise<void> {
		try {
			const [distances, weapons, categories, clubs, competitions] = await Promise.all([
				this.supabase.getDistances(),
				this.supabase.getWeapons(),
				this.supabase.getCategories(),
				this.supabase.getClubs(),
				this.supabase.getCompetitions(),
			]);

			this.distances = distances;
			this.weapons = weapons;
			this.shooterCategories = categories;
			this.clubs = clubs;
			this.competitions = competitions;

			const idParam = this.route.snapshot.paramMap.get('id');
			const isEditRequested = idParam !== null;

			if (isEditRequested) {
				const id = Number(idParam);
				const shooterFromState = history.state?.shooter as Shooter | undefined;

				if (shooterFromState && Number.isFinite(id) && shooterFromState.id === id) {
					this.isEditMode = true;
					this.editingShooter = shooterFromState;
					this.fillFormFromShooter(shooterFromState); // préremplit tous les champs
				} else {
					this.commonService.showSwalToast("Impossible d'ouvrir l'édition du tireur (données manquantes).", 'error');
					this.location.back();
				}
			}
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
		}
	}

	/**
	 * Crée et retourne un objet représentant une nouvelle configuration de catégorie de tireur,
	 * avec tous les champs initialisés à `null` ou `false`.
	 *
	 * @returns {CategoryGroup} Un nouvel objet de type CategoryGroup avec des valeurs par défaut.
	 */
	createCategoryGroup(partial: Partial<CategoryGroup> = {}): CategoryGroup {
		return {
			shooterDistance: null,
			shooterWeapon: null,
			shooterCategory: null,
			scoreSerie1: null,
			scoreSerie2: null,
			scoreSerie3: null,
			scoreSerie4: null,
			scoreSerie5: null,
			scoreSerie6: null,
			isSeniorOrDame: false,
			_open: true, // visible par défaut (édition)
			...partial,
		};
	}

	/**
	 * Ajoute une nouvelle instance de `CategoryGroup` au tableau `categoryGroups`.
	 *
	 * Cette méthode permet à l'utilisateur d'ajouter dynamiquement une catégorie de tir
	 * supplémentaire à l'interface via le bouton d'ajout.
	 */
	addCategoryGroup(): void {
		if (this.isEditMode) return; // pas d'ajout en édition
		const newGroup = this.createCategoryGroup({ _open: false });
		this.categoryGroups.push(newGroup);
		setTimeout(() => (newGroup._open = true)); // 0fr -> 1fr + fade-in
	}

	/**
	 * Détermine si la catégorie sélectionnée correspond à un tireur de type "Dame" ou "Sénior"
	 * et met à jour dynamiquement le champ `isSeniorOrDame` dans le groupe de catégories.
	 *
	 * Cette méthode est appelée lors de la sélection d'une catégorie via l'autocomplétion.
	 * Elle permet de conditionner l'affichage des séries 5 et 6 uniquement pour ces catégories.
	 *
	 * @param selectedShooterCategory - L'événement déclenché par la sélection, contenant la propriété `value.name`
	 * @param group - Le groupe de saisie auquel appartient la catégorie sélectionnée
	 */
	onCategorySelected(selectedShooterCategory: any, group: CategoryGroup): void {
		const rawName =
			selectedShooterCategory?.value?.name ?? // event PrimeNG
			selectedShooterCategory?.name ?? // objet direct { name: ... }
			selectedShooterCategory ?? // string directe
			'';

		const normalizedName = String(rawName)
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, ''); // retire les accents

		const pattern = /\b(dame|senior)\b/;
		group.isSeniorOrDame = pattern.test(normalizedName);
	}

	/**
	 * Soumet le formulaire du tireur automatiquement entre création et édition selon l’état courant.
	 *
	 * @returns {Promise<void>} Promesse résolue lorsque l’opération (création ou mise à jour) est terminée.
	 */
	async onSubmitShooter(): Promise<void> {
		try {
			this.isSaving = true;

			// Validation des champs
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
			const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
			if (!areInputsValid) {
				this.isSaving = false;
				return;
			}

			const last = (this.shooterLastName ?? '').trim();
			const first = (this.shooterFirstName ?? '').trim();
			const competitionName =
				typeof this.shooterCompetitionName === 'string' ? this.shooterCompetitionName : this.shooterCompetitionName?.name ?? '';
			const competitionId = this.getIdFromSelection(this.shooterCompetitionName, this.competitions);
            const clubId = this.getIdFromSelection(this.shooterClubName, this.clubs);

			// Vérification anti-doublon pour CHAQUE groupe demandé
			for (const group of this.categoryGroups) {
				const exists = await this.supabase.existsShooterDuplicate({
					lastName: last,
					firstName: first,
					clubId,
					competitionId,
					categoryId: group.shooterCategory?.id,
					distanceId: group.shooterDistance?.id,
					weaponId: group.shooterWeapon?.id,
					currentId: this.isEditMode ? this.editingShooter?.id : undefined,
				});

				if (exists) {
					const result = await this.commonService.showSwal(
						'Tireur déjà inscrit',
						`${last} ${first} est déjà inscrit(e) dans la compétition "${competitionName}" dans la catégorie ` +
							`${group.shooterDistance?.name} - ${group.shooterWeapon?.name} - ${group.shooterCategory?.name}.` +
							`\n\nVoulez-vous tout de même enregistrer ce nouveau tireur ?`,
						'warning',
						true
					);

					if (!result.isConfirmed) {
						this.isSaving = false;
						return;
					}
				}
			}

			if (this.isEditMode) {
				await this.updateShooter();
			} else {
				await this.createShooter();
			}
		} catch (e: any) {
			this.commonService.showSwalToast(e?.message ?? 'Erreur lors de la validation du formuulaire du tireur', 'error');
		} finally {
			this.isSaving = false;
		}
	}

	/**
	 * Permet de créer un tireur à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async createShooter(): Promise<void> {
		try {
			// Données communes (en-tête du formulaire)
			const shooterLastName = this.shooterLastName?.trim();
			const shooterFirstName = this.shooterFirstName?.trim();
			const shooterEmail = (this.shooterEmail ?? '').trim() || null;
			const competitionId = this.getIdFromSelection(this.shooterCompetitionName, this.competitions);
			const clubId = this.getIdFromSelection(this.shooterClubName, this.clubs);

			if (!competitionId || !clubId) {
				this.commonService.showSwalToast('Veuillez sélectionner un club et une compétition valides.', 'error');
				return;
			}

			// Pour chaque catégorie remplie => une création en BDD
			for (const categoryGroup of this.categoryGroups) {
				const distanceId = this.getIdFromSelection(categoryGroup.shooterDistance, this.distances);
				const weaponId = this.getIdFromSelection(categoryGroup.shooterWeapon, this.weapons);
				const categoryId = this.getIdFromSelection(categoryGroup.shooterCategory, this.shooterCategories);

				// Sauter les groupes incomplets (évite une erreur côté service)
				if (!distanceId || !weaponId || !categoryId) continue;

				// Scores des séries
				const seriesScores: (number | null)[] = [
					categoryGroup.scoreSerie1 != null ? categoryGroup.scoreSerie1 : null,
					categoryGroup.scoreSerie2 != null ? categoryGroup.scoreSerie2 : null,
					categoryGroup.scoreSerie3 != null ? categoryGroup.scoreSerie3 : null,
					categoryGroup.scoreSerie4 != null ? categoryGroup.scoreSerie4 : null,
					categoryGroup.isSeniorOrDame ? (categoryGroup.scoreSerie5 != null ? categoryGroup.scoreSerie5 : null) : null,
					categoryGroup.isSeniorOrDame ? (categoryGroup.scoreSerie6 != null ? categoryGroup.scoreSerie6 : null) : null,
				];

				await this.supabase.createShooter({
					shooterLastName,
					shooterFirstName,
					shooterEmail,
					competitionId,
					clubId,
					distanceId,
					weaponId,
					categoryId,
					seriesScores,
				});
			}

			// Reset de tous les champs
			this.commonService.resetInputFields(this.inputFields);
			this.shooterCompetitionName = '';
			this.shooterClubName = '';
			this.categoryGroups = [
				{
					shooterDistance: '',
					shooterWeapon: '',
					shooterCategory: '',
					scoreSerie1: null,
					scoreSerie2: null,
					scoreSerie3: null,
					scoreSerie4: null,
					scoreSerie5: null,
					scoreSerie6: null,
					isSeniorOrDame: false,
					_open: true,
				},
			];

			this.commonService.showSwalToast('Tireur créé avec succès.');
		} catch (e: any) {
			this.commonService.showSwalToast(e?.message ?? 'Erreur lors de la création du tireur', 'error');
		}
	}

	/**
	 * Pré-remplit le formulaire d’édition à partir d’un objet `Shooter`.
	 *
	 * @param shooter  Tireur source (provenant de la BDD) dont on souhaite éditer les informations.
	 */
	private fillFormFromShooter(shooter: Shooter): void {
		this.shooterLastName = shooter.lastName ?? '';
		this.shooterFirstName = shooter.firstName ?? '';
		this.shooterEmail = shooter.email ?? '';

		// AutoComplete : on tente de retrouver l’objet par son nom (sinon on met le string)
		const findByName = <T extends { id: number; name: string }>(name: string, list: T[]): T | string =>
			list?.find((x) => x.name === name) ?? (name || '');

		this.shooterClubName = findByName(shooter.clubName, this.clubs);
		this.shooterCompetitionName = findByName(shooter.competitionName, this.competitions);

		const distanceObj = findByName(shooter.distance, this.distances);
		const weaponObj = findByName(shooter.weapon, this.weapons);
		const categoryObj = findByName(shooter.categoryName, this.shooterCategories);

		const isSeniorOrDame = /\b(Dame|Sénior)\b/i.test(shooter.categoryName || '');

		this.categoryGroups = [
			{
				shooterDistance: distanceObj,
				shooterWeapon: weaponObj,
				shooterCategory: categoryObj,
				scoreSerie1: shooter.scoreSerie1 ?? null,
				scoreSerie2: shooter.scoreSerie2 ?? null,
				scoreSerie3: shooter.scoreSerie3 ?? null,
				scoreSerie4: shooter.scoreSerie4 ?? null,
				scoreSerie5: shooter.scoreSerie5 ?? null,
				scoreSerie6: shooter.scoreSerie6 ?? null,
				isSeniorOrDame,
				_open: false,
			},
		];

		// Affichage série 5/6 si Dame/Senior
		this.onCategorySelected({ value: this.categoryGroups[0].shooterCategory }, this.categoryGroups[0]);
	}

	/**
	 * Met à jour le tireur sélectionné (mode édition) à partir des champs du formulaire.
	 * Effectue d'abord la validation des inputs, puis si la mise à jour réussit,
	 * redirige vers l'écran de modification (liste) des tireurs.
	 *
	 * @returns {Promise<void>} Promesse résolue une fois la mise à jour effectuée.
	 */
	async updateShooter(): Promise<void> {
		try {
			if (!this.editingShooter?.id) {
				throw new Error('Aucun tireur sélectionné pour la modification.');
			}

			// Données communes (en-tête du formulaire)
			const trimmedLastName = (this.shooterLastName ?? '').trim();
			const trimmedFirstName = (this.shooterFirstName ?? '').trim();
			const nullableEmail = (this.shooterEmail ?? '').trim() || null;

			if (!trimmedLastName || !trimmedFirstName) {
				throw new Error('Les champs "Nom" et "Prénom" sont obligatoires.');
			}

			// Résolution des IDs depuis les autocomplètes (objet ou string)
			const clubId = this.getIdFromSelection(this.shooterClubName, this.clubs);
			const competitionId = this.getIdFromSelection(this.shooterCompetitionName, this.competitions);

			if (!clubId || !competitionId) {
				throw new Error('Veuillez sélectionner un club et une compétition valides.');
			}

			// En édition on ne modifie qu’un seul groupe (la 1ère entrée)
			const group = this.categoryGroups?.[0];
			if (!group) throw new Error('Aucun groupe catégorie disponible pour la modification.');

			const distanceId = this.getIdFromSelection(group.shooterDistance, this.distances);
			const weaponId = this.getIdFromSelection(group.shooterWeapon, this.weapons);
			const categoryId = this.getIdFromSelection(group.shooterCategory, this.shooterCategories);

			if (!distanceId || !weaponId || !categoryId) {
				throw new Error('Veuillez sélectionner une distance, une arme et une catégorie valides.');
			}

			// Détermine si la catégorie est "Dame" ou "Sénior" (on accepte Senior/Sénior)
			const selectedCategoryName = typeof group.shooterCategory === 'object' ? group.shooterCategory?.name ?? '' : group.shooterCategory ?? '';
			const isSeniorOrDame = /\b(Dame|S[ée]nior)\b/i.test(selectedCategoryName);

			// Séries → nombre ou null (jamais 0 par défaut)
			const toNullableNumber = (v: any): number | null => (typeof v === 'number' && isFinite(v) ? v : null);

			const serie1Score = toNullableNumber(group.scoreSerie1);
			const serie2Score = toNullableNumber(group.scoreSerie2);
			const serie3Score = toNullableNumber(group.scoreSerie3);
			const serie4Score = toNullableNumber(group.scoreSerie4);
			const serie5Score = isSeniorOrDame ? toNullableNumber(group.scoreSerie5) : null;
			const serie6Score = isSeniorOrDame ? toNullableNumber(group.scoreSerie6) : null;

			// Appel service (implémente updateShooterById côté Supabase : mapping colonnes BDD)
			await this.supabase.updateShooterById(this.editingShooter.id, {
				lastName: trimmedLastName,
				firstName: trimmedFirstName,
				email: nullableEmail,
				clubId,
				competitionId,
				distanceId,
				weaponId,
				categoryId,
				serie1Score,
				serie2Score,
				serie3Score,
				serie4Score,
				serie5Score,
				serie6Score,
			});

			// Redirection
			this.commonService.redirectTo('modification_shooter');
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la mise à jour du tireur', 'error');
		}
	}

	/**
	 * Extrait l’`id` d’une sélection issue d’un composant (ex. `p-autoComplete`).
	 *
	 * @param selection Valeur renvoyée par le champ (objet sélectionné, libellé string, ou rien).
	 * @param list      Liste de référence permettant, si besoin, de retrouver l’objet à partir du `name`.
	 * @returns         L’identifiant numérique si trouvé, sinon `undefined`.
	 */
	private getIdFromSelection<T extends { id: number; name: string }>(selection: any, list: T[]): number | undefined {
		if (!selection) return undefined;
		if (typeof selection === 'object' && 'id' in selection) return selection.id as number;
		if (typeof selection === 'string') return list.find((item) => item.name === selection)?.id;
		return undefined;
	}
}
