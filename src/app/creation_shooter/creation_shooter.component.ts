import { Component } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-creation',
	standalone: true,
	imports: [AutoCompleteModule, FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_shooter.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationShooterComponent {
	constructor(protected commonService: CommonService) {}

	// Variables de création d'un tireur
	shooterFirstName: string = '';
	shooterLastName: string = '';
	shooterEmail: string = '';
	shooterCompetitionName: string = '';
	shooterDistance: string = '';
	shooterWeapon: string = '';
	shooterCategory: any = [];
	isSeniorOrDameCategory: boolean = false;
	shooterClubName: string = '';
	scoreSerie1: number = 0;
	scoreSerie2: number = 0;
	scoreSerie3: number = 0;
	scoreSerie4: number = 0;
	scoreSerie5: number = 0;
	scoreSerie6: number = 0;

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
	 * Filtre un tableau d'éléments par leur nom en fonction d'une requête saisie par l'utilisateur.
	 *
	 * @param event - L'événement contenant la requête de recherche (event.query).
	 * @param sourceList - Le tableau source à filtrer.
	 * @returns Un tableau contenant les éléments filtrés.
	 */
	filter(event: any, sourceList: any[], target: string): void {
		(this as any)[target] = sourceList.filter((item: any) => item.name.toLowerCase().includes(event.query.toLowerCase()));
	}
	filterCompetition = (e: any) => this.filter(e, this.competitions, 'filteredCompetitions');
	filterClub = (e: any) => this.filter(e, this.clubs, 'filteredClubs');
	filterDistance = (e: any) => this.filter(e, this.distances, 'filteredDistances');
	filterWeapon = (e: any) => this.filter(e, this.weapons, 'filteredWeapons');
	filterCategory = (e: any) => this.filter(e, this.categories, 'filteredCategories');

	/**
	 * Vérifie si une catégorie de tireur correspond à "Dame" ou "Sénior".
	 * Si c'est le cas, on passe le booléen isSeniorOrDameCategory à true.
	 *
	 * @param shooterCategory - La catégorie du tireur (ex: "Sénior 1", "Cadet Dame").
	 * @returns `true` si la catégorie contient "Dame" ou "Sénior", sinon `false`.
	 */
	checkIfSeniorOrDame(shooterCategory: any): void {
		console.log(shooterCategory.name);
		const pattern = /\b(Dame|Sénior)\b/i;
		this.isSeniorOrDameCategory = pattern.test(shooterCategory.name || '');
		console.log('isSeniorOrDameCategory:', this.isSeniorOrDameCategory);
	}
}
