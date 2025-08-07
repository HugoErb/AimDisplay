import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-forgot-password',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './forgot-password.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForgotPasswordComponent {
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	passwordFieldType: string = 'password';
	email: string = '';
	isLoading: boolean = false;

	constructor(protected commonService: CommonService, protected authService: AuthService) {}

	/**
	 * Permet d'envoyer un lien de réinitialisation de mot de passe au mail renseigné dans le formulaire.
	 * Une phase de validation des inputs est d'abord lancée.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le mail est envoyé.
	 */
	async sendPasswordResetEmail(): Promise<void> {
		this.isLoading = true;
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (areInputsValid) {
			await this.authService.sendPasswordResetEmail(this.email.trim());
			this.commonService.redirectTo('login');
		}
        this.isLoading = false;
	}
}
