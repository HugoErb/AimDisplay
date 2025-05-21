import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'modification',
	standalone: true,
	imports: [TableModule],
	templateUrl: './modification.component.html',
	styleUrls: ['./modification.component.scss'],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationComponent {
	shooters: Shooter[] = [
		{
			id: 1,
			lastName: 'Martin',
			firstName: 'Lucas',
			competitionName: 'Championnat National',
			clubName: 'Arc Club Paris',
			categoryName: 'Senior',
		},
		{
			id: 2,
			lastName: 'Bernard',
			firstName: 'Émilie',
			competitionName: 'Tir Régional',
			clubName: 'Les Flèches de Lyon',
			categoryName: 'Junior',
		},
		{
			id: 3,
			lastName: 'Dubois',
			firstName: 'Maxime',
			competitionName: 'Open International',
			clubName: 'Archers de Marseille',
			categoryName: 'Senior',
		},
		{
			id: 4,
			lastName: 'Leroy',
			firstName: 'Sophie',
			competitionName: 'Championnat Départemental',
			clubName: 'Tireurs de Lille',
			categoryName: 'Cadet',
		},
		{
			id: 5,
			lastName: 'Moreau',
			firstName: 'Clara',
			competitionName: 'Tir National',
			clubName: 'Les Archers Nantais',
			categoryName: 'Junior',
		},
		{
			id: 6,
			lastName: 'Gautier',
			firstName: 'Théo',
			competitionName: 'Championnat Régional',
			clubName: 'Arc Toulouse',
			categoryName: 'Senior',
		},
		{
			id: 7,
			lastName: 'Lopez',
			firstName: 'Laura',
			competitionName: 'Open de France',
			clubName: 'Les Flèches de Bordeaux',
			categoryName: 'Senior',
		},
		{
			id: 8,
			lastName: 'Bonnet',
			firstName: 'Gabriel',
			competitionName: 'Tournoi des Champions',
			clubName: 'Archers de Nice',
			categoryName: 'Cadet',
		},
		{
			id: 9,
			lastName: 'François',
			firstName: 'Julie',
			competitionName: 'Compétition Nationale',
			clubName: 'Les Archers Strasbourgeois',
			categoryName: 'Junior',
		},
		{
			id: 10,
			lastName: 'Girard',
			firstName: 'Romain',
			competitionName: 'Tir de Précision',
			clubName: 'Tireurs de Rennes',
			categoryName: 'Senior',
		},
		{
			id: 11,
			lastName: 'Perez',
			firstName: 'Emma',
			competitionName: 'Championnat International',
			clubName: 'Arc Club Montpellier',
			categoryName: 'Junior',
		},
		{
			id: 12,
			lastName: 'Lemoine',
			firstName: 'Alexandre',
			competitionName: 'Open Régional',
			clubName: 'Les Flèches d Orléans',
			categoryName: 'Senior',
		},
		{
			id: 13,
			lastName: 'Picard',
			firstName: 'Camille',
			competitionName: 'Championnat Européen',
			clubName: 'Archers du Havre',
			categoryName: 'Cadet',
		},
		{
			id: 14,
			lastName: 'Gaillard',
			firstName: 'Antoine',
			competitionName: 'Tir Olympique',
			clubName: 'Les Archers de Reims',
			categoryName: 'Senior',
		},
		{
			id: 15,
			lastName: 'Lefebvre',
			firstName: 'Chloé',
			competitionName: 'Compétition Locale',
			clubName: 'Arc Club Saint-Étienne',
			categoryName: 'Junior',
		},
		{
			id: 16,
			lastName: 'Perrot',
			firstName: 'Hugo',
			competitionName: 'Tir de Démonstration',
			clubName: 'Les Flèches de Grenoble',
			categoryName: 'Senior',
		},
		{
			id: 17,
			lastName: 'Daniel',
			firstName: 'Louise',
			competitionName: 'Tir Festif',
			clubName: 'Les Archers d Angers',
			categoryName: 'Cadet',
		},
		{
			id: 18,
			lastName: 'Cousin',
			firstName: 'Mathieu',
			competitionName: 'Championnat du Monde',
			clubName: 'Archers de Dijon',
			categoryName: 'Junior',
		},
		{
			id: 19,
			lastName: 'Germain',
			firstName: 'Charlotte',
			competitionName: 'Tir de Loisir',
			clubName: 'Arc Club Toulon',
			categoryName: 'Senior',
		},
		{
			id: 20,
			lastName: 'Moulin',
			firstName: 'Quentin',
			competitionName: 'Tournoi Interscolaire',
			clubName: 'Les Flèches de Rouen',
			categoryName: 'Cadet',
		},
	];

	nbRowsPerPage = 11;

	//   confirmDeletion(event: Event) {
	//     this.confirmationService.confirm({
	//       target: event.target as EventTarget,
	//       message:
	//         'Attention, cela est irréversible. Voulez vous vraiment supprimer cette ligne ?',
	//       header: 'Confirmation de suppression',
	//       icon: 'fa-solid fa-triangle-exclamation confirm-dialog-icon',
	//       acceptIcon: 'none',
	//       rejectIcon: 'none',
	//       acceptLabel: 'Oui',
	//       rejectLabel: 'Non',
	//       rejectButtonStyleClass: 'p-button-text',
	//       accept: () => {
	//         this.messageService.add({
	//           severity: 'info',
	//           summary: 'Confirmed',
	//           detail: 'Ligne supprimée',
	//         });
	//       },
	//       reject: () => {},
	//     });
	//   }
}

export interface Shooter {
    id: number;
    lastName: string;
    firstName: string;
    competitionName: string;
    clubName: string;
    categoryName: string;
}
