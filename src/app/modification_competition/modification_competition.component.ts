import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Competition } from '../interfaces/competition';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr-FR');

@Component({
	selector: 'app-modification-competition',
	standalone: true,
	imports: [TableModule, CommonModule, CurrencyPipe],
	templateUrl: './modification_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationCompetitionComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService) {}

	competitions: Competition[] = [];
	nbRowsPerPage: number = 1;

	async ngOnInit(): Promise<void> {
		try {
			this.competitions = await this.supabase.getCompetitions();
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
	 * @param {Competition} competition - L'objet competition à supprimer (doit contenir au minimum `id`).
	 */
	async confirmDeletion(competition: Competition) {
		const result = await this.commonService.showSwal(
			'Voulez vous vraiment supprimer cette competition ?',
			'La suppression de cette competition entraînera aussi celle de tous les tireurs qui y sont rattachés. La suppression est irréversible.',
			'warning',
			true
		);
		if (result?.isConfirmed) {
			this.deleteCompetition(competition);
		}
	}

	/**
	 * Supprime une competition côté BDD puis met à jour la liste locale `this.competitions`.
	 *
	 * @param {Competition} competition - L'objet competition à supprimer (doit contenir au minimum `id`).
	 * @returns {Promise<void>} Une promesse résolue après la suppression et la mise à jour de l'état local.
	 */
	async deleteCompetition(competition: Competition): Promise<void> {
		try {
			// Suppression en BDD
			await this.supabase.deleteCompetitionById(competition.id);

			// Mise à jour locale du tableau (évite un appel réseau)
			this.competitions = this.competitions.filter((c) => c.id !== competition.id);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression de la competition.', 'error');
		}
	}
}
