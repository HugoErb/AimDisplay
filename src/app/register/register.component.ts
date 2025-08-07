import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './register.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegisterComponent {
	passwordFieldType: string = 'password';
	clubName: string = '';
	email: string = '';
	password: string = '';
	confirmPassword: string = '';
	isLoading: boolean = false;

	constructor(protected commonService: CommonService, protected authService: AuthService) {}

	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();

	/**
	 * Permet de créer un nouveau compte à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on redirige vers la page de login.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
	async register(): Promise<void> {
		this.isLoading = true;
		try {
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
			const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, true);
			if (areInputsValid) {
				await this.authService.signUp(this.email.trim(), this.password, this.clubName.trim());
				this.commonService.redirectTo('login');
			}
		} finally {
			this.isLoading = false;
		}
	}
}
