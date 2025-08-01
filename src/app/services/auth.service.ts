import { Injectable, OnDestroy } from '@angular/core';
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	createUserWithEmailAndPassword,
	updateProfile,
	EmailAuthProvider,
	reauthenticateWithCredential,
	sendPasswordResetEmail as firebaseSendPasswordResetEmail,
	updatePassword,
	User,
	UserCredential,
} from 'firebase/auth';
import { ref, deleteObject, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserParams } from '../interfaces/user-params';
import { CommonService } from './../services/common.service';
import { ThemeService } from '../services/theme.service';
import { auth, storage } from '../firebase-init';

/**
 * Service d'authentification et de gestion de profil utilisateur basé sur le SDK Firebase pur.
 * Ne dépend pas d'@angular/fire.
 *
 * Fonctionnalités :
 *  - Connexion / inscription / déconnexion
 *  - Ré-authentification et changement de mot de passe
 *  - Réinitialisation de mot de passe par email
 *  - Lecture / mise à jour du profil (displayName, avatar)
 *  - Upload / suppression d'avatar dans Firebase Storage
 *  - Initialisation de préférences locales (userParams, thème via ThemeService)
 *  - Redirections en fonction de l'état de session
 */
@Injectable({
	providedIn: 'root',
})
export class AuthService implements OnDestroy {
	// Utilisateur courant sous forme observable et snapshot
	private userSubject = new BehaviorSubject<User | null>(null);
	readonly user$ = this.userSubject.asObservable();

	// Indicateur de chargement initial (vérification de session)
	readonly isLoading = new BehaviorSubject<boolean>(true);

	// Référence pour désabonnement de l'écoute authStateChanged
	private unsubscribeAuthState: (() => void) | null = null;

	constructor(private router: Router, private commonService: CommonService, private themeService: ThemeService) {
		// Surveille l'état d'authentification Firebase et réagit aux changements
		this.unsubscribeAuthState = onAuthStateChanged(auth, (user) => {
			this.userSubject.next(user);
			this.isLoading.next(false);

			if (user) {
				this.ensureLocalStorageDefaults();
				// Si on est sur la page de login alors qu'on est connecté, redirige vers home
				if (this.router.url.startsWith('/login')) {
					this.router.navigate(['home']);
				}
			} else {
				// Pas d'utilisateur authentifié : on renvoie sur login
				this.router.navigate(['login']);
			}
		});
	}

	ngOnDestroy(): void {
		// Nettoyage de l'écoute
		if (this.unsubscribeAuthState) {
			this.unsubscribeAuthState();
			this.unsubscribeAuthState = null;
		}
	}

	/**
	 * Initialise les préférences locales si elles n'existent pas encore.
	 * Le thème est géré par ThemeService.
	 */
	private ensureLocalStorageDefaults(): void {
		if (!localStorage.getItem('userParams')) {
			// const defaultParams: UserParams = {
			// 	cardStyle: 'default',
			// 	playmatColor: 'green',
			// 	displaySolution: false,
			// 	autoMultipleSolutionName: false,
			// 	showParticules: false,
			// };
			// localStorage.setItem('userParams', JSON.stringify(defaultParams));
		}
		if (!localStorage.getItem('theme')) {
			// On laisse ThemeService appliquer le thème ; on synchronise la clé
			localStorage.setItem('theme', this.themeService.getTheme());
		}
	}

	/**
	 * Connexion avec email et mot de passe.
	 * Affiche un toast et remonte une erreur lisible en cas d'échec.
	 * @param email Adresse email de l'utilisateur.
	 * @param password Mot de passe.
	 */
	async signIn(email: string, password: string): Promise<void> {
		try {
			await signInWithEmailAndPassword(auth, email, password);
			this.commonService.showSwalToast('Connexion réussie !');
		} catch (error: any) {
			const msg = this.mapSignInError(error);
			this.commonService.showSwalToast(msg, 'error');
			throw new Error(msg);
		}
	}

	/**
	 * Déconnexion de l'utilisateur courant.
	 */
	async signOut(): Promise<void> {
		try {
			await firebaseSignOut(auth);
			this.commonService.showSwalToast('Déconnexion réussie !');
		} catch (error: any) {
			console.error('Erreur de déconnexion', error);
			this.commonService.showSwalToast('Échec de la déconnexion', 'error');
			throw error;
		}
	}

	/**
	 * Inscription avec email, mot de passe et displayName.
	 * @param email Email.
	 * @param password Mot de passe.
	 * @param displayName Nom affiché.
	 */
	async signUp(email: string, password: string, displayName: string): Promise<void> {
		try {
			const cred = await createUserWithEmailAndPassword(auth, email, password);
			await updateProfile(cred.user, { displayName });
			this.commonService.showSwalToast('Inscription réussie !');
			this.router.navigate(['home']);
		} catch (error: any) {
			const msg = this.mapSignUpError(error);
			this.commonService.showSwalToast(msg, 'error');
			throw new Error(msg);
		}
	}

	/**
	 * Indique si un utilisateur est actuellement connecté.
	 */
	isLoggedIn(): boolean {
		return this.userSubject.value !== null;
	}

	/**
	 * Retourne l'utilisateur courant (ou null).
	 */
	getUser(): User | null {
		return this.userSubject.value;
	}

	/**
	 * Retourne le nom du club (displayName dans firebase) (ou null).
	 */
	getUserDisplayName(): string | null | undefined {
		return this.userSubject.value?.displayName;
	}

	/**
	 * Retourne le mail de l'utlisateur (ou null).
	 */
	getUserEmail(): string | null | undefined {
		return this.userSubject.value?.email;
	}

	/**
	 * Retourne la photo de profil de l'utilisateur (ou null).
	 */
	getUserAvatar(): string | null | undefined {
		return this.userSubject.value?.photoURL;
	}

	/**
	 * Met à jour le displayName de l'utilisateur connecté.
	 * @param displayName Nouveau nom.
	 */
	async setUserDisplayName(displayName: string): Promise<void> {
		const user = this.getUser();
		if (!user) throw new Error('Utilisateur non connecté');
		await updateProfile(user, { displayName });
	}

	/**
	 * Met à jour l'avatar (photoURL) de l'utilisateur connecté.
	 * @param newAvatar URL de l'image.
	 */
	async setUserAvatar(newAvatar: string): Promise<void> {
		const user = this.getUser();
		if (!user) throw new Error('Utilisateur non connecté');
		await updateProfile(user, { photoURL: newAvatar });
	}

	/**
	 * Supprime un avatar dans Firebase Storage.
	 * @param fileName Chemin complet de l'objet dans le storage.
	 */
	async removeAvatar(fileName: string): Promise<void> {
		const storageRef = ref(storage, fileName);
		try {
			await deleteObject(storageRef);
		} catch (e) {
			console.warn('Suppression avatar échouée (peut être inexistant) :', e);
		}
	}

	/**
	 * Upload un avatar, supprime l'ancien, puis met à jour le profil avec la nouvelle URL.
	 * @param file Fichier image.
	 */
	async uploadAvatar(file: File): Promise<void> {
		const email = this.getUserEmail();
		if (!email) throw new Error('Utilisateur non connecté');

		const safeName = encodeURIComponent(email);
		const fileName = `avatar/${safeName}`;
		const storageRef = ref(storage, fileName);

		await this.removeAvatar(fileName).catch(() => {
			// ignore si inexistant
		});

		const uploadTask = uploadBytesResumable(storageRef, file);
		const snapshot: UploadTaskSnapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
			uploadTask.on(
				'state_changed',
				() => {
					// progression ; on pourrait émettre un événement si nécessaire
				},
				(err: unknown) => reject(err),
				() => resolve(uploadTask.snapshot)
			);
		});

		const url = await getDownloadURL(snapshot.ref);
		await this.setUserAvatar(url);
	}

	/**
	 * Envoie l'email de réinitialisation du mot de passe.
	 * @param email Adresse email concernée.
	 */
	async sendPasswordResetEmail(email: string): Promise<void> {
		try {
			await firebaseSendPasswordResetEmail(auth, email);
		} catch (error: any) {
			console.error('Erreur reset password', error);
			throw error;
		}
	}

	/**
	 * Ré-authentifie l'utilisateur avec son mot de passe actuel (pour opérations sensibles).
	 * @param currentPassword Mot de passe actuel.
	 */
	reauthenticate(currentPassword: string): Promise<UserCredential> {
		const user = this.getUser();
		if (user && user.email) {
			const credential = EmailAuthProvider.credential(user.email, currentPassword);
			return reauthenticateWithCredential(user, credential);
		} else {
			return Promise.reject('Aucun utilisateur connecté');
		}
	}

	/**
	 * Change le mot de passe de l'utilisateur connecté.
	 * @param newPassword Nouveau mot de passe.
	 */
	async changePassword(newPassword: string): Promise<void> {
		const user = this.getUser();
		if (!user) throw new Error('Aucun utilisateur connecté');
		await updatePassword(user, newPassword);
	}

	/**
	 * Convertit une erreur de connexion Firebase en message utilisateur lisible.
	 * @param error Erreur brute.
	 */
	private mapSignInError(error: any): string {
		switch (error.code) {
			case 'auth/invalid-email':
				return 'Adresse email non valide';
			case 'auth/wrong-password':
				return 'Mot de passe incorrect';
			case 'auth/user-disabled':
				return 'Compte désactivé';
			case 'auth/user-not-found':
				return 'Utilisateur introuvable';
			default:
				return 'Échec de connexion';
		}
	}

	/**
	 * Convertit une erreur d'inscription Firebase en message utilisateur lisible.
	 * @param error Erreur brute.
	 */
	private mapSignUpError(error: any): string {
		switch (error.code) {
			case 'auth/email-already-in-use':
				return 'Adresse email déjà utilisée';
			case 'auth/invalid-email':
				return 'Adresse email non valide';
			case 'auth/weak-password':
				return 'Mot de passe trop faible';
			default:
				return "Échec de l'inscription";
		}
	}
}
