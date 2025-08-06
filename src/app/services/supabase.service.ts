import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Club } from '../interfaces/club';
import { ShooterCategory } from '../interfaces/shooter-category';
import { Weapon } from '../interfaces/weapon';
import { Distance } from '../interfaces/distance';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
	private supabase: SupabaseClient;

	constructor(private zone: NgZone) {
		// On instancie le client SUPABASE en dehors de la zone Angular
		// et on désactive la persistence de session pour éviter les locks
		this.supabase = this.zone.runOutsideAngular(() =>
			createClient(environment.supabase.url, environment.supabase.anonKey, {
				auth: {
					persistSession: false,
					autoRefreshToken: false,
					detectSessionInUrl: false,
				},
			})
		);
	}

	// lister les clubs
	async getClubs(): Promise<Club[]> {
		const { data, error } = await this.supabase.from<'clubs', Club>('clubs').select('*').order('name', { ascending: true });

		if (error) {
			console.error('Erreur récupération clubs', error);
			throw error;
		}
		return data ?? [];
	}

	/** Récupère toutes les distances */
	async getDistances(): Promise<Distance[]> {
		const { data, error } = await this.supabase.from('distances').select('*').order('label', { ascending: true });

		if (error) throw error;

		// on mappe label → name
		return (data ?? []).map((d) => ({
			id: d.id,
			name: d.label,
		}));
	}

	async getWeapons(): Promise<Weapon[]> {
		const { data, error } = await this.supabase.from('weapons').select('*').order('label', { ascending: true });

		if (error) throw error;
		return (data ?? []).map((w) => ({
			id: w.id,
			name: w.label,
		}));
	}

	async getCategories(): Promise<ShooterCategory[]> {
		const { data, error } = await this.supabase.from('categories').select('*').order('id', { ascending: true });

		if (error) throw error;
		return (data ?? []).map((c) => ({
			id: c.id,
			name: c.label,
		}));
	}
}
