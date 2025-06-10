import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../services/common.service';

@Component({
	selector: 'app-forgot-password',
	standalone: true,
	imports: [FormsModule, InputTextModule],
	templateUrl: './forgot-password.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForgotPasswordComponent {
	email: string = '';

	constructor(
		protected commonService: CommonService // protected authService: AuthService
	) {}
}
