import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { SupabaseService } from './supabase.service';
import { CommonService } from './common.service';
import { Shooter } from '../interfaces/shooter';

// vfs
const vfsAny: any = (pdfFonts as any).vfs ?? (pdfFonts as any).default?.vfs ?? (pdfFonts as any);
(pdfMake as any).vfs = vfsAny;

type Cell = { text: string; style?: string; alignment?: 'left' | 'right' | 'center' | 'justify' };

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
	constructor(private supabase: SupabaseService, private commonService: CommonService) {}

	// Palette
	private theme = {
		primary: '#2563EB',
		surface: '#FFFFFF',
		border: '#E5E7EB',
		textMuted: '#6B7280',
	};

	async generateCompetitionReport(competitionId: number): Promise<void> {
		try {
			if (!competitionId) {
				this.commonService.showSwalToast('Veuillez sélectionner une compétition.', 'error');
				return;
			}

			const shooters: Shooter[] = await this.supabase.getShootersByCompetition(competitionId);
			if (!shooters.length) {
				this.commonService.showSwalToast('Aucun tireur trouvé pour cette compétition.', 'error');
				return;
			}

			const competitionTitle = (shooters[0]?.competitionName ?? '').toString().trim() || 'Compétition';

			// Distance → Catégorie → Arme
			const groups = this.groupAndSortByDistanceCategoryWeapon(shooters);

			const content: Content[] = [];
			for (const g of groups) {
				const ordered = [...g.shooters].sort((a, b) => (b?.totalScore ?? 0) - (a?.totalScore ?? 0));
				const title = `${g.distance} • ${g.category} • ${g.weapon}`;
				content.push(this.buildGroupCard(title, ordered));
			}

			const docDefinition: TDocumentDefinitions = {
				pageSize: 'A4',
				pageOrientation: 'landscape',
				pageMargins: [0, 88, 0, 54],
				content,
				styles: {
					pageTitle: { fontSize: 16, bold: true, color: '#ffffff' },
					cardTitle: { fontSize: 12, bold: true, color: '#ffffff' },
					th: { bold: true, fillColor: '#F3F4F6', margin: [0, 6, 0, 6] },
					td: { margin: [0, 4, 0, 4] },
				},
				defaultStyle: { fontSize: 10 },

				// Header bleu
				header: () => ({
					margin: [0, 0, 0, 8],
					table: {
						widths: ['*'],
						body: [
							[
								{
									border: [false, false, false, false],
									fillColor: this.theme.primary,
									margin: [40, 18, 40, 18],
									columns: [{ text: `Classement ${competitionTitle}`, style: 'pageTitle' }],
								},
							],
						],
					},
					layout: 'noBorders',
				}),

				// Footer
				footer: (currentPage: number, pageCount: number) => ({
					margin: [40, 0, 40, 18],
					columns: [
						{ text: '', width: '*' },
						{ text: `${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 8 },
					],
				}),
			};

			const safeTitle = competitionTitle
				.replace(/[\\/:*?"<>|]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			pdfMake.createPdf(docDefinition).download(`Classement ${safeTitle}.pdf`);
			this.commonService.showSwalToast('PDF généré.', 'success');
		} catch (err: any) {
			console.error('Erreur PDF:', err);
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}

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

	/** Carte sans espace blanc autour du tableau (affiche S5/S6 seulement pour Dame/Sénior) */
	private buildGroupCard(title: string, rows: Shooter[]): Content {
		const showSix = this.isSixSeriesCategory(rows[0]?.categoryName ?? '');

		// En-têtes dynamiques
		const headerRow: Cell[] = [
			{ text: 'Rang', style: 'th', alignment: 'center' },
			{ text: 'Nom', style: 'th' },
			{ text: 'Prénom', style: 'th' },
			{ text: 'Club', style: 'th' },
			{ text: 'S1', style: 'th', alignment: 'right' },
			{ text: 'S2', style: 'th', alignment: 'right' },
			{ text: 'S3', style: 'th', alignment: 'right' },
			{ text: 'S4', style: 'th', alignment: 'right' },
		];

		if (showSix) {
			headerRow.push({ text: 'S5', style: 'th', alignment: 'right' }, { text: 'S6', style: 'th', alignment: 'right' });
		}

		headerRow.push({ text: 'Total', style: 'th', alignment: 'right' });

		// Largeurs adaptées
		const widths = showSix
			? [35, '*', '*', '*', 40, 40, 40, 40, 40, 40, 60] // avec S5/S6
			: [35, '*', '*', '*', 45, 45, 45, 45, 60]; // sans S5/S6

		const body: Cell[][] = [headerRow];
		const v = (n: any) => (n == null || Number.isNaN(Number(n)) ? '' : Number(n).toFixed(2));

		rows.forEach((s, idx) => {
			const base: Cell[] = [
				{ text: String(idx + 1), style: 'td', alignment: 'center' },
				{ text: s.lastName ?? '', style: 'td' },
				{ text: s.firstName ?? '', style: 'td' },
				{ text: s.clubName ?? '', style: 'td' },
				{ text: v(s.scoreSerie1), style: 'td', alignment: 'right' },
				{ text: v(s.scoreSerie2), style: 'td', alignment: 'right' },
				{ text: v(s.scoreSerie3), style: 'td', alignment: 'right' },
				{ text: v(s.scoreSerie4), style: 'td', alignment: 'right' },
			];
			if (showSix) {
				base.push({ text: v(s.scoreSerie5), style: 'td', alignment: 'right' }, { text: v(s.scoreSerie6), style: 'td', alignment: 'right' });
			}
			base.push({ text: v(s.totalScore), style: 'td', alignment: 'right' });
			body.push(base);
		});

		return {
			// Garde bandeau + au moins une ligne ensemble
			unbreakable: true,
			margin: [40, 0, 40, 12],
			stack: [
				// Bandeau bleu
				{
					table: {
						widths: ['*'],
						body: [
							[
								{
									text: title,
									style: 'cardTitle',
									fillColor: this.theme.primary,
									color: '#fff',
									margin: [12, 10, 12, 10],
								},
							],
						],
					},
					layout: 'noBorders',
					margin: [0, 0, 0, 0],
				},
				// Tableau : supprime la ligne supérieure
				{
					table: {
						headerRows: 1,
						widths,
						body,
					},
					layout: {
						hLineWidth: (i) => (i === 0 ? 0 : 1),
						hLineColor: this.theme.border,
						vLineColor: this.theme.border,
						paddingLeft: () => 6,
						paddingRight: () => 6,
						paddingTop: () => 4,
						paddingBottom: () => 4,
					},
					margin: [0, 0, 0, 0],
				},
			],
		};
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

		groups.forEach((g) => {
			g.shooters.sort((x, y) => {
				const ln = (x.lastName || '').localeCompare(y.lastName || '', 'fr', { sensitivity: 'base' });
				return ln !== 0 ? ln : (x.firstName || '').localeCompare(y.firstName || '', 'fr', { sensitivity: 'base' });
			});
		});

		return groups;
	}
}
