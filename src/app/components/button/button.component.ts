import { Component, Input } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AppButtonComponent – wrapper de style pour les boutons "Prime".
 *
 * Usage :
 *   <app-button
 *     type="submit"                  ← type natif, défaut "submit"
 *     [disabled]="isSaving"
 *     icon="mdi:check"              ← icône Iconify (optionnel)
 *     iconPosition="left"           ← "left" | "right" (défaut "right")
 *   >
 *     Libellé du bouton
 *   </app-button>
 */
@Component({
	selector: 'app-button',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './button.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppButtonComponent {
	/** Icône Iconify à afficher (ex: "mdi:arrow-right"). Vide = pas d'icône. */
	@Input() icon: string = '';

	/** Position de l'icône par rapport au texte. */
	@Input() iconPosition: 'left' | 'right' = 'right';

	/** Type HTML du bouton natif. Défaut : "submit". */
	@Input() type: 'submit' | 'button' | 'reset' = 'submit';

	/** Si true, le bouton prend toute la largeur disponible. */
	@Input() fullWidth: boolean = false;
}
