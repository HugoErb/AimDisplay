import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'modification',
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
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 2,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 3,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 4,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 5,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 6,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 7,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 8,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 9,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 10,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 11,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 12,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 13,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 14,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 15,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 16,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 17,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 18,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 19,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
		{
			id: 20,
			competitionName: 'Championnat National',
			competitionDate: '12/03/2025 - 13/03/2025',
			competitionPrice: '15',
			competitionSupCategoryPrice: '15',
		},
	];
	nbRowsPerPage = 10;

	ngOnInit(): void {
		this.nbRowsPerPage = this.commonService.getNbRowsPerPage(window.innerHeight);
	}

	/**
	 * Événement déclenché lors du redimensionnement de la fenêtre.
	 * Met à jour dynamiquement le nombre de lignes par page en fonction
	 * de la hauteur de la fenêtre actuelle.
	 *
	 * @param {Event} event - L'événement de redimensionnement (resize) de la fenêtre.
	 */
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.nbRowsPerPage = this.commonService.getNbRowsPerPage(event.target.innerHeight);
	}

	/**
	 * Affiche une boîte de dialogue de confirmation avant la suppression d'une ligne.
	 *
	 * @param {Event} event - L'événement déclencheur (clic sur un bouton de suppression).
	 */
	confirmDeletion(event: Event) {
		this.commonService.showSwal('Voulez vous vraiment supprimer cette ligne ?', 'Cette action sera irréversible.', 'warning');
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
