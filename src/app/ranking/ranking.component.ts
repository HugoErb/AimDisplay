import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
	selector: 'app-display',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './ranking.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RankingComponent {
	currentPage: number = 1;
	totalPages: number = 5;

	// Données d'exemple pour le classement
	classementData = [
		{
			position: 1,
			nom: 'Dupont',
			prenom: 'Martin',
			club: 'Club de Tir Parisien',
			serie1: 9.8,
			serie2: 9.6,
			serie3: 9.9,
			serie4: 9.7,
			serie5: 9.8,
			serie6: 9.5,
			total: 58.3,
		},
		{
			position: 2,
			nom: 'Bernard',
			prenom: 'Sophie',
			club: 'Société de Tir de Lyon',
			serie1: 9.5,
			serie2: 9.7,
			serie3: 9.4,
			serie4: 9.8,
			serie5: 9.6,
			serie6: 9.7,
			total: 57.7,
		},
		{
			position: 3,
			nom: 'Moreau',
			prenom: 'Pierre',
			club: 'Club Olympique de Marseille',
			serie1: 9.3,
			serie2: 9.5,
			serie3: 9.6,
			serie4: 9.4,
			serie5: 9.5,
			serie6: 9.4,
			total: 56.7,
		},
		{
			position: 4,
			nom: 'Leroy',
			prenom: 'Marie',
			club: 'Club de Tir Parisien',
			serie1: 9.2,
			serie2: 9.4,
			serie3: 9.3,
			serie4: 9.5,
			serie5: 9.3,
			serie6: 9.6,
			total: 56.3,
		},
		{
			position: 5,
			nom: 'Petit',
			prenom: 'Jean',
			club: 'Société de Tir de Lyon',
			serie1: 9.1,
			serie2: 9.3,
			serie3: 9.2,
			serie4: 9.3,
			serie5: 9.4,
			serie6: 9.2,
			total: 55.5,
		},
		{
			position: 6,
			nom: 'Roux',
			prenom: 'Claire',
			club: 'Club Olympique de Marseille',
			serie1: 9.0,
			serie2: 9.2,
			serie3: 9.1,
			serie4: 9.2,
			serie5: 9.1,
			serie6: 9.3,
			total: 54.9,
		},
		{
			position: 7,
			nom: 'Blanc',
			prenom: 'Thomas',
			club: 'Club de Tir Parisien',
			serie1: 8.9,
			serie2: 9.1,
			serie3: 9.0,
			serie4: 9.1,
			serie5: 9.0,
			serie6: 9.1,
			total: 54.2,
		},
		{
			position: 8,
			nom: 'Garnier',
			prenom: 'Isabelle',
			club: 'Société de Tir de Lyon',
			serie1: 8.8,
			serie2: 9.0,
			serie3: 8.9,
			serie4: 9.0,
			serie5: 8.9,
			serie6: 9.0,
			total: 53.6,
		},
	];

	getPositionBadge(position: number): string {
		let bgClass = '';
		let text = '';

		switch (position) {
			case 1:
				bgClass = 'bg-yellow-500 text-white';
				text = '1er';
				break;
			case 2:
				bgClass = 'bg-gray-400 text-white';
				text = '2ème';
				break;
			case 3:
				bgClass = 'bg-amber-600 text-white';
				text = '3ème';
				break;
			default:
				bgClass = 'border border-gray-400 text-gray-700';
				text = `${position}ème`;
		}

		return `<span class="px-2 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${bgClass}">${text}</span>`;
	}
}
