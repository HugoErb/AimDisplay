import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';

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
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
		},
		{
			id: 1,
			clubName: 'Martin',
			clubCity: 'Marseille',
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
		this.commonService.showSwal('Voulez vous vraiment supprimer cette ligne ?', 'Cette action sera irréversible.', 'warning', true);
	}

	displayModifFormModal() {
		this.commonService.showModal('displayModifFormModal');
	}
}

export interface Club {
	id: number;
	clubName: string;
	clubCity: string;
}
