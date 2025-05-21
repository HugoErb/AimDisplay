import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
	private readonly themeKey = 'theme';

	constructor() {
		this.applyTheme(this.getTheme());
	}

	getTheme(): 'dark' | 'light' {
		const theme = localStorage.getItem(this.themeKey);
		if (theme === 'dark' || theme === 'light') return theme;
		localStorage.setItem(this.themeKey, 'light');
		return 'light';
	}

	setTheme(theme: 'dark' | 'light'): void {
		localStorage.setItem(this.themeKey, theme);
		this.applyTheme(theme);
	}

	toggleTheme(): 'dark' | 'light' {
		const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
		this.setTheme(newTheme);
		return newTheme;
	}

	private applyTheme(theme: 'dark' | 'light'): void {
		const html = document.documentElement;
		if (theme === 'dark') {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
	}
}
