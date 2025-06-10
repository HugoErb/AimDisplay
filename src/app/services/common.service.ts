import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import axios from 'axios';
import { EmailValidityResponse } from '../interfaces/email-validity-response';

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

	/**
	 * Alterne entre 'password' et 'text' pour afficher ou masquer un champ mot de passe.
	 * @param currentType Le type actuel du champ (ex: 'password' ou 'text')
	 * @returns Le nouveau type de champ ('text' si c'était 'password', sinon 'password')
	 */
	togglePasswordVisibility(currentType: string): string {
		return currentType === 'password' ? 'text' : 'password';
	}

	/**
	 * Filtre une liste d'objets par une propriété (par défaut 'name') en fonction d'une requête.
	 * @param query La chaîne à rechercher
	 * @param list Le tableau source
	 * @param property La propriété à comparer (par défaut 'name')
	 * @returns Un tableau filtré
	 */
	filterByName(query: string, list: any[], property: string = 'name'): any[] {
		const lowercaseQuery = query.toLowerCase();
		return list.filter((item) => item[property]?.toLowerCase().includes(lowercaseQuery));
	}

	/**
	 * Vérifie la validité d'une adresse email en utilisant l'API Mailcheck AI.
	 * Pour cela la méthode évalue si l'email n'est pas jetable et si un enregistrement MX valide est présent.
	 *
	 * @param {string} email L'adresse email à vérifier.
	 * @returns {Promise<boolean>} La promesse renvoie `true` si l'email n'est pas jetable et a un enregistrement MX valide,
	 *                             sinon `false`. Renvoie également `false` en cas d'erreur lors de la requête à l'API.
	 */
	async checkEmailValidity(email: string): Promise<boolean> {
		const url = `https://api.mailcheck.ai/email/${email}`;
		try {
			const response = await axios.get<EmailValidityResponse>(url);
			// Retourne false si l'email est jetable ou si mx est false
			if (response.data.disposable || !response.data.mx) {
				return false;
			}
			return true;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error(`Impossible de vérifier l'email : ${error.message}`);
			} else {
				console.error('Erreur inattendue lors de la vérification de lemail.');
			}
			return false;
		}
	}
}
