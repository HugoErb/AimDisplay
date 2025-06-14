import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './login.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginComponent {
	constructor(
		protected commonService: CommonService // protected authService: AuthService
	) {}

	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	passwordFieldType: string = 'password';
	email: string = '';
	password: string = '';

	/**
	 * Permet de créer un nouveau compte à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on redirige vers la page de login.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async login() {
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (areInputsValid) {
			// this.authService.signIn(this.email, this.password);
			this.commonService.showSwalToast('Connexion réussie !');
			this.commonService.redirectTo('home');
		}
	}
}
