import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
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
	private avatarUrlSubject = new BehaviorSubject<string | undefined>(undefined);
	public avatarUrl$ = this.avatarUrlSubject.asObservable();

	constructor(private zone: NgZone, private commonService: CommonService, private themeService: ThemeService, private router: Router) {
		this.supabase = this.zone.runOutsideAngular(() =>
			createClient(environment.supabase.url, environment.supabase.anonKey, {
				auth: {
					persistSession: true,
					autoRefreshToken: true,
					detectSessionInUrl: true,
					// Désactive le mécanisme de verrouillage : pas de Web Locks
					lock: async (_name, _acquireTimeout, fn) => await fn(),
				},
			})
		);

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

	async getCurrentSession() {
		const { data, error } = await this.supabase.auth.getSession();
		if (error) return null;
		return data?.session ?? null;
	}

	/**
	 * Inscrit un nouvel utilisateur (email + password + displayName)
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
	 */
	async signUp(email: string, password: string, displayName: string): Promise<void> {
		const isElectron = !!(window as any).deeplink || !!(window as any).electronAPI?.isElectron;
		const redirectTo = isElectron
			? 'aimdisplay://auth-callback' // deep link Electron (déjà ajouté aux Redirect URLs)
			: `${window.location.origin}/login`; // fallback web

		const { data, error } = await this.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { displayName },
				emailRedirectTo: redirectTo,
			},
		});

		if (error) {
			this.commonService.showSwalToast(this.mapAuthError(error, 'signup'), 'error');
			throw error;
		}

		// Cas "email déjà utilisé" (Supabase renvoie identities = [])
		const alreadyRegistered = !!data?.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0;

		if (alreadyRegistered) {
			// Renvoyer de l’e-mail de confirmation
			try {
				await this.supabase.auth.resend({
					type: 'signup',
					email,
					options: { emailRedirectTo: redirectTo },
				});
			} catch {
				/* ignore */
			}

			return;
		}

		// Flux normal (nouvel utilisateur)
		this.commonService.showSwal(
			'Inscription réussie !',
			"Vérifiez votre boîte mail afin de valider votre adresse e-mail. N'oubliez pas de vérifier vos spams !",
			'success',
			false
		);

		// On déconnecte pour forcer la validation e-mail avant 1re connexion
		await this.supabase.auth.signOut();
	}

	/**
	 * Connecte un utilisateur existant
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
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
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
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
	 * Envoie l'email de réinitialisation de mot de passe.
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
	 */
	async sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
		const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });

		if (error) {
			const status = (error as any).status as number | undefined;
			const msg = (error.message || '').toLowerCase();

			if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
				this.commonService.showSwalToast('Trop de tentatives. Réessayez dans quelques minutes.', 'error');
				throw error;
			}

			if ((status && status >= 500) || msg.includes('smtp') || msg.includes('email not sent')) {
				this.commonService.showSwalToast("Impossible d'envoyer l'email pour le moment. Réessayez plus tard.", 'error');
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

	/**
	 * Pose la session Supabase à partir des query params de l’URL de recovery
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
	 */
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
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
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
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
	 */
	async changePasswordWithVerification(currentPassword: string, newPassword: string): Promise<void> {
		const {
			data: { user },
			error: getUserError,
		} = await this.supabase.auth.getUser();

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
	 *
	 * @returns {string} L'email de l'utilisateur connecté, ou null.
	 */
	getUserEmail(): string | null {
		return this.userSubject.value?.email || null;
	}

	/**
	 * Récupère et retourne le displayName de l'utilisateur connecté, ou null.
	 *
	 * @returns {string} Le displayName de l'utilisateur connecté, ou null.
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
	 * Met à jour les **métadonnées du profil** utilisateur (champ `user_metadata`)
	 * via `supabase.auth.updateUser({ data })`, puis affiche un toast de résultat.
	 *
	 * @param data - Paires clé/valeur à écrire dans `user_metadata`.
	 *               - `displayName?`  Nom d’affichage du profil.
	 *               - `avatarUrl?`    URL d’avatar à stocker.
	 *
	 * @returns {Promise<void>}  Ne retourne rien en cas de succès.
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
	 * Upload un avatar dans le bucket "avatars", met à jour le profil utilisateur
	 * avec le chemin du fichier, puis retourne une URL signée temporaire pour affichage.
	 *
	 * @param file Fichier image à uploader.
	 * @returns Promise<string | undefined> URL signée (1h) ou `undefined` si non disponible.
	 */
	async uploadAvatar(file: File): Promise<string | undefined> {
		const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
		const AVATAR_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

		let didToast = false;
		const toast = (msg: string, type: 'success' | 'error' = 'error') => {
			this.commonService.showSwalToast(msg, type);
			didToast = true;
		};

		try {
			// Validations basiques
			if (!AVATAR_ACCEPTED.includes(file.type)) {
				toast('Format non supporté. JPG, PNG ou WEBP.', 'error');
				throw new Error('Unsupported media type');
			}
			if (file.size > AVATAR_MAX_BYTES) {
				toast('Image trop lourde (max 2 Mo).', 'error');
				throw new Error('Payload too large');
			}

			// Utilisateur
			const {
				data: { user },
				error: userErr,
			} = await this.supabase.auth.getUser();
			if (userErr || !user) {
				toast('Connectez-vous pour changer la photo de profil.', 'error');
				throw userErr || new Error('Not authenticated');
			}

			// Chemin + upload
			const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
			const path = `${user.id}/avatar.${ext}`;

			const { error: upErr } = await this.supabase.storage.from('avatars').upload(path, file, {
				upsert: true,
				contentType: file.type,
				cacheControl: '3600',
			});

			if (upErr) {
				const msg = (upErr.message || '').toLowerCase();
				if (msg.includes('payload') || msg.includes('too large') || msg.includes('413')) {
					toast('Image trop lourde (max 2 Mo).', 'error');
				} else if (msg.includes('unsupported') || msg.includes('content type')) {
					toast('Format non supporté. JPG, PNG ou WEBP.', 'error');
				} else {
					toast("Échec de l'upload de l'avatar.", 'error');
				}
				throw upErr;
			}

			// Associer le chemin au profil (on stocke le path, pas l’URL signée qui expire)
			const { error: updMetaErr } = await this.supabase.auth.updateUser({ data: { avatarPath: path } });
			if (updMetaErr) {
				toast("Photo uploadée, mais impossible de l'associer au profil.", 'error');
				throw updMetaErr;
			}

			// Générer une URL signée pour affichage immédiat
			const { data: signedData, error: urlErr } = await this.supabase.storage.from('avatars').createSignedUrl(path, 60 * 60); // 1h

			if (urlErr || !signedData?.signedUrl) {
				// L’upload est OK, mais pas d’URL affichable maintenant.
				toast("Photo uploadée, mais impossible de créer le lien d'affichage.", 'error');
				throw urlErr || new Error('Failed to create signed URL');
			}

			await this.refreshAvatarUrl();
			toast('Photo de profil mise à jour !', 'success');
			return signedData.signedUrl;
		} catch (err) {
			// Filet de sécurité si aucune alerte n’a été affichée plus haut
			if (!didToast) {
				this.commonService.showSwalToast("Échec de la mise à jour de l'avatar.", 'error');
			}
			throw err;
		}
	}

	/**
	 * Lit le chemin `avatarPath` dans les métadonnées de l’utilisateur
	 * connecté (`user_metadata`) puis demande à Supabase Storage de créer un lien
	 * temporaire (signé) vers le fichier.
	 *
	 * - La durée de validité de l’URL signée est de 1 heure (3600 s).
	 * - Retourne `undefined` si aucun avatar n’est défini ou si la création d’URL échoue.
	 *
	 * @returns {Promise<string | undefined>}
	 *          L’URL signée (valable 1h) ou `undefined` si indisponible.
	 */
	async getSignedAvatarUrl(): Promise<string | undefined> {
		const path = (this.userSubject.value?.user_metadata as any)?.['avatarPath'];
		if (!path) return;

		const { data, error } = await this.supabase.storage.from('avatars').createSignedUrl(path, 60 * 60); // 1h

		if (error) return undefined;
		return data?.signedUrl;
	}

	/**
	 * Ajoute un paramètre de requête `v=<timestamp>` à une URL pour invalider le cache navigateur.
	 *
	 * @param url - L’URL d’origine (publique ou signée).
	 * @returns L’URL avec un paramètre `v` horodaté pour “cache busting”.
	 */
	private addCacheBust(url: string): string {
		try {
			const u = new URL(url);
			u.searchParams.set('v', Date.now().toString());
			return u.toString();
		} catch {
			return url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
		}
	}

	/**
	 * Récupère l’URL signée courante de l’avatar puis émet sa version “cache-bustée”
	 * afin que l’UI (ex. sidebar) se mette à jour automatiquement.
	 *
	 * @returns Promise<void>
	 */
	async refreshAvatarUrl(): Promise<void> {
		const url = await this.getSignedAvatarUrl(); // ta méthode actuelle
		this.avatarUrlSubject.next(url ? this.addCacheBust(url) : undefined);
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
	 * Traduit une erreur d’authentification Supabase en **message lisible** pour l’utilisateur.
	 *
	 * @param err - Erreur brute renvoyée par supabase-js (souvent `AuthApiError`, parfois autre).
	 * @param ctx - Contexte d’utilisation : `'signin'` ou `'signup'`.
	 * @returns Message utilisateur (fr) adapté à l’erreur et au contexte.
	 */
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
					if (msg.includes('signups not allowed')) return 'Les inscriptions sont désactivées';
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
