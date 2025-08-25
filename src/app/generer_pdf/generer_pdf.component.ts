import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { CommonService } from '../services/common.service';
import { CompetitionPDFGenerator } from '../services/competition-pdf-generator.service';
import { ShooterPDFGenerator } from '../services/shooter-pdf-generator.service';
import { SupabaseService } from '../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { Competition } from '../interfaces/competition';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Shooter } from '../interfaces/shooter';
import { TooltipModule } from 'primeng/tooltip';

@Component({
	selector: 'app-generer-pdf',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule, FormsModule, ToggleSwitchModule, TooltipModule],
	templateUrl: './generer_pdf.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenererPDFComponent {
	constructor(
		protected commonService: CommonService,
		private competitionPDFGenerator: CompetitionPDFGenerator,
		private shooterPDFGenerator: ShooterPDFGenerator,
		private supabase: SupabaseService
	) {}

	isSaving: boolean = false;

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();

	// Variables de sélection de tab
	selectedTab: 'competition' | 'tireur' = 'competition';

	//Variables de selection d'entité à exporter
	selectedCompetition: Competition | null = null;
	activateClubInfos: boolean = false;
	selectedShooter: Shooter | null = null;
	selectedShooterCompetition: Competition | null = null;

	// Variables de liste
	competitions: any[] = [];
	filteredCompetitions: any[] = [];
	shooters: any[] = [];
	filteredShooters: any[] = [];
	competitionsByShooterKey: Record<string, Array<{ id: number; name: string }>> = {};
	competitionsForSelectedShooter: Array<{ id: number; name: string }> = [];

	async ngOnInit(): Promise<void> {
		try {
			// 1) on charge TOUT ce qu’il faut pour les 2 onglets
			const [shootersRaw, competitions, entries] = await Promise.all([
				this.supabase.getShooters(), // pour construire la liste "Tireur"
				this.supabase.getCompetitions(), // pour l’onglet "Compétition"
				this.supabase.getAllShooterEntries(), // pour faire la map tireur -> compétitions
			]);

			// 2) normalise & déduplique les tireurs (comme avant)
			const normalize = (s: string = '') =>
				s
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.toLowerCase()
					.trim();

			const mappedShooters = (shootersRaw ?? []).map((s) => {
				const last = (s.lastName ?? '').trim();
				const first = (s.firstName ?? '').trim();
				const fullName = `${last} ${first}`.replace(/\s+/g, ' ').trim();
				return { ...s, lastName: last, firstName: first, fullName, name: fullName };
			});

			const dedup = mappedShooters.filter((shooter, idx, arr) => {
				const key = normalize(shooter.fullName);
				return idx === arr.findIndex((x) => normalize(x.fullName) === key);
			});
			dedup.sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }));
			this.shooters = dedup;

			// 3) la liste "toutes compétitions" pour l’onglet compétition
			this.competitions = competitions ?? [];

			// 4) construit la map tireur -> compétitions à partir des entries
			const keyOf = (s: { lastName: string; firstName: string }) => `${normalize(s.lastName)}|${normalize(s.firstName)}`;

			const compByKey = new Map<string, Map<number, string>>();
			(entries ?? []).forEach((e: any) => {
				const key = keyOf(e);
				if (!compByKey.has(key)) compByKey.set(key, new Map<number, string>());
				compByKey.get(key)!.set(e.competitionId, e.competitionName);
			});

			this.competitionsByShooterKey = {};
			for (const [key, map] of compByKey.entries()) {
				const arr = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
				arr.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
				this.competitionsByShooterKey[key] = arr;
			}
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
			this.commonService.showSwalToast('Erreur lors du chargement des données', 'error');
		}
	}

	/**
	 * Change l'onglet actuellement sélectionné dans l'interface utilisateur.
	 *
	 * @param tab - Le nom de l'onglet à activer, soit 'competition' soit 'tireur'.
	 *              Cela met à jour la propriété `selectedTab` utilisée pour afficher le contenu associé.
	 */
	switchTab(tab: 'competition' | 'tireur') {
		this.selectedTab = tab;
	}

	handleShooterChange(shooter: Shooter | null): void {
		this.selectedShooter = shooter || null;
		this.selectedShooterCompetition = null;

		if (!this.selectedShooter) {
			this.competitionsForSelectedShooter = [];
			return;
		}

		const normalize = (s: string = '') =>
			s
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.trim();
		const key = `${normalize(this.selectedShooter.lastName)}|${normalize(this.selectedShooter.firstName)}`;

		this.competitionsForSelectedShooter = this.competitionsByShooterKey[key] || [];
	}

	/**
	 * Permet de lancer la génération du PDF à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie et le PDF et télécharger sur le PC de l'utilisateur.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async generatePDF(): Promise<void> {
		this.isSaving = true;
		try {
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

			if (await this.commonService.validateInputs(this.inputLabelMap, false)) {
				// Génération de PDF : rapport compétition
				if (this.selectedTab === 'competition') {
					if (!this.selectedCompetition?.id) {
						this.commonService.showSwalToast('Veuillez sélectionner une compétition.', 'error');
						return;
					}
					await this.competitionPDFGenerator.generateCompetitionReport(this.selectedCompetition.id, this.activateClubInfos);

					// reset champs "competition"
					this.commonService.resetInputFields(this.inputFields);
					this.selectedCompetition = null;
				}

				// Génération de PDF : rapport de tireur
				if (this.selectedTab === 'tireur') {
					if (!this.selectedShooter) {
						this.commonService.showSwalToast('Veuillez sélectionner un tireur.', 'error');
						return;
					}

					const shooterKey = this.selectedShooter;
					const competitionId = this.selectedShooterCompetition?.id ?? undefined;

					await this.shooterPDFGenerator.generateShooterReport(shooterKey, competitionId);

					// reset champs "tireur"
					this.commonService.resetInputFields(this.inputFields);
					this.selectedShooter = null;
					this.selectedShooterCompetition = null;
				}
			}
		} catch (e: any) {
			this.commonService.showSwalToast(e?.message ?? 'Erreur lors de la génération du PDF', 'error');
		} finally {
			this.isSaving = false;
		}
	}
}
