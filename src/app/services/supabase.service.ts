import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Club } from '../interfaces/club';

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

	// créer un club
	async addClub(clubName: string, clubCity: string) {
		const { data, error } = await this.supabase.from('clubs').insert({ clubName, clubCity }).single();
		if (error) throw error;
		return data;
	}
}
