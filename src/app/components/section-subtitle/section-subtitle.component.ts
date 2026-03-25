import { Component } from '@angular/core';

@Component({
	selector: 'app-section-subtitle',
	standalone: true,
	template: `
		<div class="flex items-center gap-2">
			<div class="w-1 h-5 bg-prime-blue rounded-full"></div>
			<h2 class="text-[1.05rem] font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-500">
				<ng-content></ng-content>
			</h2>
		</div>
	`,
})
export class AppSectionSubtitleComponent {}
