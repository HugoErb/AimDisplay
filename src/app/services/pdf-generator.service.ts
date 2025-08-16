import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { SupabaseService } from './supabase.service';
import { CommonService } from './common.service';
import { Shooter } from '../interfaces/shooter';

const vfsAny: any = (pdfFonts as any).vfs ?? (pdfFonts as any).default?.vfs ?? (pdfFonts as any);
(pdfMake as any).vfs = vfsAny;

// Cellule de tableau minimaliste
type Cell = {
	text: string;
	style?: string;
	alignment?: 'left' | 'right' | 'center' | 'justify';
};

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
	constructor(private supabase: SupabaseService, private commonService: CommonService) {}

	/**
	 * Génère un PDF "Classement NOM COMPETITION" en orientation paysage.
	 * - Regroupe par triplet (arme, distance, catégorie)
	 * - Trie chaque groupe par score total décroissant
	 * - Construit un PDF avec un tableau par groupe
	 */
	async generateCompetitionReport(competitionId: number): Promise<void> {
		try {
			if (!competitionId) {
				this.commonService.showSwalToast('Compétition invalide.', 'error');
				return;
			}

			// 1) Récupère les tireurs (garde ton implémentation actuelle)
			const allShooters = await this.supabase.getShooters();
			const shooters: Shooter[] = (allShooters ?? []).filter(Boolean);

			if (!shooters.length) {
				this.commonService.showSwalToast('Aucun tireur trouvé pour cette compétition.', 'info');
				return;
			}

			// Titre dynamique (nom de la compétition)
			const competitionTitle = (shooters[0]?.competitionName ?? '').toString().trim() || 'Compétition';

			// 2) Regroupe par (arme, distance, catégorie)
			const groupMap = new Map<string, Shooter[]>();
			for (const s of shooters) {
				const key = this.makeGroupKey(s);
				if (!groupMap.has(key)) groupMap.set(key, []);
				groupMap.get(key)!.push(s);
			}

			// 3) Contenu PDF
			const content: Content[] = [];

			// En-tête (sans "Généré le ...")
			content.push({
				text: `Classement ${competitionTitle}`,
				style: 'h1',
				margin: [0, 0, 0, 12],
			});

			// Un tableau par groupe
			for (const [, list] of groupMap.entries()) {
				if (!list.length) continue;

				const groupTitle = this.makeGroupLabelFromRow(list[0]);
				const sorted = [...list].sort((a, b) => (b?.totalScore ?? 0) - (a?.totalScore ?? 0));

				content.push(this.buildGroupBlock(groupTitle, sorted));
			}

			const docDefinition: TDocumentDefinitions = {
				pageSize: 'A4',
				pageOrientation: 'landscape',
				pageMargins: [40, 60, 40, 60],
				content,
				styles: {
					h1: { fontSize: 16, bold: true },
					subtitle: { fontSize: 9, color: '#666' },
					h2: { fontSize: 13, bold: true },
					th: { bold: true, fillColor: '#f3f4f6', margin: [0, 5, 0, 5] },
					td: { margin: [0, 4, 0, 4] },
				},
				defaultStyle: { fontSize: 10 },
				footer: (currentPage: number, pageCount: number) => ({
					text: `${currentPage} / ${pageCount}`,
					alignment: 'right',
					margin: [0, 0, 40, 20],
					fontSize: 8,
				}),
			};

			// 4) Nom de fichier: "Classement NOM COMPETITION.pdf"
			const safeTitle = competitionTitle
				.replace(/[\\/:*?"<>|]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			const fileName = `Classement ${safeTitle}.pdf`;

			pdfMake.createPdf(docDefinition).download(fileName); // téléchargement avec nom demandé
			this.commonService.showSwalToast('PDF généré.', 'success');
		} catch (err: any) {
			console.error('Erreur PDF:', err);
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}

	// ———————————————————————————————————————————————
	// Bloc d’un groupe (arme • distance • catégorie)
	// ———————————————————————————————————————————————
	private buildGroupBlock(title: string, rows: Shooter[]): Content {
		// En-tête sans Distance/Arme
		const header: Cell[] = [
			{ text: 'Rang', style: 'th', alignment: 'center' },
			{ text: 'Nom', style: 'th' },
			{ text: 'Prénom', style: 'th' },
			{ text: 'Club', style: 'th' },
			{ text: 'Score total', style: 'th', alignment: 'right' },
		];

		const body: Cell[][] = [header];

		rows.forEach((s, idx) => {
			const rank = idx + 1;
			body.push([
				{ text: String(rank), style: 'td', alignment: 'center' },
				{ text: s.lastName ?? '', style: 'td' },
				{ text: s.firstName ?? '', style: 'td' },
				{ text: s.clubName ?? '', style: 'td' },
				{ text: this.formatScore(s.totalScore), style: 'td', alignment: 'right' },
			]);
		});

		return {
			// <-- tient Titre + Tableau ensemble : si ça ne tient pas,
			// l’ensemble passe à la page suivante (fini le mini-tableau)
			unbreakable: true,
			stack: [
				{ text: title, style: 'h2', margin: [0, 10, 0, 6] },
				{
					table: {
						headerRows: 1,
						widths: [35, '*', '*', '*', 90],
						body,
					},
					layout: {
						hLineColor: '#e5e7eb',
						vLineColor: '#e5e7eb',
						paddingLeft: () => 6,
						paddingRight: () => 6,
						paddingTop: () => 4,
						paddingBottom: () => 4,
					},
				},
			],
			// espace sous le bloc avant la catégorie suivante
			margin: [0, 0, 0, 24],
		};
	}

	// ———————————————————————————————————————————————
	// Helpers de regroupement/formatage
	// ———————————————————————————————————————————————
	private makeGroupKey(s: Shooter): string {
		const weapon = (s.weapon ?? '').toString().trim().toLowerCase();
		const distance = (s.distance ?? '').toString().trim().toLowerCase();
		const category = (s.categoryName ?? '').toString().trim().toLowerCase();
		return `${weapon}||${distance}||${category}`;
	}

	private makeGroupLabelFromRow(s: Shooter): string {
		const weapon = (s.weapon ?? '—').toString().trim();
		const distance = (s.distance ?? '—').toString().trim();
		const category = (s.categoryName ?? 'Sans catégorie').toString().trim();
		return `${weapon} • ${distance} • ${category}`;
	}

	private formatScore(score: number | null | undefined): string {
		const n = Number(score);
		if (!isFinite(n)) return '';
		return n.toFixed(2);
	}
}
