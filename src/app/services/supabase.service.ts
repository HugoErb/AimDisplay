import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Club } from '../interfaces/club';
import { ShooterCategory } from '../interfaces/shooter-category';
import { Weapon } from '../interfaces/weapon';
import { Distance } from '../interfaces/distance';
import { CommonService } from '../services/common.service';

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
