import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonService } from '../services/common.service';
import { SupabaseService } from '../services/supabase.service';
import { ActivatedRoute } from '@angular/router';
import { RankedShooter, Shooter } from '../interfaces/shooter';
import { NgZone } from '@angular/core';

type GroupPage = {
	distance: string;
	weapon: string;
	category: string;
	rows: RankedShooter[];
};

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

	pages: GroupPage[] = [];
	classementData: RankedShooter[] = [];

	async ngOnInit(): Promise<void> {
		const idParam = this.route.snapshot.paramMap.get('competitionId');
		const nameParam = this.route.snapshot.paramMap.get('competitionName') ?? '';

		const id = Number(idParam);
		if (!Number.isFinite(id) || id <= 0 || !nameParam.trim()) {
			this.commonService.showSwalToast('Compétition invalide.', 'error');
			return;
		}

		this.competitionId = id;
		// paramMap te donne déjà une valeur décodée
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

	private buildPagesFromShooters(shooters: Shooter[]): GroupPage[] {
		const byKey = new Map<string, { distance: string; weapon: string; category: string; items: Shooter[] }>();

		for (const s of shooters) {
			const distance = s.distance ?? '';
			const weapon = s.weapon ?? '';
			const category = s.categoryName ?? '';
			const key = `${distance}|${weapon}|${category}`;
			if (!byKey.has(key)) byKey.set(key, { distance, weapon, category, items: [] });
			byKey.get(key)!.items.push(s);
		}

		const pages: GroupPage[] = [];
		byKey.forEach(({ distance, weapon, category, items }) => {
			// on part de Shooter, on ajoute rank
			const rows: RankedShooter[] = items.map((s) => ({ ...s, rank: 0 })).sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

			// Attribution du rang (gestion des ex aequo sur 2 décimales)
			for (let i = 0; i < rows.length; i++) {
				if (i > 0 && Number((rows[i].totalScore ?? 0).toFixed(2)) === Number((rows[i - 1].totalScore ?? 0).toFixed(2))) {
					rows[i].rank = rows[i - 1].rank; // même rang que le précédent
				} else {
					rows[i].rank = i + 1; // rang suivant
				}
			}

			pages.push({ distance, weapon, category, rows });
		});

		// Option: tri de l’ordre d’affichage des pages
		pages.sort((a, b) => {
			const ca = `${a.weapon} ${a.distance} ${a.category}`.toLowerCase();
			const cb = `${b.weapon} ${b.distance} ${b.category}`.toLowerCase();
			return ca.localeCompare(cb);
		});

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
		this.participantsCount = page.rows.length;
		this.currentPage = index + 1;
		this.discipline = `${page.weapon} ${page.distance} - Catégorie ${page.category}`;
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
}
