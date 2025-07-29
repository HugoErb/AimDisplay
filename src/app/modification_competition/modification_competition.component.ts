import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

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
			competitionName: 'Open de France',
			competitionDate: '05/04/2025 - 06/04/2025',
			competitionPrice: '20',
			competitionSupCategoryPrice: '25',
		},
		{
			id: 2,
			competitionName: 'Tournoi National',
			competitionDate: '15/05/2025 - 16/05/2025',
			competitionPrice: '18',
			competitionSupCategoryPrice: '22',
		},
		{
			id: 3,
			competitionName: 'Championnat Régional',
			competitionDate: '01/06/2025 - 02/06/2025',
			competitionPrice: '12',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 4,
			competitionName: 'Coupe de Printemps',
			competitionDate: '20/03/2025',
			competitionPrice: '10',
			competitionSupCategoryPrice: '12',
		},
		{
			id: 5,
			competitionName: 'Challenge Départemental',
			competitionDate: '28/06/2025',
			competitionPrice: '8',
			competitionSupCategoryPrice: '10',
		},
		{
			id: 6,
			competitionName: 'Circuit Junior',
			competitionDate: '12/07/2025 - 13/07/2025',
			competitionPrice: '5',
			competitionSupCategoryPrice: '7',
		},
		{
			id: 7,
			competitionName: 'Grand Prix d’Été',
			competitionDate: '25/07/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '18',
		},
		{
			id: 8,
			competitionName: 'Open International',
			competitionDate: '10/08/2025 - 12/08/2025',
			competitionPrice: '30',
			competitionSupCategoryPrice: '35',
		},
		{
			id: 9,
			competitionName: 'Coupe d’Automne',
			competitionDate: '05/09/2025',
			competitionPrice: '14',
			competitionSupCategoryPrice: '18',
		},
		{
			id: 10,
			competitionName: 'Championnat National Senior',
			competitionDate: '20/09/2025 - 21/09/2025',
			competitionPrice: '22',
			competitionSupCategoryPrice: '25',
		},
		{
			id: 11,
			competitionName: 'Tournoi de Noël',
			competitionDate: '15/12/2025',
			competitionPrice: '12',
			competitionSupCategoryPrice: '14',
		},
		{
			id: 12,
			competitionName: 'Open des Champions',
			competitionDate: '08/11/2025 - 09/11/2025',
			competitionPrice: '28',
			competitionSupCategoryPrice: '32',
		},
		{
			id: 13,
			competitionName: 'Coupe des Neiges',
			competitionDate: '22/01/2025',
			competitionPrice: '9',
			competitionSupCategoryPrice: '11',
		},
		{
			id: 14,
			competitionName: 'Championnat Départemental',
			competitionDate: '14/04/2025',
			competitionPrice: '11',
			competitionSupCategoryPrice: '13',
		},
		{
			id: 15,
			competitionName: 'Trophée des Étoiles',
			competitionDate: '30/05/2025',
			competitionPrice: '16',
			competitionSupCategoryPrice: '20',
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

	displayModifFormModal() {
		this.commonService.showModal('displayModifFormModal');
	}
}

export interface Competition {
	id: number;
	competitionName: string;
	competitionDate: string;
	competitionPrice: string;
	competitionSupCategoryPrice: string;
}
