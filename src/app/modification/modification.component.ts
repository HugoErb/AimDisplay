import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from './../services/common.service';

@Component({
	selector: 'modification',
	standalone: true,
	imports: [TableModule],
	templateUrl: './modification.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationComponent {
	constructor(protected commonService: CommonService) {}

	shooters: Shooter[] = [
		{
			id: 1,
			lastName: 'Martin',
			firstName: 'Lucas',
			competitionName: 'Championnat National',
			clubName: 'Arc Club Paris',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 2,
			lastName: 'Bernard',
			firstName: 'Émilie',
			competitionName: 'Tir Régional',
			clubName: 'Les Flèches de Lyon',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 3,
			lastName: 'Dubois',
			firstName: 'Maxime',
			competitionName: 'Open International',
			clubName: 'Archers de Marseille',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 4,
			lastName: 'Leroy',
			firstName: 'Sophie',
			competitionName: 'Championnat Départemental',
			clubName: 'Tireurs de Lille',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Cadet',
		},
		{
			id: 5,
			lastName: 'Moreau',
			firstName: 'Clara',
			competitionName: 'Tir National',
			clubName: 'Les Archers Nantais',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 6,
			lastName: 'Gautier',
			firstName: 'Théo',
			competitionName: 'Championnat Régional',
			clubName: 'Arc Toulouse',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 7,
			lastName: 'Lopez',
			firstName: 'Laura',
			competitionName: 'Open de France',
			clubName: 'Les Flèches de Bordeaux',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 8,
			lastName: 'Bonnet',
			firstName: 'Gabriel',
			competitionName: 'Tournoi des Champions',
			clubName: 'Archers de Nice',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Cadet',
		},
		{
			id: 9,
			lastName: 'François',
			firstName: 'Julie',
			competitionName: 'Compétition Nationale',
			clubName: 'Les Archers Strasbourgeois',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 10,
			lastName: 'Girard',
			firstName: 'Romain',
			competitionName: 'Tir de Précision',
			clubName: 'Tireurs de Rennes',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 11,
			lastName: 'Perez',
			firstName: 'Emma',
			competitionName: 'Championnat International',
			clubName: 'Arc Club Montpellier',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 12,
			lastName: 'Lemoine',
			firstName: 'Alexandre',
			competitionName: 'Open Régional',
			clubName: 'Les Flèches d Orléans',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 13,
			lastName: 'Picard',
			firstName: 'Camille',
			competitionName: 'Championnat Européen',
			clubName: 'Archers du Havre',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Cadet',
		},
		{
			id: 14,
			lastName: 'Gaillard',
			firstName: 'Antoine',
			competitionName: 'Tir Olympique',
			clubName: 'Les Archers de Reims',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 15,
			lastName: 'Lefebvre',
			firstName: 'Chloé',
			competitionName: 'Compétition Locale',
			clubName: 'Arc Club Saint-Étienne',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 16,
			lastName: 'Perrot',
			firstName: 'Hugo',
			competitionName: 'Tir de Démonstration',
			clubName: 'Les Flèches de Grenoble',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Senior',
		},
		{
			id: 17,
			lastName: 'Daniel',
			firstName: 'Louise',
			competitionName: 'Tir Festif',
			clubName: 'Les Archers d Angers',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Cadet',
		},
		{
			id: 18,
			lastName: 'Cousin',
			firstName: 'Mathieu',
			competitionName: 'Championnat du Monde',
			clubName: 'Archers de Dijon',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Junior',
		},
		{
			id: 19,
			lastName: 'Germain',
			firstName: 'Charlotte',
			competitionName: 'Tir de Loisir',
			clubName: 'Arc Club Toulon',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Dame 1',
		},
		{
			id: 20,
			lastName: 'Moulin',
			firstName: 'Quentin',
			competitionName: 'Tournoi Interscolaire',
			clubName: 'Les Flèches de Rouen',
			distance: '10 Mètres',
			weapon: 'Pistolet Vitesse',
			categoryName: 'Cadet',
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

export interface Shooter {
	id: number;
	lastName: string;
	firstName: string;
	competitionName: string;
	clubName: string;
	distance: string;
	weapon: string;
	categoryName: string;
}
