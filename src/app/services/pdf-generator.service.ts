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

			// 1) Distance → Catégorie → Arme, puis on retire les groupes vides
			const groups = this.groupAndSortByDistanceCategoryWeapon(shooters)
				.map((g) => ({ ...g, shooters: (g.shooters || []).filter(Boolean) }))
				.filter((g) => (g.shooters?.length ?? 0) > 0);

			// 2) Construit le contenu (une carte par groupe)
			const content: Content[] = [];
			groups.forEach((g, idx) => {
				const useSix = this.isSixSeriesCategory(g.category); // 4 ou 6 séries selon catégorie
				const ordered = [...g.shooters].sort((a, b) => this.compareShooters(a, b, useSix)); // départage

				const title = `${g.distance} • ${g.category} • ${g.weapon}`;
				const card = this.buildGroupCard(title, ordered); // ⚠️ signature à 2 arguments conservée
				if (!card) return; // au cas où buildGroupCard retourne null si pas de lignes

				// Saut de page entre cartes, mais pas après la dernière (évite une page finale vide)
				if (idx < groups.length - 1) (card as any).pageBreak = 'after';
				content.push(card);
			});

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
					margin: [0, 0, 0, 0],
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

	/**
	 * Construit un bloc "carte de classement" : bandeau bleu + tableau des tireurs.
	 *
	 * Principes :
	 * - Les lignes (rows) doivent être déjà triées en amont.
	 * - Le BANDEAU seul est non-cassable (unbreakable) pour éviter qu'il reste orphelin.
	 * - Le TABLEAU est cassable (pas d'unbreakable global), ce qui supprime la
	 *   page blanche finale quand le tableau dépasse une page.
	 * - Détection automatique 4/6 séries selon la catégorie (Dame/Sénior → 6).
	 * - `keepWithHeaderRows: 1` évite qu'un header soit imprimé en bas de page sans ligne dessous.
	 *
	 * @param title  Titre à afficher dans le bandeau (ex. "25 m • Sénior • Pistolet").
	 * @param rows   Lignes de tireurs à afficher (déjà ordonnées).
	 * @return       Un noeud pdfMake à pousser dans `content`.
	 */
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
			margin: [40, 0, 40, 12],
			stack: [
				// Bandeau (non-cassable) — OK s'il reste seul en bas d'une page
				{
					unbreakable: true,
					table: {
						widths: ['*'],
						body: [
							[
								{
									text: title,
									style: 'cardTitle',
									fillColor: this.theme.primary,
									color: '#fff',
									margin: [12, 8, 12, 8],
								},
							],
						],
					},
					layout: {
						hLineWidth: () => 0,
						vLineWidth: () => 0,
					},
					margin: [0, 0, 0, 0],
				},

				// Tableau (cassable)
				{
					table: {
						headerRows: 1,
						keepWithHeaderRows: 1,
						dontBreakRows: true, // empêche la petite “ligne” au break
						widths,
						body,
					},
					layout: {
						hLineWidth: (i: number) => (i === 0 ? 0 : 1),
						hLineColor: this.theme.border,
						vLineColor: this.theme.border,
						paddingLeft: () => 6,
						paddingRight: () => 6,
						paddingTop: () => 4,
						paddingBottom: () => 4,
						fillColor: (rowIndex: number) => (rowIndex === 0 ? '#F3F4F6' : null),
					},
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

	/** Transforme un tireur en tableau de séries (4 ou 6 selon la catégorie) */
	private seriesOf(s: any, useSix: boolean): number[] {
		const toNum = (x: any) => (x == null || Number.isNaN(Number(x)) ? 0 : Number(x));
		const base = [toNum(s.scoreSerie1), toNum(s.scoreSerie2), toNum(s.scoreSerie3), toNum(s.scoreSerie4)];
		return useSix ? [...base, toNum(s.scoreSerie5), toNum(s.scoreSerie6)] : base;
	}

	/** Tri: total desc → dernière série desc → ... → première série desc → Nom/Prénom asc */
	private compareShooters(a: any, b: any, useSix: boolean): number {
		// 1) Total
		const byTotal = (b?.totalScore ?? 0) - (a?.totalScore ?? 0);
		if (byTotal !== 0) return byTotal;

		// 2) Séries de la fin vers le début
		const sa = this.seriesOf(a, useSix);
		const sb = this.seriesOf(b, useSix);
		for (let i = sa.length - 1; i >= 0; i--) {
			const diff = (sb[i] ?? 0) - (sa[i] ?? 0); // desc
			if (diff !== 0) return diff;
		}

		// 3) Alphabétique (Nom puis Prénom)
		const ln = (a.lastName || '').localeCompare(b.lastName || '', 'fr', { sensitivity: 'base' });
		if (ln !== 0) return ln;
		return (a.firstName || '').localeCompare(b.firstName || '', 'fr', { sensitivity: 'base' });
	}
}
