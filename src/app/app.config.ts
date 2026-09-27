import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { setupDeepLink } from './services/deep-link.bootstrap';

const LaraPreset = definePreset(Lara, {
	semantic: {
		primary: {
			50: '{blue.50}',
			100: '{blue.100}',
			200: '{blue.200}',
			300: '{blue.300}',
			400: '{blue.400}',
			500: '{blue.500}',
			600: '{blue.600}',
			700: '{blue.700}',
			800: '{blue.800}',
			900: '{blue.900}',
			950: '{blue.950}',
		},
		// Palette dark alignée sur les gris de l'application (main-dark-bg / secondary-dark-bg)
		colorScheme: {
			dark: {
				surface: {
					0: '#ffffff',
					50: '#f6f7f7',
					100: '#eceeed',
					200: '#dde0df',
					300: '#c4c9c7',
					400: '#9ca3a1',
					500: '#7d8482',
					600: '#4a4f4d',
					700: '#383c3b',
					800: '#2c302f',
					900: '#232726',
					950: '#191a1a',
				},
				primary: {
					color: '{primary.500}',
					contrastColor: '#ffffff',
					hoverColor: '{primary.600}',
					activeColor: '{primary.700}',
				},
				highlight: {
					background: 'color-mix(in srgb, {primary.500}, transparent 80%)',
					focusBackground: 'color-mix(in srgb, {primary.500}, transparent 70%)',
					color: '{primary.300}',
					focusColor: '{primary.200}',
				},
				formField: {
					background: '#1b1e1d',
					borderColor: 'rgba(255, 255, 255, 0.08)',
					hoverBorderColor: 'rgba(255, 255, 255, 0.18)',
					color: '#e5e7eb',
					placeholderColor: '#7d8482',
					iconColor: '#8b9290',
				},
				overlay: {
					select: { background: '#262a29', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#e5e7eb' },
					popover: { background: '#262a29', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#e5e7eb' },
					modal: { background: '#262a29', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#e5e7eb' },
				},
				list: {
					option: {
						focusBackground: 'rgba(255, 255, 255, 0.05)',
					},
				},
			},
		},
	},
	components: {
		// Rond blanc + coche bleue quand activé, comme en mode clair
		toggleswitch: {
			colorScheme: {
				dark: {
					handle: {
						checkedBackground: '#ffffff',
						checkedHoverBackground: '#ffffff',
						checkedColor: '{primary.color}',
						checkedHoverColor: '{primary.hover.color}',
					},
				},
			},
		},
	},
});

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes, withHashLocation()),
		provideHttpClient(),
		provideAnimations(),
		providePrimeNG({
			theme: {
				preset: LaraPreset,
				options: {
					// La classe .dark est posée sur <html> par ThemeService : les overlays attachés au body en héritent
					darkModeSelector: '.dark',
				},
			},
		}),
		provideTranslateService({}),
		...provideTranslateHttpLoader(),
		provideAppInitializer(() => setupDeepLink()),
	],
};
