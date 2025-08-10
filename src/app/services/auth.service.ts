import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient, Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { ThemeService } from '../services/theme.service';
import { AuthApiError } from '@supabase/supabase-js';
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
		this.authSubscription = this.supabase.auth.onAuthStateChange((event, session) => {
			this.zone.run(() => {
				this.userSubject.next(session?.user ?? null);
				this.isLoading.next(false);

				// Flux de recovery : on reste sur /reset-password
				if (event === 'PASSWORD_RECOVERY') {
					if (!this.router.url.startsWith('/reset-password')) {
						this.commonService.redirectTo('reset-password');
					}
					return; // ne pas tomber dans le else/login
				}

				if (session?.user) {
					this.ensureLocalStorageDefaults();
					if (this.router.url.startsWith('/login')) {
						this.commonService.redirectTo('home');
					}
				} else {
					// Laisser passer /reset-password même sans session classique
					if (!this.router.url.startsWith('/reset-password')) {
						this.commonService.redirectTo('login');
					}
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
			this.commonService.showSwalToast(this.mapAuthError(error, 'signup'), 'error');
			throw error;
		}
		this.commonService.showSwal(
			'Inscription réussie !',
			"Vérifiez votre boîte mail afin de valider votre adresse email. N'oubliez pas de vérifier vos spam !",
			'success',
			false
		);
		// On déconnecte l'utilisateur pour qu'il doive confirmer son email
		await this.supabase.auth.signOut();
	}

	/**
	 * Connecte un utilisateur existant
	 */
	async signIn(email: string, password: string): Promise<void> {
		const { error } = await this.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			this.commonService.showSwalToast(this.mapAuthError(error, 'signin'), 'error');
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
		this.commonService.redirectTo('login');
	}

	/**
	 * Envoie l'email de réinitialisation de mot de passe
	 */
	async sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });

        if (error) {
            const status = (error as any).status as number | undefined;
            const msg = (error.message || '').toLowerCase();

            if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
                this.commonService.showSwalToast(
                'Trop de tentatives. Réessayez dans quelques minutes.',
                'error'
                );
                throw error;
            }

            if (status && status >= 500 || msg.includes('smtp') || msg.includes('email not sent')) {
                this.commonService.showSwalToast(
                "Impossible d'envoyer l'email pour le moment. Réessayez plus tard.",
                'error'
                );
                throw error;
            }

            // Fallback générique
            this.commonService.showSwalToast("Erreur lors de l'envoi de l'email de réinitialisation.", 'error');
            throw error;
            }
        this.commonService.showSwal(
            'E-mail de réinitialisation envoyé !',
            "Suivez les indications de l'email que vous avez reçu afin de réinitialiser votre mot de passe. N'oubliez pas de vérifier vos spam !",
            'success',
            false
        );
	}

	/** Pose la session Supabase à partir des query params de l’URL de recovery */
	async setRecoverySession(access_token: string, refresh_token?: string): Promise<void> {
		const { error } = await this.supabase.auth.setSession({
			access_token,
			refresh_token: refresh_token ?? '',
		});
		if (error) {
			this.commonService.showSwalToast("Impossible d'initialiser la session de réinitialisation", 'error');
			throw error;
		}
	}

	/**
	 * Met à jour le mot de passe après reset ou reauth
	 */
	async changePassword(newPassword: string): Promise<void> {
		const { error } = await this.supabase.auth.updateUser({ password: newPassword });
        if (error) {
            let message = 'Échec de la mise à jour du mot de passe';

            if (error.message?.toLowerCase().includes('should be different')) {
                message = "Le nouveau mot de passe doit être différent de l'ancien";
            } else if (error.message?.toLowerCase().includes('password should be at least')) {
                message = 'Le nouveau mot de passe est trop court';
            } else if (error.message?.toLowerCase().includes('password')) {
                message = 'Nouveau mot de passe invalide. Vérifiez sa complexité.';
            }

            this.commonService.showSwalToast(message, 'error');
            throw error;
		}
		this.commonService.showSwalToast('Mot de passe mis à jour !');
	}
    
    /**
     * Change le mot de passe en vérifiant d'abord le mot de passe actuel.
     *
     * @param currentPassword Mot de passe actuel de l'utilisateur.
     * @param newPassword Nouveau mot de passe souhaité.
     */
    async changePasswordWithVerification(currentPassword: string, newPassword: string): Promise<void> {
        const { data: { user }, error: getUserError } = await this.supabase.auth.getUser();

        if (getUserError || !user?.email) {
            this.commonService.showSwalToast('Impossible de vérifier l’utilisateur', 'error');
            throw getUserError || new Error('Utilisateur non connecté ou e-mail introuvable.');
        }

        // Re-authentification
        const { error: signInError } = await this.supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            this.commonService.showSwalToast('Mot de passe actuel incorrect', 'error');
            throw signInError;
        }

        // Mise à jour du mot de passe
        await this.changePassword(newPassword);
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
			this.commonService.showSwalToast('Échec mise à jour nom du nom de club', 'error');
			throw error;
		}
		this.commonService.showSwalToast('Nom du club mis à jour !');
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

    private mapAuthError(err: any, ctx: 'signin' | 'signup'): string {
        const status = err?.status ?? err?.code ?? null;
        const msg = (err?.message || '').toLowerCase();

        // Réseau / offline
        if (msg.includes('failed to fetch') || msg.includes('network') || status === 0) {
            return 'Problème de connexion réseau. Réessayez.';
        }

        // Classes/Status Supabase
        if (err instanceof AuthApiError) {
            switch (err.status) {
            case 401:
                if (msg.includes('invalid login')) return 'Email ou mot de passe invalide';
                if (msg.includes('email not confirmed')) return 'Adresse email non vérifiée';
                return 'Authentification refusée';
            case 400:
                if (msg.includes('password sign-in is disabled')) return 'La connexion par mot de passe est désactivée';
                if (msg.includes('password should be')) return 'Mot de passe trop faible';
                if (msg.includes('invalid email')) return 'Adresse email invalide';
                return 'Requête invalide';
            case 403:
                if (msg.includes('banned')) return 'Compte bloqué';
                if (msg.includes('signups not allowed')) return "Les inscriptions sont désactivées";
                return 'Accès refusé';
            case 409:
                if (ctx === 'signup' && msg.includes('already')) return 'Email déjà utilisé';
                return 'Conflit de données';
            case 422:
                if (msg.includes('invalid email')) return 'Adresse email invalide';
                return 'Données invalides';
            case 429:
                return 'Trop de tentatives. Réessayez dans quelques minutes.';
            default:
                if (err.status >= 500) return 'Erreur serveur. Réessayez plus tard.';
            }
        }

        // Autres mots-clés
        if (msg.includes('mfa required')) return 'Vérification à deux facteurs requise';
        if (msg.includes('email not confirmed')) return 'Adresse email non vérifiée';
        if (ctx === 'signin' && msg.includes('invalid login')) return 'Email ou mot de passe invalide';
        if (ctx === 'signup' && msg.includes('already')) return 'Email déjà utilisé';

        // Fallback
        return ctx === 'signin' ? 'Échec de connexion' : "Échec de l'inscription";
    }

}
