import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
	providedIn: 'root',
})
export class CommonService {
	private darkMode = signal<boolean>(false);

	constructor(private router: Router) {}

	public isCollapsed: boolean = false;

	/**
	 * Utilise le routeur pour naviguer vers une page donnée.
	 *
	 * @param {string} page - Le chemin de la page vers laquelle rediriger.
	 */
	redirectTo(page: string) {
		this.router.navigate([page]);
	}

	/**
	 * Affiche une notification toast avec SweetAlert2.
	 *
	 * @param {string} message - Le message à afficher dans la notification.
	 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} [icon='success'] - L'icône à afficher dans la notification. Peut être 'success', 'error', 'warning', 'info' ou 'question'.
	 */
	showSwalToast(message: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') {
		Swal.fire({
			position: 'top-end',
			toast: true,
			icon: icon,
			title: `<div class="text-xl">${message}</div>`,
			showConfirmButton: false,
			width: 'auto',
			timer: 2500,
		});
	}

	/**
	 * Affiche une boîte de dialogue SweetAlert2 personnalisée.
	 *
	 * @param {string} title - Le titre affiché dans la boîte de dialogue.
	 * @param {string} message - Le message HTML à afficher dans le corps de la boîte.
	 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} [icon='success'] -
	 *        L'icône à afficher. Peut être 'success', 'error', 'warning', 'info' ou 'question'.
	 */
	showSwal(title: string, message: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') {
		Swal.fire({
			icon: icon,
			title: `<div class="text-2xl">${title}</div>`,
			html: `${message}`,
			showCancelButton: true,
			showConfirmButton: true,
			confirmButtonText: 'Valider',
			cancelButtonText: 'Annuler',
			reverseButtons: true,
			customClass: {
				confirmButton: 'swal2-confirm custom-prime-button',
			},
		});
	}

	/**
	 * Renvoie un message d'erreur correspondant au code d'erreur fourni.
	 *
	 * @param {string} errorCode - Le code d'erreur retourné par le service d'authentification.
	 * @returns {string} - Le message d'erreur correspondant.
	 */
	getErrorMessage(errorCode: string): string {
		const errorMessages: { [key: string]: string } = {
			'auth/wrong-password': 'Le mot de passe actuel est incorrect.',
			'auth/weak-password': 'Le nouveau mot de passe est trop faible.',
			'auth/requires-recent-login': 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter et réessayer.',
			'auth/invalid-email': "L'adresse email n'est pas valide.",
			'auth/user-not-found': 'Aucun utilisateur trouvé avec cette adresse email.',
		};

		return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
	}

	/**
	 * Affiche une modal spécifiée par son identifiant.
	 *
	 * @param {string} id - L'identifiant de l'élément modal à afficher.
	 */
	showModal(id: string) {
		const modal = document.getElementById(id) as HTMLDialogElement;
		if (modal) {
			modal.showModal();
		}
	}

	/**
	 * Ferme une modal spécifiée par son identifiant.
	 *
	 * @param {string} id - L'identifiant de l'élément modal à fermer.
	 */
	closeModal(id: string) {
		const modal = document.getElementById(id) as HTMLDialogElement;
		if (modal) {
			modal.close();
		}
	}

	/**
	 * Renvoie l'état actuel du dark mode.
	 * @returns {boolean} L'état actuel du dark mode.
	 */
	getDarkMode() {
		return this.darkMode();
	}

	/**
	 * Met à jour l'état du dark mode.
	 * @param value La nouvelle valeur du dark mode.
	 */
	setDarkMode(value: boolean) {
		this.darkMode.set(value);
	}

	/**
	 * Permet de changer le nombre de lignes affichées dans les tableaux primeNG, en fonction de la taille de l'écran
	 * @param height Hauteur de la fenêtre en pixel.
	 */
	getNbRowsPerPage(height: number): number {
		if (height > 1080) {
			return 15;
		} else if (height <= 750) {
			return 4;
		} else {
			return 11;
		}
	}
}
