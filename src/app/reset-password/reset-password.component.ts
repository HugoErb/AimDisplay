import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-reset-password',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './reset-password.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResetPasswordComponent {
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	passwordFieldType: string = 'password';
	newPassword: string = '';
	newPasswordConfirmation: string = '';
	isLoading: boolean = false;
	tokenPresent: boolean = false;

	constructor(private route: ActivatedRoute, protected commonService: CommonService, protected authService: AuthService) {}

	async ngOnInit() {
		const qp = this.route.snapshot.queryParamMap;
		const access = qp.get('access_token');
		const refresh = qp.get('refresh_token') ?? undefined;

		if (access) {
			this.tokenPresent = true;
			await this.authService.setRecoverySession(access, refresh);
		} else {
			// Pas de token → on renvoie l’utilisateur demander un nouveau mail
			this.commonService.redirectTo('forgot-password');
		}
	}

	/**
	 * Permet de modifier le mot de passe de l'utilisateur avec celui renseigné dans le formulaire.
	 * Une phase de validation des inputs est d'abord lancée.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le mot de passe est remplacé.
	 */
	async resetPassword(): Promise<void> {
		this.isLoading = true;
		this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
		const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
		if (areInputsValid) {
			await this.authService.changePassword(this.newPassword);
			this.commonService.redirectTo('login');
		}
		this.isLoading = false;
	}
}
