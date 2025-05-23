import { Component } from '@angular/core';
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

@Component({
	selector: 'app-settings',
	standalone: true,
	imports: [DropdownModule, InputSwitchModule, FormsModule, InputTextModule, TextareaModule, TableModule],
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent {
	constructor(protected commonService: CommonService, private themeService: ThemeService) {}

	userParamsName: string = 'userParamsAimDisplay';
	email: string = '';
	darkMode: boolean = false;
	newUserName: string = '';

	transactions: Transaction[] = [
		{
			id: 1,
			date: '2023/06/01',
			montant: 19.99,
			typeOffre: 'Abonnement VIP',
			statutPaiement: 'Payé',
		},
		{
			id: 2,
			date: '2023/05/01',
			montant: 14.99,
			typeOffre: 'Abonnement Pro',
			statutPaiement: 'Payé',
		},
		{
			id: 3,
			date: '2023/04/01',
			montant: 14.99,
			typeOffre: 'Abonnement Pro',
			statutPaiement: 'En attente',
		},
		{
			id: 4,
			date: '2023/03/01',
			montant: 14.99,
			typeOffre: 'Abonnement Pro',
			statutPaiement: 'Payé',
		},
		{
			id: 5,
			date: '2023/02/01',
			montant: 7.99,
			typeOffre: 'Abonnement Basique',
			statutPaiement: 'Annulé',
		},
	];

	ngOnInit() {
		const userParams: UserParams = JSON.parse(localStorage.getItem(this.userParamsName)!);
		this.darkMode = this.themeService.getTheme() === 'dark';
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
}

interface Transaction {
	id: number;
	date: string;
	montant: number;
	typeOffre: string;
	statutPaiement: string;
}
