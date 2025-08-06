import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Club } from '../interfaces/club';

@Component({
	selector: 'app-modification-club',
	standalone: true,
	imports: [TableModule],
	templateUrl: './modification_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationClubComponent {
	constructor(protected commonService: CommonService) {}

	clubs: Club[] = [
		{ id: 1, name: 'Les Aiglons de Lyon', city: 'Lyon' },
		{ id: 2, name: 'Tireurs Niçois', city: 'Nice' },
		{ id: 3, name: 'Archers Toulousains', city: 'Toulouse' },
		{ id: 4, name: 'Flèches de Paris', city: 'Paris' },
		{ id: 5, name: 'Voltigeurs Bordelais', city: 'Bordeaux' },
		{ id: 6, name: 'Élan Strasbourgeois', city: 'Strasbourg' },
		{ id: 7, name: 'Sagittaires Marseillais', city: 'Marseille' },
		{ id: 8, name: 'Tireurs Nantais', city: 'Nantes' },
		{ id: 9, name: 'Compagnie de Lille', city: 'Lille' },
		{ id: 10, name: 'Hirondelles Rennaises', city: 'Rennes' },
		{ id: 11, name: 'Étoiles Toulon', city: 'Toulon' },
		{ id: 12, name: 'Les Caravelles Perpignan', city: 'Perpignan' },
		{ id: 13, name: 'Les Hussards Dijon', city: 'Dijon' },
		{ id: 14, name: 'Tir Précision Brest', city: 'Brest' },
		{ id: 15, name: 'Archers Rouennais', city: 'Rouen' },
		{ id: 16, name: 'Sagittaire Clermont', city: 'Clermont-Ferrand' },
		{ id: 17, name: 'Les Flèches du Havre', city: 'Le Havre' },
		{ id: 18, name: 'Compagnie Poitevine', city: 'Poitiers' },
		{ id: 19, name: 'Tireurs Valenciennois', city: 'Valenciennes' },
		{ id: 20, name: 'Archers Montpelliérains', city: 'Montpellier' },
	];

	nbRowsPerPage: number = 1;

	async ngAfterViewInit() {
		this.nbRowsPerPage = await this.commonService.getNbRowsPerPage();
	}

	/**
	 * Événement déclenché lors du redimensionnement de la fenêtre.
	 * Met à jour dynamiquement le nombre de lignes par page en fonction
	 * de la hauteur de la fenêtre actuelle.
	 *
	 * @param {Event} event - L'événement de redimensionnement (resize) de la fenêtre.
	 */
	@HostListener('window:resize', ['$event'])
	async onResize(event: any) {
		this.nbRowsPerPage = await this.commonService.getNbRowsPerPage();
	}

	/**
	 * Affiche une boîte de dialogue de confirmation avant la suppression d'une ligne.
	 *
	 * @param {Event} event - L'événement déclencheur (clic sur un bouton de suppression).
	 */
	confirmDeletion(event: Event) {
		this.commonService.showSwal('Voulez vous vraiment supprimer cette ligne ?', 'Cette action sera irréversible.', 'warning', true);
	}
}
