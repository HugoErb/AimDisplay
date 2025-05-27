import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'app-creation',
	standalone: true,
	imports: [FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationCompetitionComponent {
	// Variables de création d'une compétition
	competitionDate: string = '';
	competitionName: string = '';
	prixInscription: number = 0;
	prixCategSup: number = 0;
}
