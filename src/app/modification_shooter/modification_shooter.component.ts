import { Component, HostListener } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Shooter } from '../interfaces/shooter';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
	selector: 'app-modification-shooter',
	standalone: true,
	imports: [TableModule, CommonModule],
	templateUrl: './modification_shooter.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModificationShooterComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService, private router: Router) {}

	shooters: Shooter[] = [];
	nbRowsPerPage: number = 1;
	isFetchingData: boolean = false;

	async ngOnInit(): Promise<void> {
		try {
			this.isFetchingData = true;
			this.shooters = await this.supabase.getShooters();
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
		} finally {
			this.isFetchingData = false;
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
	 * Redirige l’utilisateur vers la page d’édition d’un tireur, en envoyant le tireur à modifier.
	 *
	 * @param {Shooter} shooter - Le tireur à modifier. Son identifiant (`shooter.id`) est utilisé comme paramètre de route.
	 * @returns {void}
	 */
	goToEditShooter(shooter: Shooter) {
		this.router.navigate(['/creation_shooter', shooter.id], {
			state: { shooter },
		});
	}

	/**
	 * Affiche une boîte de dialogue de confirmation avant la suppression d'une ligne.
	 *
	 * @param {Shooter} shooter - L'objet shooter à supprimer (doit contenir au minimum `id`).
	 */
	async confirmDeletion(shooter: Shooter) {
		const result = await this.commonService.showSwal(
			'Voulez vous vraiment supprimer ce tireur ?',
			'La suppression est irréversible.',
			'warning',
			true
		);
		if (result?.isConfirmed) {
			this.deleteShooter(shooter);
		}
	}

	/**
	 * Supprime un shooter côté BDD puis met à jour la liste locale `this.shooters`.
	 *
	 * @param {Shooter} shooter - L'objet shooter à supprimer (doit contenir au minimum `id`).
	 * @returns {Promise<void>} Une promesse résolue après la suppression et la mise à jour de l'état local.
	 */
	async deleteShooter(shooter: Shooter): Promise<void> {
		try {
			// Suppression en BDD
			await this.supabase.deleteShooterById(shooter.id);

			// Mise à jour locale du tableau (évite un appel réseau)
			this.shooters = this.shooters.filter((s) => s.id !== shooter.id);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression du tireur', 'error');
		}
	}
}
