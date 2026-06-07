import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
	private readonly themeKey = 'theme';

	constructor() {
		this.applyTheme(this.getTheme());
	}

	/**
	 * Retourne le theme courant sauvegarde.
	 */
	getTheme(): 'dark' | 'light' {
		const theme = localStorage.getItem(this.themeKey);
		if (theme === 'dark' || theme === 'light') return theme;
		localStorage.setItem(this.themeKey, 'light');
		return 'light';
	}

	/**
	 * Sauvegarde et applique le theme demande.
	 */
	setTheme(theme: 'dark' | 'light'): void {
		localStorage.setItem(this.themeKey, theme);
		this.applyTheme(theme);
	}

	/**
	 * Bascule entre les themes clair et sombre.
	 */
	toggleTheme(): 'dark' | 'light' {
		const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
		this.setTheme(newTheme);
		return newTheme;
	}

	/**
	 * Applique la classe CSS correspondant au theme.
	 */
	private applyTheme(theme: 'dark' | 'light'): void {
		const html = document.documentElement;
		if (theme === 'dark') {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
	}
}
