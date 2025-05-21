import { Component } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { categories } from '../../assets/data/categories';

interface Category {
	cname: string;
	code: string;
}

@Component({
	selector: 'app-creation',
	standalone: true,
	imports: [AutoCompleteModule, CascadeSelectModule, FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation.component.html',
	styleUrls: ['./creation.component.scss'],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationComponent {
	constructor() {
		this.selectedCategory = { cname: '', code: '' };
	}
	shooterFirstName: string = '';
	shooterLastName: string = '';
	shooterCompetitionName: string = '';
	selectedCategory: Category;
	isSeniorOrDameCategory: boolean = false;
	shooterClubName: string = '';
	scoreSerie1: number = 0;
	scoreSerie2: number = 0;
	scoreSerie3: number = 0;
	scoreSerie4: number = 0;
	scoreSerie5: number = 0;
	scoreSerie6: number = 0;

	competitionDate: string = '';
	competitionName: string = '';
	prixInscription: number = 0;
	prixCategSup: number = 0;

	clubName: string = '';
	categories: any[] = categories;

	competitions: any[] = [{ name: 'Tournoi de Marennes' }, { name: 'Tournoi de Rochefort' }, { name: 'Tournoi de Pau' }];
	filteredCompetitions: any[] = [];

	clubs: any[] = [{ name: 'Club de Marennes' }, { name: 'Club de Rochefort' }, { name: 'Club de Pau' }];
	filteredClubs: any[] = [];

	/**
	 * Filtre les compétitions en fonction de la recherche de compétition entrée.
	 * @param event - L'événement contenant la recherche de compétition entrée.
	 */
	filterCompetition(event: any): void {
		const filtered: any[] = [];
		const query: string = event.query.toLowerCase();

		for (const competition of this.competitions) {
			if (competition.name.toLowerCase().includes(query)) {
				filtered.push(competition);
			}
		}

		this.filteredCompetitions = filtered;
	}

	/**
	 * Filtre les clubs en fonction de la recherche du club entré.
	 * @param event - L'événement contenant la recherche du club entré.
	 */
	filterClub(event: any): void {
		const filtered: any[] = [];
		const query: string = event.query.toLowerCase();

		for (const club of this.clubs) {
			if (club.name.toLowerCase().includes(query)) {
				filtered.push(club);
			}
		}

		this.filteredClubs = filtered;
	}

	/**
	 * Vérifie si la catégorie du tireur contient 'SEN' ou 'DAM' suivi d'un chiffre unique.
	 */
	setIsSeniorOrDameCategory(): void {
		if (this.selectedCategory && this.selectedCategory.code) {
			const categoryCode = this.selectedCategory.code;
			this.isSeniorOrDameCategory = /SEN\d|DAM\d/.test(categoryCode);
		} else {
			this.isSeniorOrDameCategory = false;
		}
	}
}
