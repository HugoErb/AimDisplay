import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Competition } from '../interfaces/competition';
import { SupabaseService } from '../services/supabase.service';

@Component({
	selector: 'app-creation-competition',
	standalone: true,
	imports: [FormsModule, InputNumberModule, DatePickerModule, CommonModule, InputTextModule],
	templateUrl: './creation_competition.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreationCompetitionComponent {
	constructor(protected commonService: CommonService, private supabase: SupabaseService) {}

	// Variables de création d'une compétition
	@ViewChildren('inputField', { read: ElementRef }) inputFields!: QueryList<ElementRef>;
	public inputLabelMap = new Map<string, string>();
	competitionDate: string | Date | (Date | null)[] = '';
	competitionName: string = '';
	prixInscription: number | null = null;
	prixCategSup: number | null = null;
    isSaving: boolean = false;

    /**
	 * Permet de créer une compétition à partir des données récoltées dans les champs du formulaire.
	 * Une phase de validation des inputs est d'abord lancée, puis, si la création réussit,
	 * on réinitialise les champs de saisie.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la création est effectuée et que les
	 * champs de saisie ont été réinitialisés en cas de succès.
	 */
    async createCompetition() : Promise<void> {
        this.isSaving = true;
        try {
            this.inputLabelMap = this.commonService.getInputLabelMap(this.inputFields);
            const areInputsValid = await this.commonService.validateInputs(this.inputLabelMap, false);
            if (areInputsValid) {
                const { startISO, endISO } = this.parseDateRange(this.competitionDate);
                await this.supabase.createCompetition({
                    name: this.competitionName,
                    startDate: startISO,
                    endDate: endISO,
                    prixInscription: this.prixInscription ?? 0,
                    prixCategSup: this.prixCategSup ?? 0,
                });
                this.commonService.resetInputFields(this.inputFields);
            }
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Convertit une entrée de date (string/Date/Date[]) en début et fin au format 'YYYY-MM-DD'.
     * 
     * @param input Chaîne "jj/mm/aa[aa]" ou "jj/mm/aa[aa] - jj/mm/aa[aa]" ou Date/Date[] (range).
     * @return Objet contenant startISO et endISO au format 'YYYY-MM-DD'.
     */
    private parseDateRange(input: string | Date | (Date | null)[]): { startISO: string; endISO: string } {
        if (Array.isArray(input)) {
            const [a, b] = input;
            if (a instanceof Date && b instanceof Date) {
            return { startISO: this.toIsoDate(a), endISO: this.toIsoDate(b) };
            }
            if (a instanceof Date && !b) {
            const iso = this.toIsoDate(a);
            return { startISO: iso, endISO: iso };
            }
            throw new Error('Merci de sélectionner au moins une date.');
        }

        // Date simple
        if (input instanceof Date) {
            const iso = this.toIsoDate(input);
            return { startISO: iso, endISO: iso };
        }

        // Chaîne "dd/mm/yy[yy]" ou "dd/mm/yy[yy] - dd/mm/yy[yy]"
        const raw = (input ?? '').toString().trim();
        if (!raw) throw new Error('Merci de renseigner la date de la compétition.');

        const parts = raw.includes('-') ? raw.split('-').map(p => p.trim()) : [raw, raw];
        if (parts.length !== 2) {
            throw new Error('Format invalide. Utilisez "jj/mm/aaaa" ou "jj/mm/aaaa - jj/mm/aaaa".');
        }

        const start = this.parseFrDate(parts[0]);
        const end = this.parseFrDate(parts[1]);
        return { startISO: this.toIsoDate(start), endISO: this.toIsoDate(end) };
    }

    /**
     * Convertit une date au format français "jj/mm/aa[aa]" en objet Date.
     * 
     * @param stringDate Chaîne au format "jj/mm/aa" ou "jj/mm/aaaa".
     * @return L’objet Date correspondant.
     */
    private parseFrDate(stringDate: string): Date {
        const match = stringDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if (!match) throw new Error(`Date invalide: "${stringDate}". Attendu: jj/mm/aa[aa].`);
        const dd = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);
        if (match[3].length === 2) year = year >= 70 ? 1900 + year : 2000 + year;
        return new Date(year, mm - 1, dd);
    }

    /**
     * Formate un objet Date en chaîne 'YYYY-MM-DD' (sans heure).
     * 
     * @param date Date à formater.
     * @return Chaîne ISO au format 'YYYY-MM-DD'.
     */
    private toIsoDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
