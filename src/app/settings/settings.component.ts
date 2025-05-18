import { Component } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

@Component({
	selector: 'settings',
	templateUrl: './settings.component.html',
	standalone: true,
	imports: [TextareaModule, FormsModule, TableModule, InputTextModule],
	styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
	email: string = '';

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
}

interface Transaction {
    id: number;
    date: string;
    montant: number;
    typeOffre: string;
    statutPaiement: string;
}
