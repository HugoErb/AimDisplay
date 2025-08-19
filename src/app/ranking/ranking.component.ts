import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';
import { RankedShooter, Shooter } from '../interfaces/shooter';
import { RankingPage } from '../interfaces/ranking-page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'app-ranking',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './ranking.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RankingComponent implements OnInit, OnDestroy {
	// Identifiant et titre de la compétition (récupéré via l’URL).
	competitionId!: number;
	competitionTitle: string = '';

	// Pages construites à partir des tireurs.
	pages: RankingPage[] = [];
	// Index de la page actuellement affichée (base 0).
	currentIndex: number = 0;
	// Numéro de la page courante (affiché à l’écran, base 1).
	currentPage: number = 1;
	// Nombre total de pages pour la discipline courante.
	totalPages: number = 1;

	// Données affichées dans le tableau pour la page courante.
	classementData: RankedShooter[] = [];
	// Nombre total de participants dans la discipline courante.
	participantsCount: number = 0;

	// Libellé « discipline » affiché dans le titre (arme + distance + catégorie).
	discipline: string = '';

	/** Nombre de lignes par page. */
	private readonly PAGE_SIZE = 8;

	/** Timer de rotation (identifiant du setTimeout). */
	private rotationTimerId: number | undefined;
	/** Indique que le composant est détruit (empêche les ticks ultérieurs). */
	private destroyed = false;
	/** Évite les rafraîchissements concurrents. */
	private isRefreshing = false;

	constructor(private readonly commonService: CommonService, private readonly supabase: SupabaseService, private readonly route: ActivatedRoute) {}

	// ──────────────────────────────────────────────────────────────────────────────
	// Lifecycle
	// ──────────────────────────────────────────────────────────────────────────────

	async ngOnInit(): Promise<void> {
		const idParam = this.route.snapshot.paramMap.get('competitionId');
		const nameParam = this.route.snapshot.paramMap.get('competitionName') ?? '';

		const id = Number(idParam);
		if (!Number.isFinite(id) || id <= 0 || !nameParam.trim()) {
			this.commonService.showSwalToast('Compétition invalide.', 'error');
			return;
		}

		this.competitionId = id;
		this.competitionTitle = nameParam.trim();

		const shooters = await this.supabase.getShootersByCompetitionId(this.competitionId);
		this.pages = this.buildPagesFromShooters(shooters);

		if (!this.pages.length) {
			this.commonService.showSwalToast('Aucun tireur pour cette compétition.', 'info');
			return;
		}

		// Affiche la première page de la première discipline.
		this.showPage(0);
		// Lance la rotation (infinie).
		this.startRotation();
	}

	/**
	 * Nettoyage : stoppe la rotation et empêche tout nouveau tick.
	 */
	ngOnDestroy(): void {
		this.destroyed = true;
		this.stopRotation();
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Affichage / Formatage
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Renvoie le badge HTML (couleur/texte) représentant la position du tireur.
	 * @param position Rang (1, 2, 3, …)
	 */
	getPositionBadge(position: number): string {
		let bgClass = '';
		let text = '';

		switch (position) {
			case 1:
				bgClass = 'bg-yellow-500 text-white';
				text = '1er';
				break;
			case 2:
				bgClass = 'bg-gray-400 text-white';
				text = '2ème';
				break;
			case 3:
				bgClass = 'bg-amber-600 text-white';
				text = '3ème';
				break;
			default:
				bgClass = 'border border-gray-400 text-gray-700';
				text = `${position}ème`;
		}

		return `<span class="px-2 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${bgClass}">${text}</span>`;
	}

	/**
	 * Affiche la page située à l’index donné et met à jour l’état du composant
	 * (tableau, titre de discipline, pagination).
	 * @param index Index de la page (base 0).
	 */
	private showPage(index: number): void {
		this.currentIndex = index;
		const page = this.pages[index];

		this.classementData = page.rows;
		this.participantsCount = page.groupSize;
		this.currentPage = page.pageNumberInGroup;
		this.totalPages = page.pageCountInGroup;
		this.discipline = `${page.weapon} ${page.distance} - Catégorie ${page.category}`;
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Construction des pages (grouping + tri + pagination)
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Construit les pages de classement à partir d’une liste de tireurs :
	 * - regroupe par discipline (arme/distance/catégorie),
	 * - trie chaque discipline par total décroissant, tie-break sur la dernière série
	 *   (S4 si Senior/Dame, sinon S6), puis S3 → S1, puis ordre alphabétique
	 *   (nom, prénom, club), puis id,
	 * - numérote les rangs,
	 * - pagine par tranches de `PAGE_SIZE`.
	 */
	private buildPagesFromShooters(shooters: Shooter[]): RankingPage[] {
		// Regroupement par triplet discipline
		const keyOf = (s: Shooter) => `${s.distance}|||${s.weapon}|||${s.categoryName}`;
		const buckets = new Map<string, Shooter[]>();
		for (const s of shooters ?? []) {
			const k = keyOf(s);
			if (!buckets.has(k)) buckets.set(k, []);
			buckets.get(k)!.push(s);
		}

		const pages: RankingPage[] = [];

		for (const [key, list] of buckets) {
			const [distance, weapon, category] = key.split('|||');

			// Enrichissement : ajoute isSeniorOrDame et rang par défaut
			const enriched: RankedShooter[] = list.map((s) => ({
				...s,
				isSeniorOrDame: this.isSeniorOrDameCategory(s.categoryName),
				rank: 0,
			}));

			// Tri avec tie-breakers (total, dernière série, S3..S1, alpha, id)
			enriched.sort((a, b) => {
				// total
				const byTotal = this.toNum(b.totalScore) - this.toNum(a.totalScore);
				if (byTotal !== 0) return byTotal;

				// dernière série (S4 pour Senior/Dame, sinon S6)
				const lastA = a.isSeniorOrDame ? this.serieScore(a, 4) : this.serieScore(a, 6);
				const lastB = b.isSeniorOrDame ? this.serieScore(b, 4) : this.serieScore(b, 6);
				if (lastB !== lastA) return lastB - lastA;

				// S3, S2, S1
				for (let i = 3 as 3 | 2 | 1; i >= 1; i = (i - 1) as 3 | 2 | 1) {
					const ai = this.serieScore(a, i);
					const bi = this.serieScore(b, i);
					if (bi !== ai) return bi - ai;
				}

				// Ordre alphabétique : nom, prénom, club
				const byLast = this.cmpAlpha(a.lastName, b.lastName);
				if (byLast !== 0) return byLast;

				const byFirst = this.cmpAlpha(a.firstName, b.firstName);
				if (byFirst !== 0) return byFirst;

				const byClub = this.cmpAlpha(a.clubName, b.clubName);
				if (byClub !== 0) return byClub;

				// Fallback déterministe
				return (a.id ?? 0) - (b.id ?? 0);
			});

			// Numérotation des rangs (après tie-break)
			enriched.forEach((s, i) => (s.rank = i + 1));

			// Pagination par tranches PAGE_SIZE
			const total = enriched.length;
			const pageCount = Math.ceil(total / this.PAGE_SIZE);

			for (let p = 0; p < pageCount; p++) {
				const start = p * this.PAGE_SIZE;
				const rows = enriched.slice(start, start + this.PAGE_SIZE);

				pages.push({
					weapon,
					distance,
					category,
					rows,
					groupSize: total,
					pageNumberInGroup: p + 1,
					pageCountInGroup: pageCount,
				});
			}
		}

		return pages;
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Rotation infinie (10s + 1s par tireur) + refresh BDD en fin de cycle
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Démarre la rotation des pages (boucle infinie).
	 * À la fin de la dernière page, recharge la BDD puis recommence.
	 */
	startRotation(): void {
		this.stopRotation();
		if (!this.pages?.length || this.destroyed) return;
		this.scheduleNextTick();
	}

	/** Arrête immédiatement la rotation si elle est en cours. */
	stopRotation(): void {
		if (this.rotationTimerId !== undefined) {
			clearTimeout(this.rotationTimerId);
			this.rotationTimerId = undefined;
		}
	}

	/**
	 * Programme l’affichage de l’étape suivante selon la durée de la page courante.
	 * Durée = 10 secondes + 1 seconde par tireur affiché.
	 */
	private scheduleNextTick(): void {
		if (this.destroyed || !this.pages?.length) return;

		const page = this.pages[this.currentIndex];
		const delay = this.getPageDisplayDuration(page);

		this.rotationTimerId = window.setTimeout(() => {
			void this.advanceOrRefresh();
		}, delay);
	}

	/**
	 * Passe à la page suivante si disponible ; sinon recharge la BDD,
	 * reconstruit les pages et repart de la première page.
	 */
	private async advanceOrRefresh(): Promise<void> {
		if (this.destroyed) return;

		// Il reste des pages → page suivante
		if (this.currentIndex < this.pages.length - 1) {
			this.showPage(this.currentIndex + 1);
			this.scheduleNextTick();
			return;
		}

		// Dernière page atteinte → rafraîchir depuis la BDD et recommencer
		await this.refreshAndRestart();
	}

	/**
	 * Recharge les tireurs de la compétition, reconstruit les pages,
	 * revient à la page 0 et relance la rotation.
	 */
	private async refreshAndRestart(): Promise<void> {
		if (this.isRefreshing || this.destroyed) return;
		this.isRefreshing = true;
		this.stopRotation();

		try {
			const shooters = await this.supabase.getShootersByCompetitionId(this.competitionId);
			this.pages = this.buildPagesFromShooters(shooters);

			if (!this.pages.length) {
				this.commonService.showSwalToast('Aucun tireur pour cette compétition.', 'info');
				return;
			}

			this.showPage(0);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la mise à jour du classement.', 'error');
			return; // évite une boucle d’erreurs
		} finally {
			this.isRefreshing = false;
		}

		this.scheduleNextTick();
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Helpers
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Durée d’affichage d’une page = **10s + 1s par tireur affiché**.
	 * @param page Page courante
	 */
	private getPageDisplayDuration(page: RankingPage): number {
		const BASE_MS = 10_000;
		const PER_SHOOTER_MS = 1_000;
		const n = page?.rows?.length ?? 0;
		return BASE_MS + n * PER_SHOOTER_MS;
	}

	/** Convertit prudemment un score en nombre (0 si invalide). */
	private toNum(v: number | null | undefined): number {
		return typeof v === 'number' && isFinite(v) ? v : 0;
	}

	/** Compare deux chaînes en ordre alphabétique (fr, insensible aux accents/majuscules). */
	private cmpAlpha(a?: string, b?: string): number {
		return (a ?? '').localeCompare(b ?? '', 'fr', { sensitivity: 'base' });
	}

	/** Normalise une chaîne (minuscule + retrait des accents). */
	private normalize(s?: string | null): string {
		return (s ?? '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
	}

	/**
	 * Indique si la catégorie est de type "Senior" ou "Dame"
	 * (optionnellement suivie d’un numéro 1/2/3).
	 */
	private isSeniorOrDameCategory(categoryName: string): boolean {
		const n = this.normalize(categoryName);
		return /\b(senior|dame)\s*(1|2|3)?\b/.test(n);
	}

	/**
	 * Retourne le score d’une série (S1..S6) pour un tireur (0 si vide).
	 * @param s Tireur
	 * @param idx Numéro de série 1..6
	 */
	private serieScore(s: Shooter, idx: 1 | 2 | 3 | 4 | 5 | 6): number {
		const map: Record<number, number | null | undefined> = {
			1: s.scoreSerie1,
			2: s.scoreSerie2,
			3: s.scoreSerie3,
			4: s.scoreSerie4,
			5: s.scoreSerie5,
			6: s.scoreSerie6,
		};
		return this.toNum(map[idx]);
	}
}
