import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
	competitionId!: number; // Identifiant de la compétition (récupéré via l’URL)
	competitionTitle: string = ''; // Titre de la compétition (récupéré via l’URL)

	// --- Pages ---
	pages: RankingPage[] = []; // Pages construites à partir des tireurs
	currentIndex: number = 0; // Index de la page actuellement affichée (base 0)
	currentPage: number = 1; // Numéro de la page courante (affiché à l’écran, base 1)
	totalPages: number = 1; // Nombre total de pages pour la discipline courante
	classementData: RankedShooter[] = []; // Données affichées dans le tableau pour la page courante
	participantsCount: number = 0; // Nombre total de participants dans la discipline courante
	discipline: string = ''; // Libellé « discipline » affiché dans le titre (arme + distance + catégorie)

	private allShooters: Shooter[] = []; // Mémorise la liste complète pour pouvoir rebâtir les pages après un resize

	private lastRowsPerPage: number = this.getNbRowsPerPage(); // Dernier nombre de lignes utilisé (pour éviter de recalculer pour rien)

	private rotationTimerId: number | undefined; // Timer de rotation (identifiant du setTimeout)
	private destroyed = false; // Indique que le composant est détruit (empêche les ticks ultérieurs)
	private isRefreshing = false; // Évite les rafraîchissements concurrents

	// --- Pré-chargement du prochain cycle ---
	private isPrefetching = false; // évite de lancer plusieurs précharges en //
	private prefetchedPages: RankingPage[] | null = null; // pages reconstruites en avance
	private prefetchRun = 0; // id de course pour invalider les anciennes promesses

	// --- Barre de progression ---
	private progressRun = 0; // identifiant pour invalider les anciennes animations
	progressStyle: { [k: string]: string } = { width: '0%', transition: 'none' }; // Style bindé sur la barre (width + transition)
	private readonly ANIM_MS = 400; // Durée d'animation (doit matcher avec styles.css)

	// --- Animations ---
	tableAnimClass: string | null = 'animate-swipe-right-in';
	headerAnimClass: string | null = 'animate-swipe-right-in';

	// --- Plein écran ---
	isFullscreen = false; // vrai si la page est en plein écran
	showFsButton = false; // contrôle l’affichage du bouton
	private hideFsBtnTimer: any; // timer d’auto-masquage
	private fsChangeHandler = () => this.updateFullscreenState();
	private fsPinned = false; // souris sur le bouton => pas d'auto-hide
	private fsHideTimer: any | null = null;

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
		this.allShooters = shooters;
		this.pages = this.buildPagesFromShooters(shooters);

		if (!this.pages.length) {
			this.commonService.showSwalToast('Aucun tireur pour cette compétition.', 'info');
			return;
		}

		// Affiche la première page de la première discipline.
		this.showPage(0);
		// Lance la rotation (infinie).
		this.startRotation();

		// plein écran: écoute les changements du navigateur
		document.addEventListener('fullscreenchange', this.fsChangeHandler);
		document.addEventListener('webkitfullscreenchange', this.fsChangeHandler as any);
		document.addEventListener('mozfullscreenchange', this.fsChangeHandler as any);
		document.addEventListener('MSFullscreenChange', this.fsChangeHandler as any);
		this.updateFullscreenState();
		window.addEventListener('mousemove', this.onGlobalMouseMove, { passive: true });
	}

	/**
	 * Nettoyage : stoppe la rotation et empêche tout nouveau tick.
	 */
	ngOnDestroy(): void {
		this.destroyed = true;
		this.stopRotation();
		clearTimeout(this.hideFsBtnTimer);
		document.removeEventListener('fullscreenchange', this.fsChangeHandler);
		document.removeEventListener('webkitfullscreenchange', this.fsChangeHandler as any);
		document.removeEventListener('mozfullscreenchange', this.fsChangeHandler as any);
		document.removeEventListener('MSFullscreenChange', this.fsChangeHandler as any);
		window.removeEventListener('mousemove', this.onGlobalMouseMove as any);
		if (this.fsHideTimer) clearTimeout(this.fsHideTimer);
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Gestion et construction des pages (grouping + tri + pagination)
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Met à jour l’état pour afficher la page de classement ciblée depuis `this.pages[index]`.
	 *
	 * @param {number} index - Indice (base 0) de la page à afficher dans `this.pages`.
	 * @returns {void} Ne retourne rien.
	 */
	private showPage(index: number): void {
		this.currentIndex = index;
		const page = this.pages[index];

		this.classementData = page.rows;
		this.participantsCount = page.groupSize;
		this.currentPage = page.pageNumberInGroup;
		this.totalPages = page.pageCountInGroup;
		this.discipline = `${page.weapon} - ${page.distance} - ${page.category}`;
	}

	/**
	 * Construit les pages de classement.
	 *
	 * @param {Shooter[]} shooters - Liste des tireurs à classer ; si vide ou indéfinie, aucune page n’est générée.
	 * @returns {RankingPage[]} Pages paginées par discipline contenant les lignes triées et les métadonnées.
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

			// Pagination par tranches
			const rowsPerPage = this.getNbRowsPerPage();
			const total = enriched.length;
			const pageCount = Math.ceil(total / rowsPerPage);

			for (let p = 0; p < pageCount; p++) {
				const start = p * rowsPerPage;
				const rows = enriched.slice(start, start + rowsPerPage);

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

	/**
	 * Génère le badge HTML d’une position de classement avec style adapté (or/argent/bronze pour 1–3, style générique sinon).
	 *
	 * @param {number} position - Position dans le classement (1 pour premier, 2 pour deuxième, etc.).
	 * @returns {string} HTML d’un <span> stylé (classes Tailwind) affichant le rang correspondant.
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
	 * Calcule dynamiquement le nombre optimal de lignes à afficher dans le tableau,
	 * en prenant des tailles fixes d'éléments du tableau et en les
	 * soustrayant à la taille disponible dans la fenêtre.
	 *
	 * @returns {Promise<number>} Le nombre de lignes à afficher.
	 */
	getNbRowsPerPage(): number {
		// Mesures
		const headerH = 80;
		const headerTabH = 45;
		const disciplineContainerH = 94;
		const defaultRowH = 53;
		const defaultPadding = 75;

		// Calcul de l’espace disponible
		const available = window.innerHeight - headerH - disciplineContainerH - headerTabH - defaultPadding;

		// Nombre de lignes complètes
		const count = Math.floor(available / defaultRowH);

		// On renvoie au moins 1
		return Math.max(1, count);
	}

	/**
	 * Gère le redimensionnement de la fenêtre : recalcule les lignes par page, rebâtit
	 * les pages en conservant le contexte courant et relance la rotation.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	@HostListener('window:resize')
	onResize(): void {
		const newRows = this.getNbRowsPerPage();
		if (newRows === this.lastRowsPerPage) return; // rien à faire

		this.lastRowsPerPage = newRows;

		// S’il nous manque les données “source”, on ne peut rien rebâtir
		if (!this.allShooters?.length) return;

		// Sauvegarde le « contexte » courant (discipline + page dans la discipline)
		const cur = this.pages[this.currentIndex];
		const curKey = cur ? `${cur.distance}|||${cur.weapon}|||${cur.category}` : null;
		const curPageInGroup = cur?.pageNumberInGroup ?? 1;

		// Stoppe la rotation + la barre, rebâtit les pages
		this.stopRotation();
		this.pages = this.buildPagesFromShooters(this.allShooters);

		// Essaie de retrouver la même discipline…
		let newIndex = 0;
		if (curKey) {
			const groupPages = this.pages.filter((p) => `${p.distance}|||${p.weapon}|||${p.category}` === curKey);
			if (groupPages.length) {
				const wantedPage = Math.min(curPageInGroup, groupPages[0].pageCountInGroup);
				const idx = this.pages.findIndex(
					(p) => `${p.distance}|||${p.weapon}|||${p.category}` === curKey && p.pageNumberInGroup === wantedPage
				);
				if (idx >= 0) newIndex = idx;
			}
		}

		// Réaffiche et relance la rotation
		this.showPage(newIndex);
		this.playEnterAnimations(this.pages[newIndex].pageNumberInGroup === 1); // header si nouvelle discipline
		this.scheduleNextTick();
	}

	/**
	 * Démarre la rotation automatique des pages si l’affichage est valide.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	startRotation(): void {
		this.stopRotation();
		if (!this.pages?.length || this.destroyed) return;
		this.scheduleNextTick();
	}

	/**
	 * Arrête la rotation en cours et réinitialise la barre de progression.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	stopRotation(): void {
		if (this.rotationTimerId !== undefined) {
			clearTimeout(this.rotationTimerId);
			this.rotationTimerId = undefined;
		}
		this.resetProgressBar();
	}

	/**
	 * Planifie le prochain tick de rotation : calcule le délai de la page courante,
	 * Lance la barre de progression, précharge le cycle suivant si nécessaire, puis programme l’avance.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	private scheduleNextTick(): void {
		if (this.destroyed || !this.pages?.length) return;

		const page = this.pages[this.currentIndex];
		const delay = this.getPageDisplayDuration(page);

		// barre de progression
		this.startProgressBar(delay);

		// si on est sur la dernière page du cycle → pré-charger le prochain
		const isLastPageOfCycle = this.currentIndex === this.pages.length - 1;
		if (isLastPageOfCycle && !this.isPrefetching) {
			void this.prefetchNextCycle(); // async, en tâche de fond
		}

		this.rotationTimerId = window.setTimeout(() => {
			void this.advanceOrRefresh();
		}, delay);
	}

	/**
	 * Précharge en arrière-plan le prochain cycle de pages (fetch des tireurs,
	 * construction des pages) et enregistre le résultat s’il est toujours d’actualité.
	 *
	 * @returns {Promise<void>} Promesse résolue à la fin du préchargement.
	 */
	private async prefetchNextCycle(): Promise<void> {
		if (this.isPrefetching || this.destroyed) return;
		this.isPrefetching = true;
		const run = ++this.prefetchRun;

		try {
			const shooters = await this.supabase.getShootersByCompetitionId(this.competitionId);
			const pages = this.buildPagesFromShooters(shooters);
			if (run !== this.prefetchRun || this.destroyed) return; // résultat obsolète
			this.prefetchedPages = pages;
		} catch {
			if (run === this.prefetchRun) this.prefetchedPages = null;
		} finally {
			if (run === this.prefetchRun) this.isPrefetching = false;
		}
	}

	/**
	 * Avance à la page suivante avec animations ou, en fin de cycle,
	 * bascule sur les pages préchargées ; à défaut, rafraîchit et redémarre.
	 *
	 * @returns {Promise<void>} Promesse résolue une fois l’action effectuée.
	 */
	private async advanceOrRefresh(): Promise<void> {
		if (this.destroyed) return;

		// Jouer la sortie (header aussi si fin de discipline)
		const isGroupEnd = this.isLastPageOfGroup;
		await this.playExitAnimations(isGroupEnd);

		// Page suivante ?
		if (this.currentIndex < this.pages.length - 1) {
			const nextIndex = this.currentIndex + 1;
			const nextIsGroupStart = this.pages[nextIndex].pageNumberInGroup === 1;

			this.showPage(nextIndex);
			this.playEnterAnimations(nextIsGroupStart);
			this.scheduleNextTick();
			return;
		}

		// Dernière page du cycle → bascule sur les pages préchargées si dispo
		if (this.prefetchedPages && this.prefetchedPages.length) {
			this.pages = this.prefetchedPages;
			this.prefetchedPages = null;
			this.currentIndex = 0;
			this.showPage(0);
			this.playEnterAnimations(true); // nouvelle discipline en général
			this.scheduleNextTick();
			return;
		}

		// Pas encore préchargé / échec → fallback
		await this.refreshAndRestart();
	}

	/**
	 * Rafraîchit le classement depuis Supabase, reconstruit les pages,
	 * affiche la première et relance la rotation (avec toasts en cas de vide/erreur).
	 *
	 * @returns {Promise<void>} Promesse résolue à la fin.
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
			this.playEnterAnimations(true);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la mise à jour du classement.', 'error');
			return;
		} finally {
			this.isRefreshing = false;
			// invalide toute ancienne précharge
			this.prefetchRun++;
			this.prefetchedPages = null;
		}

		this.scheduleNextTick();
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Animations
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Joue l’animation de sortie (glissement vers la gauche) pour la table
	 * et, optionnellement, pour le header, puis attend la fin.
	 *
	 * @param {boolean} withHeader - Indique s’il faut animer le header en plus de la table.
	 * @returns {Promise<void>} Promesse résolue à la fin de l’animation.
	 */
	private playExitAnimations(withHeader: boolean): Promise<void> {
		// reset classes pour forcer le replay propre
		this.tableAnimClass = '';
		if (withHeader) this.headerAnimClass = '';

		return new Promise((resolve) => {
			requestAnimationFrame(() => {
				// Applique les 2 classes dans la même frame → synchro parfaite
				this.tableAnimClass = 'animate-swipe-left-out';
				if (withHeader) this.headerAnimClass = 'animate-swipe-left-out';

				setTimeout(resolve, this.ANIM_MS);
			});
		});
	}

	/**
	 * Joue l’animation d’entrée (glissement depuis la droite)
	 * pour la table et, optionnellement, pour le header.
	 *
	 * @param {boolean} withHeader - true pour animer aussi le header en plus de la table.
	 * @returns {void} Ne retourne rien.
	 */
	private playEnterAnimations(withHeader: boolean): void {
		// reset
		this.tableAnimClass = '';
		if (withHeader) this.headerAnimClass = '';

		requestAnimationFrame(() => {
			this.tableAnimClass = 'animate-swipe-right-in';
			if (withHeader) this.headerAnimClass = 'animate-swipe-right-in';
		});
	}

	/**
	 * Retourne les métadonnées de la page actuellement affichée.
	 *
	 * @returns {RankingPage | undefined} L’objet de la page courante,
	 * ou `undefined` si aucune page n’est disponible.
	 */
	get currentPageMeta() {
		return this.pages?.[this.currentIndex];
	}

	/**
	 * Indique si la page courante est la première de son groupe (discipline).
	 *
	 * @returns {boolean} `true` si `pageNumberInGroup === 1`, sinon `false`.
	 */
	get isFirstPageOfGroup(): boolean {
		const p = this.currentPageMeta;
		return !!p && p.pageNumberInGroup === 1;
	}

	/**
	 * Indique si la page courante est la dernière de son groupe (discipline).
	 *
	 * @returns {boolean} `true` si `pageNumberInGroup === pageCountInGroup`, sinon `false`.
	 */
	get isLastPageOfGroup(): boolean {
		const p = this.currentPageMeta;
		return !!p && p.pageNumberInGroup === p.pageCountInGroup;
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Helpers
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Calcule la durée d’affichage d’une page en millisecondes (base + 1 s par tireur).
	 *
	 * @param {RankingPage} page - Page dont le nombre de lignes (rows) détermine la durée.
	 * @returns {number} Durée d’affichage en millisecondes.
	 */
	private getPageDisplayDuration(page: RankingPage): number {
		const BASE_MS = 10_000;
		const PER_SHOOTER_MS = 1_000;
		const n = page?.rows?.length ?? 0;
		return BASE_MS + n * PER_SHOOTER_MS;
	}

	/**
	 * Convertit une valeur potentiellement invalide en nombre sûr (retourne 0 si absent, NaN ou infini).
	 *
	 * @param {number | null | undefined} v - Valeur à convertir en nombre fini.
	 * @returns {number} Le nombre valide, ou 0 en repli.
	 */
	private toNum(v: number | null | undefined): number {
		return typeof v === 'number' && isFinite(v) ? v : 0;
	}

	/**
	 * Compare deux chaînes en ordre alphabétique français, insensible à la casse et aux accents.
	 *
	 * @param {string | undefined} [a] - Première chaîne à comparer.
	 * @param {string | undefined} [b] - Deuxième chaîne à comparer.
	 * @returns {number} Négatif si `a` < `b`, 0 si égal, positif si `a` > `b`.
	 */
	private cmpAlpha(a?: string, b?: string): number {
		return (a ?? '').localeCompare(b ?? '', 'fr', { sensitivity: 'base' });
	}

	/**
	 * Normalise une chaîne en minuscules et sans accents.
	 *
	 * @param {string | null | undefined} [s] - Chaîne à normaliser.
	 * @returns {string} Chaîne normalisée (minuscule, sans accents).
	 */
	private normalize(s?: string | null): string {
		return (s ?? '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
	}

	/**
	 * Détermine si un libellé correspond à une catégorie Senior ou Dame.
	 *
	 * @param {string} categoryName - Libellé de la catégorie (ex. "Senior 1", "Dame 2").
	 * @returns {boolean} `true` si la catégorie est Senior/Dame, sinon `false`.
	 */
	private isSeniorOrDameCategory(categoryName: string): boolean {
		const n = this.normalize(categoryName);
		return /\b(senior|dame)\s*(1|2|3)?\b/.test(n);
	}

	/**
	 * Retourne le score d’une série S1..S6 pour un tireur (0 si vide ou invalide).
	 *
	 * @param {Shooter} s - Tireur dont on récupère le score de série.
	 * @param {1|2|3|4|5|6} idx - Numéro de série à lire (S1 à S6).
	 * @returns {number} Score numérique de la série, ou 0 si absent/invalide.
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

	// ──────────────────────────────────────────────────────────────────────────────
	// Barre de chargement
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Lance l’animation de la barre de progression : reset instantané
	 * à 100% puis transition linéaire vers 0% sur deux frames.
	 *
	 * @param {number} durationMs - Durée de la transition en millisecondes (100% → 0%).
	 * @returns {void} Ne retourne rien.
	 */
	private startProgressBar(durationMs: number): void {
		const run = ++this.progressRun;

		// 1) Reset instantané, barre pleine, sans transition
		this.progressStyle = { width: '100%', transition: 'none' };

		// 2) Première frame : on force un reflow pour figer l’état visuellement
		requestAnimationFrame(() => {
			if (run !== this.progressRun || this.destroyed) return;
			// force le reflow ; pas besoin d'ElementRef ici
			void document.body.offsetWidth;

			// 3) Deuxième frame : on lance la transition vers 0%
			requestAnimationFrame(() => {
				if (run !== this.progressRun || this.destroyed) return;
				this.progressStyle = {
					width: '0%',
					transition: `width ${durationMs}ms linear`,
				};
			});
		});
	}

	/**
	 * Réinitialise instantanément la barre de progression et invalide toute animation en cours.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	private resetProgressBar(): void {
		this.progressRun++; // invalide les rAF précédents
		this.progressStyle = { width: '100%', transition: 'none' };
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// Bouton de mise en plein écran
	// ──────────────────────────────────────────────────────────────────────────────

	/**
	 * Affiche temporairement le bouton plein écran
	 * et relance le timer d’auto-masquage (2s).
	 *
	 * @returns {void} Ne retourne rien.
	 */
	private showFsButtonNow(): void {
		this.showFsButton = true;
		clearTimeout(this.hideFsBtnTimer);
		this.hideFsBtnTimer = setTimeout(() => (this.showFsButton = false), 2000);
	}

	/**
	 * Affiche le bouton plein écran lors d’un mouvement de souris.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	@HostListener('document:mousemove')
	onDocMouseMove(): void {
		this.showFsButtonNow();
	}

	/**
	 * Met à jour l’état plein écran (`isFullscreen`).
	 * @returns {void} Ne retourne rien.
	 */
	private updateFullscreenState(): void {
		const d: any = document;
		this.isFullscreen = !!(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement);
	}

	/**
	 * Bascule l’affichage entre plein écran et fenêtre selon l’état courant.
	 * @returns {Promise<void>} Promesse résolue après l’entrée ou la sortie du mode plein écran.
	 */
	async toggleFullscreen(): Promise<void> {
		if (this.isFullscreen) {
			await this.exitFullscreen();
		} else {
			await this.enterFullscreen();
		}
	}

	/**
	 * Passe l’application en plein écran.
	 *
	 * @returns {Promise<void>} Promesse résolue après la demande de plein écran.
	 */
	private async enterFullscreen(): Promise<void> {
		const el: any = document.documentElement;
		if (el.requestFullscreen) await el.requestFullscreen();
		else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
		else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
		else if (el.msRequestFullscreen) await el.msRequestFullscreen();
		this.updateFullscreenState();
	}

	/**
	 * Quitte le plein écran.
	 *
	 * @returns {Promise<void>} Promesse résolue après avoir quitter le plein écran.
	 */
	private async exitFullscreen(): Promise<void> {
		const d: any = document;
		if (document.exitFullscreen) await document.exitFullscreen();
		else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
		else if (d.mozCancelFullScreen) await d.mozCancelFullScreen();
		else if (d.msExitFullscreen) await d.msExitFullscreen();
		this.updateFullscreenState();
	}

	/**
	 * Affiche le bouton plein écran au moindre mouvement global de souris et relance le timer d’auto-masquage.
	 *
	 * @param {MouseEvent} _e - Événement souris provenant du listener `document:mousemove`.
	 * @returns {void} Ne retourne rien.
	 */
	@HostListener('document:mousemove', ['$event'])
	onGlobalMouseMove(_e: MouseEvent) {
		// dès qu'on bouge la souris n'importe où, on montre le bouton et on relance le timer
		this.showFsButton = true;
		this.restartFsHideTimer(); // 1.8s par défaut
	}

	/**
	 * Épingle le bouton plein écran lors du survol pour le garder visible et annule le timer courant.
	 * @returns {void} Ne retourne rien ; met `fsPinned` et `showFsButton` à true et efface le timer.
	 */
	onFsMouseEnter() {
		// on "épingle" le bouton -> tant que la souris est dessus il reste visible
		this.fsPinned = true;
		this.showFsButton = true;
		if (this.fsHideTimer) {
			clearTimeout(this.fsHideTimer);
			this.fsHideTimer = null;
		}
	}

	/**
	 * Désépingle le bouton plein écran en sortie de survol et lance un court délai avant masquage.
	 *
	 * @returns {void} Ne retourne rien.
	 */
	onFsMouseLeave() {
		// on "dé-épingle" et on lance un petit délai avant de cacher
		this.fsPinned = false;
		this.restartFsHideTimer(700); // petit délai pour éviter un flicker
	}

	/**
	 * (Ré)initialise le timer de masquage du bouton plein écran, en annulant l’éventuel timer actif.
	 *
	 * @param {number} [delay=1800] - Délai en millisecondes avant de masquer le bouton si non épinglé.
	 * @returns {void} Ne retourne rien..
	 */
	private restartFsHideTimer(delay = 1800) {
		if (this.fsHideTimer) clearTimeout(this.fsHideTimer);
		this.fsHideTimer = setTimeout(() => {
			if (!this.fsPinned) this.showFsButton = false;
		}, delay);
	}
}
