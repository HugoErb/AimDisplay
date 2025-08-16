import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { CommonService } from '../services/common.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { SupabaseService } from '../services/supabase.service';
import { Shooter } from '../interfaces/shooter';
import { Competition } from '../interfaces/competition';
type ShooterWithFullName = Shooter & { fullName: string };

@Component({
	selector: 'app-generer-pdf',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './generer_pdf.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenererPDFComponent {
	constructor(protected commonService: CommonService, private pdfGeneratorService: PdfGeneratorService, private supabase: SupabaseService) {}

	// Variables de création d'un club
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();

	// Variables de sélection de tab
	selectedTab: 'competition' | 'tireur' = 'competition';

	//Variables de selection d'entité à exporter
	selectedCompetition: Competition | null = null;
	selectedShooterName: { name: string } | null = null;
	selectedShooterCompetitionName: { name: string } | null = null;

	// Variables de liste
	competitions: any[] = [];
	filteredCompetitions: any[] = [];
	shooters: any[] = [];
	filteredShooters: any[] = [];

	async ngOnInit(): Promise<void> {
		try {
			const [shooters, competitions] = await Promise.all([this.supabase.getShooters(), this.supabase.getCompetitions()]);

			// Création du tableau avec trim
			const mappedShooters = (shooters ?? []).map((s) => {
				const fullName = `${s.lastName} ${s.firstName}`.trim();
				return { ...s, fullName, name: fullName };
			});

			// Suppression des doublons par fullName
			this.shooters = mappedShooters.filter((shooter, index, self) => index === self.findIndex((s) => s.fullName === shooter.fullName));

			this.competitions = competitions;
		} catch (err) {
			console.error('Erreur lors du chargement des données :', err);
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

	/**
	 * Permet de lancer la génération du PDF à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie et le PDF et télécharger sur le PC de l'utilisateur.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async generatePDF(): Promise<void> {
		try {
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);

			if (await this.commonService.validateInputs(this.inputLabelMap, false)) {
				if (this.selectedTab === 'competition') {
					if (!this.selectedCompetition?.id) {
						this.commonService.showSwalToast('Veuillez sélectionner une compétition.', 'error');
						return;
					}
					await this.pdfGeneratorService.generateCompetitionReport(this.selectedCompetition?.id);
				}
				this.commonService.resetInputFields(this.inputFields);
			}
		} catch (e: any) {
			this.commonService.showSwalToast(e?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}
}
