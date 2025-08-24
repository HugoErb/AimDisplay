import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Club } from '../interfaces/club';
import { ShooterCategory } from '../interfaces/shooter-category';
import { Weapon } from '../interfaces/weapon';
import { Distance } from '../interfaces/distance';
import { CommonService } from '../services/common.service';
import { Competition } from '../interfaces/competition';
import { Shooter } from '../interfaces/shooter';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
	private supabase: SupabaseClient;

	constructor(private zone: NgZone, private commonService: CommonService) {
		this.supabase = this.zone.runOutsideAngular(() =>
			createClient(environment.supabase.url, environment.supabase.anonKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: true,
				},
			})
		);
	}

	// CREATE FUNCTIONS /////////////////////////////////////////////////////////////////////

	/**
	 * Crée un tireur (une ligne par combinaison distance/arme/catégorie).
	 *
	 * @param payload Données de base + catégories/séries pour UNE combinaison.
	 * Les scores non renseignés sont traités comme 0.
	 * @return Le tireur créé tel qu’enregistré en base.
	 */
	async createShooter(payload: {
		shooterLastName: string;
		shooterFirstName: string;
		shooterEmail?: string | null;
		competitionId: number;
		clubId: number;
		distanceId: number;
		weaponId: number;
		categoryId: number;
		seriesScores?: Array<number | null>; // Scores de la série [1..6]
	}) {
		try {
			const { data: authUserData, error: authUserError } = await this.supabase.auth.getUser();
			if (authUserError) throw new Error(authUserError.message);

			const currentUser = authUserData?.user;
			if (!currentUser) throw new Error('Aucun utilisateur connecté.');

			const trimmedLastName = payload.shooterLastName?.trim();
			const trimmedFirstName = payload.shooterFirstName?.trim();
			if (!trimmedLastName || !trimmedFirstName) {
				throw new Error('Nom et prénom obligatoires.');
			}

			const { competitionId, clubId, distanceId, weaponId, categoryId } = payload;

			if (!competitionId) throw new Error('competition_id manquant.');
			if (!clubId) throw new Error('club_id manquant.');
			if (!distanceId) throw new Error('distance_id manquant.');
			if (!weaponId) throw new Error('weapon_id manquant.');
			if (!categoryId) throw new Error('category_id manquant.');

			const allSeriesScores = payload.seriesScores ?? [];

			const getNumericOrNull = (value: any): number | null => (typeof value === 'number' && isFinite(value) ? value : null);

			const serie1ScoreValue = getNumericOrNull(allSeriesScores[0]);
			const serie2ScoreValue = getNumericOrNull(allSeriesScores[1]);
			const serie3ScoreValue = getNumericOrNull(allSeriesScores[2]);
			const serie4ScoreValue = getNumericOrNull(allSeriesScores[3]);
			const serie5ScoreValue = getNumericOrNull(allSeriesScores[4]);
			const serie6ScoreValue = getNumericOrNull(allSeriesScores[5]);

			const { data: insertedShooter, error: insertError } = await this.supabase
				.from('shooters')
				.insert({
					last_name: trimmedLastName,
					first_name: trimmedFirstName,
					email: payload.shooterEmail ?? null,
					club_id: clubId,
					competition_id: competitionId,
					distance_id: distanceId,
					weapon_id: weaponId,
					category_id: categoryId,
					serie1_score: serie1ScoreValue,
					serie2_score: serie2ScoreValue,
					serie3_score: serie3ScoreValue,
					serie4_score: serie4ScoreValue,
					serie5_score: serie5ScoreValue,
					serie6_score: serie6ScoreValue,
					user_id: currentUser.id,
				})
				.select('*')
				.single();

			if (insertError) throw new Error(insertError.message);
			return insertedShooter;
		} catch (error: any) {
			this.zone.run(() => this.commonService.showSwalToast(error?.message ?? 'Erreur lors de la création du tireur', 'error'));
			throw error;
		}
	}

	/**
	 * Crée une compétition et l’associe à l’utilisateur courant via son UUID.
	 *
	 * @param payload Données: name, startDate, endDate, prixInscription, prixCategSup.
	 * @return La compétition créée telle qu’enregistrée en base.
	 */
	async createCompetition(payload: {
		name: string;
		startDate: string | Date;
		endDate: string | Date;
		prixInscription: number;
		prixCategSup: number;
	}): Promise<Competition> {
		try {
			const { data: userData, error: userError } = await this.supabase.auth.getUser();
			if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
			const user = userData?.user;
			if (!user) throw new Error('Aucun utilisateur connecté.');

			const name = payload.name?.trim();
			if (!name) throw new Error('Le nom de la compétition est obligatoire.');

			const startISO = typeof payload.startDate === 'string' ? payload.startDate : this.toIsoDate(payload.startDate);
			const endISO = typeof payload.endDate === 'string' ? payload.endDate : this.toIsoDate(payload.endDate);

			if (!startISO || !endISO) throw new Error('Les dates de début et de fin sont obligatoires.');

			const { data, error } = await this.supabase
				.from('competitions')
				.insert({
					name,
					start_date: startISO,
					end_date: endISO,
					price: payload.prixInscription ?? 0,
					sup_category_price: payload.prixCategSup ?? 0,
					user_id: user.id,
				})
				.select('*')
				.single<Competition>();

			if (error) throw new Error(`Erreur lors de la création de la compétition: ${error.message}`);

			this.zone.run(() => this.commonService.showSwalToast('Nouvelle compétition créée !'));
			return data!;
		} catch (e: any) {
			const msg = e?.message ?? 'Une erreur est survenue lors de la création de la compétition.';
			this.zone.run(() => this.commonService.showSwalToast(msg, 'error'));
			throw e;
		}
	}

	/**
	 * Formate une Date en 'YYYY-MM-DD'.
	 * @param d Date à formater.
	 * @return Chaîne ISO sans l’heure.
	 */
	private toIsoDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	/**
	 * Crée un club et l’associe à l’utilisateur courant via son UUID.
	 *
	 * @param payload Données minimales du club (name, city).
	 * @return Le club créé tel qu’enregistré en base.
	 */
	async createClub(payload: Pick<Club, 'name' | 'city'>): Promise<Club> {
		try {
			const { data: userData, error: userError } = await this.supabase.auth.getUser();
			if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
			const user = userData?.user;
			if (!user) throw new Error('Aucun utilisateur connecté.');

			const name = payload.name?.trim();
			const city = payload.city?.trim();
			if (!name || !city) throw new Error('Les champs "name" et "city" sont obligatoires.');

			const { data, error } = await this.supabase.from('clubs').insert({ name, city, user_id: user.id }).select('*').single<Club>();

			if (error) throw new Error(`Erreur lors de la création du club: ${error.message}`);

			this.zone.run(() => this.commonService.showSwalToast('Nouveau club créé !'));

			return data!;
		} catch (e: any) {
			const msg = e?.message ?? 'Une erreur est survenue lors de la création du club.';
			this.zone.run(() => this.commonService.showSwalToast(msg, 'error'));
			throw e;
		}
	}

	// GET FUNCTIONS /////////////////////////////////////////////////////////////////////

	/**
	 * Récupère tous les tireurs de l’utilisateur courant depuis la table `shooters`
	 * puis normalise les données pour l’interface `Shooter`.
	 *
	 * @returns {Promise<Shooter[]>} La liste des tireurs normalisés pour l’UI.
	 */
	async getShooters(): Promise<Shooter[]> {
		// Utilisateur courant
		const { data: userData, error: userError } = await this.supabase.auth.getUser();
		if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
		const currentUser = userData?.user;
		if (!currentUser) throw new Error('Aucun utilisateur connecté.');

		// Lecture brute des tireurs (toutes colonnes)
		const { data: shooterRows, error: shootersError } = await this.supabase
			.from('shooters')
			.select('*')
			.eq('user_id', currentUser.id)
			.order('id', { ascending: true });

		if (shootersError) throw new Error(`Erreur lors de la récupération des tireurs: ${shootersError.message}`);
		const rows = shooterRows ?? [];
		if (!rows.length) return [];

		// Référentiels
		const [{ data: competitions }, { data: clubs }, { data: distances }, { data: weapons }, { data: categories }] = await Promise.all([
			this.supabase.from('competitions').select('id, name'),
			this.supabase.from('clubs').select('id, name'),
			this.supabase.from('distances').select('id, label'),
			this.supabase.from('weapons').select('id, label'),
			this.supabase.from('categories').select('id, label'),
		]);

		const mapName = <T extends { id: number; name?: string; label?: string }>(arr?: T[] | null) =>
			new Map((arr ?? []).map((x) => [x.id, (x as any).name ?? (x as any).label ?? '']));

		const competitionById = mapName(competitions as any[]);
		const clubById = mapName(clubs as any[]);
		const distanceById = mapName(distances as any[]);
		const weaponById = mapName(weapons as any[]);
		const categoryById = mapName(categories as any[]);

		const toNum = (v: any) => (v == null ? 0 : Number(v) || 0);

		return rows.map((row: any): Shooter => {
			const s1 = toNum(row.serie1_score);
			const s2 = toNum(row.serie2_score);
			const s3 = toNum(row.serie3_score);
			const s4 = toNum(row.serie4_score);
			const s5 = toNum(row.serie5_score);
			const s6 = toNum(row.serie6_score);
			const total = s1 + s2 + s3 + s4 + s5 + s6;

			return {
				id: row.id,
				lastName: row.last_name,
				firstName: row.first_name,
				email: row.email,
				competitionName: competitionById.get(row.competition_id) ?? '',
				clubName: clubById.get(row.club_id) ?? '',
				distance: distanceById.get(row.distance_id) ?? '',
				weapon: weaponById.get(row.weapon_id) ?? '',
				categoryName: categoryById.get(row.category_id) ?? '',
				scoreSerie1: s1,
				scoreSerie2: s2,
				scoreSerie3: s3,
				scoreSerie4: s4,
				scoreSerie5: s5,
				scoreSerie6: s6,
				totalScore: Number(total.toFixed(2)),
				userId: row.user_id,
			};
		});
	}

	/**
	 * Récupère tous les tireurs de l’utilisateur courant depuis la table `shooters`
	 * puis normalise les données pour l’interface `Shooter`.
	 *
	 * @returns {Promise<Shooter[]>} La liste des tireurs normalisés pour l’UI.
	 */
	async getShootersByCompetitionId(competitionId: number): Promise<Shooter[]> {
		// Utilisateur courant
		const { data: userData, error: userError } = await this.supabase.auth.getUser();
		if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
		const currentUser = userData?.user;
		if (!currentUser) throw new Error('Aucun utilisateur connecté.');

		// Récupère les tireurs pour la compétition en paramètre
		const { data: shooterRows, error: shootersError } = await this.supabase
			.from('shooters')
			.select('*')
			.eq('user_id', currentUser.id)
			.eq('competition_id', competitionId)
			.order('id', { ascending: true });

		if (shootersError) throw new Error(`Erreur lors de la récupération des tireurs: ${shootersError.message}`);
		const rows = shooterRows ?? [];
		if (!rows.length) return [];

		// Référentiels
		const [{ data: competitions }, { data: clubs }, { data: distances }, { data: weapons }, { data: categories }] = await Promise.all([
			this.supabase.from('competitions').select('id, name'),
			this.supabase.from('clubs').select('id, name'),
			this.supabase.from('distances').select('id, label'),
			this.supabase.from('weapons').select('id, label'),
			this.supabase.from('categories').select('id, label'),
		]);

		const mapName = <T extends { id: number; name?: string; label?: string }>(arr?: T[] | null) =>
			new Map((arr ?? []).map((x) => [x.id, (x as any).name ?? (x as any).label ?? '']));

		const competitionById = mapName(competitions as any[]);
		const clubById = mapName(clubs as any[]);
		const distanceById = mapName(distances as any[]);
		const weaponById = mapName(weapons as any[]);
		const categoryById = mapName(categories as any[]);

		const toNum = (v: any) => (v == null ? 0 : Number(v) || 0);

		return rows.map((row: any): Shooter => {
			const s1 = toNum(row.serie1_score);
			const s2 = toNum(row.serie2_score);
			const s3 = toNum(row.serie3_score);
			const s4 = toNum(row.serie4_score);
			const s5 = toNum(row.serie5_score);
			const s6 = toNum(row.serie6_score);
			const total = s1 + s2 + s3 + s4 + s5 + s6;

			return {
				id: row.id,
				lastName: row.last_name,
				firstName: row.first_name,
				email: row.email,
				competitionName: competitionById.get(row.competition_id) ?? '',
				clubName: clubById.get(row.club_id) ?? '',
				distance: distanceById.get(row.distance_id) ?? '',
				weapon: weaponById.get(row.weapon_id) ?? '',
				categoryName: categoryById.get(row.category_id) ?? '',
				scoreSerie1: s1,
				scoreSerie2: s2,
				scoreSerie3: s3,
				scoreSerie4: s4,
				scoreSerie5: s5,
				scoreSerie6: s6,
				totalScore: Number(total.toFixed(2)),
				userId: row.user_id,
			};
		});
	}

	/**
	 * Récupère les compétitions de l’utilisateur courant (mappées en camelCase avec dates en Date).
	 * @param none
	 * @return La liste des compétitions appartenant à l’utilisateur connecté.
	 */
	async getCompetitions(): Promise<Competition[]> {
		// Récupération de l'utilisateur courant
		const { data: authData, error: authError } = await this.supabase.auth.getUser();
		if (authError) throw new Error(`Impossible de récupérer l'utilisateur: ${authError.message}`);
		const currentUser = authData?.user;
		if (!currentUser) throw new Error('Aucun utilisateur connecté.');

		const { data: competitionRows, error: queryError } = await this.supabase
			.from('competitions')
			.select('id,name,start_date,end_date,price,sup_category_price,user_id')
			.eq('user_id', currentUser.id)
			.order('id', { ascending: true });

		if (queryError) {
			throw new Error(`Erreur lors de la récupération des compétitions: ${queryError.message}`);
		}

		const parseYmdToDate = (ymd: string): Date => {
			const [year, month, day] = ymd.split('-').map(Number);
			return new Date(year, month - 1, day);
		};

		return (competitionRows ?? []).map((row: any) => ({
			id: row.id,
			name: row.name,
			startDate: parseYmdToDate(row.start_date),
			endDate: parseYmdToDate(row.end_date),
			price: row.price,
			supCategoryPrice: row.sup_category_price,
			userId: row.user_id,
		})) as Competition[];
	}

	/**
	 * Récupère la liste des clubs de l’utilisateur courant.
	 *
	 * @return La liste des clubs appartenant à l’utilisateur connecté.
	 */
	async getClubs(): Promise<Club[]> {
		// Récupération de l'utilisateur courant
		const { data: userData, error: userError } = await this.supabase.auth.getUser();
		if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
		const user = userData?.user;
		if (!user) throw new Error('Aucun utilisateur connecté.');

		const { data, error } = await this.supabase.from('clubs').select('*').eq('user_id', user.id).order('id', { ascending: true });

		if (error) throw new Error(`Erreur lors de la récupération des clubs: ${error.message}`);
		return (data ?? []) as Club[];
	}

	/**
	 * Récupère la liste des armes ordonnées par identifiant.
	 * @return La liste des armes.
	 */
	async getWeapons(): Promise<Weapon[]> {
		const { data, error } = await this.supabase.from('weapons').select('*').order('id', { ascending: true });
		if (error) throw error;
		return (data ?? []).map((w: any) => ({
			id: w.id,
			name: w.label,
		})) as Weapon[];
	}

	/**
	 * Récupère la liste des distances ordonnées par identifiant.
	 * @return La liste des distances.
	 */
	async getDistances(): Promise<Distance[]> {
		const { data, error } = await this.supabase.from('distances').select('*').order('id', { ascending: true });
		if (error) throw error;
		return (data ?? []).map((d: any) => ({
			id: d.id,
			name: d.label,
		})) as Distance[];
	}

	/**
	 * Récupère la liste des catégories de tireur ordonnées par identifiant.
	 * @return La liste des catégories.
	 */
	async getCategories(): Promise<ShooterCategory[]> {
		const { data, error } = await this.supabase.from('categories').select('*').order('id', { ascending: true });
		if (error) throw error;
		return (data ?? []).map((c: any) => ({
			id: c.id,
			name: c.label,
		})) as ShooterCategory[];
	}

	/**
	 * Retourne les tireurs d'une compétition donnée, enrichis avec les libellés
	 * (club, distance, arme, catégorie) + toutes les séries et le totalScore (2 décimales).
	 */
	async getShootersByCompetition(competitionId: number): Promise<Shooter[]> {
		const { data: userData, error: userError } = await this.supabase.auth.getUser();
		if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
		const user = userData?.user;
		if (!user) throw new Error('Aucun utilisateur connecté.');

		// Récupération brute des shooters de la compétition
		const { data: rows, error } = await this.supabase
			.from('shooters')
			.select('*')
			.eq('user_id', user.id)
			.eq('competition_id', competitionId)
			.order('id', { ascending: true });

		if (error) throw new Error(`Erreur lors de la récupération des tireurs: ${error.message}`);

		// Référentiels pour libellés
		const [clubs, competitions, distances, weapons, categories] = await Promise.all([
			this.getClubs(),
			this.getCompetitions(),
			this.getDistances(),
			this.getWeapons(),
			this.getCategories(),
		]);

		const clubById = new Map(clubs.map((c) => [c.id, c.name]));
		const competitionById = new Map(competitions.map((c) => [c.id, c.name]));
		const distanceById = new Map(distances.map((d) => [d.id, d.name]));
		const weaponById = new Map(weapons.map((w) => [w.id, w.name]));
		const categoryById = new Map(categories.map((k) => [k.id, k.name]));

		const toNum = (v: any) => (typeof v === 'number' ? v : v == null ? 0 : Number(v) || 0);

		return (rows ?? []).map((row: any): Shooter => {
			const s1 = toNum(row.serie1_score);
			const s2 = toNum(row.serie2_score);
			const s3 = toNum(row.serie3_score);
			const s4 = toNum(row.serie4_score);
			const s5 = toNum(row.serie5_score);
			const s6 = toNum(row.serie6_score);

			const total = s1 + s2 + s3 + s4 + s5 + s6;

			return {
				id: row.id,
				lastName: row.last_name,
				firstName: row.first_name,
				email: row.email,
				competitionName: competitionById.get(row.competition_id) ?? '',
				clubName: clubById.get(row.club_id) ?? '',
				distance: distanceById.get(row.distance_id) ?? '',
				weapon: weaponById.get(row.weapon_id) ?? '',
				categoryName: categoryById.get(row.category_id) ?? '',
				scoreSerie1: s1,
				scoreSerie2: s2,
				scoreSerie3: s3,
				scoreSerie4: s4,
				scoreSerie5: s5,
				scoreSerie6: s6,
				totalScore: Number(total.toFixed(2)),
				userId: row.user_id,
			};
		});
	}

	/**
	 * Retourne toutes les participations d'un tireur (toutes compétitions),
	 * enrichies avec les libellés (club, distance, arme, catégorie) + séries et totalScore (2 décimales).
	 *
	 * @param shooterKey  objet ou string permettant d'identifier le tireur :
	 *   - { lastName, firstName } ou { fullName }
	 *   - string "Nom Prénom"
	 */
	async getShooterResults(shooterKey: { firstName?: string; lastName?: string; fullName?: string } | string): Promise<Shooter[]> {
		// --- Auth utilisateur (même pattern que getShootersByCompetition)
		const { data: userData, error: userError } = await this.supabase.auth.getUser();
		if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
		const user = userData?.user;
		if (!user) throw new Error('Aucun utilisateur connecté.');

		// --- Extraction Nom/Prénom
		const clean = (s: string) =>
			(s || '')
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.trim();
		let lastName = '';
		let firstName = '';

		if (typeof shooterKey === 'string') {
			const parts = shooterKey.split(/\s+/);
			lastName = clean(parts[0] || '');
			firstName = clean(parts.slice(1).join(' ') || '');
		} else {
			if (shooterKey?.fullName) {
				const p = shooterKey.fullName.split(/\s+/);
				lastName = clean(shooterKey.lastName || p[0] || '');
				firstName = clean(shooterKey.firstName || p.slice(1).join(' ') || '');
			} else {
				lastName = clean(shooterKey?.lastName || '');
				firstName = clean(shooterKey?.firstName || '');
			}
		}

		// --- Récupération brute des lignes pour cet utilisateur (filtre par nom/prénom si fournis)
		let query = this.supabase.from('shooters').select('*').eq('user_id', user.id);

		// On applique un filtrage large côté SQL ; on affinera côté JS avec normalisation
		if (lastName) query = query.ilike('last_name', `%${lastName}%`);
		if (firstName) query = query.ilike('first_name', `%${firstName}%`);

		// Ordre stable
		query = query.order('competition_id', { ascending: true }).order('id', { ascending: true });

		const { data: rows, error } = await query;
		if (error) throw new Error(`Erreur lors de la récupération des résultats du tireur: ${error.message}`);

		// --- Référentiels pour libellés (même logique que l'autre méthode)
		const [clubs, competitions, distances, weapons, categories] = await Promise.all([
			this.getClubs(),
			this.getCompetitions(),
			this.getDistances(),
			this.getWeapons(),
			this.getCategories(),
		]);

		const clubById = new Map(clubs.map((c) => [c.id, c.name]));
		const competitionById = new Map(competitions.map((c) => [c.id, c.name]));
		const distanceById = new Map(distances.map((d) => [d.id, d.name]));
		const weaponById = new Map(weapons.map((w) => [w.id, w.name]));
		const categoryById = new Map(categories.map((k) => [k.id, k.name]));

		const toNum = (v: any) => (typeof v === 'number' ? v : v == null ? 0 : Number(v) || 0);
		const norm = (s: string) =>
			(s || '')
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.trim();

		// --- Mapping + filtre fin (exact Nom/Prénom si fournis)
		const mapped = (rows ?? []).map((row: any): Shooter => {
			const s1 = toNum(row.serie1_score);
			const s2 = toNum(row.serie2_score);
			const s3 = toNum(row.serie3_score);
			const s4 = toNum(row.serie4_score);
			const s5 = toNum(row.serie5_score);
			const s6 = toNum(row.serie6_score);
			const total = s1 + s2 + s3 + s4 + s5 + s6;

			return {
				id: row.id,
				lastName: row.last_name,
				firstName: row.first_name,
				email: row.email,
				competitionName: competitionById.get(row.competition_id) ?? '',
				clubName: clubById.get(row.club_id) ?? '',
				distance: distanceById.get(row.distance_id) ?? '',
				weapon: weaponById.get(row.weapon_id) ?? '',
				categoryName: categoryById.get(row.category_id) ?? '',
				scoreSerie1: s1,
				scoreSerie2: s2,
				scoreSerie3: s3,
				scoreSerie4: s4,
				scoreSerie5: s5,
				scoreSerie6: s6,
				totalScore: Number(total.toFixed(2)),
				userId: row.user_id,
			};
		});

		// Filtrage exact (accents/casse insensibles) si Nom/Prénom fournis
		const hasFilter = Boolean(lastName || firstName);
		return hasFilter
			? mapped.filter((r) => (!lastName || norm(r.lastName) === norm(lastName)) && (!firstName || norm(r.firstName) === norm(firstName)))
			: mapped;
	}

	// DELETE FUNCTIONS /////////////////////////////////////////////////////////////////////

	/**
	 * Supprime définitivement un club en base de données (table `clubs`) via Supabase.
	 *
	 * @param {number} clubId - Identifiant unique du club à supprimer.
	 * @returns {Promise<void>} Une promesse résolue une fois la suppression effectuée.
	 */
	async deleteClubById(clubId: number): Promise<void> {
		try {
			const { data: authUserData, error: authUserError } = await this.supabase.auth.getUser();
			if (authUserError) throw new Error(authUserError.message);
			const currentUser = authUserData?.user;
			if (!currentUser) throw new Error('Aucun utilisateur connecté.');

			const { data, error } = await this.supabase.from('clubs').delete().eq('id', clubId).select('id').limit(1);

			if (error) throw new Error(error.message);

			const deleted = Array.isArray(data) && data.length > 0;

			this.commonService.showSwalToast(
				deleted ? 'Club supprimé !' : 'Aucun club supprimé (non trouvé ou déjà supprimé).',
				deleted ? 'success' : 'info'
			);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression du club', 'error');
		}
	}

	/**
	 * Supprime définitivement une competition en base de données (table `competitions`) via Supabase.
	 *
	 * @param {number} competitionId - Identifiant unique de la competition à supprimer.
	 * @returns {Promise<void>} Une promesse résolue une fois la suppression effectuée.
	 */
	async deleteCompetitionById(competitionId: number): Promise<void> {
		try {
			const { data: authUserData, error: authUserError } = await this.supabase.auth.getUser();
			if (authUserError) throw new Error(authUserError.message);
			const currentUser = authUserData?.user;
			if (!currentUser) throw new Error('Aucun utilisateur connecté.');

			const { data, error } = await this.supabase.from('competitions').delete().eq('id', competitionId).select('id').limit(1);

			if (error) throw new Error(error.message);

			const deleted = Array.isArray(data) && data.length > 0;

			this.commonService.showSwalToast(
				deleted ? 'Competition supprimée !' : 'Aucune competition supprimée (non trouvé ou déjà supprimé).',
				deleted ? 'success' : 'info'
			);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression de la competition', 'error');
		}
	}

	/**
	 * Supprime définitivement un tireur en base de données (table `shooters`) via Supabase.
	 *
	 * @param {number} shooterId - Identifiant unique du tireur à supprimer.
	 * @returns {Promise<void>} Une promesse résolue une fois la suppression effectuée.
	 */
	async deleteShooterById(shooterId: number): Promise<void> {
		try {
			const { data: authUserData, error: authUserError } = await this.supabase.auth.getUser();
			if (authUserError) throw new Error(authUserError.message);
			const currentUser = authUserData?.user;
			if (!currentUser) throw new Error('Aucun utilisateur connecté.');

			const { data, error } = await this.supabase.from('shooters').delete().eq('id', shooterId).select('id').limit(1);

			if (error) throw new Error(error.message);

			const deleted = Array.isArray(data) && data.length > 0;

			this.commonService.showSwalToast(
				deleted ? 'Tireur supprimé !' : 'Aucun tireur supprimé (non trouvé ou déjà supprimé).',
				deleted ? 'success' : 'info'
			);
		} catch (err: any) {
			this.commonService.showSwalToast(err?.message ?? 'Erreur lors de la suppression du tireur', 'error');
		}
	}

	// UPDATE FUNCTIONS /////////////////////////////////////////////////////////////////////

	/**
	 * Met à jour un tireur (restreint à l'utilisateur courant via son UUID).
	 *
	 * @param shooterId Identifiant du tireur à modifier.
	 * @param payload   Données modifiables du tireur.
	 * @returns La ligne 'shooters' mise à jour telle qu’enregistrée en base.
	 */
	async updateShooterById(
		shooterId: number,
		payload: {
			lastName: string;
			firstName: string;
			email?: string | null;
			clubId: number;
			competitionId: number;
			distanceId: number;
			weaponId: number;
			categoryId: number;
			serie1Score?: number | null;
			serie2Score?: number | null;
			serie3Score?: number | null;
			serie4Score?: number | null;
			serie5Score?: number | null;
			serie6Score?: number | null;
		}
	): Promise<{
		id: number;
		last_name: string;
		first_name: string;
		email: string | null;
		club_id: number;
		competition_id: number;
		distance_id: number;
		weapon_id: number;
		category_id: number;
		serie1_score: number | null;
		serie2_score: number | null;
		serie3_score: number | null;
		serie4_score: number | null;
		serie5_score: number | null;
		serie6_score: number | null;
		user_id: string;
		created_at?: string;
		updated_at?: string;
	}> {
		try {
			const { data: userData, error: userError } = await this.supabase.auth.getUser();
			if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
			const user = userData?.user;
			if (!user) throw new Error('Aucun utilisateur connecté.');
			if (!shooterId) throw new Error('Identifiant de tireur invalide.');

			const trimmedLastName = payload.lastName?.trim();
			const trimmedFirstName = payload.firstName?.trim();
			if (!trimmedLastName || !trimmedFirstName) {
				throw new Error('Les champs "Nom" et "Prénom" sont obligatoires.');
			}

			// Patch à envoyer en BDD (respect des noms de colonnes)
			const updatePatch = {
				last_name: trimmedLastName,
				first_name: trimmedFirstName,
				email: payload.email ?? null,

				club_id: payload.clubId,
				competition_id: payload.competitionId,
				distance_id: payload.distanceId,
				weapon_id: payload.weaponId,
				category_id: payload.categoryId,

				// Les séries peuvent être NULL si non renseignées
				serie1_score: payload.serie1Score ?? null,
				serie2_score: payload.serie2Score ?? null,
				serie3_score: payload.serie3Score ?? null,
				serie4_score: payload.serie4Score ?? null,
				serie5_score: payload.serie5Score ?? null,
				serie6_score: payload.serie6Score ?? null,
			};

			const { data, error } = await this.supabase
				.from('shooters')
				.update(updatePatch)
				.eq('id', shooterId)
				.eq('user_id', user.id)
				.select('*')
				.single();

			if (error) throw new Error(`Erreur lors de la mise à jour du tireur: ${error.message}`);
			if (!data) throw new Error('Tireur introuvable ou non autorisé.');

			this.zone.run(() => this.commonService.showSwalToast('Tireur mis à jour !', 'success'));
			return data!;
		} catch (e: any) {
			const msg = e?.message ?? 'Une erreur est survenue lors de la mise à jour du tireur.';
			this.zone.run(() => this.commonService.showSwalToast(msg, 'error'));
			throw e;
		}
	}

	/**
	 * Met à jour un club (restreint à l'utilisateur courant via son UUID).
	 *
	 * @param clubId  Identifiant du club à modifier.
	 * @param payload Données modifiables du club.
	 * @return Le club mis à jour tel qu’enregistré en base.
	 */
	async updateClubById(clubId: number, payload: Pick<Club, 'name' | 'city'>): Promise<Club> {
		try {
			const { data: userData, error: userError } = await this.supabase.auth.getUser();
			if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
			const user = userData?.user;
			if (!user) throw new Error('Aucun utilisateur connecté.');
			if (!clubId) throw new Error('Identifiant de club invalide.');

			const name = payload.name?.trim();
			const city = payload.city?.trim();
			if (!name || !city) throw new Error('Les champs "name" et "city" sont obligatoires.');

			const { data, error } = await this.supabase
				.from('clubs')
				.update({ name, city })
				.eq('id', clubId)
				.eq('user_id', user.id)
				.select('*')
				.single<Club>();

			if (error) throw new Error(`Erreur lors de la mise à jour du club: ${error.message}`);
			if (!data) throw new Error('Club introuvable ou non autorisé.');

			this.zone.run(() => this.commonService.showSwalToast('Club mis à jour !', 'success'));
			return data!;
		} catch (e: any) {
			const msg = e?.message ?? 'Une erreur est survenue lors de la mise à jour du club.';
			this.zone.run(() => this.commonService.showSwalToast(msg, 'error'));
			throw e;
		}
	}

	/**
	 * Met à jour une compétition (restreint à l'utilisateur courant via son UUID).
	 *
	 * @param competitionId Identifiant de la compétition à modifier.
	 * @param payload       Données modifiables de la compétition.
	 *
	 * @return La compétition mise à jour telle qu’enregistrée en base.
	 */
	async updateCompetitionById(
		competitionId: number,
		payload: {
			name?: string | null;
			startDate?: string | Date | null;
			endDate?: string | Date | null;
			price?: number | null;
			supCategoryPrice?: number | null;
			place?: string | null;
			clubId?: number | null;
		}
	): Promise<Competition> {
		try {
			const { data: userData, error: userError } = await this.supabase.auth.getUser();
			if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
			const user = userData?.user;
			if (!user) throw new Error('Aucun utilisateur connecté.');
			if (!competitionId) throw new Error('Identifiant de compétition invalide.');

			// Normalise une date vers 'YYYY-MM-DD' (ou null si demandé)
			const toYmd = (d: string | Date | null | undefined): string | null | undefined => {
				if (d === undefined) return undefined; // champ non fourni => pas de mise à jour
				if (d === null) return null; // demande explicite d'effacement
				if (typeof d === 'string') return d; // on suppose 'YYYY-MM-DD'
				if (d instanceof Date) {
					const y = d.getFullYear();
					const m = String(d.getMonth() + 1).padStart(2, '0');
					const day = String(d.getDate()).padStart(2, '0');
					return `${y}-${m}-${day}`;
				}
				throw new Error('Format de date invalide.');
			};

			// Ne pousser que les champs fournis
			const updates: any = {};
			if (payload.name !== undefined) updates.name = payload.name?.trim() ?? null;
			if (payload.startDate !== undefined) updates.start_date = toYmd(payload.startDate);
			if (payload.endDate !== undefined) updates.end_date = toYmd(payload.endDate);
			if (payload.price !== undefined) updates.price = payload.price ?? null;
			if (payload.supCategoryPrice !== undefined) updates.sup_category_price = payload.supCategoryPrice ?? null;
			if (payload.place !== undefined) updates.place = payload.place?.trim() ?? null;
			if (payload.clubId !== undefined) updates.club_id = payload.clubId ?? null;

			// Au moins un champ à modifier ?
			if (Object.keys(updates).length === 0) {
				throw new Error('Aucune donnée à mettre à jour.');
			}

			const { data, error } = await this.supabase
				.from('competitions')
				.update(updates)
				.eq('id', competitionId)
				.eq('user_id', user.id)
				.select('*')
				.single<Competition>();

			if (error) throw new Error(`Erreur lors de la mise à jour de la compétition: ${error.message}`);
			if (!data) throw new Error('Compétition introuvable ou non autorisée.');

			this.zone.run(() => this.commonService.showSwalToast('Compétition mise à jour !', 'success'));
			return data!;
		} catch (e: any) {
			const msg = e?.message ?? 'Une erreur est survenue lors de la mise à jour de la compétition.';
			this.zone.run(() => this.commonService.showSwalToast(msg, 'error'));
			throw e;
		}
	}
}
