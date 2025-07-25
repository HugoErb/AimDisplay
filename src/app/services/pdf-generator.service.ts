import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfVfs } from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, ContentTable } from 'pdfmake/interfaces';

// Initialise le virtual file system
(pdfMake as any).vfs = pdfVfs;   

export type InputLabelMap = Map<string, any>;

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
	/**
	 * Génère le PDF à partir des données et déclenche le téléchargement.
	 * Renvoie true si tout s'est bien passé.
	 */
	async generateAndDownloadPDF(inputLabelMap: InputLabelMap): Promise<boolean> {
		try {
			const docDefinition = this.buildDocDefinition(inputLabelMap);
			const pdfDocGenerator = pdfMake.createPdf(docDefinition);

			pdfDocGenerator.getBlob((blob: Blob) => {
				saveAs(blob, `rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
			});

			return true;
		} catch (e) {
			console.error('Erreur génération PDF', e);
			return false;
		}
	}

	/**
	 * Construit la définition du document pdfmake à partir de la map.
	 */
	private buildDocDefinition(inputLabelMap: InputLabelMap): TDocumentDefinitions {
		// Entêtes du tableau
		const headerRow = [
			{ text: 'Champ', style: 'tableHeader' },
			{ text: 'Valeur', style: 'tableHeader' },
		];

		// Corps du tableau : on parcourt la Map
		const dataRows: ContentTable['table']['body'] = [];
		for (const [label, value] of inputLabelMap.entries()) {
			dataRows.push([
				{ text: label, style: 'tableCell' },
				{ text: this.stringifyValue(value), style: 'tableCell' },
			]);
		}

		const body: ContentTable['table']['body'] = [headerRow, ...dataRows];

		return {
			info: {
				title: 'Rapport',
				author: 'Aim Display',
				subject: 'Rapport PDF généré',
			},
			content: [
				{ text: 'Rapport PDF', style: 'title', margin: [0, 0, 0, 20] },
				{
					table: {
						headerRows: 1,
						widths: ['*', '*'],
						body,
					},
					layout: 'lightHorizontalLines',
				},
				{
					text: `Généré le ${new Date().toLocaleString()}`,
					style: 'footer',
					margin: [0, 20, 0, 0],
				},
			],
			styles: {
				title: { fontSize: 18, bold: true },
				tableHeader: { bold: true, fontSize: 12, fillColor: '#e5e7eb' },
				tableCell: { fontSize: 11 },
				footer: { italics: true, fontSize: 9, color: '#6b7280' },
			},
			defaultStyle: { fontSize: 11 },
			pageMargins: [40, 60, 40, 60],
		};
	}

	/**
	 * Convertit n’importe quelle valeur en chaîne de caractères lisible.
	 *
	 * - Si `value` est `null` ou `undefined`, renvoie une chaîne vide.
	 * - Si `value` est un objet (tableau, objet littéral…), renvoie son JSON "pretty printed"
	 *   avec une indentation de 2 espaces.
	 * - Sinon, renvoie simplement `String(value)`.
	 *
	 * @param value La valeur à convertir (peut être de n’importe quel type).
	 * @returns La représentation textuelle de la valeur.
	 */
	private stringifyValue(value: any): string {
		if (value == null) return '';
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}
}
