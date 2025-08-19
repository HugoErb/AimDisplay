import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';
import { ActivatedRoute } from '@angular/router';
import { RankedShooter, Shooter } from '../interfaces/shooter';
import { NgZone } from '@angular/core';

interface Page {
	weapon: string;
	distance: string;
	category: string;
	rows: RankedShooter[]; // tranche affichée
	groupSize: number; // nb total de tireurs dans la discipline
	pageNumberInGroup: number; // numéro de page dans la discipline (1..pageCountInGroup)
	pageCountInGroup: number; // nb de pages pour la discipline
}

@Component({
	selector: 'app-ranking',
	standalone: true,
	imports: [AutoCompleteModule, CommonModule],
	templateUrl: './ranking.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RankingComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService, private route: ActivatedRoute, private ngZone: NgZone) {}

	currentPage: number = 1;
	totalPages: number = 5;
	competitionId!: number;
	competitionTitle = '';
	currentIndex = 0;
	rotationMs = 8000;
	rotationTimer: any;
	participantsCount = 0; // ← number of shooters on current page
	discipline = '';

	pages: Page[] = [];
	classementData: RankedShooter[] = [];
	private readonly PAGE_SIZE = 8;

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

		this.totalPages = this.pages.length;
		this.showPage(0);
		this.startRotation();
	}

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

	private buildPagesFromShooters(shooters: Shooter[]): Page[] {
		// Groupe par triplet discipline
		const keyOf = (s: Shooter) => `${s.distance}|||${s.weapon}|||${s.categoryName}`;
		const groups = new Map<string, Shooter[]>();
		for (const s of shooters) {
			const k = keyOf(s);
			if (!groups.has(k)) groups.set(k, []);
			groups.get(k)!.push(s);
		}

		const pages: Page[] = [];

		for (const [key, list] of groups) {
			const [distance, weapon, category] = key.split('|||');

			// enrichit + détermine la "dernière série jouée"
			const enriched: RankedShooter[] = list.map((s) => ({
				...s,
				isSeniorOrDame: this.isSeniorOrDameCategory(s.categoryName),
				rank: 0,
			}));

			// Tri :
			// 1) totalScore DESC
			// 2) dernière série jouée (S4 si senior/dame, sinon S6)
			// 3) fallback: on remonte S3->S1 pour casser une égalité totale
			enriched.sort((a, b) => {
				const at = Number(a.totalScore ?? 0);
				const bt = Number(b.totalScore ?? 0);
				if (bt !== at) return bt - at;

				const lastA = a.isSeniorOrDame ? 4 : 6;
				const lastB = b.isSeniorOrDame ? 4 : 6;
				const al = this.serieScore(a, lastA as 4 | 6);
				const bl = this.serieScore(b, lastB as 4 | 6);
				if (bl !== al) return bl - al;

				// Fallback : S3 -> S1
				for (let i = 3 as 3 | 2 | 1; i >= 1; i = (i - 1) as 3 | 2 | 1) {
					const ai = this.serieScore(a, i);
					const bi = this.serieScore(b, i);
					if (bi !== ai) return bi - ai;
				}
				return 0;
			});

			// Numérotation des rangs (après tie-break)
			enriched.forEach((s, i) => (s.rank = i + 1));

			// Pagination par tranches de 8
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

	/**
	 * Affiche la page de classement située à l’index donné et met à jour l’état du composant.
	 *
	 * @param {number} index Index de la page à afficher (base 0).
	 *                       Doit être compris entre `0` et `this.pages.length - 1`.
	 */
	private showPage(index: number): void {
		this.currentIndex = index;
		const page = this.pages[index];

		this.classementData = page.rows;
		this.participantsCount = page.groupSize; // nb total dans la discipline
		this.currentPage = page.pageNumberInGroup; // X
		this.totalPages = page.pageCountInGroup; // Y
		this.discipline = `${page.weapon} ${page.distance} - ${page.category}`;
	}

	/**
	 * Lance la rotation automatique des pages de classement.
	 */
	private startRotation(): void {
		if (this.rotationTimer) {
			clearInterval(this.rotationTimer);
			this.rotationTimer = null;
		}

		if (!Array.isArray(this.pages) || this.pages.length <= 1) return;

		this.rotationTimer = window.setInterval(() => {
			const next = (this.currentIndex + 1) % this.pages.length;
			this.ngZone.run(() => this.showPage(next));
		}, this.rotationMs);
	}

	private normalize = (s: string | undefined | null) =>
		(s ?? '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

	private isSeniorOrDameCategory = (categoryName: string) => {
		const n = this.normalize(categoryName);
		// "senior" ou "dame", optionnellement suivis de 1/2/3
		return /\b(senior|dame)\s*(1|2|3)?\b/.test(n);
	};

	private serieScore(s: Shooter, idx: 1 | 2 | 3 | 4 | 5 | 6): number {
		const map: Record<number, number | null | undefined> = {
			1: s.scoreSerie1,
			2: s.scoreSerie2,
			3: s.scoreSerie3,
			4: s.scoreSerie4,
			5: s.scoreSerie5,
			6: s.scoreSerie6,
		};
		return Number(map[idx] ?? 0);
	}
}
