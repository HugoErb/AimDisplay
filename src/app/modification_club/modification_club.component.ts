import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Club } from '../interfaces/club';
import { SupabaseService } from '../services/supabase.service';

@Component({
	selector: 'app-modification-club',
	standalone: true,
	imports: [TableModule],
	templateUrl: './modification_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationClubComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService) {}

	clubs: Club[] = [];
	nbRowsPerPage: number = 1;

    async ngOnInit(): Promise<void> {
		try {
			this.clubs = await this.supabase.getClubs();
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
		}
	}

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
	async confirmDeletion(club: Club) {
		const result = await this.commonService.showSwal('Voulez vous vraiment supprimer ce club ?', 'La suppression de ce club entraînera aussi celle de tous les tireurs qui y sont rattachés. La suppression est irréversible.', 'warning', true);
        if (result?.isConfirmed){
            this.deleteClub(club)
        };
	}

    /**
     * Supprime un club côté BDD puis met à jour la liste locale `this.clubs`.
     * 
     * @param {Club} club - L'objet club à supprimer (doit contenir au minimum `id`).
     * @returns {Promise<void>} Une promesse résolue après la suppression et la mise à jour de l'état local.
     */
    async deleteClub(club: Club): Promise<void> {
        try {
            // Suppression en BDD
            await this.supabase.deleteClubById(club.id);

            // Mise à jour locale du tableau (évite un appel réseau)
            this.clubs = this.clubs.filter(c => c.id !== club.id);

        } catch (err: any) {
            this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression du club', 'error');
        }
    }
}
