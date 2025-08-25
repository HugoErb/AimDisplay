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

	// Dimensions communes pour éviter les en-têtes "écrasés"
	private dims = {
		headerRowHeight: 20,
		bodyRowHeight: 18,
		padX: 8,
		padYHeader: 6, // padding vertical de base (header)
		padY: 5, // padding vertical de base (corps)

		// biais pour compenser la baseline de la police
		vBiasHeader: 4.5, // pousse un peu le texte vers le BAS dans les entêtes
		vBiasBody: 3, // pareil pour les lignes du corps

		vTweakHeader: 4.5, // pousse un peu le texte vers le BAS dans les entêtes
		vTweakBody: 3, // pareil pour les lignes du corps

		thFontSize: 10,
		bodyFontSize: 10,
		lineHeight: 1.05,
	};

	private norm = (s: string) =>
		(s || '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();

	private fmt2 = (n: number | string | null | undefined) => {
		const v = Number(n);
		return Number.isFinite(v) ? v.toFixed(2) : '—';
	};

	private isSixSeriesRow(r: Shooter): boolean {
		const cat = this.norm(r.categoryName);
		const byCategory = cat.startsWith('dame') || cat.startsWith('senior');
		const hasS56 = r.scoreSerie5 != null || r.scoreSerie6 != null;
		return byCategory || !!hasS56;
	}

	private basicStats(nums: number[]) {
		const arr = nums.filter((x) => Number.isFinite(x));
		const count = arr.length;
		if (!count) return { count: 0, avg: 0, median: 0, best: 0, worst: 0 };
		const sum = arr.reduce((a, b) => a + b, 0);
		const avg = sum / count;
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		return { count, avg, median, best: sorted[sorted.length - 1], worst: sorted[0] };
	}

	private total4(r: Shooter): number {
		const toNum = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
		return toNum(r.scoreSerie1) + toNum(r.scoreSerie2) + toNum(r.scoreSerie3) + toNum(r.scoreSerie4);
	}
	private total6(r: Shooter): number {
		const toNum = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
		return (
			toNum(r.scoreSerie1) + toNum(r.scoreSerie2) + toNum(r.scoreSerie3) + toNum(r.scoreSerie4) + toNum(r.scoreSerie5) + toNum(r.scoreSerie6)
		);
	}

	async generateShooterReport(
		shooterKey: Shooter | { firstName?: string; lastName?: string; fullName?: string } | string,
		competitionId?: number
	): Promise<void> {
		try {
			// 1) Déduire Nom/Prénom pour affichage
			let firstName = '';
			let lastName = '';
			if (typeof shooterKey === 'string') {
				const parts = shooterKey.trim().split(/\s+/);
				lastName = parts[0] || '';
				firstName = parts.slice(1).join(' ');
			} else if (shooterKey) {
				if ('firstName' in shooterKey) firstName = shooterKey.firstName || '';
				if ('lastName' in shooterKey) lastName = shooterKey.lastName || '';
				if (!firstName || !lastName) {
					const full = (shooterKey as any).fullName || '';
					const p = full.split(/\s+/);
					lastName ||= p[0] || '';
					firstName ||= p.slice(1).join(' ');
				}
			}
			const label = `${(lastName || '').trim()} ${(firstName || '').trim()}`.replace(/\s+/g, ' ').trim() || 'Tireur';

			// 2) Récupérer lignes
			let rows: Shooter[] = [];
			if (competitionId) {
				const inComp = await this.supabase.getShootersByCompetition(competitionId);
				const ln = this.norm(lastName),
					fn = this.norm(firstName);
				rows = (inComp || []).filter((r) => this.norm(r.lastName) === ln && this.norm(r.firstName) === fn);
			} else {
				rows = await (this.supabase as any).getShooterResults(shooterKey as any);
			}
			if (!rows.length) {
				this.commonService.showSwalToast('Aucun résultat trouvé pour ce tireur.', 'info');
				return;
			}

			// Tri lisible
			rows.sort((a, b) => {
				const byComp = (a.competitionName || '').localeCompare(b.competitionName || '', 'fr', { sensitivity: 'base' });
				if (byComp !== 0) return byComp;
				return (a.distance || '').localeCompare(b.distance || '', 'fr', { sensitivity: 'base' });
			});

			const headerSubtitle = competitionId ? `Compétition : ${rows[0]?.competitionName || ''}` : '';

			const group6 = rows.filter((r) => this.isSixSeriesRow(r));
			const group4 = rows.filter((r) => !this.isSixSeriesRow(r));

			const totalsAll = rows.map((r) => r.totalScore);
			const totals4 = group4.map((r) => this.total4(r));
			const totals6 = group6.map((r) => this.total6(r));
			const statsAll = this.basicStats(totalsAll as number[]);
			const stats4 = this.basicStats(totals4);
			const stats6 = this.basicStats(totals6);

			// 3) Contenu
			const content: Content[] = [];
			if (headerSubtitle) content.push({ text: headerSubtitle, margin: [40, 8, 40, 8], color: this.theme.textMuted });

			content.push({
				margin: [40, 0, 40, 16],
				columns: [this.buildSummaryBlock(rows, statsAll), this.buildScoresMiniBlock(stats4, stats6)],
				columnGap: 16,
			});

			// Résultats 4 / 6 séries
			const fourTable = this.buildResultsTable('Résultats — 4 séries', group4, false);
			const sixTable = this.buildResultsTable('Résultats — 6 séries', group6, true);

			// forcer un saut de page AVANT le premier tableau réellement présent
			let breakInserted = false;

			if (fourTable) {
				(fourTable as any).pageBreak = 'before';
				content.push(fourTable);
				breakInserted = true;
			}
			if (sixTable) {
				if (!breakInserted) (sixTable as any).pageBreak = 'before';
				content.push(sixTable);
			}

			// 4) Doc landscape + styles avec en-têtes “aérés”
			const headerTitle = `Rapport de tireur — ${label}`;
			const docDefinition: TDocumentDefinitions = {
				pageSize: 'A4',
				pageOrientation: 'landscape',
				pageMargins: [0, 88, 0, 54],
				content,
				styles: {
					pageTitle: { fontSize: 16, bold: true, color: '#ffffff' },
					cardTitle: { fontSize: 12, bold: true, color: '#ffffff' },
					th: { bold: true, fontSize: this.dims.thFontSize, lineHeight: this.dims.lineHeight },
					td: { fontSize: this.dims.bodyFontSize, lineHeight: this.dims.lineHeight },
					tdWrap: {
						fontSize: this.dims.bodyFontSize,
						lineHeight: this.dims.lineHeight,
						margin: [0, -this.dims.vBiasBody, 0, this.dims.vBiasBody],
					},
				},
				defaultStyle: { fontSize: this.dims.bodyFontSize },

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
									columns: [{ text: headerTitle, style: 'pageTitle' }],
								},
							],
						],
					},
					layout: 'noBorders',
				}),

				footer: (currentPage: number, pageCount: number) => ({
					margin: [40, 0, 40, 18],
					columns: [
						{ text: '', width: '*' },
						{ text: `${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 8 },
					],
				}),
			};

			const safeTitle = headerTitle
				.replace(/[\\/:*?"<>|]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			pdfMake.createPdf(docDefinition).download(`${safeTitle}.pdf`);
			this.commonService.showSwalToast('PDF généré.', 'success');
		} catch (err: any) {
			console.error('Erreur PDF (tireur):', err);
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la génération du PDF', 'error');
		}
	}

	// --- Blocs visuels -------------------------------------------------

	private commonTableLayout = () => ({
		hLineWidth: () => 1,
		hLineColor: this.theme.border,
		vLineWidth: () => 1,
		vLineColor: () => this.theme.border,
		hLineWhenBreaks: false,
		paddingLeft: () => this.dims.padX,
		paddingRight: () => this.dims.padX,
		paddingTop: (row: number) => (row === 0 ? this.dims.padYHeader + this.dims.vBiasHeader : this.dims.padY + this.dims.vBiasBody),
		paddingBottom: (row: number) =>
			row === 0 ? Math.max(0, this.dims.padYHeader - this.dims.vBiasHeader) : Math.max(0, this.dims.padY - this.dims.vBiasBody),

		fillColor: (row: number) => (row === 0 ? '#F3F4F6' : null),
	});

	private buildSummaryBlock(rows: Shooter[], allStats: ReturnType<typeof this.basicStats>): Content {
		const competitions = new Set(rows.map((r) => r.competitionName)).size;
		const clubs = new Set(rows.map((r) => r.clubName)).size;
		const distances = new Set(rows.map((r) => r.distance)).size;
		const weapons = new Set(rows.map((r) => r.weapon)).size;

		return {
			margin: [0, 0, 8, 12],
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 90],
				heights: (row: number) => (row === 0 ? this.dims.headerRowHeight : this.dims.bodyRowHeight),
				body: [
					[
						{ text: 'Résumé', style: 'th' },
						{ text: '', style: 'th' },
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
						{ text: "Discipline d\'armes distinctes", style: 'td' },
						{ text: String(weapons), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne (tout confondu)', style: 'td' },
						{ text: this.fmt2(allStats.avg), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane (tout confondu)', style: 'td' },
						{ text: this.fmt2(allStats.median), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur / Pire', style: 'td' },
						{ text: `${this.fmt2(allStats.best)} / ${this.fmt2(allStats.worst)}`, style: 'td', alignment: 'right' },
					],
				],
			},
			layout: this.commonTableLayout(),
		};
	}

	private buildScoresMiniBlock(stats4: any, stats6: any): Content {
		const block = (title: string, st: any): Content => ({
			margin: [0, 0, 0, 10],
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 110],
				heights: (row: number) => (row === 0 ? this.dims.headerRowHeight : this.dims.bodyRowHeight),
				body: [
					[
						{ text: title, style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: 'Participations', style: 'td' },
						{ text: String(st.count), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne', style: 'td' },
						{ text: this.fmt2(st.avg), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane', style: 'td' },
						{ text: this.fmt2(st.median), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur', style: 'td' },
						{ text: this.fmt2(st.best), style: 'td', alignment: 'right' },
					],
				],
			},
			layout: this.commonTableLayout(),
		});

		return {
			margin: [8, 0, 0, 12],
			stack: [block('Scores en compétition (4 séries)', stats4), block('Scores en compétition (6 séries)', stats6)],
		};
	}

	private buildResultsTable(title: string, rows: Shooter[], six: boolean): Content | null {
		if (!rows.length) return null;

		const n = (x: any) => (x == null || Number.isNaN(Number(x)) ? '' : Number(x));
		const widths = six
			? [120, '*', '*', '*', 40, 40, 40, 40, 40, 40, 60] // 6 séries
			: [120, '*', '*', '*', 45, 45, 45, 45, 60]; // 4 séries

		const headerRow: Cell[] = [
			{ text: 'Compétition', style: 'th' },
			{ text: 'Distance', style: 'th' },
			{ text: 'Catégorie', style: 'th' },
			{ text: 'Discipline d\'arme', style: 'th' },
			{ text: 'S1', style: 'th', alignment: 'right' },
			{ text: 'S2', style: 'th', alignment: 'right' },
			{ text: 'S3', style: 'th', alignment: 'right' },
			{ text: 'S4', style: 'th', alignment: 'right' },
		];
		if (six) headerRow.push({ text: 'S5', style: 'th', alignment: 'right' }, { text: 'S6', style: 'th', alignment: 'right' });
		headerRow.push({ text: 'Total', style: 'th', alignment: 'right' });

		const body: any[] = [headerRow];
		rows.forEach((r) => {
			const base: any[] = [
				{ text: r.competitionName ?? '', style: 'tdWrap' },
				{ text: r.distance ?? '', style: 'tdWrap' },
				{ text: r.categoryName ?? '', style: 'tdWrap' },
				{ text: r.weapon ?? '', style: 'tdWrap' },
				{ text: n(r.scoreSerie1), alignment: 'right' },
				{ text: n(r.scoreSerie2), alignment: 'right' },
				{ text: n(r.scoreSerie3), alignment: 'right' },
				{ text: n(r.scoreSerie4), alignment: 'right' },
			];
			if (six) {
				base.push({ text: n(r.scoreSerie5), alignment: 'right' }, { text: n(r.scoreSerie6), alignment: 'right' });
			}
			base.push({ text: n(r.totalScore), alignment: 'right' });
			body.push(base);
		});

		return {
			margin: [40, 0, 40, 12],
			stack: [
				{
					unbreakable: true,
					table: {
						widths: ['*'],
						body: [[{ text: title, style: 'cardTitle', fillColor: this.theme.primary, color: '#fff', margin: [12, 8, 12, 8] }]],
					},
					layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
					margin: [0, 0, 0, 0],
				},
				{
					table: {
						headerRows: 1,
						keepWithHeaderRows: 1,
						dontBreakRows: true,
						widths,
						heights: (row: number) => (row === 0 ? this.dims.headerRowHeight : this.dims.bodyRowHeight),
						body,
					},
					layout: this.commonTableLayout(),
				},
			],
		};
	}
}
