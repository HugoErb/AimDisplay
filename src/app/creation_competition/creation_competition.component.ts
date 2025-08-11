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

    async createCompetition() {
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
                // Reset UI si besoin
                // this.competitionName = '';
                // this.competitionDate = '';
                // this.prixInscription = null;
                // this.prixCategSup = null;
                }
        } finally {
            this.isSaving = false;
        }
    }

    private parseDateRange(input: string | Date | (Date | null)[]): { startISO: string; endISO: string } {
        // 1) Date[] (p-datepicker range)
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

        // 2) Date simple
        if (input instanceof Date) {
            const iso = this.toIsoDate(input);
            return { startISO: iso, endISO: iso };
        }

        // 3) Chaîne "dd/mm/yy[yy]" ou "dd/mm/yy[yy] - dd/mm/yy[yy]"
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

    private parseFrDate(s: string): Date {
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if (!m) throw new Error(`Date invalide: "${s}". Attendu: jj/mm/aa[aa].`);
        const dd = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        let year = parseInt(m[3], 10);
        if (m[3].length === 2) year = year >= 70 ? 1900 + year : 2000 + year;
        return new Date(year, mm - 1, dd);
    }

    private toIsoDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
}
