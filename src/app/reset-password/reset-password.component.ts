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
		// Query params
		const qp = this.route.snapshot.queryParamMap;
		let access = qp.get('access_token');
		let refresh = qp.get('refresh_token') ?? undefined;

		// Hash params
		if (!access && typeof window !== 'undefined') {
			const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '');
			access = hashParams.get('access_token') ?? access;
			refresh = hashParams.get('refresh_token') ?? refresh;
		}

		if (access) {
			this.tokenPresent = true;
			try {
				await this.authService.setRecoverySession(access, refresh);
			} catch {
				// laisse l’utilisateur sur place avec un message d’erreur
			}
		} else {
			// NE PAS rediriger immédiatement
			// Montre un message + bouton “Renvoyer un lien”
			this.tokenPresent = false;
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
		try {
			this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
			const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
			if (areInputsValid) {
				await this.authService.changePassword(this.newPassword);
				this.commonService.redirectTo('login');
			}
		} finally {
			this.isLoading = false;
		}
	}
}
