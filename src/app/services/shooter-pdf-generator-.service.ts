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
export class ShooterPDFGenerator {
	constructor(private supabase: SupabaseService, private commonService: CommonService) {}

	// Palette
	private theme = {
		primary: '#2563EB',
		surface: '#FFFFFF',
		border: '#E5E7EB',
		textMuted: '#6B7280',
	};

	/**
	 * Génère un PDF pour un tireur.
	 * - Si `competitionId` est fourni, le rapport porte uniquement sur cette compétition.
	 * - Sinon, le rapport couvre l'ensemble des compétitions du tireur (historique).
	 *
	 * @param shooterKey  Objet ou string permettant d'identifier le tireur (id/licence ou Nom|Prénom)
	 * @param competitionId  (Optionnel) id de la compétition à filtrer
	 */
	public async generateShooterReport(
		shooterKey: { shooterId?: any; licenceNumber?: any; firstName?: string; lastName?: string; fullName?: string } | string,
		competitionId?: number
	): Promise<void> {
		try {
			// 0) Validation
			const label = this.prettyShooterLabel(shooterKey);
			if (!label) {
				this.commonService.showSwalToast('Veuillez sélectionner un tireur.', 'error');
				return;
			}

			// 1) Récupération des données
			let rows: Shooter[] = [];
			let headerSubtitle = '';
			if (competitionId) {
				const compRows: Shooter[] = await this.supabase.getShootersByCompetition(competitionId);
				rows = compRows.filter((r) => this.isSameShooter(r, shooterKey));
				if (!rows.length) {
					this.commonService.showSwalToast('Aucun résultat trouvé pour ce tireur dans la compétition choisie.', 'error');
					return;
				}
				headerSubtitle = rows[0]?.competitionName ? `Compétition : ${rows[0].competitionName}` : 'Compétition sélectionnée';
			} else {
				rows = await this.supabase.getShooterResults(shooterKey);
				if (!rows.length) {
					this.commonService.showSwalToast('Aucun résultat trouvé pour ce tireur.', 'error');
					return;
				}
				headerSubtitle = 'Historique du tireur (toutes compétitions)';
			}

			// 2) Tri des lignes (par date si dispo, sinon Competition → Distance → Catégorie → Arme)
			rows = this.sortShooterRows(rows);

			// 3) Stats globales + séparation 4 séries / 6 séries
			const is6 = (s: Shooter) => this.isSixSeriesCategory(s.categoryName ?? '');
			const rows6 = rows.filter(is6);
			const rows4 = rows.filter((s) => !is6(s));

			const statsAll = this.scoreStats(rows);
			const stats4 = this.scoreStats(rows4);
			const stats6 = this.scoreStats(rows6);

			// 4) Contenu
			const content: Content[] = [];

			// Bandeau principal
			content.push(this.buildBand(`Rapport de tireur — ${label}`, headerSubtitle));

			// Résumé + Indicateurs (2 colonnes)
			const summary = this.buildShooterSummary(rows, statsAll);
			const scoreCards = this.buildScoreMiniTables(stats4, stats6);
			content.push({
				columns: [
					{ width: '*', stack: [summary] },
					{ width: '*', stack: [scoreCards] },
				],
				columnGap: 16,
				margin: [40, 6, 40, 12],
			});

			// Résultats — on sépare 4 séries / 6 séries pour un tableau homogène
			if (rows4.length) {
				const res4 = this.buildResultsTable('Résultats — 4 séries', rows4, /*six*/ false);
				if (res4) content.push(res4);
			}
			if (rows6.length) {
				// saut seulement s'il y a déjà un gros bloc avant
				if (rows4.length) (content[content.length - 1] as any).pageBreak = 'after';
				const res6 = this.buildResultsTable('Résultats — 6 séries', rows6, /*six*/ true);
				if (res6) content.push(res6);
			}

			// Conseils simples (optionnel, basé sur la moyenne par série)
			const tips = this.buildTips(rows);
			if (tips) {
				(content[content.length - 1] as any).pageBreak = 'after';
				content.push(tips);
			}

			// Nettoyage anti page blanche finale
			if (content.length) {
				this.removeTrailingPageBreaks(content[content.length - 1]);
			}

			// 5) Doc
			const docDefinition: TDocumentDefinitions = {
				pageSize: 'A4',
				pageOrientation: 'landscape',
				pageMargins: [0, 60, 0, 54], // header ≈ 60
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
									columns: [{ text: 'Rapport PDF — Tireur', style: 'pageTitle' }],
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

			const safeName = label
				.replace(/[\\/:*?"<>|]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			const safeComp = competitionId ? ` — ${rows[0]?.competitionName ?? 'Compétition'}` : '';
			pdfMake.createPdf(docDefinition).download(`Rapport tireur ${safeName}${safeComp}.pdf`);
			this.commonService.showSwalToast('PDF généré.', 'success');
		} catch (err: any) {
			console.error('Erreur PDF (tireur):', err);
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}

	// == Helpers ===============================================================

	/** True si la catégorie doit afficher 6 séries (Dame/Sénior) */
	private isSixSeriesCategory(category: string): boolean {
		if (!category) return false;
		const c = category
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
		return c.startsWith('dame') || c.startsWith('senior');
	}

	/** Normalise le libellé du tireur à afficher dans le header */
	private prettyShooterLabel(key: any): string {
		if (!key) return '';
		if (typeof key === 'string') return key;
		const fn = (key.fullName || '').trim();
		if (fn) return fn;
		const ln = (key.lastName || '').trim();
		const pn = (key.firstName || '').trim();
		return `${ln} ${pn}`.trim();
	}

	/** Compare une ligne du dataset avec l'identifiant du tireur sélectionné */
	private isSameShooter(row: any, key: any): boolean {
		if (!row || !key) return false;
		// Priorité : id ou licence
		if (key.shooterId && row.shooterId && String(row.shooterId) === String(key.shooterId)) return true;
		if (key.licenceNumber && row.licenceNumber && String(row.licenceNumber) === String(key.licenceNumber)) return true;

		// Fallback Nom/Prénom normalisés
		const nrm = (s: string) =>
			(s || '')
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.trim();
		const kLast = nrm(key.lastName || (key.fullName || '').split(' ')[0] || '');
		const kFirst = nrm(key.firstName || (key.fullName || '').split(' ').slice(1).join(' ') || '');
		return nrm(row.lastName) === kLast && nrm(row.firstName) === kFirst;
	}

	/** Tri des lignes du tireur */
	private sortShooterRows(rows: Shooter[]): Shooter[] {
		const by = (a: any, b: any, k: string) => (a?.[k] || '').localeCompare(b?.[k] || '', 'fr', { sensitivity: 'base' });
		// Si une date est dispo, on l'utilise (desc), sinon on reste lexical
		if (rows.length && (rows[0] as any).date) {
			return [...rows].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
		}
		return [...rows].sort((a, b) => {
			const c = by(a, b, 'competitionName');
			if (c !== 0) return c;
			const d = by(a, b, 'distance');
			if (d !== 0) return d;
			const e = by(a, b, 'categoryName');
			if (e !== 0) return e;
			return by(a, b, 'weapon');
		});
	}

	/** Stats simples sur totalScore d'une liste de lignes */
	private scoreStats(arr: Shooter[]) {
		const toNum = (x: any) => (x == null || Number.isNaN(Number(x)) ? 0 : Number(x));
		const vals = arr.map((s) => toNum((s as any).totalScore)).filter((n) => n > 0);
		const count = vals.length;
		const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
		const median = (() => {
			if (!count) return 0;
			const sorted = [...vals].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		})();
		const best = count ? Math.max(...vals) : 0;
		const worst = count ? Math.min(...vals) : 0;
		return { count, avg, median, best, worst };
	}

	/** Bandeau bleu (non cassable) */
	private buildBand(title: string, subtitle?: string): Content {
		return {
			margin: [0, 0, 0, 12],
			stack: [
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
									margin: [40, 10, 40, 10],
								},
							],
						],
					},
					layout: 'noBorders',
					margin: [0, 0, 0, subtitle ? 4 : 0],
				},
				...(subtitle
					? [
							{
								margin: [40, 0, 40, 0],
								text: subtitle,
								color: this.theme.textMuted,
							},
					  ]
					: []),
			],
		} as any;
	}

	/** Mini tableaux de résumé (volumétrie + scores globaux) */
	private buildShooterSummary(rows: Shooter[], allStats: ReturnType<typeof this.scoreStats>): Content {
		const competitions = new Set(rows.map((r) => r.competitionName).filter(Boolean)).size;
		const clubs = new Set(rows.map((r) => r.clubName).filter(Boolean)).size;
		const distances = new Set(rows.map((r) => r.distance).filter(Boolean)).size;
		const weapons = new Set(rows.map((r) => r.weapon).filter(Boolean)).size;

		const statsLayout: any = {
			hLineWidth: () => 1,
			hLineColor: this.theme.border,
			vLineWidth: () => 1,
			vLineColor: this.theme.border,
			hLineWhenBreaks: false,
			paddingLeft: () => 6,
			paddingRight: () => 6,
			paddingTop: (row: number) => (row === 0 ? 2 : 4),
			paddingBottom: (row: number, node: any) => (row === 0 ? 2 : row === node.table.body.length - 1 ? 0 : 4),
			fillColor: (row: number) => (row === 0 ? '#F3F4F6' : null),
		};

		return {
			margin: [0, 0, 0, 0],
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 80],
				body: [
					[
						{ text: 'Résumé', style: 'th', margin: [0, 0, 0, 0] },
						{ text: '', style: 'th', margin: [0, 0, 0, 0] },
					],
					[
						{ text: 'Inscriptions (lignes)', style: 'td' },
						{ text: String(rows.length), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Compétitions distinctes', style: 'td' },
						{ text: String(competitions), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Clubs distincts', style: 'td' },
						{ text: String(clubs), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Distances distinctes', style: 'td' },
						{ text: String(distances), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Armes distinctes', style: 'td' },
						{ text: String(weapons), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne (toutes lignes)', style: 'td' },
						{ text: allStats.count ? allStats.avg.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane (toutes lignes)', style: 'td' },
						{ text: allStats.count ? allStats.median.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur / Pire', style: 'td' },
						{
							text: allStats.count ? `${allStats.best.toFixed(2)} / ${allStats.worst.toFixed(2)}` : '—',
							style: 'td',
							alignment: 'right',
						},
					],
				],
			},
			layout: statsLayout,
		};
	}

	/** Deux mini tableaux "Scores (4 séries)" et "Scores (6 séries)" avec ligne Participants */
	private buildScoreMiniTables(stats4: any, stats6: any): Content {
		const statsLayout: any = {
			hLineWidth: () => 1,
			hLineColor: this.theme.border,
			vLineWidth: () => 1,
			vLineColor: this.theme.border,
			hLineWhenBreaks: false,
			paddingLeft: () => 6,
			paddingRight: () => 6,
			paddingTop: (row: number) => (row === 0 ? 2 : 4),
			paddingBottom: (row: number, node: any) => (row === node.table.body.length - 1 ? 0 : 4),
			fillColor: (row: number) => (row === 0 ? '#F3F4F6' : null),
		};
		const block = (title: string, st: any): Content => ({
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 110],
				body: [
					[
						{ text: title, style: 'th', margin: [0, 0, 0, 0] },
						{ text: '', style: 'th', margin: [0, 0, 0, 0] },
					],
					[
						{ text: 'Participants', style: 'td' },
						{ text: String(st.count), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne', style: 'td' },
						{ text: st.count ? st.avg.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane', style: 'td' },
						{ text: st.count ? st.median.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur', style: 'td' },
						{ text: st.count ? st.best.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 0, 0, 10],
		});

		return {
			stack: [block('Scores (4 séries)', stats4), block('Scores (6 séries)', stats6)],
		};
	}

	/** Tableau des résultats (4 ou 6 séries) */
	private buildResultsTable(title: string, rows: Shooter[], six: boolean): Content | null {
		if (!rows.length) return null;

		const n = (x: any) => (x == null || Number.isNaN(Number(x)) ? '' : Number(x));
		const widths = six ? [120, '*', '*', '*', 30, 30, 30, 30, 30, 30, 40] : [120, '*', '*', '*', 36, 36, 36, 36, 40];

		const headerRow: any[] = [
			{ text: 'Compétition', style: 'th' },
			{ text: 'Distance', style: 'th' },
			{ text: 'Catégorie', style: 'th' },
			{ text: 'Arme', style: 'th' },
			{ text: 'S1', style: 'th', alignment: 'right' },
			{ text: 'S2', style: 'th', alignment: 'right' },
			{ text: 'S3', style: 'th', alignment: 'right' },
			{ text: 'S4', style: 'th', alignment: 'right' },
		];
		if (six) {
			headerRow.push({ text: 'S5', style: 'th', alignment: 'right' }, { text: 'S6', style: 'th', alignment: 'right' });
		}
		headerRow.push({ text: 'Total', style: 'th', alignment: 'right' });

		const body: any[] = [headerRow];
		rows.forEach((r) => {
			const base = [
				r.competitionName ?? '',
				r.distance ?? '',
				r.categoryName ?? '',
				r.weapon ?? '',
				{ text: n((r as any).scoreSerie1), alignment: 'right' },
				{ text: n((r as any).scoreSerie2), alignment: 'right' },
				{ text: n((r as any).scoreSerie3), alignment: 'right' },
				{ text: n((r as any).scoreSerie4), alignment: 'right' },
			];
			if (six) {
				base.push({ text: n((r as any).scoreSerie5), alignment: 'right' }, { text: n((r as any).scoreSerie6), alignment: 'right' });
			}
			base.push({ text: n((r as any).totalScore), alignment: 'right' });
			body.push(base);
		});

		const band = this.buildBand(title);

		const table: Content = {
			margin: [40, 0, 40, 12],
			stack: [
				band,
				{
					table: {
						headerRows: 1,
						keepWithHeaderRows: 1,
						dontBreakRows: true,
						widths,
						body,
					},
					layout: {
						hLineWidth: (i: number) => (i === 0 ? 0 : 1),
						hLineColor: this.theme.border,
						vLineColor: this.theme.border,
						hLineWhenBreaks: false,
						paddingLeft: () => 6,
						paddingRight: () => 6,
						paddingTop: (rowIndex: number) => (rowIndex === 0 ? 6 : 4),
						paddingBottom: (rowIndex: number, node: any) => (rowIndex === node.table.body.length - 1 ? 0 : 4),
						fillColor: (rowIndex: number) => (rowIndex === 0 ? '#F3F4F6' : null),
					},
				} as any,
			],
		};

		return table;
	}

	/** Conseils simples basés sur les moyennes par série (heuristique rapide) */
	private buildTips(rows: Shooter[]): Content | null {
		if (!rows.length) return null;

		// Moyenne par position de série (sur toutes lignes)
		const toNum = (x: any) => (x == null || Number.isNaN(Number(x)) ? 0 : Number(x));
		const acc: { [k: string]: { sum: number; c: number } } = {};
		const push = (k: string, v: number) => {
			if (!acc[k]) acc[k] = { sum: 0, c: 0 };
			acc[k].sum += v;
			acc[k].c += 1;
		};

		rows.forEach((r) => {
			push('S1', toNum((r as any).scoreSerie1));
			push('S2', toNum((r as any).scoreSerie2));
			push('S3', toNum((r as any).scoreSerie3));
			push('S4', toNum((r as any).scoreSerie4));
			if (this.isSixSeriesCategory(r.categoryName ?? '')) {
				push('S5', toNum((r as any).scoreSerie5));
				push('S6', toNum((r as any).scoreSerie6));
			}
		});

		const avg = (k: string) => (acc[k] && acc[k].c ? acc[k].sum / acc[k].c : 0);
		const series = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].filter((k) => acc[k]?.c);
		if (!series.length) return null;

		const minSer = series.reduce((m, k) => (avg(k) < avg(m) ? k : m), series[0]);
		const maxSer = series.reduce((m, k) => (avg(k) > avg(m) ? k : m), series[0]);

		return {
			margin: [40, 0, 40, 12],
			stack: [
				this.buildBand('Conseils personnalisés'),
				{
					ul: [
						`Ta série la plus régulière est ${maxSer} (moyenne ~ ${avg(maxSer).toFixed(
							2
						)}). Capitalise dessus en reproduisant la même routine.`,
						`Ta série la plus faible est ${minSer} (moyenne ~ ${avg(minSer).toFixed(2)}). Travaille des drills ciblés pour cette phase.`,
						`Stabilise le rythme : garde des séries à ±5% de ta meilleure moyenne pour éviter les écarts.`,
					],
				},
			],
		};
	}

	/** Supprime récursivement les pageBreak:'after' sur le dernier enfant d'un nœud (anti page blanche) */
	private removeTrailingPageBreaks(node: any): void {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			if (node.length) this.removeTrailingPageBreaks(node[node.length - 1]);
			return;
		}
		if (Array.isArray((node as any).stack) && (node as any).stack.length) {
			this.removeTrailingPageBreaks((node as any).stack[(node as any).stack.length - 1]);
		}
		if (Array.isArray((node as any).columns) && (node as any).columns.length) {
			this.removeTrailingPageBreaks((node as any).columns[(node as any).columns.length - 1]);
		}
		if ((node as any).pageBreak === 'after') delete (node as any).pageBreak;
	}
}
