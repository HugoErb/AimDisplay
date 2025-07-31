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
		{ id: 1, clubName: 'Les Aiglons de Lyon', clubCity: 'Lyon' },
		{ id: 2, clubName: 'Tireurs Niçois', clubCity: 'Nice' },
		{ id: 3, clubName: 'Archers Toulousains', clubCity: 'Toulouse' },
		{ id: 4, clubName: 'Flèches de Paris', clubCity: 'Paris' },
		{ id: 5, clubName: 'Voltigeurs Bordelais', clubCity: 'Bordeaux' },
		{ id: 6, clubName: 'Élan Strasbourgeois', clubCity: 'Strasbourg' },
		{ id: 7, clubName: 'Sagittaires Marseillais', clubCity: 'Marseille' },
		{ id: 8, clubName: 'Tireurs Nantais', clubCity: 'Nantes' },
		{ id: 9, clubName: 'Compagnie de Lille', clubCity: 'Lille' },
		{ id: 10, clubName: 'Hirondelles Rennaises', clubCity: 'Rennes' },
		{ id: 11, clubName: 'Étoiles Toulon', clubCity: 'Toulon' },
		{ id: 12, clubName: 'Les Caravelles Perpignan', clubCity: 'Perpignan' },
		{ id: 13, clubName: 'Les Hussards Dijon', clubCity: 'Dijon' },
		{ id: 14, clubName: 'Tir Précision Brest', clubCity: 'Brest' },
		{ id: 15, clubName: 'Archers Rouennais', clubCity: 'Rouen' },
		{ id: 16, clubName: 'Sagittaire Clermont', clubCity: 'Clermont-Ferrand' },
		{ id: 17, clubName: 'Les Flèches du Havre', clubCity: 'Le Havre' },
		{ id: 18, clubName: 'Compagnie Poitevine', clubCity: 'Poitiers' },
		{ id: 19, clubName: 'Tireurs Valenciennois', clubCity: 'Valenciennes' },
		{ id: 20, clubName: 'Archers Montpelliérains', clubCity: 'Montpellier' },
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

	displayModifFormModal() {
		this.commonService.showModal('displayModifFormModal');
	}
}
