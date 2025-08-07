import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient, Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { ThemeService } from '../services/theme.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
	private supabase: SupabaseClient;
	private userSubject = new BehaviorSubject<User | null>(null);
	readonly user$ = this.userSubject.asObservable();
	readonly isLoading = new BehaviorSubject<boolean>(true);
	private authSubscription: { data: { subscription: any } } | null = null;

	constructor(private zone: NgZone, private commonService: CommonService, private themeService: ThemeService, private router: Router) {
		this.supabase = this.zone.runOutsideAngular(() => createClient(environment.supabase.url, environment.supabase.anonKey, {}));

		// Souscription aux changements d'état d'authentification
		this.authSubscription = this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
			this.zone.run(() => {
				this.userSubject.next(session?.user ?? null);
				this.isLoading.next(false);

				if (session?.user) {
					this.ensureLocalStorageDefaults();
					// Redirige du login vers home si déjà connecté
					if (this.router.url.startsWith('/login')) {
						this.router.navigate(['home']);
					}
				} else {
					// Si pas connecté, aller sur login
					this.router.navigate(['login']);
				}
			});
		});
	}

	ngOnDestroy(): void {
		// Nettoyer la souscription auth
		this.authSubscription?.data.subscription.unsubscribe();
	}

	/**
	 * Initialise les préférences locales (userParams, thème)
	 */
	private ensureLocalStorageDefaults(): void {
		if (!localStorage.getItem('userParams')) {
			// TODO initialiser userParams si besoin
		}
		if (!localStorage.getItem('theme')) {
			localStorage.setItem('theme', this.themeService.getTheme());
		}
	}

	/**
	 * Inscrit un nouvel utilisateur (email + password + displayName)
	 */
	async signUp(email: string, password: string, displayName: string): Promise<void> {
		const { error } = await this.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { displayName },
			},
		});
		if (error) {
			this.commonService.showSwalToast(this.mapSignUpError(error), 'error');
			throw error;
		}
        this.commonService.showSwal('Inscription réussie !', 'Vérifiez votre boîte mail afin de valider votre adresse email. N\'oubliez pas de vérifier vos spam !', 'success', false);
		// On déconnecte l'utilisateur pour qu'il doive confirmer son email
		await this.supabase.auth.signOut();
	}

	/**
	 * Connecte un utilisateur existant
	 */
	async signIn(email: string, password: string): Promise<void> {
		const { error } = await this.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			this.commonService.showSwalToast(this.mapSignInError(error), 'error');
			throw error;
		}
        this.commonService.showSwalToast('Connexion réussie !');
	}

	/**
	 * Déconnecte l'utilisateur courant
	 */
	async signOut(): Promise<void> {
		const { error } = await this.supabase.auth.signOut();
		if (error) {
			this.commonService.showSwalToast('Échec de la déconnexion', 'error');
			throw error;
		}
		this.commonService.showSwalToast('Déconnexion réussie !');
	}

	/**
	 * Envoie l'email de réinitialisation de mot de passe
	 */
	async sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
		const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
		if (error) {
			this.commonService.showSwalToast('Erreur envoi du lien de réinitialisation', 'error');
			throw error;
		}
		this.commonService.showSwal(
			'E-mail de réinitialisation envoyé !',
			"Veuillez suivre les indications de l'email que vous avez reçu afin de réinitialiser votre mot de passe. N'oubliez pas de vérifier vos spam !",
			'success',
			false
		);
	}

	/**
	 * Met à jour le mot de passe après reset ou reauth
	 */
	async changePassword(newPassword: string): Promise<void> {
		const { error } = await this.supabase.auth.updateUser({ password: newPassword });
		if (error) {
			this.commonService.showSwalToast('Échec de la mise à jour du mot de passe', 'error');
			throw error;
		}
		this.commonService.showSwalToast('Mot de passe mis à jour !');
	}

	/**
	 * Retourne l'email de l'utilisateur connecté, ou null.
	 */
	getUserEmail(): string | null {
		return this.userSubject.value?.email || null;
	}

	/**
	 * Récupère le displayName de l'utilisateur connecté, ou null.
	 */
	getUserDisplayName(): string {
		return (this.userSubject.value?.user_metadata as any)?.['displayName'] || '';
	}

	/**
	 * Met à jour le displayName dans les metadata de l'utilisateur.
	 * @param displayName Nouveau displayName.
	 */
	async setUserDisplayName(displayName: string): Promise<void> {
		const user = this.userSubject.value;
		if (!user) throw new Error('Aucun utilisateur connecté');
		const { error } = await this.supabase.auth.updateUser({ data: { displayName } });
		if (error) {
			this.commonService.showSwalToast('Échec mise à jour nom d’utilisateur', 'error');
			throw error;
		}
		this.commonService.showSwalToast('Nom d’utilisateur mis à jour !');
	}

	/**
	 * Met à jour le displayName ou l'avatar (dans user_metadata)
	 */
	async updateProfile(data: { displayName?: string; avatarUrl?: string }): Promise<void> {
		const { error } = await this.supabase.auth.updateUser({ data });
		if (error) {
			this.commonService.showSwalToast('Échec mise à jour profil', 'error');
			throw error;
		}
		this.commonService.showSwalToast('Profil mis à jour !');
	}

	/**
	 * Indique si un utilisateur est connecté
	 */
	isLoggedIn(): boolean {
		return !!this.userSubject.value;
	}

	/**
	 * Retourne l'utilisateur courant ou null
	 */
	getUser(): User | null {
		return this.userSubject.value;
	}

	/**
	 * Erreurs lisibles pour la connexion
	 */
	private mapSignInError(err: any): string {
		switch (err.message) {
			case 'Invalid login credentials':
				return 'Email ou mot de passe invalide';
			default:
				return 'Échec de connexion';
		}
	}

	/**
	 * Erreurs lisibles pour l'inscription
	 */
	private mapSignUpError(err: any): string {
		switch (err.message) {
			case 'User already registered':
				return 'Email déjà utilisé';
			default:
				return "Échec de l'inscription";
		}
	}
}
