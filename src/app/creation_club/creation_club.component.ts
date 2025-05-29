import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-creation',
	standalone: true,
	imports: [CommonModule, InputTextModule, FormsModule],
	templateUrl: './creation_club.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationClubComponent {

	// Variables de création d'un club
	clubName: string = '';
	clubCity: string = '';
}
