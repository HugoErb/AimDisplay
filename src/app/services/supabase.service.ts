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

            const {
            competitionId,
            clubId,
            distanceId,
            weaponId,
            categoryId
            } = payload;

            if (!competitionId) throw new Error('competition_id manquant.');
            if (!clubId) throw new Error('club_id manquant.');
            if (!distanceId) throw new Error('distance_id manquant.');
            if (!weaponId) throw new Error('weapon_id manquant.');
            if (!categoryId) throw new Error('category_id manquant.');

            // On récupère les valeurs  des séries envoyées par le composant
            const allSeriesScores = payload.seriesScores ?? [];

            // Fonction utilitaire : renvoie un nombre ou 0 si invalide
            const getNumericOrZero = (value: any): number =>
            (typeof value === 'number' && isFinite(value)) ? value : 0;

            // Fonction utilitaire : renvoie un nombre ou null si invalide
            const getNumericOrNull = (value: any): number | null =>
            (typeof value === 'number' && isFinite(value)) ? value : null;

            // Séries 1 à 4 → nombre obligatoire (0 par défaut)
            const serie1Score = getNumericOrZero(allSeriesScores[0]);
            const serie2Score = getNumericOrZero(allSeriesScores[1]);
            const serie3Score = getNumericOrZero(allSeriesScores[2]);
            const serie4Score = getNumericOrZero(allSeriesScores[3]);

            // Séries 5 et 6 → null si non renseignées
            const serie5Score = getNumericOrNull(allSeriesScores[4]);
            const serie6Score = getNumericOrNull(allSeriesScores[5]);

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
                serie1_score: serie1Score ?? 0,
                serie2_score: serie2Score ?? 0,
                serie3_score: serie3Score ?? 0,
                serie4_score: serie4Score ?? 0,
                serie5_score: serie5Score != null ? serie5Score : null,
                serie6_score: serie6Score != null ? serie6Score : null,
                user_id: currentUser.id
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
    async createCompetition(payload: { name: string; startDate: string | Date; endDate: string | Date; prixInscription: number; prixCategSup: number;}): Promise<Competition> {
        try {
            const { data: userData, error: userError } = await this.supabase.auth.getUser();
            if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
            const user = userData?.user;
            if (!user) throw new Error('Aucun utilisateur connecté.');

            const name = payload.name?.trim();
            if (!name) throw new Error('Le nom de la compétition est obligatoire.');

            const startISO = typeof payload.startDate === 'string' ? payload.startDate : this.toIsoDate(payload.startDate);
            const endISO   = typeof payload.endDate   === 'string' ? payload.endDate   : this.toIsoDate(payload.endDate);

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

            const { data, error } = await this.supabase
                .from('clubs')
                .insert({ name, city, user_id: user.id })
                .select('*')
                .single<Club>();

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
     * Récupère la liste des tireurs de l’utilisateur courant.
     * 
     * @return La liste des tireurs appartenant à l’utilisateur connecté.
     */
    async getShooters(): Promise<Shooter[]> {
        // Récupération de l'utilisateur courant
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        if (userError) throw new Error(`Impossible de récupérer l'utilisateur: ${userError.message}`);
        const currentUser = userData?.user;
        if (!currentUser) throw new Error('Aucun utilisateur connecté.');

        // Lecture brute des tireurs
        const { data: shooterRows, error: shootersError } = await this.supabase
            .from('shooters')
            .select(`
            id, last_name, first_name, user_id,
            competition_id, club_id, distance_id, weapon_id, category_id,
            serie1_score, serie2_score, serie3_score, serie4_score, serie5_score, serie6_score
            `)
            .eq('user_id', currentUser.id)
            .order('id', { ascending: true });

        if (shootersError) throw new Error(`Erreur lors de la récupération des tireurs: ${shootersError.message}`);
        const rows = shooterRows ?? [];
        if (!rows.length) return [];

        // Récupération des libellés (label pour distances/weapons/categories)
        const [
            { data: competitions }, { data: clubs },
            { data: distances }, { data: weapons },
            { data: categories }
        ] = await Promise.all([
            this.supabase.from('competitions').select('id, name'),
            this.supabase.from('clubs').select('id, name'),
            this.supabase.from('distances').select('id, label'),
            this.supabase.from('weapons').select('id, label'),
            this.supabase.from('categories').select('id, label'),
        ]);

        // Création des maps id -> nom/label
        const mapName = <T extends { id: number; name?: string; label?: string }>(arr?: T[] | null) =>
            new Map((arr ?? []).map(x => [x.id, (x as any).name ?? (x as any).label ?? '']));

        const competitionById = mapName(competitions as any[]);
        const clubById        = mapName(clubs as any[]);
        const distanceById    = mapName(distances as any[]);
        const weaponById      = mapName(weapons as any[]);
        const categoryById    = mapName(categories as any[]);

        // Helper pour convertir les valeurs numériques et gérer les nulls
        const toNum = (v: any) => (v == null ? 0 : Number(v));

        // Mapping final vers l'interface Shooter
        return rows.map((row: any): Shooter => {
            const total =
            toNum(row.serie1_score) +
            toNum(row.serie2_score) +
            toNum(row.serie3_score) +
            toNum(row.serie4_score) +
            toNum(row.serie5_score) +
            toNum(row.serie6_score);

            return {
                id: row.id,
                lastName: row.last_name,
                firstName: row.first_name,
                competitionName: competitionById.get(row.competition_id) ?? '',
                clubName:        clubById.get(row.club_id) ?? '',
                distance:        distanceById.get(row.distance_id) ?? '',
                weapon:          weaponById.get(row.weapon_id) ?? '',
                categoryName:    categoryById.get(row.category_id) ?? '',
                totalScore: Number(total.toFixed(2)), // Arrondi à 2 décimales
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

        const { data, error } = await this.supabase
            .from('clubs')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

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
}
