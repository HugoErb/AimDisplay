import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Competition } from '../interfaces/competition';

@Component({
	selector: 'app-modification-competition',
	standalone: true,
	imports: [TableModule],
	templateUrl: './modification_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationCompetitionComponent {
	constructor(protected commonService: CommonService) {}

	competitions: Competition[] = [
		{
			id: 1,
			name: 'Open de France',
			date: '05/04/2025 - 06/04/2025',
			price: 20,
			supCategoryPrice: 25,
		},
		{
			id: 2,
			name: 'Tournoi National',
			date: '15/05/2025 - 16/05/2025',
			price: 18,
			supCategoryPrice: 22,
		},
		{
			id: 3,
			name: 'Championnat Régional',
			date: '01/06/2025 - 02/06/2025',
			price: 12,
			supCategoryPrice: 15,
		},
		{
			id: 4,
			name: 'Coupe de Printemps',
			date: '20/03/2025',
			price: 10,
			supCategoryPrice: 12,
		},
		{
			id: 5,
			name: 'Challenge Départemental',
			date: '28/06/2025',
			price: 8,
			supCategoryPrice: 10,
		},
		{
			id: 6,
			name: 'Circuit Junior',
			date: '12/07/2025 - 13/07/2025',
			price: 5,
			supCategoryPrice: 7,
		},
		{
			id: 7,
			name: 'Grand Prix d’Été',
			date: '25/07/2025',
			price: 15,
			supCategoryPrice: 18,
		},
		{
			id: 8,
			name: 'Open International',
			date: '10/08/2025 - 12/08/2025',
			price: 30,
			supCategoryPrice: 35,
		},
		{
			id: 9,
			name: 'Coupe d’Automne',
			date: '05/09/2025',
			price: 14,
			supCategoryPrice: 18,
		},
		{
			id: 10,
			name: 'Championnat National Senior',
			date: '20/09/2025 - 21/09/2025',
			price: 22,
			supCategoryPrice: 25,
		},
		{
			id: 11,
			name: 'Tournoi de Noël',
			date: '15/12/2025',
			price: 12,
			supCategoryPrice: 14,
		},
		{
			id: 12,
			name: 'Open des Champions',
			date: '08/11/2025 - 09/11/2025',
			price: 28,
			supCategoryPrice: 32,
		},
		{
			id: 13,
			name: 'Coupe des Neiges',
			date: '22/01/2025',
			price: 9,
			supCategoryPrice: 11,
		},
		{
			id: 14,
			name: 'Championnat Départemental',
			date: '14/04/2025',
			price: 11,
			supCategoryPrice: 13,
		},
		{
			id: 15,
			name: 'Trophée des Étoiles',
			date: '30/05/2025',
			price: 16,
			supCategoryPrice: 20,
		},
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