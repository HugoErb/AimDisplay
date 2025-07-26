import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from './../services/common.service';
import { UserParams } from '../interfaces/user-params';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

// Modals
type ModalKey = 'renameClub' | 'changePassword';

@Component({
	selector: 'app-settings',
	standalone: true,
	imports: [DropdownModule, InputSwitchModule, FormsModule, InputTextModule, TextareaModule, TableModule, CommonModule],
	templateUrl: './settings.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent {
	constructor(protected commonService: CommonService, private themeService: ThemeService) {}

	userParamsName: string = 'userParamsAimDisplay';
	darkMode: boolean = false;

	// Modals
	modals: Record<ModalKey, boolean> = {
		renameClub: false,
		changePassword: false,
	};
	currentClubName: string = '';
	newClubName: string = '';
	currentPassword: string = '';
	newPassword: string = '';
	newPasswordConfirmation: string = '';

	// Variables pour le mail
	@ViewChildren('inputField') inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	nameMail: string = '';
	firstNameMail: string = '';
	emailMail: string = '';
	messageMail: string = '';

	// subscriptionPlans = [
	// 	{
	// 		name: 'Basique',
	// 		price: '7',
	// 		period: '/mois',
	// 		popular: false,
	// 		features: ['Gestion de 2 compétitions par mois', 'Génération de rapport de compétition', 'Dashboard des données', 'Support par email'],
	// 	},
	// 	{
	// 		name: 'Pro',
	// 		price: '14',
	// 		period: '/mois',
	// 		popular: true,
	// 		features: [
	// 			"Fonctionnalités de l'abonnement Basique",
	// 			'Gestion de 4 compétitions par mois',
	// 			'Génération de rapport personnalisé par tireur',
	// 			'Conseils personnalisés pour les tireurs',
	// 			'Support prioritaire',
	// 		],
	// 	},
	// 	{
	// 		name: 'VIP',
	// 		price: '19',
	// 		period: '/mois',
	// 		popular: false,
	// 		features: [
	// 			"Fonctionnalités de l'abonnement Pro",
	// 			'Gestion de compétitions illimitée',
	// 			'Génération de QR Code de consultation du classement',
	// 			'Support dédié',
	// 			'Accès aux fonctionnalités bêta',
	// 		],
	// 	},
	// ];

	// transactions: Transaction[] = [
	// 	{
	// 		id: 1,
	// 		date: '2023/06/01',
	// 		montant: 19.99,
	// 		typeOffre: 'Abonnement VIP',
	// 		statutPaiement: 'Payé',
	// 	},
	// 	{
	// 		id: 2,
	// 		date: '2023/05/01',
	// 		montant: 14.99,
	// 		typeOffre: 'Abonnement Pro',
	// 		statutPaiement: 'Payé',
	// 	},
	// 	{
	// 		id: 3,
	// 		date: '2023/04/01',
	// 		montant: 14.99,
	// 		typeOffre: 'Abonnement Pro',
	// 		statutPaiement: 'En attente',
	// 	},
	// 	{
	// 		id: 4,
	// 		date: '2023/03/01',
	// 		montant: 14.99,
	// 		typeOffre: 'Abonnement Pro',
	// 		statutPaiement: 'Payé',
	// 	},
	// 	{
	// 		id: 5,
	// 		date: '2023/02/01',
	// 		montant: 7.99,
	// 		typeOffre: 'Abonnement Basique',
	// 		statutPaiement: 'Annulé',
	// 	},
	// ];

	ngOnInit() {
		const userParams: UserParams = JSON.parse(localStorage.getItem(this.userParamsName)!);
		this.darkMode = this.themeService.getTheme() === 'dark';
	}

	/**
	 * Ouvre le modal identifié par sa clé.
	 * Si nécessaire, effectue les préparations spécifiques avant l’ouverture.
	 *
	 * @param key Clé du modal à ouvrir (doit être une valeur de ModalKey).
	 */
	openModal(key: ModalKey): void {
		this.modals[key] = true;
	}

	/**
	 * Ferme le modal identifié par sa clé.
	 *
	 * @param key Clé du modal à fermer (doit être une valeur de ModalKey).
	 */
	closeModal(key: ModalKey): void {
		this.modals[key] = false;
	}

	/**
	 * Filtre et valide le champ de renommage, puis met à jour le nom du club dans la base de données.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque toutes les opérations sont terminées.
	 */
	async saveNewClubName(): Promise<void> {
		// On ne veut garder que l’ElementRef dont l’input a pour id 'newClubName'
		const clubFieldList = new QueryList<ElementRef>();
		clubFieldList.reset(this.inputFields.toArray().filter((ref) => (ref.nativeElement as HTMLInputElement).id === 'newClubName'));

		// Vérification des champs
		this.inputLabelMap = this.commonService.getInputLabelMap(clubFieldList);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, true);
		if (areInputsValid) {
			// TODO CALL BDD POUR MAJ LE NOM DU CLUB EN BDD
			this.newClubName = '';
            this.commonService.showSwalToast('Modification du nom de club réussie !');
			this.closeModal('renameClub');
		}
	}
    
    /**
	 * Filtre et valide les champs de changements de mot de passe, puis le met à jour dans la base de données.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque toutes les opérations sont terminées.
	 */
	async saveNewPassword(): Promise<void> {
		// On ne veut garder que l’ElementRef dont l’input a pour id un string qui contient 'password'
		const passwordFieldList = new QueryList<ElementRef>();
		passwordFieldList.reset(this.inputFields.toArray().filter((ref) => (ref.nativeElement as HTMLInputElement).id.includes('Password')));
        console.log(passwordFieldList);
        

		// Vérification des champs
		this.inputLabelMap = this.commonService.getInputLabelMap(passwordFieldList);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, true);
		if (areInputsValid) {
			// TODO CALL BDD POUR MAJ LE MDP EN BDD
			this.currentPassword = '';
			this.newPassword = '';
            this.newPasswordConfirmation = '';
            this.commonService.showSwalToast('Modification du mot de passe réussie !');
			this.closeModal('changePassword');
		}
	}

	/**
	 * Déconnecte le compte de l'utilisateur actuel et renvoie vers la page de connexion.
	 *
	 * @returns {void}
	 */
	disconnect(): void {
		this.commonService.showSwalToast('Déconnexion réussie !');
		this.commonService.redirectTo('login');
	}

	/**
	 * Bascule le mode sombre et met à jour le thème dans le localStorage.
	 *
	 * @returns {void}
	 */
	toggleDarkMode(): void {
		const theme = this.darkMode ? 'dark' : 'light';
		this.themeService.setTheme(theme);
	}

	// getBadgeClass(status: string): string {
	// 	switch (status) {
	// 		case 'Payé':
	// 			return 'badge-success';
	// 		case 'En attente':
	// 			return 'badge-warning';
	// 		case 'Annulé':
	// 			return 'badge-danger';
	// 		default:
	// 			return 'badge-default';
	// 	}
	// }

	/**
	 * Prépare et envoie un email.
	 * Si l'envoi de l'email réussit, on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que l'email a été envoyé et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async sendMail(): Promise<void> {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		if (await this.commonService.sendMail(this.inputLabelMap)) {
			this.commonService.resetInputFields(this.inputFields);
		}
	}
}

// interface Transaction {
// 	id: number;
// 	date: string;
// 	montant: number;
// 	typeOffre: string;
// 	statutPaiement: string;
// }
