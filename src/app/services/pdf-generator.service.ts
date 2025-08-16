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
				this.commonService.showSwalToast('Veuillez sélectionner une compétition.', 'error');
				return;
			}

			// 1) Récupère les tireurs de la compétition sélectionnée
			const shooters: Shooter[] = await this.supabase.getShootersByCompetition(competitionId);

			if (!shooters.length) {
				this.commonService.showSwalToast('Aucun tireur trouvé pour cette compétition.', 'error');
				return;
			}

			// Titre dynamique (nom de la compétition)
			const competitionTitle = (shooters[0]?.competitionName ?? '').toString().trim() || 'Compétition';

			// 2) Regroupe par (arme, distance, catégorie) puis ordonne Distance → Catégorie → Arme
			const groups = this.groupAndSortByDistanceCategoryWeapon(shooters);

			// 3) Contenu PDF
			const content: Content[] = [];

			// En-tête (sans "Généré le ...")
			content.push({
				text: `Classement ${competitionTitle}`,
				style: 'h1',
				margin: [0, 0, 0, 12],
			});

			// Un tableau par groupe
			for (const g of groups) {
				if (!g.shooters.length) continue;

				const title = `${g.weapon} • ${g.distance} • ${g.category}`;
				// tri interne du groupe par score total décroissant
				const sorted = [...g.shooters].sort((a, b) => (b?.totalScore ?? 0) - (a?.totalScore ?? 0));

				content.push(this.buildGroupBlock(title, g.category, sorted));
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

			pdfMake.createPdf(docDefinition).download(fileName);
			this.commonService.showSwalToast('PDF généré.', 'success');
		} catch (err: any) {
			console.error('Erreur PDF:', err);
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}

	// ———————————————————————————————————————————————
	// Bloc d’un groupe (arme • distance • catégorie)
	// ———————————————————————————————————————————————
	private buildGroupBlock(title: string, categoryName: string, rows: Shooter[]): Content {
		const seriesCount = this.isSixSeriesCategory(categoryName) ? 6 : 4;

		const header: Cell[] = [
			{ text: 'Rang', style: 'th', alignment: 'center' },
			{ text: 'Nom', style: 'th' },
			{ text: 'Prénom', style: 'th' },
			{ text: 'Club', style: 'th' },
			// Séries dynamiques
			...Array.from(
				{ length: seriesCount },
				(_, i) =>
					({
						text: `Série ${i + 1}`,
						style: 'th',
						alignment: 'right',
					} as Cell)
			),
			{ text: 'Score total', style: 'th', alignment: 'right' },
		];

		const body: Cell[][] = [header];

		rows.forEach((s, idx) => {
			const rank = idx + 1;

			// Récupère les N séries à afficher
			const seriesValues = [s.scoreSerie1, s.scoreSerie2, s.scoreSerie3, s.scoreSerie4, s.scoreSerie5, s.scoreSerie6].slice(0, seriesCount);

			body.push([
				{ text: String(rank), style: 'td', alignment: 'center' },
				{ text: s.lastName ?? '', style: 'td' },
				{ text: s.firstName ?? '', style: 'td' },
				{ text: s.clubName ?? '', style: 'td' },
				...seriesValues.map((val) => ({ text: this.formatScore(val), style: 'td', alignment: 'right' } as Cell)),
				{ text: this.formatScore(s.totalScore), style: 'td', alignment: 'right' },
			]);
		});

		// Largeurs : base + (seriesCount * ~55) + total
		const widths: any[] = [35, '*', '*', '*', ...Array(seriesCount).fill(55), 90];

		return {
			unbreakable: true,
			stack: [
				{ text: title, style: 'h2', margin: [0, 10, 0, 6] },
				{
					table: {
						headerRows: 1,
						widths,
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
			margin: [0, 0, 0, 24],
		};
	}

	// ———————————————————————————————————————————————
	// Helpers de regroupement/formatage
	// ———————————————————————————————————————————————

	/** true si la catégorie doit afficher 6 séries (Dame ou Sénior) */
	private isSixSeriesCategory(category: string): boolean {
		if (!category) return false;
		const c = category
			.normalize('NFD') // retire les accents
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();

		// ex: "dame", "dame 1", "senior", "senior 2", "sénior 3", etc.
		return c.startsWith('dame') || c.startsWith('senior');
	}

	/** Formate un score en 2 décimales, vide si null/undefined/NaN */
	private formatScore(v: any): string {
		if (v === null || v === undefined) return '';
		const n = Number(v);
		if (!Number.isFinite(n)) return '';
		return n.toFixed(2);
	}

	/** Regroupe et ordonne Distance → Catégorie → Arme */
	private groupAndSortByDistanceCategoryWeapon(shooters: Shooter[]): Array<{
		distance: string;
		category: string;
		weapon: string;
		shooters: Shooter[];
	}> {
		const keyOf = (d: string, c: string, w: string) => `${d}||${c}||${w}`;

		const buckets = new Map<string, { distance: string; category: string; weapon: string; shooters: Shooter[] }>();
		for (const s of shooters) {
			const distance = s.distance || '—';
			const category = s.categoryName || '—';
			const weapon = s.weapon || '—';
			const k = keyOf(distance, category, weapon);
			if (!buckets.has(k)) buckets.set(k, { distance, category, weapon, shooters: [] });
			buckets.get(k)!.shooters.push(s);
		}

		const groups = Array.from(buckets.values()).sort((a, b) => {
			const byDistance = a.distance.localeCompare(b.distance, 'fr', { sensitivity: 'base' });
			if (byDistance !== 0) return byDistance;
			const byCategory = a.category.localeCompare(b.category, 'fr', { sensitivity: 'base' });
			if (byCategory !== 0) return byCategory;
			return a.weapon.localeCompare(b.weapon, 'fr', { sensitivity: 'base' });
		});

		// Option : trier les lignes du groupe par Nom/Prénom (avant application du rang)
		groups.forEach((g) => {
			g.shooters.sort((x, y) => {
				const ln = (x.lastName || '').localeCompare(y.lastName || '', 'fr', { sensitivity: 'base' });
				return ln !== 0 ? ln : (x.firstName || '').localeCompare(y.firstName || '', 'fr', { sensitivity: 'base' });
			});
		});

		return groups;
	}
}
