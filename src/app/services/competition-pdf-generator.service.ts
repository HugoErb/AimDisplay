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
export class CompetitionPDFGenerator {
	constructor(private supabase: SupabaseService, private commonService: CommonService) {}

	// Palette
	private theme = {
		primary: '#2563EB',
		surface: '#FFFFFF',
		border: '#E5E7EB',
		textMuted: '#6B7280',
	};

	async generateCompetitionReport(competitionId: number, showStats: boolean): Promise<void> {
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

			// ➜ Ajouter la page "Statistiques" en toute fin si demandé
			if (showStats) {
				const statsPage = await this.buildStatsPage(competitionId, shooters);
				if (statsPage) {
					if (content.length > 0) {
						this.removeTrailingPageBreaks(content[content.length - 1]); // nettoie 'after' enfouis
						(statsPage as any).pageBreak = 'before'; // stats commence sur une nouvelle page
					}
					content.push(statsPage);
				}
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

	/** Construit la page finale "Statistiques" (ajoutée en dernière page). */
	private async buildStatsPage(competitionId: number, shooters: Shooter[]): Promise<Content> {
		// ---- helpers
		const toNum = (x: any) => (x == null || Number.isNaN(Number(x)) ? 0 : Number(x));
		const money = (n: number) => `${n.toFixed(2)} €`;
		const keyOfShooter = (s: any) =>
			s.shooterId ?? `${(s.lastName || '').trim().toLowerCase()}|${(s.firstName || '').trim().toLowerCase()}`;

		// ---- infos compétition (prix)
		let basePrice = 0,
			extraCatPrice = 0,
			competitionName = '';
		try {
			const comps: any[] = await (this.supabase as any).getCompetitions?.();
			const comp = Array.isArray(comps) ? comps.find((c) => c?.id === competitionId) : null;
			basePrice = toNum(comp?.price ?? comp?.basePrice ?? comp?.tarif ?? 0);
			extraCatPrice = toNum(comp?.extraCategoryPrice ?? comp?.extraPrice ?? comp?.tarifSupp ?? 0);
			competitionName = comp?.name ?? comp?.title ?? '';
		} catch {
			/* valeurs par défaut à 0 si échec */
		}

		// ---- agrégats volumétrie
		const entries = shooters.length; // nb d'inscriptions (1 ligne = 1 inscription)

		const countByShooter = new Map<string, number>();
		shooters.forEach((s) => {
			const k = keyOfShooter(s);
			countByShooter.set(k, (countByShooter.get(k) || 0) + 1);
		});
		const uniqueShooters = countByShooter.size;
		const extraEntries = Array.from(countByShooter.values()).reduce((acc, c) => acc + Math.max(0, c - 1), 0);

		const clubsMap = new Map<string, number>();
		shooters.forEach((s) => {
			const c = (s.clubName || '').trim();
			if (c) clubsMap.set(c, (clubsMap.get(c) || 0) + 1);
		});
		const clubsCount = clubsMap.size;
		const topClubs = Array.from(clubsMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		const categoriesMap = new Map<string, number>();
		shooters.forEach((s) => {
			const c = (s.categoryName || '').trim();
			if (c) categoriesMap.set(c, (categoriesMap.get(c) || 0) + 1);
		});
		const catCount = categoriesMap.size;
		const topCategories = Array.from(categoriesMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		const distMap = new Map<string, number>();
		const weapMap = new Map<string, number>();
		shooters.forEach((s) => {
			const d = (s.distance || '').trim();
			if (d) distMap.set(d, (distMap.get(d) || 0) + 1);
			const w = (s.weapon || '').trim();
			if (w) weapMap.set(w, (weapMap.get(w) || 0) + 1);
		});
		const topDistances = Array.from(distMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
		const topWeapons = Array.from(weapMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		// ---- recettes (estimation simple)
		const baseRevenue = basePrice * uniqueShooters;
		const extraRevenue = extraCatPrice * extraEntries;
		const totalRevenue = baseRevenue + extraRevenue;
		const avgPerEntry = entries ? totalRevenue / entries : 0;
		const avgPerShooter = uniqueShooters ? totalRevenue / uniqueShooters : 0;

		// ---- stats de scores séparées 4 séries / 6 séries
		const is6 = (s: Shooter) => this.isSixSeriesCategory(s.categoryName ?? '');
		const shooters6 = shooters.filter(is6);
		const shooters4 = shooters.filter((s) => !is6(s));
		const scoreStats = (arr: Shooter[]) => {
			const vals = arr.map((s) => toNum((s as any).totalScore)).filter((n) => n > 0);
			const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
			const median = (() => {
				if (!vals.length) return 0;
				const sorted = [...vals].sort((a, b) => a - b);
				const mid = Math.floor(sorted.length / 2);
				return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
			})();
			let bestVal = -Infinity;
			let bestShooter: Shooter | undefined;
			arr.forEach((s) => {
				const v = toNum((s as any).totalScore);
				if (v > bestVal) {
					bestVal = v;
					bestShooter = s;
				}
			});
			return {
				avg,
				median,
				bestText: bestShooter ? `${bestVal.toFixed(2)} — ${bestShooter.lastName ?? ''} ${bestShooter.firstName ?? ''}`.trim() : '—',
				count: vals.length,
			};
		};
		const stats4 = scoreStats(shooters4);
		const stats6 = scoreStats(shooters6);

		// ---- layout commun
		const statsLayout: any = {
			hLineWidth: () => 1,
			hLineColor: this.theme.border,
			vLineWidth: () => 1,
			vLineColor: this.theme.border,
			hLineWhenBreaks: false,

			// ← header compact + centrage vertical (padding haut = bas)
			paddingTop: (rowIndex: number) => (rowIndex === 0 ? 2 : 4),
			paddingBottom: (rowIndex: number, node: any) => (rowIndex === 0 ? 2 : rowIndex === node.table.body.length - 1 ? 0 : 4),

			paddingLeft: () => 6,
			paddingRight: () => 6,

			fillColor: (rowIndex: number) => (rowIndex === 0 ? '#F3F4F6' : null),
		};

		// ---- tableaux
		const resumeTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 80],
				body: [
					[
						{ text: 'Résumé', style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: 'Inscriptions (lignes)', style: 'td' },
						{ text: String(entries), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Participants uniques', style: 'td' },
						{ text: String(uniqueShooters), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Clubs', style: 'td' },
						{ text: String(clubsCount), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Catégories', style: 'td' },
						{ text: String(catCount), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Distances (distinctes)', style: 'td' },
						{ text: String(distMap.size), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Armes (distinctes)', style: 'td' },
						{ text: String(weapMap.size), style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const pricingTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 110],
				body: [
					[
						{ text: 'Tarifs', style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: 'Prix de base (1ère catégorie)', style: 'td' },
						{ text: money(basePrice), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Prix catégorie supplémentaire', style: 'td' },
						{ text: money(extraCatPrice), style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const revenueTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 120],
				body: [
					[
						{ text: 'Recettes', style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: `Recettes des inscriptions (${uniqueShooters})`, style: 'td' },
						{ text: money(baseRevenue), style: 'td', alignment: 'right' },
					],
					[
						{ text: `Recettes des inscriptions en catégories supp. (${extraEntries})`, style: 'td' },
						{ text: money(extraRevenue), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Total estimé des recettes', style: 'td' },
						{ text: money(totalRevenue), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne par inscription', style: 'td' },
						{ text: money(avgPerEntry), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne par participant unique', style: 'td' },
						{ text: money(avgPerShooter), style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const topClubsTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 60],
				body: [
					[
						{ text: "Nombre d'inscriptions par club", style: 'th' },
						{ text: '', style: 'th', alignment: 'right' },
					],
					...topClubs.map(([club, n]) => [
						{ text: club, style: 'td' },
						{ text: String(n), style: 'td', alignment: 'right' },
					]),
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const topCategoriesTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 60],
				body: [
					[
						{ text: "Nombre d'inscriptions par catégorie", style: 'th' },
						{ text: '', style: 'th', alignment: 'right' },
					],
					...topCategories.map(([cat, n]) => [
						{ text: cat, style: 'td' },
						{ text: String(n), style: 'td', alignment: 'right' },
					]),
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const topDistancesTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 60],
				body: [
					[
						{ text: "Nombre d'inscriptions par distance", style: 'th' },
						{ text: '', style: 'th', alignment: 'right' },
					],
					...topDistances.map(([d, n]) => [
						{ text: d, style: 'td' },
						{ text: String(n), style: 'td', alignment: 'right' },
					]),
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const topWeaponsTable: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 60],
				body: [
					[
						{ text: "Nombre d'inscriptions par discipline d'arme", style: 'th' },
						{ text: '', style: 'th', alignment: 'right' },
					],
					...topWeapons.map(([w, n]) => [
						{ text: w, style: 'td' },
						{ text: String(n), style: 'td', alignment: 'right' },
					]),
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const scores4Table: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 110],
				body: [
					[
						{ text: 'Scores sur 4 séries', style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: 'Participants', style: 'td' },
						{ text: String(stats4.count), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne', style: 'td' },
						{ text: stats4.count ? stats4.avg.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane', style: 'td' },
						{ text: stats4.count ? stats4.median.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur score', style: 'td' },
						{ text: stats4.bestText, style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		const scores6Table: Content = {
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: ['*', 110],
				body: [
					[
						{ text: 'Scores sur 6 séries', style: 'th' },
						{ text: '', style: 'th' },
					],
					[
						{ text: 'Participants', style: 'td' },
						{ text: String(stats6.count), style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Moyenne', style: 'td' },
						{ text: stats6.count ? stats6.avg.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Médiane', style: 'td' },
						{ text: stats6.count ? stats6.median.toFixed(2) : '—', style: 'td', alignment: 'right' },
					],
					[
						{ text: 'Meilleur score', style: 'td' },
						{ text: stats6.bestText, style: 'td', alignment: 'right' },
					],
				],
			},
			layout: statsLayout,
			margin: [0, 6, 0, 6],
		};

		return {
			margin: [40, 0, 40, 12],
			stack: [
				// bandeau
				{
					table: {
						widths: ['*'],
						body: [
							[
								{
									text: `Statistiques ${competitionName || ''}`.trim(),
									style: 'cardTitle',
									fillColor: this.theme.primary,
									color: '#fff',
									margin: [12, 8, 12, 8],
								},
							],
						],
					},
					layout: 'noBorders',
					margin: [0, 0, 0, 0],
				},
				// colonnes
				{
					columns: [
						{ width: '*', stack: [resumeTable, pricingTable, revenueTable, topDistancesTable] }, // ← on met "Top distances" à gauche
						{ width: '*', stack: [topClubsTable, topCategoriesTable, topWeaponsTable, scores4Table, scores6Table] },
					],
					columnGap: 16,
				},
			],
		} as Content;
	}

	/** Supprime récursivement les pageBreak:'after' sur le dernier élément d'un bloc */
	private removeTrailingPageBreaks(node: any): void {
		if (!node) return;

		const strip = (n: any) => {
			if (!n || typeof n !== 'object') return;
			if (Array.isArray(n.stack) && n.stack.length) {
				this.removeTrailingPageBreaks(n.stack[n.stack.length - 1]);
			}
			if (Array.isArray(n.columns) && n.columns.length) {
				this.removeTrailingPageBreaks(n.columns[n.columns.length - 1]);
			}
			// si le tout dernier enfant a un pageBreak:'after', on l'enlève
			if (n.pageBreak === 'after') delete n.pageBreak;
		};

		if (Array.isArray(node)) {
			// pour un tableau d’items (ex: content/stack/columns)
			this.removeTrailingPageBreaks(node[node.length - 1]);
		} else {
			strip(node);
		}
	}
}
