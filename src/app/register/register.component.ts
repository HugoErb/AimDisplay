import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './register.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegisterComponent {
	passwordFieldType: string = 'password';
	email: string = '';
	password: string = '';
	confirmPassword: string = '';

	constructor(
		protected commonService: CommonService // protected authService: AuthService
	) {}

	/**
	 * Cette méthode vérifie si l'email et le mot de passe sont renseignés,
	 * puis appelle le service d'authentification pour se connecter avec ces informations.
	 */
	// login(): void {
	// 	if (this.email && this.password) this.authService.signIn(this.email, this.password);
	// }
}
