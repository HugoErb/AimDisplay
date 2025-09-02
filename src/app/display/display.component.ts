import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';
import { Competition } from '../interfaces/competition';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

declare global {
	interface Window {
		display?: { openRanking: (competitionId: string, competitionName: string) => Promise<void> };
	}
}

@Component({
	selector: 'app-display',
	standalone: true,
	imports: [AutoCompleteModule, FormsModule],
	templateUrl: './display.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DisplayComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService, private router: Router, private location: Location) {}

	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	selectedCompetition: Competition | null = null;
	competitions: any[] = [];
	filteredCompetitions: any[] = [];

	async ngOnInit(): Promise<void> {
		try {
			this.competitions = await this.supabase.getCompetitions();
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
		}
	}

	/**
	 * Permet de lancer l'affichage à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si l'affichage réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que l'affichage est effectué et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	launchDisplay(): void {
		const comp: any = this.selectedCompetition;
		const id = comp?.id;
		const name = (comp?.name ?? '').trim();

		if (!id || !name) {
			this.commonService.showSwalToast('Veuillez sélectionner une compétition.', 'error');
			return;
		}

		// Construire l’URL /ranking/:id/:name (Angular encode le segment pour nous)
		const tree = this.router.createUrlTree(['/ranking', id, name]);
		const url = this.location.prepareExternalUrl(this.router.serializeUrl(tree));

		// Ouvrir dans un nouvel onglet / ou nouvelle fenêtre Electron
		if (window.display?.openRanking) {
			void window.display.openRanking(String(id), String(name)); // Electron (nouvelle BrowserWindow)
		} else {
			window.open(url, '_blank'); // Fallback Web
		}

		// Reset local
		this.commonService.resetInputFields(this.inputFields);
		this.selectedCompetition = null;
	}
}
