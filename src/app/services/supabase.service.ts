import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
	private supabase: SupabaseClient;

	constructor() {
		this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
	}

	// Exemple : lister les clubs
	async getClubs() {
		const { data, error } = await this.supabase.from('clubs').select('*').order('clubName');
		if (error) throw error;
		return data;
	}

	// Exemple : créer un club
	async addClub(clubName: string, clubCity: string) {
		const { data, error } = await this.supabase.from('clubs').insert({ clubName, clubCity }).single();
		if (error) throw error;
		return data;
	}

	// etc.
}
