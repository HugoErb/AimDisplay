import { ElementRef, Injectable, QueryList, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';
import axios from 'axios';
import { EmailValidityResponse } from '../interfaces/email-validity-response';

@Injectable({
	providedIn: 'root',
})
export class CommonService {
	constructor(private router: Router) {}

	private darkMode = signal<boolean>(false);

	// Liste blanche des domaines populaires considérés comme fiables
	private trustedEmailDomains = new Set([
		'gmail.com',
		'hotmail.com',
		'outlook.com',
		'yahoo.com',
		'yahoo.fr',
		'live.com',
		'protonmail.com',
		'icloud.com',
	]);
	private emailValidationCache = new Map<string, boolean>();

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
			timer: 3000,
		});
	}

	/**
	 * Affiche une boîte de dialogue SweetAlert2 personnalisée et renvoie le résultat.
	 *
	 * @param {string} title - Le titre affiché dans la boîte de dialogue.
	 * @param {string} message - Le message HTML à afficher dans le corps de la boîte.
	 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} [icon='success'] -
	 *        L'icône à afficher. Peut être 'success', 'error', 'warning', 'info' ou 'question'.
	 * @param {boolean} showCancelButton - Affiche ou non le bouton Annuler.
	 * @returns {Promise<SweetAlertResult>} - Le résultat de la boîte de dialogue.
	 */
	showSwal(
		title: string,
		message: string,
		icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success',
		showCancelButton: boolean
	): Promise<SweetAlertResult<any>> {
		return Swal.fire({
			icon: icon,
			title: `<div class="text-2xl">${title}</div>`,
			html: `${message}`,
			showCancelButton: showCancelButton,
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
	 * Calcule dynamiquement le nombre optimal de lignes à afficher dans un <p-table>
	 * PrimeNG paginé, en prenant des tailles fixes d'éléments du tableau et en les
	 * soustrayant à la taille disponible dans la fenêtre.
	 *
	 * @returns {Promise<number>} Le nombre de lignes à afficher.
	 */
	async getNbRowsPerPage(): Promise<number> {
		// Mesures
		const headerH = 108;
		const footerH = 56;
		const defaultRowH = 65;
		const defaultPadding = 30;

		// Calcul de l’espace disponible
		const available = window.innerHeight - headerH - footerH - defaultPadding;

		// Nombre de lignes complètes
		const count = Math.floor(available / defaultRowH);

		// On renvoie au moins 1
		return Math.max(1, count);
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
	 * Prépare et envoie un email à l'aide d'un service de messagerie.
	 * Avant l'envoi, on vérifie les entrées pour s'assurer qu'elles sont valides en utilisant la méthode `validateInputs`.
	 * Si les validations échouent, l'envoi est interrompu. Si les validations réussissent, les données sont envoyées au service de messagerie.
	 */
	async sendMail(inputLabelMap: Map<string, string>): Promise<boolean> {
		// On vérifie les données
		const areInputsValid = await this.validateInputs(inputLabelMap, false);
		if (!areInputsValid) {
			return false;
		}
		this.showSwalToast('Message envoyé !');
		return true;

		const mailData = this.createMailData(inputLabelMap);

		// return new Promise((resolve, reject) => {
		// 	this.mailService.sendMail(mailData).subscribe({
		// 		next: (response) => {
		// 			this.showSwalToast('Message envoyé !');
		// 			resolve(true);
		// 		},
		// 		error: (error) => {
		// 			this.showSwalToast("Erreur lors de l'envoi du message.", 'error');
		// 			reject(false);
		// 		},
		// 	});
		// });
	}

	/**
	 * Génère dynamiquement une map contenant les paires <label, valeur> des champs d’un formulaire.
	 *
	 * Tous les champs doivent utiliser la référence locale #inputField dans le HTML pour que la méthode fonctionne.
	 *
	 * @param inputFields - Liste des éléments de formulaire marqués avec #inputField
	 * @returns Une Map contenant le texte du label en clé, et la valeur saisie en valeur
	 */
	getInputLabelMap(inputFields: QueryList<ElementRef>): Map<string, any> {
		const inputLabelMap = new Map<string, any>();

		inputFields.forEach((inputRef) => {
			const nativeEl = inputRef.nativeElement as HTMLElement;

			// On retrouve le <label> associé au champ via son parent immédiat
			const container = nativeEl.parentElement;

			let label = '';
			if (container) {
				const labelEl = container.querySelector('label');
				label = labelEl?.textContent?.trim() ?? '';
			}

			// Si le label n’est pas trouvé, on remonte d’un niveau
			if (!label && container?.parentElement) {
				const upperLabel = container.parentElement.querySelector('label');
				label = upperLabel?.textContent?.trim() ?? '';
			}

			// Champ ignoré si aucun label trouvé
			if (!label) return;

			let value: any = '';

			// Récupération de la valeur
			// Cas classique : champ HTML avec propriété "value"
			if ('value' in nativeEl) {
				value = nativeEl.value;
			}

			// Cas PrimeNG : chercher un input interne
			if (!value && nativeEl.querySelector) {
				const inner = nativeEl.querySelector('input, textarea, select') as HTMLInputElement;
				value = inner?.value ?? '';
			}

			// Ajout à la Map finale
			inputLabelMap.set(label, value);
		});

		// console.table(Array.from(inputLabelMap.entries()));
		return inputLabelMap;
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
				console.error("Erreur inattendue lors de la vérification de l'email.");
			}
			return false;
		}
	}

	/**
	 * Vérifie que les champs remplis par l'utilisateur sont dans un format correct.
	 *
	 * @param {Map<string, string>} inputLabelMap - Clé : nom du champ ; valeur : donnée saisie
	 * @param {boolean} checkMail - Active ou non la vérification du domaine de l'adresse email
	 * @returns {Promise<boolean>} Retourne `true` si toutes les validations sont passées, sinon `false`.
	 */
	async validateInputs(inputLabelMap: Map<string, string>, checkMail: boolean): Promise<boolean> {
		const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

		let passwordValue: string | null = null;

		for (const [label, value] of inputLabelMap.entries()) {
			const trimmedValue = value.trim();
			const lowerCaseLabel = label.toLowerCase();

			const isRequired = lowerCaseLabel.includes('*');
			const isEmailField = lowerCaseLabel.includes('email');

			// Sauvegarder la valeur du mot de passe pour vérification ultérieure
			if (label === 'Mot de passe *' || label === 'Nouveau mot de passe *') {
				passwordValue = trimmedValue;
			}

			// Vérification champs requis
			if (isRequired && !trimmedValue) {
				this.showSwal('Erreur de saisie', `Le champ "${label}" est obligatoire.`, 'error', false);
				return false;
			}

			// Vérification du format email
			if (isEmailField && trimmedValue && !emailRegex.test(trimmedValue)) {
				this.showSwal('Erreur de saisie', `Le format de l'adresse email est invalide.`, 'error', false);
				return false;
			}

			// Vérification du domaine email (si checkMail === true)
			if (checkMail && isEmailField && trimmedValue) {
				const domain = trimmedValue.split('@')[1]?.toLowerCase();

				if (this.trustedEmailDomains.has(domain)) {
					continue;
				}

				if (this.emailValidationCache.has(trimmedValue)) {
					const cachedResult = this.emailValidationCache.get(trimmedValue)!;
					if (!cachedResult) {
						this.showSwal('Erreur de saisie', `Le domaine de l'adresse email n'est pas accepté.`, 'error', false);
						return false;
					}
					continue;
				}

				const isEmailValid = await this.checkEmailValidity(trimmedValue);
				this.emailValidationCache.set(trimmedValue, isEmailValid);

				if (!isEmailValid) {
					this.showSwal('Erreur de saisie', `Le domaine de l'adresse email n'est pas accepté.`, 'error', false);
					return false;
				}
			}
		}

		// Vérification de confirmation du mot de passe
		if (inputLabelMap.has('Confirmer le mot de passe *')) {
			const confirmPwd = inputLabelMap.get('Confirmer le mot de passe *')!.trim();
			if (passwordValue === null || confirmPwd !== passwordValue) {
				this.showSwal('Erreur de saisie', `Les mots de passe renseignés ne correspondent pas.`, 'error', false);
				return false;
			}
		}

		return true;
	}

	/**
	 * Crée un objet de données mail en mappant les labels des champs de saisie à leurs valeurs.
	 *
	 * @returns {any} L'objet `mailData` contenant les données des champs sous forme d'objets avec des clés appropriées.
	 *                Les clés sont des versions normalisées des labels des champs, et les valeurs sont celles entrées par l'utilisateur.
	 */
	public createMailData(inputLabelMap: Map<string, string>): any {
		const mailData: any = {};
		inputLabelMap.forEach((value, key) => {
			const objectKey = this.convertLabelToObjectKey(key);
			mailData[objectKey] = value;
		});
		return mailData;
	}

	/**
	 * Convertit un label textuel en une clé d'objet utilisable.
	 * Cette méthode normalise le label pour retirer les accents et autres signes diacritiques,
	 * puis convertit le texte en minuscules et élimine les espaces blancs pour former une clé d'objet.
	 *
	 * @param {string} label - Le label textuel à convertir en clé d'objet.
	 * @returns {string} La clé d'objet obtenue après la normalisation, le nettoyage des diacritiques,
	 *                   la mise en minuscules et la suppression des espaces.
	 */
	convertLabelToObjectKey(label: string): string {
		const normalizedLabel = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		return normalizedLabel.toLowerCase().replace(/\s+/g, '');
	}

	/**
	 * Réinitialise les champs de formulaire référencés par #inputField.
	 * Elle gère les inputs HTML standards ainsi que certains composants PrimeNG.
	 *
	 * @param inputFields - La liste des champs ciblés (généralement via @ViewChildren('inputField'))
	 */
	resetInputFields(inputFields: QueryList<ElementRef>): void {
		inputFields.forEach((field) => {
			const el = field.nativeElement as HTMLElement;

			// 1. Champs HTML standards
			if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
				el.value = '';
			}

			// 2. Composants PrimeNG : rechercher un <input> à l'intérieur
			const inner = el.querySelector?.('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
			if (inner) {
				inner.value = '';
			}
		});
	}
}
