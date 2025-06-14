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

@Component({
	selector: 'app-creation-shooter',
	standalone: true,
	imports: [AutoCompleteModule, FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_shooter.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationShooterComponent {
	constructor(protected commonService: CommonService) {}

	// Variables de création d'un tireur
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	shooterLastName: string = '';
	shooterFirstName: string = '';
	shooterEmail: string = '';
	shooterCompetitionName: string = '';
	shooterClubName: string = '';
	categoryGroups: CategoryGroup[] = [this.createCategoryGroup()];

	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];
	clubs: any[] = [{ name: 'Club de Marennes' }, { name: 'Club de Rochefort' }, { name: 'Club de Pau' }];
	filteredClubs: any[] = [];
	distances: any[] = [{ name: '10 Mètres' }, { name: '25 Mètres' }, { name: '50 Mètres' }];
	filteredDistances: any[] = [];
	weapons: any[] = [
		{ name: 'Arbalète' },
		{ name: 'Carabine' },
		{ name: 'Pistolet' },
		{ name: 'Pistolet Percussion' },
		{ name: 'Pistolet Vitesse' },
	];
	filteredWeapons: any[] = [];
	categories: any[] = [
		{ name: 'Poussin' },
		{ name: 'Minime' },
		{ name: 'Benjamin' },
		{ name: 'Cadet' },
		{ name: 'Junior' },
		{ name: 'Dame 1' },
		{ name: 'Dame 2' },
		{ name: 'Dame 3' },
		{ name: 'Sénior 1' },
		{ name: 'Sénior 2' },
		{ name: 'Sénior 3' },
	];
	filteredCategories: any[] = [];

	/**
	 * Crée et retourne un objet représentant une nouvelle configuration de catégorie de tireur,
	 * avec tous les champs initialisés à `null` ou `false`.
	 *
	 * @returns {CategoryGroup} Un nouvel objet de type CategoryGroup avec des valeurs par défaut.
	 */
	createCategoryGroup(): CategoryGroup {
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
		};
	}

	/**
	 * Ajoute une nouvelle instance de `CategoryGroup` au tableau `categoryGroups`.
	 *
	 * Cette méthode permet à l'utilisateur d'ajouter dynamiquement une catégorie de tir
	 * supplémentaire à l'interface via le bouton d'ajout.
	 */
	addCategoryGroup(): void {
		this.categoryGroups.push(this.createCategoryGroup());
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
		const pattern = /\b(Dame|Sénior)\b/i;
		group.isSeniorOrDame = pattern.test(selectedShooterCategory.value.name || '');
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
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

		if (await this.commonService.createData(this.inputLabelMap)) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}
